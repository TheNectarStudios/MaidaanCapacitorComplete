import axios from "../common/axios";
import { PushNotifications } from '@capacitor/push-notifications';

// Helper to show notifications
const showNotification = (title, body) => {
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Notification received:', notification);
  });

  PushNotifications.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: 5, // Max importance
    visibility: 1,
    sound: 'default',
  });

  PushNotifications.schedule({
    notifications: [
      {
        title: title,
        body: body,
        id: new Date().getTime(),
        schedule: { at: new Date(new Date().getTime() + 1000) },
      },
    ],
  });
};

// Initiate payment and notify success/failure
export const initiatePayment = async (data, paymentLink) => {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_NODE_BASE_URL}/payment/${paymentLink ? "initiateWithPhoneNumber" : "initiate"}`,
      data
    );
    const url = response.data?.data?.url;
    const showTournamentStatedPopup = (response.data?.message === "Tournament already started");
    
    if (url) {
      showNotification("Payment Initiated", "The payment process has been successfully initiated.");
    } else if (showTournamentStatedPopup) {
      showNotification("Tournament Notice", "The tournament has already started.");
    }
    return { url, showTournamentStatedPopup };
  } catch (error) {
    showNotification("Error", "Failed to initiate payment. Please try again.");
    throw error;
  }
};

// Check payment status and notify
export const checkPaymentStatus = async (id) => {
  try {
    const { data: response } = await axios.get(
      `${process.env.REACT_APP_NODE_BASE_URL}/payment/status?id=${id}`
    );
    const status = response.data;
    
    if (status === "SUCCESS") {
      showNotification("Payment Success", "Your payment was successful.");
    } else if (status === "PENDING") {
      showNotification("Payment Pending", "Your payment is still being processed.");
    } else if (status === "FAILED") {
      showNotification("Payment Failed", "Your payment could not be completed.");
    }
    return status;
  } catch (error) {
    showNotification("Error", "Failed to check payment status. Please try again.");
    throw error;
  }
};

// Check payment status by ID and notify
export const checkPaymentStatusById = async (id) => {
  try {
    const { data: response } = await axios.get(
      `${process.env.REACT_APP_NODE_BASE_URL}/payment/getStatus/${id}`
    );
    const status = response.data;
    
    if (status === "SUCCESS") {
      showNotification("Payment Success", "Your payment was successful.");
    } else if (status === "PENDING") {
      showNotification("Payment Pending", "Your payment is still being processed.");
    } else if (status === "FAILED") {
      showNotification("Payment Failed", "Your payment could not be completed.");
    }
    return status;
  } catch (error) {
    showNotification("Error", "Failed to check payment status by ID. Please try again.");
    throw error;
  }
};

// Get all orders and notify success/failure
export const getAllOrders = async () => {
  try {
    const { data: response } = await axios.get(
      `${process.env.REACT_APP_NODE_BASE_URL}/orders/get`
    );
    if (response?.length > 0) {
      showNotification("Orders Fetched", "All orders have been successfully retrieved.");
    } else {
      showNotification("No Orders Found", "No orders are available to display.");
    }
    return response.data;
  } catch (error) {
    showNotification("Error", "Failed to fetch orders. Please try again.");
    throw error;
  }
};
