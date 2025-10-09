import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../utils/axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const intervalRef = useRef(null);

  // ✅ Tüm notification datalarını çek
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/notifications');
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Bildirim getirme hatası:', error);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/notifications/unread-count');
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Okunmamış sayı getirme hatası:', error);
    }
  }, []);

  const fetchUnreadMessagesCount = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/messages/unread-count');
      setUnreadMessagesCount(response.data.count || 0);
    } catch (error) {
      console.error('Okunmamış mesaj sayısı hatası:', error);
    }
  }, []);

  // ✅ Tüm verileri paralel çek
  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchNotifications(),
      fetchUnreadCount(),
      fetchUnreadMessagesCount()
    ]);
  }, [fetchNotifications, fetchUnreadCount, fetchUnreadMessagesCount]);

  // ✅ İlk yükleme ve polling
  useEffect(() => {
    if (!user) return;

    // İlk yükleme
    fetchAllData();

    // 30 saniyede bir güncelle
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        fetchUnreadCount();
        fetchUnreadMessagesCount();
      }, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, fetchAllData, fetchUnreadCount, fetchUnreadMessagesCount]);

  // ✅ User çıkış yaptığında temizle
  useEffect(() => {
    if (!user && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [user]);

  // ✅ Notification'ı okundu işaretle
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await axiosInstance.put(`/notifications/${notificationId}/read`);
      await fetchAllData();
    } catch (error) {
      console.error('Okundu işaretleme hatası:', error);
    }
  }, [fetchAllData]);

  // ✅ Tümünü okundu işaretle
  const markAllAsRead = useCallback(async () => {
    try {
      await axiosInstance.put('/notifications/read-all');
      await fetchAllData();
    } catch (error) {
      console.error('Toplu okundu işlemi hatası:', error);
    }
  }, [fetchAllData]);

  // ✅ Manuel refresh
  const refresh = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  const value = {
    notifications,
    unreadCount,
    unreadMessagesCount,
    markAsRead,
    markAllAsRead,
    refresh,
    fetchNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;