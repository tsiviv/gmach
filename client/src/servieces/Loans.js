import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000',
});

// הוספת Interceptor להוספת טוקן אוטומטי
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

export const GetAllLoans = async () => {
  try {
    const res = await api.get('/Loan');
    return res.data;
  } catch (error) {
    console.error('Error fetching all loans:', error);
    throw error;
  }
};

export const CreateLoan = async (
  numOfLoan,
  borrowerId,
  amount,
  startDate,
  notes,
  repaymentType,
  repaymentDay,
  singleRepaymentDate,
  amountInMonth,
  guarantorsWithFiles = [],
  loanDocument = null,
  typeOfPayment,
  currency,
  amountOfPament
) => {
  try {
    const formData = new FormData();
    formData.append('numOfLoan', numOfLoan);
    formData.append('borrowerId', borrowerId);
    formData.append('amount', amount);
    formData.append('startDate', startDate);
    formData.append('notes', notes);
    formData.append('repaymentType', repaymentType);
    formData.append('repaymentDay', repaymentDay);
    formData.append('singleRepaymentDate', singleRepaymentDate);
    formData.append('amountInMonth', amountInMonth);
    formData.append('amountOfPament', amountOfPament);
    formData.append('typeOfPayment', typeOfPayment); // חדש
    formData.append('currency', currency);           // חדש
    console.log("createloan")

    if (loanDocument instanceof File) {
      formData.append('loanDocument', loanDocument);
    }

    const guarantorsOnly = guarantorsWithFiles.map(({ document, ...rest }) => rest);
    formData.append('guarantors', JSON.stringify(guarantorsOnly));

    guarantorsWithFiles.forEach(({ document }, i) => {
      if (document instanceof File) {
        formData.append(`document${i}`, document);
      }
    });


    const res = await api.post('/Loan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data;
  } catch (error) {
    console.error('Error creating loan:', error.response?.data || error.message);
    throw error;
  }
};

export const GetLoanById = async (id) => {
  try {
    const res = await api.get(`/Loan/${id}`);
    console.log("hi", res)
    return res.data;
  } catch (error) {
    console.error(`Error fetching loan ${id}:`, error);
    throw error;
  }
};

export const GetLoanStatusSummary = async (personId) => {
  try {
    const res = await api.get(`/Loan/GetLoanStatusSummary/${personId}`);
    return res.data;
  } catch (error) {
    console.error(`Error fetching loan ${personId}:`, error);
    throw error;
  }
};

export const UpdateLoan = async (
  id,
  numOfLoan,
  borrowerId,
  amount,
  startDate,
  notes,
  repaymentType,
  repaymentDay,
  singleRepaymentDate,
  amountInMonth,
  guarantorsWithFiles = [],
  loanDocument = null,
  typeOfPayment,
  currency, amountOfPament
) => {
  try {
    const formData = new FormData();
    formData.append('numOfLoan', numOfLoan);
    formData.append('borrowerId', borrowerId);
    formData.append('amount', amount);
    formData.append('startDate', startDate);
    formData.append('notes', notes);
    formData.append('repaymentType', repaymentType);
    formData.append('repaymentDay', repaymentDay);
    formData.append('singleRepaymentDate', singleRepaymentDate);
    formData.append('amountInMonth', amountInMonth);
    formData.append('typeOfPayment', typeOfPayment); // חדש
    formData.append('currency', currency);           // חדש
    formData.append('amountOfPament', amountOfPament);

    const guarantorsOnly = guarantorsWithFiles.map(({ file, ...rest }) => rest);
    formData.append('guarantors', JSON.stringify(guarantorsOnly));

    if (loanDocument instanceof File) {
      formData.append('loanDocument', loanDocument);
    } else if (loanDocument) {
      formData.append('documentPath', loanDocument);
    }

    guarantorsWithFiles.forEach((g, i) => {
      formData.append(`guarantors[${i}].PeopleId`, g.PeopleId);
      if (g.document instanceof File) {
        formData.append(`document${i}`, g.document); // ✅ נכון, זה מה שהשרת מצפה לו
      }

    });


    const res = await api.put(`/Loan/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data;
  } catch (error) {
    console.error('Error updating loan:', error.response?.data || error.message);
    throw error;
  }
};
export const getMonthlyChecks = async () => {
  try {
    const res = await api.get('/Loan/getMonthlyChecks');
    return res.data;
  } catch (error) {
    console.error('שגיאה בעדכון סטטוס התראות:', error);
    throw error;
  }
};

export const updateLoanStatusApi = async () => {
  try {
    const res = await api.put('/Loan/');
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const DeleteLoan = async (id) => {
  try {
    const res = await api.delete(`/Loan/${id}`);
    return res.data;
  } catch (error) {
    console.error(`Error deleting loan ${id}:`, error);
    throw error;
  }
};

export const GetUnpaidLoans = async () => {
  try {
    const res = await api.get('/Loan/GetUnpaidLoans');
    return res.data;
  } catch (error) {
    console.error('Error fetching unpaid loans:', error);
    throw error;
  }
};

export const GetOverdueLoans = async () => {
  try {
    const res = await api.get('/Loan/GetOverdueLoans');
    return res.data;
  } catch (error) {
    console.error('Error fetching overdue loans:', error);
    throw error;
  }
};
export const sendEmail = async () => {
  try {
    const res = await api.post('/Loan/send');
    return res.data;
  } catch (error) {
    console.error('Error fetching overdue loans:', error);
    throw error;
  }
};