import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000',
});

// מוסיף את הטוקן לכל בקשה אוטומטית
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    console.log('JWT Token:', token); // בדיקה
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const getAllMovements = async () => {
  try {
    const res = await api.get('/FundMovement');
    return res.data;
  } catch (error) {
    console.error('שגיאה בקבלת תנועות הקרן:', error);
    throw error;
  }
};

export const createFundMovement = async (personId, amount, type, description, date,typeOfPayment,currency) => {
  try {
    const res = await api.post('/FundMovement', {
      personId: personId || null,
      amount,
      type,
      description,
      date,typeOfPayment,currency
    });
    return res.data;
  } catch (error) {
    console.error('שגיאה ביצירת תנועת קרן:', error);
    throw error;
  }
};

export const updateFundMovement = async (id, personId, amount, type, description, date,typeOfPayment,currency) => {
  try {
    console.log(amount)
    const res = await api.put(`/FundMovement/${id}`, {
      personId: personId || null,
      amount,
      type,
      description,
      date,typeOfPayment,currency
    });
    return res.data;
  } catch (error) {
    console.error('שגיאה בעדכון תנועת קרן:', error);
    throw error;
  }
};

export const deleteMovement = async (id) => {
  try {
    const res = await api.delete(`/FundMovement/${id}`);
    return res.data;
  } catch (error) {
    console.error('שגיאה במחיקת תנועת קרן:', error);
    throw error;
  }
};
