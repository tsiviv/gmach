import axios from 'axios';

const url = 'http://localhost:4000';

// יצירת מופע axios
const api = axios.create({
  baseURL: url,
});

// Interceptor שמוסיף את ה-Authorization Header אוטומטית
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

// קבלת סטטוס ההתראות הנוכחי
export const getNotificationsStatus = async () => {
  try {
    const res = await api.get('/Notification/get-notifications');
    return res.data.enabled;
  } catch (error) {
    console.error('שגיאה בקבלת סטטוס התראות:', error);
    throw error;
  }
};

// עדכון סטטוס ההתראות
export const setNotificationsStatus = async (enabled) => {
  try {
    const res = await api.post('/Notification/set-notifications', { enabled });
    return res.data;
  } catch (error) {
    console.error('שגיאה בעדכון סטטוס התראות:', error);
    throw error;
  }
};
