import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users';

// Token'ı header'a ekle
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Tüm kullanıcıları getir
export const getAllUsers = async () => {
  const response = await axios.get(API_URL, getAuthHeader());
  return response.data;
};

// Tek kullanıcı getir
export const getUserById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, getAuthHeader());
  return response.data;
};

// Yeni kullanıcı oluştur
export const createUser = async (userData) => {
  const response = await axios.post(API_URL, userData, getAuthHeader());
  return response.data;
};

// Kullanıcı güncelle
export const updateUser = async (id, userData) => {
  const response = await axios.put(`${API_URL}/${id}`, userData, getAuthHeader());
  return response.data;
};

// Kullanıcı sil
export const deleteUser = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader());
  return response.data;
};