const functions = require("firebase-functions");
const nodemailer = require('nodemailer');
const stringSimilarity = require('string-similarity');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 's@maidaan.app',
        pass: 'topytmgldiexpsod',
        authentication: 'plain'
    }
});

const {
    getFirestore,
    collection,
    getDocs,
    orderBy,
    doc,
    query,
    where,
  } = require("firebase/firestore");
  const { initializeApp } = require("firebase/app");
  const { FIREBASE_CONFIG, devFirebaseConfig } = require("../constants/firebase");
  
  const app = initializeApp(FIREBASE_CONFIG);
  const db = getFirestore(app);


  exports.dupeCheck = functions
  .runWith({ memory: '2GB', timeoutSeconds: 540 })
  .pubsub.schedule('0 10 * * *')
  .timeZone('Asia/Kolkata') // Runs 10 am everyday
  .onRun(async (context) => {
    const receivers = [
        'aj@maidaan.app',
        's@maidaan.app'
    ];

    const recentChildren = await _getRecentChildren("children");

    let mailBody = '<h3>Potential duplicate users</h3>';

    for (const recentChild of recentChildren) {

      const matchingChildren = await _getAllDocsChildren(recentChild.grade, recentChild.tenantIds[0])

      // Further filter where firstName and lastName have >60% match
      const potentialDuplicates = matchingChildren.filter(child => {
        const firstNameSimilarity = stringSimilarity.compareTwoStrings(child.firstName.trim().toLowerCase(), recentChild.firstName.trim().toLowerCase());
        const lastNameSimilarity = stringSimilarity.compareTwoStrings(child.lastName.trim().toLowerCase(), recentChild.lastName.trim().toLowerCase());
        return firstNameSimilarity > 0.6 && lastNameSimilarity > 0.6;
      });

      if (potentialDuplicates.length > 0) {
        potentialDuplicates
          .filter(dup => dup.id !== recentChild.id) // Ensure different IDs
          .forEach(dup => {
            mailBody += `
                <p>
                    <b>New User:</b> ${recentChild.id}, <b>Dupe status:</b> ${recentChild?.duplicateUser || 'Marked non-dupe'}<br>
                    <b>Potential Duplicate:</b> ${dup.id}, <b>Dupe status:</b> ${dup?.duplicateUser || 'Marked non-dupe'}
                </p><br>`;
          });
      }
    }

    if (mailBody !== '<h3>Potential duplicate users</h3>') {
      // Prepare mail options
      const mailOptions = {
        from: 's@maidaan.app',
        to: receivers.join(','),
        subject: 'Dupe Report',
        html: mailBody
      };

      // Send email
      transporter.sendMail(mailOptions, (error, data) => {
        if (error) {
          console.log('Error sending email:', error);
          return;
        }
        console.log("✅✅ EMAIL SENT!");
      });
    } else {
      console.log("No potential duplicates found.");
    }

    return null;
  });

  const _getRecentChildren = async (collectionName) => {
    const collectionRef = collection(db, collectionName);
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const q = query(collectionRef, where("verifiedOTP","==", true), orderBy("createdAt"), where("createdAt",">=", twentyFourHoursAgo));
    const querySnapshot = await getDocs(q);    
    const data = [];
    querySnapshot.forEach((doc) => {
        data.push({ ...doc.data(), id: doc.id });
    });
    return data;
};

const _getAllDocsChildren = async (grade, tenant) => {
  const collectionRef = collection(db, "children");
  const q = query(collectionRef, where("grade","==", grade), where("tenantIds","array-contains", tenant));
  const querySnapshot = await getDocs(q);    
  const data = [];
  querySnapshot.forEach((doc) => {
      data.push({ ...doc.data(), id: doc.id });
  });
  return data;
};