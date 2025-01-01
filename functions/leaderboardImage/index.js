const puppeteer = require("puppeteer-core");
const path = require("path");
const pug = require("pug");
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
//const sendPDFResponse = require("../Whatsapp");

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
const storage = getStorage(app);

//import { connectFunctionsEmulator } from "firebase/functions";
//connectFunctionsEmulator(functions, "127.0.0.1", 5001);

//const cors = require('cors')({origin: true});


exports.generateLeaderboardImage = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "512MB",
  })
  .https.onRequest(async (request, response) => {
    console.log(request.body);
    const requestBody = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    const tournamentId = requestBody.tournamentId;
    const leaderboardLimit = requestBody.leaderboardLimit;
    console.log(tournamentId,leaderboardLimit);
    try {
        const leaderBoardData = await _getLeaderBoardData(tournamentId);
        const players = await setDataByAggregateOption(leaderBoardData);
        const html = await _compileTemplate(players, leaderboardLimit);
        const imageUrl = await _generateImage(html, tournamentId);
        console.log(imageUrl);
        response.status(200).send(imageUrl);
        //res.status(200).send("Image generated successfully!");
    } catch (error) {
        console.error(error);
        response.status(500).send("Error generating image");
        //res.status(500).send("Error generating image");
    }  
    });
    
    const _compileTemplate = async (players, leaderboardLimit) => {
        const templatePath = path.resolve(__dirname,"../leaderboardImage/LEADERBOARD.pug");
        const compiledFunction = pug.compileFile(templatePath);
        return compiledFunction({
            players,
            leaderboardLimit,
        });
    };

const _getLeaderBoardData = async (tournamentId) => {
    const querySnapshot = await getDocs(collection(db, `tournaments/${tournamentId}/leaderboard`));
    const data = [];
    querySnapshot.forEach((doc) => {
    data.push({ ...doc.data(), id: doc.id });
  });
  return(data);
}

const setDataByAggregateOption = async (data) => {
    const result = [];
    data.map((d) => {
        const aggScore = d.score.reduce((pv, cv) => pv + cv, 0);
        const aggAttempt = d.attempts.reduce((pv, cv) => pv + cv, 0);
        const aggDaysPlayed = d.daysPlayed.length;
        result.push({
            Player: `${d.firstName} ${d.lastName}`,
            Class: d.grade,
            School: `${d.school}, ${d.city}`,
            score: aggScore,
            attempts: aggAttempt,
            accuracy: Math.floor((Number(aggScore) * 100) / Number(aggAttempt)),
        });
    });

    result.sort((a, b) => {
        // First, compare the scores in descending order
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        // In case of a tie in score, compare accuracy in descending order
        return b.accuracy - a.accuracy;
    });

    let Rank = 1;
    let diff = 0;
    result.map((d, idx) => {
        if (idx > 0) {
            if (
                result[idx - 1].score === d.score &&
                result[idx - 1].accuracy === d.accuracy
            ) {
                d.Rank = Rank;
                diff++;
            } else {
                Rank = Rank + 1 + diff;
                d.Rank = Rank;
                diff = 0;
            }
        } else {
            d.Rank = 1;
        }
    });
    return result;
};

const _generateImage = async (html, tournamentId) => {
    console.log("Generating image...");
    const htmlString = html;
    const executablePath = await chromium.executablePath;
    const browser = await chromium.puppeteer.launch({
        args: chromium.args,
        executablePath,
        headless: chromium.headless,
        });
    const page = await browser.newPage();
    await page.setContent(htmlString);
    const dimensions = await page.evaluate(() => {
        const body = document.querySelector("table");
        const { width, height } = body.getBoundingClientRect();
        return { width, height };
    });
    console.log(dimensions); 
    await page.setViewport({
        width: Math.ceil(dimensions.width) + 15,
        height: Math.ceil(dimensions.height) + 55,
    });

   const imageBuffer = await page.screenshot({
        fullPage: true,
        omitBackground: true,
      });
    await browser.close();
    
    let storagePath=`LeaderboardImages/${tournamentId}/leaderboard.png`
    console.log(storagePath);
    storageRef = ref(storage, storagePath);
    const buffer = Buffer.from(imageBuffer);

    const imageBlob = new Blob([buffer], { type: "image/jpeg" }); 

    const arrayBuffer = await imageBlob.arrayBuffer();

    await uploadBytes(storageRef, arrayBuffer, {
    contentType: "image/jpeg", 
    }).then((snapshot) => {
    console.log("Uploaded a blob or file!");
    });   

    const downloadURL = await getDownloadURL(storageRef);
  
    console.log("Image generated and uploaded successfully!");
    //console.log(downloadURL);
    return downloadURL;
};
