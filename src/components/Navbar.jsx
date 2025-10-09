import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    unreadMessagesCount, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // ✅ Dışarı tıklama kontrolü
  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleNotificationClick = useCallback(async (notification) => {
    try {
      if (!notification.isRead) {
        await markAsRead(notification._id);
      }

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
  }, [navigate, markAsRead]);

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  // ✅ Bildirim icon'u - memoized
  const getNotificationIcon = useCallback((type) => {
    const icons = {
      report_rejected: '❌',
      report_approved: '✅',
      meeting_created: '📅',
      meeting_updated: '📝',
      message_received: '💬'
    };
    return icons[type] || '🔔';
  }, []);

  // ✅ Tarih formatla - memoized
  const formatDate = useCallback((date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = Math.floor((now - notifDate) / 1000);

    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
    return notifDate.toLocaleDateString('tr-TR');
  }, []);

  // ✅ Notification listesi - memoized
  const notificationList = useMemo(() => {
    return notifications.map(notification => (
      <div
        key={notification._id}
        onClick={() => handleNotificationClick(notification)}
        className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition ${
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
    ));
  }, [notifications, handleNotificationClick, getNotificationIcon, formatDate]);

  if (!user) return null;

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

            {/* Mesajlar */}
            <Link
              to="/messages"
              className="relative p-2 text-gray-600 hover:text-blue-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {unreadMessagesCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadMessagesCount}
                </span>
              )}
            </Link>

            {/* Bildirimler */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-blue-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Bildirimler</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Tümünü Okundu İşaretle
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto max-h-80">
                    {notifications.length > 0 ? (
                      notificationList
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        Bildirim bulunmuyor
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 border-l border-gray-200 pl-4">
              <span className="text-sm text-gray-700">
                {user.firstName} {user.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;