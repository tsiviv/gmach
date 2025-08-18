import axios from 'axios';

const url = 'http://localhost:4000';

// צור מופע axios
const api = axios.create({
    baseURL: url,
});

// הוסף interceptor לכל הבקשות
api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// ואז תשתמש ב־api במקום axios:
export const GetAllPeople = async (page = 1, limit = 20) => {
  try {
    const res = await api.get('/People', {
      params: { page, limit }
    });
    return res.data; // יכיל data, total, totalPages, currentPage
  } catch (error) {
    console.error('Error fetching all people:', error);
    throw error;
  }
};


export const CreatePerson = async (id, fullName, phone, address, email, notes) => {
    const res = await api.post('/People', { id, fullName, phone, address, email, notes });
    return res.data;
};

export const GetPersonById = async (id) => {
    const res = await api.get(`/People/${id}`);
    return res.data;
};

export const GetLoansByPerson = async (id) => {
    const res = await api.get(`/People/GetLoansByPerson/${id}`);
    return res.data;
};

export const GetLoansByGuarantor = async (id) => {
    const res = await api.get(`/People/GetLoansByGuarantor/${id}`);
    return res.data;
};

export const DeletePerson = async (id) => {
    const res = await api.delete(`/People/${id}`);
    return res.data;
};

export const UpdatePerson = async (id, fullName, phone, address, email, notes) => {
    const res = await api.put(`/People/${id}`, { fullName, phone, address, email, notes });
    return res.data;
};
