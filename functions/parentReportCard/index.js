const puppeteer = require("puppeteer-core");
const path = require("path");
const pug = require("pug");
const fs = require("fs");
const { initializeApp } = require("firebase/app");
const {
  getStorage,
  uploadBytes,
  ref,
  getDownloadURL,
} = require("firebase/storage");
const { Blob } = require("buffer");
const {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} = require("firebase/firestore");
const { FIREBASE_CONFIG, devFirebaseConfig } = require("../constants/firebase");
const functions = require("firebase-functions");
const chromium = require("chrome-aws-lambda");

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
const storage = getStorage(app);

const reportBg = path.resolve(__dirname, "report-background.png");
const devComBg = path.resolve(__dirname, "dev-comment-bg.png");
const rewardsPng = path.resolve(__dirname, "rewards.png");
const questionMarksBg = path.resolve(__dirname, "question-marks.png");
const rankCircle = path.resolve(__dirname, "ranks-circle.png");
//ranks-circle-pilot.png
const rankCirclePilot = path.resolve(__dirname, "ranks-circle-pilot.png");
const rankCircle2 = path.resolve(__dirname, "ranks-circle2.png");
const devComTransparentImg = path.resolve(__dirname, "dev-comment-transparent.png");
const pointerBlue = path.resolve(__dirname, "pointer-blue.png");
const pointerYellow = path.resolve(__dirname, "pointer-yellow.png");
const trophy = path.resolve(__dirname, "trophy.png");

exports.generateParentReportCard = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "512MB",
  })
  .https.onRequest(async (request, response) => {
    try {
      const requestBody = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
      const { tournamentId, childId, subjectData, topicData, tournamentData, developmentComment, progress, topics, tenantId, tournamentDataTwo, pilotReport } = requestBody;

      const ranks = [];

      let rankCircleData = {
        rank: tournamentData.rank ?? 0,
        sectionOne : "Your Rank",
        participants: tournamentData.participants,
        sectionTwo : "Participants",
      }
      if(tournamentData.participants < 500 && tournamentData.schoolCount >= 2) {
        rankCircleData.participants = tournamentData.schoolCount,
        rankCircleData.sectionTwo = "Schools Played"
      }
      else if (tournamentData.participants < 500 && tournamentData.schoolCount < 2) {
        rankCircleData.participants = "Across",
        rankCircleData.sectionTwo = "Your School"
      }

      let rankCircleDataTwo = {
        rank: tournamentDataTwo.rank ?? 0,
        sectionOne : "Your Rank",
        participants: tournamentDataTwo.participants,
        sectionTwo : "Participants",
      }
      if(tournamentDataTwo.participantsTwo < 500 && tournamentDataTwo.schoolCount > 2) {
        rankCircleDataTwo.participants = tournamentDataTwo.schoolCount,
        rankCircleDataTwo.sectionTwo = "Schools Played"
      }

      const pilotTournamentCircleData= {};

      pilotTournamentCircleData.primary = rankCircleComment(tournamentData.status ?? "DNP");
      pilotTournamentCircleData.secondary = rankCircleComment(tournamentDataTwo.status ?? "DNP");



      
      if (subjectData && subjectData.rank) {
        ranks.push({ rank: subjectData.rank, name: "Maidaan Rank" });
      }
      if (subjectData && subjectData.schoolRank && tenantId!=="maidaan") {
        ranks.push({ rank: subjectData.schoolRank, name: "School Rank" });
      }
      if (subjectData && subjectData.cityRank && subjectData.cityPeople >= 100) {
        ranks.push({ rank: subjectData.cityRank, name: "City Rank" });
      }
      if(tournamentData.status === "Podium" || tournamentData.status === "Merit") {
        tournamentData.comment = "Congratulations, for finishing in the Merit Ranks! Well deserved!";
      }
      else if (tournamentData.status === "DNQ") {
        tournamentData.comment = `Well played! You finished ${tournamentData.userPoolRank}th in your pool but narrowly missed qualifying for the finals this time. All the best for the next one, come back stronger!`;
      }
      else {
        tournamentData.comment = "Well played! You fought bravely but narrowly missed a Merit finish. All the best for the next one, come back stronger!";
      }

      const maxScore = Math.max(...topics.map((topic) => topic.value));
      topics.forEach((topic) => {
        if (topic.didNotPlay) {
          topic.comment = "You have missed this round"
        }
        else if (topic.value >= 66) {
          topic.comment = `You're in the top ${Math.max(100 - topic.value, 1)}% of all contestants`;
        }
        else if(topic.value === maxScore) {
          topic.comment = "Your Strength";
        }
        else{
          topic.comment = "Focus more on this";
        }
      });

      console.log(tournamentData, "tournamentData");
      console.log(rankCircleData, "rankCircleData");

      const html = await _compileTemplate({ subjectData, topicData, tournamentData, developmentComment, progress, ranks, topics, rankCircleData, rankCircleDataTwo, tournamentDataTwo, pilotTournamentCircleData, pilotReport,
        backgroundImg: "data:image/jpeg;base64," + fs.readFileSync(reportBg).toString("base64"),
        devComBackground: "data:image/jpeg;base64," + fs.readFileSync(devComBg).toString("base64"),
        rewardImage: "data:image/jpeg;base64," + fs.readFileSync(rewardsPng).toString("base64"),
        qstnMarksBachground: "data:image/jpeg;base64," + fs.readFileSync(questionMarksBg).toString("base64"),
        rankCircleImg: "data:image/jpeg;base64," + fs.readFileSync(rankCircle).toString("base64"),
        rankCircleImg2: "data:image/jpeg;base64," + fs.readFileSync(rankCircle2).toString("base64"),
        rankCircleImgPilot: "data:image/jpeg;base64," + fs.readFileSync(rankCirclePilot).toString("base64"),
        devComTransparentImg: "data:image/jpeg;base64," + fs.readFileSync(devComTransparentImg).toString("base64"),
        pointerBlue: "data:image/jpeg;base64," + fs.readFileSync(pointerBlue).toString("base64"),
        pointerYellow: "data:image/jpeg;base64," + fs.readFileSync(pointerYellow).toString("base64"),
        trophy: "data:image/jpeg;base64," + fs.readFileSync(trophy).toString("base64"),
      });
      const imageUrl = await _generateImage(html, tournamentId, childId, tournamentData.dnpPrimary);
      response.send({imageUrl});
    } catch (error) {
      console.error("Error in request processing:", error);
      response.status(500).send("Error generating image");
    }

  });

