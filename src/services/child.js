import axios from "../common/axios";

export const getChildDetials = async () => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/user/details`,
  );
  return data.data;
};
export const registerChildService = async (childData) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_NODE_BASE_URL}/user/register-child`,
    childData
  );
  return data.data;
};

export const getMonths = async () => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/user/months`
  );
  return data.data;
};

export const login = async (formData) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_NODE_BASE_URL}/user/login`,
    formData
  );
  return data.data;
}

export const forgotPassword = async (formData) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_NODE_BASE_URL}/user/forgot-password`,
    formData
  );
  return data.data;
}

export const checkReferralCode = async (formData) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_NODE_BASE_URL}/user/referral/check`,
    formData
  );
  return data.data;
}

export const confirmJoinMaidaan = async () => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/user/confirm-join`
  );
  return data.data;
};


export const checkGameHour = async (formData) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_NODE_BASE_URL}/user/is-game-hour`,
    formData
  );
  return data.data;
}

export const checkplanTest = async (formData) => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/wallet/plans`,
    formData
  );
  return data.data;
}

export const optInFirstOpenTournament = async () => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/user/confirm-join`,
  );
  return data.data;
};

export const getFreeUserTournament = async () => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/user/get-free-user-tournament`,
  );
  return data.data;
};

export const getPlanSummary = async () => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/user/your-plan-summary`
  );
  return data.data;
};


export const getUniqueCompetitors = async () => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/user/get-unique-competitors`
  );
  return data.data;
};

export const getAllCertificates = async () => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/user/get-all-certificates`
  );
  return data.data;
};

export const getNextOpenRegisteredTournament = async () => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/user/get-next-open-registered-tournament`,
  );
  return data.data;
}

export const getPodiumDetails = async (formData) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_NODE_BASE_URL}/profile/podium-details`,
  );
  return data.data;
};

export const getHasUserVoted = async (userId) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_NODE_BASE_URL}/profile/has-user-voted`,
    { userId }
  );
  return data.data;
};


