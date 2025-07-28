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

export const getSiteDetails = async () => {
  try {
    const res = await axios.get(`${url}/Login/settings`)
    console.log(res.data)
    return res.data
  } catch (error) {
    console.error('שגיאה בקבלת פרטי האתר:', error)
    throw error
  }
}


export const uploadLogo = async (file, siteTitle) => {
  try {
    const formData = new FormData()
    formData.append('logo', file)
    formData.append('name', siteTitle)

    const res = await axios.post(`${url}/Login/upload-logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return res.data
  } catch (error) {
    console.error('שגיאה בהעלאת לוגו:', error)
    throw error
  }
}

export const updateSiteTitle = async (siteTitle) => {
  try {
    const params = new URLSearchParams()
    params.append('name', siteTitle)

    const res = await axios.post(`${url}/Login/update-name`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    return res.data
  } catch (error) {
    console.error('שגיאה בעדכון השם:', error)
    throw error
  }
}
