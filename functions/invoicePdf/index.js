const functions = require("firebase-functions");
const chromium = require("chrome-aws-lambda");
const fs = require("fs");
const { compile } = require("pug");
const { resolve } = require("path");

const logoPath = resolve(__dirname, "Maidaan_logo.png");
const signaturePath = resolve(__dirname, "invoice-signature.png");

exports.generateInvoicePdf = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "512MB",
  })
  .https.onRequest(async (request, response) => {
    functions.logger.info("Generating invoice pdf!", { structuredData: true });
    const pdf = await generatePDF(request.body.pdfData);
    response.send(pdf);
  });


const generatePDF = async (pdfData) => {
    try {
        const pugTemplate = fs.readFileSync(
        resolve(__dirname, "./invoice-new.PUG"),
        "utf-8"
        );
        const compiledTemplate = compile(pugTemplate);
        const renderedHTML = compiledTemplate({
          ...pdfData,
          logoBinary:
            "data:image/jpeg;base64," +
            fs.readFileSync(logoPath).toString("base64"),
          signature:
            "data:image/jpeg;base64," +
            fs.readFileSync(signaturePath).toString("base64"),
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
        const pdf = await page.pdf({ format: "A4", printBackground: true });
        await browser.close();

        return pdf;
    } catch (err) {
        console.error("Error generating PDF:", err);
        throw err;
    }
};

