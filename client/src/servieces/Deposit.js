import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000',
});

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
export const updateDeposit = async (id,deposit) => {
  try {
    const res = await api.put(`/Deposit/${id}`, deposit);
    return res.data;
  } catch (error) {
    console.error('שגיאה בעדכון הפקדה:', error);
    throw error;
  }
};

export const getAllDeposits = async () => {
  try {
    const res = await api.get('/Deposit');
    return res.data;
  } catch (error) {
    console.error('שגיאה בקבלת תנועות הקרן:', error);
    throw error;
  }
};

// שליפת תנועות לפי מזהה אדם
export const getDepositsByPersonId = async (PeopleId) => {
  try {
    const res = await api.get(`/Deposit/${PeopleId}`);
    return res.data;
  } catch (error) {
    console.error('שגיאה בקבלת תנועות הקרן לפי מזהה אדם:', error);
    throw error;
  }
};

// יצירת הפקדה
export const createDeposit = async ({ PeopleId, amount, date, typeOfPayment, description, currency, method, isDeposit }) => {
  try {
    const res = await api.post('/Deposit', {
      PeopleId,
      amount,
      date,
      typeOfPayment,
      description,
      currency,
      method,isDeposit
    });
    return res.data;
  } catch (error) {
    console.error('שגיאה ביצירת הפקדה:', error);
    throw error;
  }
};


export const deleteDeposit = async (id) => {
  try {
    const res = await api.delete(`/Deposit/${id}`);
    return res.data;
  } catch (error) {
    console.error('שגיאה במחיקת תנועה:', error);
    throw error;
  }
};

// שליפת יתרה נוכחית לאדם
export const getCurrentBalance = async (PeopleId) => {
  try {
    const res = await api.get(`/Deposit/balance/${PeopleId}`);
    return res.data;
  } catch (error) {
    console.error('שגיאה בקבלת יתרה:', error);
    throw error;
  }
};
