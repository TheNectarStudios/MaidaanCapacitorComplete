const functions = require("firebase-functions");
const chromium = require("chrome-aws-lambda");
const fs = require("fs");
const { compile } = require("pug");
const { resolve } = require("path");

const logoPath = resolve(__dirname, "ribbon-logo.png");
const darkBg = resolve(__dirname, "dark-bg.png");
const signature = resolve(__dirname, "signature.png");

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
} = require("firebase/firestore");
const { FIREBASE_CONFIG, devFirebaseConfig } = require("../constants/firebase");

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
const storage = getStorage(app);

exports.generateCertificatePDF = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "512MB",
  })
  .https.onRequest(async (request, response) => {
    functions.logger.info("Generating certificate!", { structuredData: true });
    const downloadURL = await generateCertificate(request.body.data, request.body.pathData);
    response.send({downloadURL});
  });

const generateCertificate = async (data, pathData) => {
  try {
    const pugTemplate = fs.readFileSync(
      resolve(__dirname, "./certificate.pug"),
      "utf-8"
    );
    const compiledTemplate = compile(pugTemplate);
    const renderedHTML = compiledTemplate({
      ...data,
      logoBinary:
        "data:image/jpeg;base64," +
        fs.readFileSync(logoPath).toString("base64"),
      backgroundImg: "data:image/jpeg;base64," + fs.readFileSync(darkBg).toString("base64"),
      signatureImg: "data:image/jpeg;base64," + fs.readFileSync(signature).toString("base64"),
    });

    const executablePath = await chromium.executablePath;
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless,
    });
    // const browser = await launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(renderedHTML, { waitUntil: "networkidle0" });
    const customWidth = '471px';
    const customHeight = '665px';
    const pdf = await page.pdf({ width: customWidth, height: customHeight, printBackground: true });
    await browser.close();

    const storagePath = `meritCertificates/${pathData.tournamentId}/${pathData.childId}.pdf`;
    //return pdf;
    const storageReference = ref(storage, storagePath);
    
    //upload to firebase storage and return the URL
    const downloadURL = await uploadPdf(pdf, storageReference);
    console.log("✅✅✅✅✅ : Download URL:", downloadURL);
    return downloadURL;
  } catch (err) {
    console.error("Error generating PDF:", err);
    throw err;
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
    console.log("✅✅✅✅✅ : uploadPdf method finished");
    return downloadURL;
  } catch (error) {
    console.log("⚠️⚠️⚠️⚠️⚠️⚠️⚠️ : Error in uploadPdf method:", error);
  }
};
