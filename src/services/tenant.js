import axios from "../common/axios";

export const getTenantDetails = async (tenantId) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_NODE_BASE_URL}/tenant/get`,
    {
        tenantId
    }
  );
  return data.data;
};

export const getAllTenants = async () => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/tenant/all`
  );
  return data.data;
}