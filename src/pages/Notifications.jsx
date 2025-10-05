import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/notifications');
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Bildirim getirme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Bildirimi okundu yap
      if (!notification.isRead) {
        await axiosInstance.put(`/notifications/${notification._id}/read`);
        fetchNotifications();
      }

      // İlgili sayfaya yönlendir
      if (notification.relatedReport) {
        navigate('/work-reports');
      } else if (notification.relatedMeeting) {
        navigate(`/meetings/${notification.relatedMeeting._id}`);
      }
    } catch (error) {
      console.error('Bildirim işleme hatası:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axiosInstance.put('/notifications/read-all');
      fetchNotifications();
    } catch (error) {
      console.error('Toplu okundu işlemi hatası:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu bildirimi silmek istediğinizden emin misiniz?')) return;

    try {
      await axiosInstance.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Bildirim silinemedi');
    }
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
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'report_rejected':
        return 'bg-red-50 border-red-200';
      case 'report_approved':
        return 'bg-green-50 border-green-200';
      case 'meeting_created':
        return 'bg-blue-50 border-blue-200';
      case 'meeting_updated':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
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
    return notifDate.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'read') return notif.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bildirimler</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Tümünü Okundu Yap
          </button>
        )}
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tümü ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Okunmamış ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'read'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Okunmuş ({notifications.length - unreadCount})
          </button>
        </div>
      </div>

      {/* Bildirim Listesi */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <p className="text-gray-500 text-lg">
              {filter === 'unread'
                ? 'Okunmamış bildiriminiz yok'
                : filter === 'read'
                ? 'Okunmuş bildiriminiz yok'
                : 'Henüz bildiriminiz yok'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`bg-white rounded-xl shadow-sm border-2 p-5 transition hover:shadow-md ${
                !notification.isRead ? 'border-blue-300' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0 border-2 ${getNotificationColor(
                    notification.type
                  )}`}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      onClick={() => handleNotificationClick(notification)}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-base font-semibold text-gray-900 ${
                            !notification.isRead ? 'font-bold' : ''
                          }`}
                        >
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(notification._id)}
                      className="text-gray-400 hover:text-red-600 transition p-1"
                      title="Sil"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Related Info */}
                  {(notification.relatedReport || notification.relatedMeeting) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        {notification.relatedReport && '📊 Rapor ile ilgili'}
                        {notification.relatedMeeting && '📅 Toplantı ile ilgili'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;