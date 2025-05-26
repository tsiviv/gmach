import axios from 'axios';

const url = 'http://localhost:4000';

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
  },
});

export const getAllMovements = async () => {
  try {
    const res = await axios.get(`${url}/FundMovement`, getAuthHeaders());
    return res.data;
  } catch (error) {
    console.error('שגיאה בקבלת תנועות הקרן:', error);
    throw error;
  }
};

export const createFundMovement = async (personId, amount, type, description, date) => {
  try {
    const res = await axios.post(
      `${url}/FundMovement`,
      { personId, amount, type, description, date },
      getAuthHeaders()
    );
    return res.data;
  } catch (error) {
    console.error('שגיאה ביצירת תנועת קרן:', error);
    throw error;
  }
};
export const updateFundMovement = async (id,personId, amount, type, description, date) => {
  try {
    const res = await axios.put(
      `${url}/FundMovement/${id}`,
      { personId, amount, type, description, date },
      getAuthHeaders()
    );
    return res.data;
  } catch (error) {
    console.error('שגיאה ביצירת תנועת קרן:', error);
    throw error;
  }
};

export const deleteMovement = async (id) => {
  try {
    const res = await axios.delete(`${url}/FundMovement/${id}`, getAuthHeaders());
    return res.data;
  } catch (error) {
    console.error('שגיאה במחיקת תנועת קרן:', error);
    throw error;
  }
};
