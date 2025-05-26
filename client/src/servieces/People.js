import axios from 'axios'

const url='http://localhost:4000'

const token =sessionStorage.getItem('token')

export const GetAllPeople=async()=>{
    const res=await axios.get(`${url}/People`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    return res.data;
}

export const CreatePerson=async(id,fullName, phone, address, email, notes)=>{
    const res=await axios.post(`${url}/People`,{id,fullName, phone, address, email, notes}, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    return res.data;
}

export const GetPersonById=async(id)=>{
    const res=await axios.get(`${url}/People/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    return res.data;
}

export const GetLoansByPerson=async(id)=>{
    const res=await axios.get(`${url}/People/GetLoansByPerson/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    return res.data;
}
export const GetLoansByGuarantor=async(id)=>{
    const res=await axios.get(`${url}/People/GetLoansByGuarantor/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    return res.data;
}

export const DeletePerson=async(id)=>{
    const res=await axios.delete(`${url}/People/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    return res.data;
}
export const UpdatePerson=async(id,fullName, phone, address, email, notes)=>{
    const res=await axios.put(`${url}/People/${id}`,{fullName, phone, address, email, notes}, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    return res.data;
}
