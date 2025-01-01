const axios = require("axios");

const WHATSAPP_API = "https://api.interakt.ai/v1/public/message/";

const whatsappApi = axios.create({
  baseURL: WHATSAPP_API,
});

const DEFAULT_KEY = "R1lYRmY1N09CRkRPOC1ZbUFhQnhLbnlzb2l0dWxpZExUb3ZJNTlIdkszTTo=";

const sendPDFResponse = async (
  firstName,
  tournamentName,
  roundTitle,
  phoneNumber,
  fileURL,
  pdfName,
  tenantIds = []
) => {
  try {
    const requestData = {
      countryCode: "+91",
      phoneNumber,
      callbackData: "some text here",
      type: "Template",
      template: {
        name: "game_responses_new",
        languageCode: "en",
        headerValues: [fileURL],
        fileName: pdfName,
        bodyValues: [firstName, tournamentName, roundTitle],
      },
      media: {
        type: "application/pdf",
        file: fileURL,
      },
    };
    // const isNavodaya = tenantIds?.includes("navodaya");
    const { data } = await whatsappApi.post("", requestData, {
      headers: {
        Authorization: `Basic ${DEFAULT_KEY}`,
      },
    });
    return data.result;
  } catch (error) {
    console.log(error);
  }
};

module.exports = sendPDFResponse;
