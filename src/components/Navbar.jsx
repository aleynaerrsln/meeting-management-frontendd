import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../utils/axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const notificationRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
      fetchUnreadMessagesCount();
      
      // Her 30 saniyede bir bildirim kontrolü
      const interval = setInterval(() => {
        fetchUnreadCount();
        fetchUnreadMessagesCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  // Dışarı tıklama kontrolü
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get('/notifications');
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Bildirim getirme hatası:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axiosInstance.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Okunmamış sayı getirme hatası:', error);
    }
  };

  const fetchUnreadMessagesCount = async () => {
    try {
      const response = await axiosInstance.get('/messages/unread-count');
      setUnreadMessagesCount(response.data.count);
    } catch (error) {
      console.error('Okunmamış mesaj sayısı hatası:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Bildirimi okundu yap
      if (!notification.isRead) {
        await axiosInstance.put(`/notifications/${notification._id}/read`);
        fetchNotifications();
        fetchUnreadCount();
      }

      // İlgili sayfaya yönlendir
      if (notification.relatedReport) {
        navigate('/work-reports');
      } else if (notification.relatedMeeting) {
        navigate(`/meetings/${notification.relatedMeeting._id}`);
      } else if (notification.relatedMessage) {
        navigate('/messages');
      }

      setShowNotifications(false);
    } catch (error) {
      console.error('Bildirim işleme hatası:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axiosInstance.put('/notifications/read-all');
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Toplu okundu işlemi hatası:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'report_rejected':
        return '❌';
      case 'report_approved':
        return '✅';
      case 'meeting_created':
        return '📅';
      case 'meeting_updated':
        return '🔄';
      case 'message_received':
        return '💬';
      default:
        return '🔔';
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return notifDate.toLocaleDateString('tr-TR');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">📊</span>
              <span className="ml-2 text-xl font-bold text-gray-800">Yönetim Paneli</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  Ana Sayfa
                </Link>
                
                {user.role === 'admin' && (
                  <>
                    <Link
                      to="/meetings"
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition"
                    >
                      Toplantılar
                    </Link>
                    <Link
                      to="/users"
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition"
                    >
                      Kullanıcılar
                    </Link>
                  </>
                )}

                <Link
                  to="/work-reports"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  Çalışma Raporları
                </Link>

                <Link
                  to="/sponsorships"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  Sponsorluklar
                </Link>

                <Link
                  to="/messages"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition relative"
                >
                  💬 Mesajlar
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
                </Link>

                {/* 🆕 BİLDİRİM İKONU */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-700 hover:text-blue-600 transition"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Bildirim Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                        <h3 className="text-sm font-semibold text-gray-800">Bildirimler</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Tümünü Okundu Yap
                          </button>
                        )}
                      </div>

                      <div className="divide-y divide-gray-100">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500 text-sm">
                            Bildiriminiz yok
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification._id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition ${
                                !notification.isRead ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-start">
                                <span className="text-2xl mr-3">
                                  {getNotificationIcon(notification.type)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium text-gray-900 ${
                                    !notification.isRead ? 'font-semibold' : ''
                                  }`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatDate(notification.createdAt)}
                                  </p>
                                </div>
                                {!notification.isRead && (
                                  <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {notifications.length > 0 && (
                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                          <Link
                            to="/notifications"
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            onClick={() => setShowNotifications(false)}
                          >
                            Tüm Bildirimleri Gör
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </div>
                  <span>{user.firstName} {user.lastName}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm font-medium"
                >
                  Çıkış Yap
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;