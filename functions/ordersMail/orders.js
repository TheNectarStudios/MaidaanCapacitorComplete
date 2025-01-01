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

exports.sendEmailOnOrder = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "512MB",
  })
  .firestore.document("orders/{orderId}")
  .onCreate(async (snapshot, context) => {
    console.log("✅✅ FUNCTION STARTED")
    const receivers = [
      'aj@maidaan.app',
      's@maidaan.app'
      // Add more email addresses as needed
    ];
    const mailOptions = {
        from: 's@maidaan.app',
        to: receivers.join(','),
        subject: 'New Order',
        html: `<h3>New order from ${snapshot.data().userId}</h3>
                <p>
                   <b>Order: </b>${snapshot.data().rewardIds}<br>
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