import axios from 'axios';

const API_URL = 'http://localhost:5000/api/activity-points';

// Token'ı header'a ekle
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Liderlik tablosunu getir (Herkes)
export const getLeaderboard = async () => {
  const response = await axios.get(`${API_URL}/leaderboard`, getAuthHeader());
  return response.data;
};

// Kullanıcının puan geçmişini getir (Admin)
export const getUserHistory = async (userId) => {
  const response = await axios.get(`${API_URL}/history/${userId}`, getAuthHeader());
  return response.data;
};

// Yeni puan ekle (Admin)
export const addActivityPoint = async (data) => {
  const response = await axios.post(API_URL, data, getAuthHeader());
  return response.data;
};

// Puan güncelle (Admin)
export const updateActivityPoint = async (id, data) => {
  const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeader());
  return response.data;
};

// Puan sil (Admin)
export const deleteActivityPoint = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader());
  return response.data;
};