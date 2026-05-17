import axios from 'axios'

const API = axios.create({
  baseURL: 'https://atomquest-backend-7ocw.onrender.com'  // ← new
})


// attach token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default API