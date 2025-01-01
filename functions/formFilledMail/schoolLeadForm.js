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

exports.sendEmailOnSchoolLeadFormFill = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "512MB",
  })
  .firestore.document("schoolLeads/{responseId}")
  .onCreate(async (snapshot, context) => {
    console.log("✅✅ FUNCTION STARTED")
    const receivers = [
      'partnerships@maidaan.app',
      's@maidaan.app'
      // Add more email addresses as needed
    ];
    const mailOptions = {
        from: 's@maidaan.app',
        to: receivers.join(','),
        subject: 'New School Lead',
        html: `<h3>Inbound school lead received on website : ${snapshot.data().school}, ${snapshot.data().city}</h3>
                <p>
                   <b>Form Filler: </b>${snapshot.data().firstName} ${snapshot.data().lastName}<br>
                   <b>Form Filler Designation: </b>${snapshot.data().designation}<br>
                   <b>Form Filler Mobile: </b>${snapshot.data().phoneNumber}<br>
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