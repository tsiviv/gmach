import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000',
});

// מוסיף את הטוקן לכל בקשה
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

export const LoginAdmin = async (email, password) => {
  try {
    const res = await axios.post(`${api.defaults.baseURL}/Login`, { email, password });
    return res.data;
  } catch (error) {
    console.error('Error fetching all loans:', error);
    throw error;
  }
};

export const getSiteDetails = async () => {
  try {
    const res = await axios.get(`${api.defaults.baseURL}/Login/settings`)
    return res.data
  } catch (error) {
    console.error('שגיאה בקבלת פרטי האתר:', error)
    throw error
  }
}

export const uploadLogo = async (file) => {
  try {
    if (!file) throw new Error("לא נבחר קובץ לוגו");

    const formData = new FormData();
    formData.append('logo', file);

    const res = await api.post('/Login/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return res.data;
  } catch (error) {
    console.error('שגיאה בהעלאת לוגו:', error);
    throw error;
  }
};

export const updateSiteTitle = async (siteTitle) => {
  try {
    const params = new URLSearchParams();
    params.append('name', siteTitle);

    const res = await api.post('/Login/update-name', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return res.data;
  } catch (error) {
    console.error('שגיאה בעדכון השם:', error);
    throw error;
  }
};
