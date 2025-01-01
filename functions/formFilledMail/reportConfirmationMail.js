const functions = require("firebase-functions");
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 's@maidaan.app',
        pass: 'topytmgldiexpsod',
        authentication: 'plain'
    }
});

exports.reportConfirmationEmail = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "512MB",
  })
  .https.onRequest(async (request, response) => {
    console.log("✅✅ FUNCTION STARTED")
    const receivers = [
      'aj@maidaan.app',
      's@maidaan.app',
      'lokesh.mogali@maidaan.app'
      // Add more email addresses as needed
    ];
    const mailOptions = {
        from: 's@maidaan.app',
        to: receivers.join(','),
        subject: 'Parent Reports Generated',
        html: `<p>Report generation completed for: ${request.body.tournamentIds}</p>`
    };

    return transporter.sendMail(mailOptions, (error, data) => {
        if (error) {
            console.log(error)
            return
        }
        console.log("✅✅ EMAIL SENT!")
    });

  });