const _compileTemplate = async ({ subjectData, topicData, tournamentData, developmentComment, backgroundImg, progress, ranks, devComBackground, rewardImage, qstnMarksBachground, rankCircleImg, rankCircleImg2, rankCircleImgPilot, devComTransparentImg, topics, pointerYellow, trophy, pointerBlue, rankCircleData, rankCircleDataTwo, pilotTournamentCircleData, tournamentDataTwo, pilotReport }) => {
  try {
    const templatePath = path.resolve(__dirname, `../parentReportCard/${pilotReport ? 'PILOTREPORTCARD.pug' : 'REPORTCARD.pug'}`);
    console.log(templatePath, "templatePath");
    const compiledFunction = pug.compileFile(templatePath);
    return compiledFunction({ subjectData, topicData, tournamentData, developmentComment, backgroundImg, progress, ranks, devComBackground, rewardImage, qstnMarksBachground, rankCircleImg, rankCircleImg2, rankCircleImgPilot, devComTransparentImg, topics, pointerYellow, trophy, pointerBlue, rankCircleData, rankCircleDataTwo, pilotTournamentCircleData, tournamentDataTwo });
  } catch (error) {
    console.error("Error compiling template:", error);
    throw error;
  }
};

const _generateImage = async (html, tournamentId, childId, dnpPrimary) => {
  try {
    console.log("Generating image...");
    const executablePath = await chromium.executablePath;
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    //await page.setContent(html);
    await page.setContent(html, { waitUntil: "networkidle0" });

    const clipHeight = dnpPrimary ? 997 : 1967;
    const dimensions = { width: 1080, height: 1967 };

    await page.setViewport({
      width: Math.ceil(dimensions.width),
      height: Math.ceil(dimensions.height),
    });

    await page.waitForTimeout(1000);

    const imageBuffer = await page.screenshot({
      clip: {
        x: 0,
        y: 0,
        width: Math.ceil(dimensions.width),
        height: clipHeight,
      },
      omitBackground: true,
    });
    await browser.close();

    const storagePath = `parentReportCards/${tournamentId}/${childId}.png`;
    console.log(storagePath, "storagepath");
    const storageRef = ref(storage, storagePath);
    const buffer = Buffer.from(imageBuffer);

    const imageBlob = new Blob([buffer], { type: "image/jpeg" });
    const arrayBuffer = await imageBlob.arrayBuffer();

    await uploadBytes(storageRef, arrayBuffer, { contentType: "image/jpeg" });
    console.log("Uploaded a blob or file!");

    const downloadURL = await getDownloadURL(storageRef);
    console.log("Image generated and uploaded successfully!");
    return downloadURL;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};


const rankCircleComment = (tournamentStatus) =>{
  if(tournamentStatus === "Podium" || tournamentStatus === "Merit") {
    return "Merit Finish";
  }
  else if (tournamentStatus === "DNP") {
    return "Did Not Play";
  }
  else {
    return "Participated";
  }
}
