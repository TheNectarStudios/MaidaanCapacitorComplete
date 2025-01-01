const functions = require("firebase-functions");
const { google } = require('googleapis');

const serviceAccount = require('../serviceaccount.json');

// Create JWT client using the service account key
const jwtClient = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Initialize the Sheets API
const sheets = google.sheets({
  version: 'v4',
  auth: jwtClient,
});

exports.addUserOnCreation = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "512MB",
  })
  .firestore.document("children/{userId}")
  .onCreate(async (snapshot, context) => {
    console.log("✅✅ FUNCTION STARTED")
        if(snapshot.data().createdAt){
            try {
                const data = snapshot.data(); // Get the data of the added document
                const sheetId = '15CoHLP87vUG0g5xUZ75R8BRbUPHFoTtBm5rgGMPNQNY';

                const DOJ = new Date(data.createdAt.seconds * 1000);
                const formattedDOJ = DOJ.toISOString();

                let tenant1 = "";
                let tenant2 = "";
                let optedIn = "School";
                  
                if(data.tenantIds){
                  tenant1 = data.tenantIds[0];}
                if(data.tenantIds && data.tenantIds.length >=2 ){
                  tenant2 = data.tenantIds[1];}

                if(!data.tenantIds || data.tenantIds.includes("maidaan") || data.tenantIds.length === 0 ){
                    optedIn = "Open"
                }
                
                // Construct the request
                const request = {
                  spreadsheetId: sheetId,
                  range: `Sheet1!$A:$Y`, // Append data to the last row
                  valueInputOption: 'RAW',
                  resource: {
                    values: [
                      [context.params.userId, data.firstName, data.lastName, data.school, data.grade, data.city, formattedDOJ, tenant1, tenant2, optedIn]
                    ],
                  },
                };
          
                // Update the Google Sheet
                await sheets.spreadsheets.values.append(request);
                console.log('Google Sheet updated successfully');
              } catch (error) {
                console.error('Error updating Google Sheet:', error);
            }
        }
  })