import axios from "../common/axios";

export const initiatePayment = async (data, paymentLink) => {
  const response  = await axios.post(
    `${process.env.REACT_APP_NODE_BASE_URL}/payment/${paymentLink ? "initiateWithPhoneNumber" : "initiate"}`,
    data
  );
  const url = response.data?.data?.url;
  const showTournamentStatedPopup =(response.data?.message ===  "Tournament already started");
  return { url, showTournamentStatedPopup };
};

export const checkPaymentStatus = async (id) => {
  const { data: response } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/payment/status?id=${id}`
  );
  return response.data;
};

export const checkPaymentStatusById = async (id) => {
  const { data: response } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/payment/getStatus/${id}`
  );
  return response.data;
};

export const getAllOrders = async (id) => {
  const { data: response } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/orders/get`
  );
  return response.data;
};
