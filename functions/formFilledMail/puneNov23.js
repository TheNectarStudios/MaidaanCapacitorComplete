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

exports.sendEmailOnFormFill = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "512MB",
  })
  .firestore.document("puneSpellathonNov23/{responseId}")
  .onCreate(async (snapshot, context) => {
    console.log("✅✅ FUNCTION STARTED")
    const receivers = [
      'j@maidaan.app',
      's@maidaan.app'
      // Add more email addresses as needed
    ];
    const mailOptions = {
        from: 's@maidaan.app',
        to: receivers.join(','),
        subject: 'Nov Pune Spellation Registration',
        html: `<h3>Woohoo! New registration from: ${snapshot.data().schoolName}</h3>
                <p>
                   <b>Form Filler: </b>${snapshot.data().schoolPointOfContactName}<br>
                   <b>Form Filler Designation: </b>${snapshot.data().designation}<br>
                   <b>Form Filler Mobile: </b>${snapshot.data().schoolPointOfContactPhone}<br>
                   <b>Tournaments Registered: </b>${snapshot.data().schoolLevel}<br>
                   <b>Medium: </b>${snapshot.data().mediumOfInstruction}<br>  
                </p>`
    };

    return transporter.sendMail(mailOptions, (error, data) => {
        if (error) {
            console.log(error)
            return
        }
        console.log("✅✅ EMAIL SENT!")
    });
  });