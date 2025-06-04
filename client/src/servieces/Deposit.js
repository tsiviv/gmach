import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000',
});

// Interceptor להוספת הטוקן אוטומטית
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const getAllDeposit = async () => {
  try {
    const res = await api.get('/Deposit');
    return res.data;
  } catch (error) {
    console.error('שגיאה בקבלת תנועות הקרן:', error);
    throw error;
  }
};

export const getDepositByPersonId = async (PeopleId) => {
  try {
    const res = await api.get(`/Deposit/${PeopleId}`);
    return res.data;
  } catch (error) {
    console.error('שגיאה בקבלת תנועות הקרן לפי מזהה אדם:', error);
    throw error;
  }
};

export const createDeposit = async (PeopleId, pull_amount, deposit_amount, date) => {
  try {
    const res = await api.post('/Deposit', {
      PeopleId,
      pull_amount,
      deposit_amount,
      date,
    });
    return res.data;
  } catch (error) {
    console.error('שגיאה ביצירת תנועת קרן:', error);
    throw error;
  }
};

export const deleteDeposit = async (id) => {
  try {
    const res = await api.delete(`/Deposit/${id}`);
    return res.data;
  } catch (error) {
    console.error('שגיאה במחיקת תנועת קרן:', error);
    throw error;
  }
};
