import axios from 'axios'

const url='http://localhost:4000'

const token =sessionStorage.getItem('token')

export const GetAllRepayments=async()=>{
    const res=await axios.get(`${url}/Repayment`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    return res.data;
}

export const CreateRepayment=async( loanId, amount, paidDate, notes )=>{
    const res=await axios.post(`${url}/Repayment`,{ loanId, amount, paidDate, notes }, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    return res.data;
}

export const GetRepaymentsByLoanId=async(loanId)=>{
    const res=await axios.get(`${url}/Repayment/loan/${loanId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    return res.data;
}

export const UpdateRepayment=async(id, loanId, amount, paidDate, notes )=>{
    const res=await axios.put(`${url}/Repayment/${id}`,{ loanId, amount, paidDate, notes} , {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    return res.data;
}

export const DeleteRepayment=async(id)=>{
    const res=await axios.delete(`${url}/Repayment/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    return res.data;
}