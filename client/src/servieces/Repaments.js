import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000',
});

// מוסיף Authorization לכל בקשה אוטומטית
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

export const GetAllRepayments = async () => {
  try {
    const res = await api.get('/Repayment');
    return res.data;
  } catch (error) {
    console.error('שגיאה בקבלת תשלומים:', error);
    throw error;
  }
};

export const CreateRepayment = async (loanId, Guarantor, amount, paidDate, notes) => {
  try {
    const res = await api.post('/Repayment', {
      loanId,
      Guarantor,
      amount,
      paidDate,
      notes,
    });
    return res.data;
  } catch (error) {
    console.error('שגיאה ביצירת תשלום:', error);
    throw error;
  }
};

export const GetRepaymentsByLoanId = async (loanId) => {
  try {
    const res = await api.get(`/Repayment/loan/${loanId}`);
    return res.data;
  } catch (error) {
    console.error(`שגיאה בקבלת תשלומים להלוואה ${loanId}:`, error);
    throw error;
  }
};

export const UpdateRepayment = async (id, loanId, Guarantor, amount, paidDate, notes) => {
  try {
    const res = await api.put(`/Repayment/${id}`, {
      loanId,
      Guarantor,
      amount,
      paidDate,
      notes,
    });
    return res.data;
  } catch (error) {
    console.error(`שגיאה בעדכון תשלום ${id}:`, error);
    throw error;
  }
};

export const DeleteRepayment = async (id) => {
  try {
    const res = await api.delete(`/Repayment/${id}`);
    return res.data;
  } catch (error) {
    console.error(`שגיאה במחיקת תשלום ${id}:`, error);
    throw error;
  }
};
