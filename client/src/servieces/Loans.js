import axios from 'axios'

const url = 'http://localhost:4000'
const token = sessionStorage.getItem('token')

export const GetAllLoans = async () => {
    try {
        const res = await axios.get(`${url}/Loan`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        return res.data
    } catch (error) {
        console.error('Error fetching all loans:', error)
        throw error
    }
}
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
    loanDocument = null
) => {
    try {
        const formData = new FormData();

        formData.append('borrowerId', borrowerId);
        formData.append('amount', amount);
        formData.append('startDate', startDate);
        formData.append('notes', notes);
        formData.append('repaymentType', repaymentType);
        formData.append('repaymentDay', repaymentDay);
        formData.append('singleRepaymentDate', singleRepaymentDate);
        formData.append('amountInMonth', amountInMonth);
        formData.append('numOfLoan', numOfLoan);

        // ערבֵים - שומר רק את המידע בלי הקובץ
        const guarantorsOnly = guarantorsWithFiles.map(({ file, ...rest }) => rest);
        formData.append('guarantors', JSON.stringify(guarantorsOnly));

        // מסמך ההלוואה
        if (loanDocument instanceof File) {
            formData.append('loanDocument', loanDocument);
        }

        // מסמכי הערבים לפי אינדקס
        guarantorsWithFiles.forEach(({ document }, i) => {
            console.log(`Appending file for document${i}:`, document);
            if (document && document.name && document.type) {
                formData.append(`document${i}`, document);
            }
        });

        const res = await axios.post(`${url}/Loan`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`,
            },
        });

        return res.data;
    } catch (error) {
        console.error('Error creating loan:', error.response?.data || error.message);
        throw error;
    }
};

export const GetLoanById = async (id) => {
    try {
        const res = await axios.get(`${url}/Loan/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        return res.data
    } catch (error) {
        console.error(`Error fetching loan ${id}:`, error)
        throw error
    }
}
export const GetLoanStatusSummary = async (personId) => {
    try {
        const res = await axios.get(`${url}/Loan/GetLoanStatusSummary/${personId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        return res.data
    } catch (error) {
        console.error(`Error fetching loan ${personId}:`, error)
        throw error
    }
}

export const UpdateLoan = async (
    id,numOfLoan,
    borrowerId,
    amount,
    startDate,
    notes,
    repaymentType,
    repaymentDay,
    singleRepaymentDate,
    amountInMonth,
    guarantorsWithFiles = [],
    loanDocument = null
) => {
    try {
        const formData = new FormData();
        console.log(loanDocument, guarantorsWithFiles, "guarantorsWithFiles")
        formData.append('borrowerId', borrowerId);
        formData.append('amount', amount);
        formData.append('startDate', startDate);
        formData.append('notes', notes);
        formData.append('repaymentType', repaymentType);
        formData.append('repaymentDay', repaymentDay);
        formData.append('singleRepaymentDate', singleRepaymentDate);
        formData.append('amountInMonth', amountInMonth);
        formData.append('numOfLoan', numOfLoan);

        const guarantorsOnly = guarantorsWithFiles.map(({ file, ...rest }) => rest);
        formData.append('guarantors', JSON.stringify(guarantorsOnly));

        if (loanDocument instanceof File) {
            formData.append('loanDocument', loanDocument);
        }
        else {
            formData.append('documentPath', loanDocument);
        }
        guarantorsWithFiles.forEach(({ document }, i) => {
            if (document && document.name && document.type) {
                formData.append(`document${i}`, document);
            }
        });

        const res = await axios.put(`${url}/Loan/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`,
            },
        });

        return res.data;
    } catch (error) {
        console.error('Error updating loan:', error.response?.data || error.message);
        throw error;
    }
};


export const DeleteLoan = async (id) => {
    try {
        const res = await axios.delete(`${url}/Loan/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        return res.data
    } catch (error) {
        console.error(`Error deleting loan ${id}:`, error)
        throw error
    }
}

export const GetUnpaidLoans = async () => {
    try {
        const res = await axios.get(`${url}/Loan/GetUnpaidLoans`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        return res.data
    } catch (error) {
        console.error('Error fetching unpaid loans:', error)
        throw error
    }
}

export const GetOverdueLoans = async () => {
    console.log('GetOverdueLoans')
    try {
        const res = await axios.get(`${url}/Loan/GetOverdueLoans`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        return res.data
    } catch (error) {
        console.error('Error fetching overdue loans:', error)
        throw error
    }
}
