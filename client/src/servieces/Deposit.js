import axios from 'axios';

const url = 'http://localhost:4000';

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
  },
});

export const getAllDeposit = async () => {
  try {
    const res = await axios.get(`${url}/Deposit`, getAuthHeaders());
    return res.data;
  } catch (error) {
    console.error('שגיאה בקבלת תנועות הקרן:', error);
    throw error;
  }
};
export const getDepositByPersonId = async (PeopleId) => {
    try {
      const res = await axios.get(`${url}/Deposit/${PeopleId}`, getAuthHeaders());
      return res.data;
    } catch (error) {
      console.error('שגיאה בקבלת תנועות הקרן:', error);
      throw error;
    }
  };

export const createDeposit = async (PeopleId, pull_amount, deposit_amount,date) => {
  try {
    const res = await axios.post(
      `${url}/Deposit`,
      { PeopleId, pull_amount, deposit_amount,date},
      getAuthHeaders()
    );
    return res.data;
  } catch (error) {
    console.error('שגיאה ביצירת תנועת קרן:', error);
    throw error;
  }
};


export const deleteDeposit = async (id) => {
  try {
    const res = await axios.delete(`${url}/Deposit/${id}`, getAuthHeaders());
    return res.data;
  } catch (error) {
    console.error('שגיאה במחיקת תנועת קרן:', error);
    throw error;
  }
};
