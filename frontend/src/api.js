import axios from 'axios';

// Your backend URL
const API = axios.create({
  baseURL: 'https://food-delivery-app1-production.up.railway.app',

 
});

// Automatically attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;