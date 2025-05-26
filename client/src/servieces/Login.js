import axios from 'axios'

const url = 'http://localhost:4000'

export const LoginAdmin = async (email, password) => {
    try {
console.log("f")
        const res = await axios.post(`${url}/Login`, { email, password })
        console.log("f")
        return res.data
    } catch (error) {
        console.error('Error fetching all loans:', error)
        console.log("f")
        throw error
    }
}
