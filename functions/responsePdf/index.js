const puppeteer = require("puppeteer-core");
const fs = require("fs");
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
const sendPDFResponse = require("../Whatsapp");

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
const storage = getStorage(app);

exports.generatePdfOnCreate = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "512MB",
  })
  .firestore.document("tournaments/{tournamentId}/leaderboard/{userId}")
  .onCreate(async (snapshot, context) => {
    console.log(snapshot);
    await generatePdfResponse(snapshot, context);
    return null;
  });

exports.generatePdfOnUpdate = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "512MB",
  })
  .firestore.document("tournaments/{tournamentId}/leaderboard/{userId}")
  .onUpdate(async (change, context) => {
    if (change.after.data().round.length > change.before.data().round?.length){
      await generatePdfResponse(change.after, context);} else { 
        console.log("Response already sent for this round")}
    return null;
  });

const generatePdfResponse = async (snapshot, context) => {
  const TOURNAMENT_ID = context.params.tournamentId;
  const USER_ID = context.params.userId;
  const userData = snapshot.data();
  const userFirstName = userData.firstName;
  const phoneNumberRef = doc(db, `children/${USER_ID}`);
  const phoneNumberDocs = await getDoc(phoneNumberRef);
  const childPhoneNumber = phoneNumberDocs
    .data()
    .phoneNumber.replace(/^\+/, "");
  const childPhone = childPhoneNumber.slice(2);

  const responsePdf = async (tournamentId) => {
    // FETCHING THE TOURNAMENT ACTIVE ROUND, NAME, and STARTDATE
    const tournamentSnapshot = await getDoc(
      doc(db, "tournaments", tournamentId)
    );
    const tournamentData = tournamentSnapshot.data();
    const ROUND = tournamentData.activeRound;
    const TITLE1 = tournamentData.name;

    const startDate = tournamentData.startDate.toDate();
    const MONTH = startDate
      .toLocaleString("default", { month: "long" })
      .slice(0, 3);
    const YEAR = startDate.getFullYear();
    const TITLE2 = `${MONTH} ${YEAR}`;

    // FETCHING THE ROUND FORMAT AND TITLE
    const roundSnapshot = await getDoc(
      doc(db, "tournaments", tournamentId, "rounds", ROUND)
    );
    const roundData = roundSnapshot.data();
    const FORMAT = roundData.format;
    const roundName = roundData.title;
    const roundResponse = roundData.sendResponse;
    
    let TITLE3;
    if (TOURNAMENT_ID.includes("Practice")) {
      TITLE3 = "Practice Arena";
    } else if (TOURNAMENT_ID.includes("Demo")) {
      TITLE3 = "Demo";
    } else {
      TITLE3 = `R${ROUND}: ${roundName}`;
    }

    const TEMPLATE_NAME = `${FORMAT}_RESPONSE`;
    
    // CALLS THE FUNCTIONS TO RETRIEVE CHILD DATA AND GAME DETAILS TO GENERATE PDF
    const GeneratePDFForUser = async () => {
      try {
        console.log("✅✅✅✅✅ : GeneratePDFForUser method called");
        const childDetails = await _getChildData(USER_ID);
        const gameDetails = await _getGameDetails(USER_ID);
        const transformedResponses = _transformData(gameDetails[0]);
        const html = _compileTemplate(
          childDetails.firstName,
          transformedResponses
        );
        const { pdfBuffer, storageReference } = await _generatePdf(
          USER_ID,
          html
        );
        const downURL = await uploadPdf(pdfBuffer, storageReference);
        const pdfNameWhatsapp = await pdfNaming(userFirstName,TOURNAMENT_ID, ROUND)
        await sendPDFResponse(
          userFirstName,
          TITLE1,
          roundName,
          childPhone,
          downURL,
          pdfNameWhatsapp,
          childDetails.tenantIds ?? []
        );
        console.log(
          "✅✅✅✅✅ : GeneratePDFForUser method finished, EVERYTHING DONE!"
        );
      } catch (error) {
        console.log(
          "⚠️⚠️⚠️⚠️⚠️⚠️⚠️ : Error in GeneratePdfForUser method:",
          error
        );
      }
    };

    const _transformData = (gameData) => {
      let data = [];
      gameData.attemptedWords.forEach((attWrd, idx) => {
        const temp = `${attWrd}`;
        const finalString = temp
          .replace(/"/g, '"')
          .replace(/'/g, "'")
          .replace(/style=\"(.*?)\"/g, (match, p1) => {
            const replaced = p1.replace(/"/g, '\\\\"');
            return `style=\\"${replaced}\\"`;
          });
        const parsedQuiz = JSON.parse(finalString);

        data.push({
          question: parsedQuiz.question,
          answer: parsedQuiz.answer,
          imageUrl: parsedQuiz.imageUrl,
          response: gameData.responses[idx],
          solution: parsedQuiz.solution,
          jumbledString: gameData.jumbledString[idx],
          hint: parsedQuiz.hint,
          result:
            gameData.results && [true, false].includes(gameData.results[0])
              ? gameData.results[idx] === true
                ? "Correct"
                : "Incorrect"
              : undefined,
        });
      });

      return data;
    };

    const _getChildData = async (userId) => {
      const dataSnapshot = doc(db, "children", userId);
      const docSnap = await getDoc(dataSnapshot);
      const output = { ...docSnap.data(), id: docSnap.id };
      return output;
    };

    const _compileTemplate = (userId, transformedResponses) => {
      const templatePath = path.resolve(
        __dirname,
        "../responsePdf/templates",
        `${TEMPLATE_NAME}.pug`
      );
      const logoPath = path.resolve(
        __dirname,
        "../responsePdf/templates",
        "logo.jpg"
      );
      const compiledFunction = pug.compileFile(templatePath);
      return compiledFunction({
        name: userId,
        title1: TITLE1,
        title2: TITLE2,
        title3: TITLE3,
        response: transformedResponses,
        logoBinary:
          "data:image/jpeg;base64," +
          fs.readFileSync(logoPath).toString("base64"),
      });
    };

    const _getGameDetails = async (userId) => {
      const q = query(
        collection(db, `children/${userId}/games`),
        where("tournamentId", "==", TOURNAMENT_ID),
        where("round", "==", ROUND)
      );
      const querySnapshot = await getDocs(q);
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push(doc.data());
      });
      return data;
    };

    const _generatePdf = async (userId, html) => {
      try {
        console.log("✅✅✅✅✅ : _generatePdf method called");
        const executablePath = await chromium.executablePath;
        const browser = await chromium.puppeteer.launch({
          args: chromium.args,
          executablePath,
          headless: chromium.headless,
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        await page.emulateMediaType("screen");

        var names = TEMPLATE_NAME.split("_");

        let storagePath;
        if (TOURNAMENT_ID.includes("Practice")) {
          storagePath = `responsePdf/${TOURNAMENT_ID}/${userId.slice(
            0,
            -2
          )}-practiceArena.pdf`;
        } else if (TOURNAMENT_ID.includes("Demo")) {
          storagePath = `responsePdf/${TOURNAMENT_ID}/${userId.slice(
            0,
            -2
          )}-demo${names[0]}.pdf`;
        } else {
          storagePath = `responsePdf/${TOURNAMENT_ID}/${userId.slice(
            0,
            -2
          )}-response-R${ROUND}.pdf`;
        }

        const pdfOptions = {
          margin: {
            top: "100px",
            right: "50px",
            bottom: "100px",
            left: "50px",
          },
          printBackground: true,
          format: "A4",
        };

        const storageReference = ref(storage, storagePath);

        const pdfBuffer = await page.pdf(pdfOptions);

        await browser.close();
        console.log("✅✅✅✅✅ : GeneratePDFForUser method ended");
        return { pdfBuffer, storageReference };
      } catch (error) {
        console.log("⚠️⚠️⚠️⚠️⚠️⚠️⚠️ : Error in _generatePdf method:", error);
      }
    };

    const uploadPdf = async (pdfBuff, storageRef) => {
      try {
        console.log("✅✅✅✅✅ : uploadPdf method called");
        const buffer = Buffer.from(pdfBuff);

        const pdfBlob = new Blob([buffer], { type: "application/pdf" });

        const arrayBuffer = await pdfBlob.arrayBuffer();

        await uploadBytes(storageRef, arrayBuffer, {
          contentType: "application/pdf",
        }).then((snapshot) => {
          console.log("Uploaded a blob or file!");
        });
        const downloadURL = await getDownloadURL(storageRef);
        // console.log("✅✅✅✅✅ : Download URL:", downloadURL);
        console.log("✅✅✅✅✅ : uploadPdf method finished");
        return downloadURL;
      } catch (error) {
        console.log("⚠️⚠️⚠️⚠️⚠️⚠️⚠️ : Error in uploadPdf method:", error);
      }
    };

    const pdfNaming = async (firstName,tournamentName, roundNo) =>{
      let pdfName;
      if (tournamentName.includes("Practice")) {
        pdfName = `${firstName}-practiceArena.pdf`;
      } else if (tournamentName.includes("Demo")) {
        pdfName = `${firstName}-demo.pdf`;
      } else {
        pdfName = `${firstName}-response-R${roundNo}.pdf`;
      }
      return pdfName;
    }
    if(roundResponse == true){
     await GeneratePDFForUser();
    }else{
      console.log("PDF WONT BE SENT FOR THIS ROUND")
    }
  };
  try {
    await responsePdf(TOURNAMENT_ID);
    console.log("✅✅✅✅✅ : PDF generation completed and uploaded");
  } catch (error) {
    console.log("⚠️⚠️⚠️⚠️⚠️⚠️⚠️ : Error in response pdf:", error);
  }
  return null;
};
