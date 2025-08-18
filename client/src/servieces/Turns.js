import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:4000',
});

// הוספת טוקן אוטומטית לכותרות כל בקשה (אם קיים)
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

// כל התנועות (Turns)
export const getAllTurns = async (page = 1, limit = 20) => {
  try {
    const res = await api.get('/Turn', {
      params: { page, limit }
    });
    return res.data; // data, total, totalPages, currentPage
  } catch (error) {
    console.error('שגיאה בקבלת תנועות:', error);
    throw error;
  }
};


// תנועות לפי מזהה אדם
// export const getTurnsByPersonId = async (personId) => {
//   try {
//     const res = await api.get(`/Turns/person/${personId}`);
//     return res.data;
//   } catch (error) {
//     console.error('שגיאה בקבלת תנועות לפי מזהה אדם:', error);
//     throw error;
//   }
// };

// יצירת תנועה חדשה (פעם אחת או חודשית)
export const createTurn = async ({ personId, amount, repaymentType, description, date }) => {
    amount = amount.replace(/,/g, '')
    try {
        const res = await api.post('/Turn', {
            personId,
            amount,
            repaymentType,
            description,
            date,
        });
        return res.data;
    } catch (error) {
        console.error('שגיאה ביצירת תנועה:', error);
        throw error;
    }
};

// מחיקת תנועה לפי מזהה
export const deleteTurn = async (id) => {
    try {
        const res = await api.delete(`/Turn/${id}`);
        return res.data;
    } catch (error) {
        console.error('שגיאה במחיקת תנועה:', error);
        throw error;
    }

};
// עדכון תנועה לפי מזהה
export const updateTurn = async (id, { personId, amount, repaymentType, description, date }) => {
    amount = amount.replace(/,/g, '')
    try {
        const res = await api.put(`/Turn/${id}`, {
            personId,
            amount,
            repaymentType,
            description,
            date,
        });
        return res.data;
    } catch (error) {
        console.error('שגיאה בעדכון תנועה:', error);
        throw error;
    }
};
