import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import UserAvatar from './UserAvatar'; // 🆕 AVATAR COMPONENT

const FloatingChatButton = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [users, setUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByUser, setUnreadByUser] = useState({}); // 🆕 Her kullanıcıdan okunmamış
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchUnreadCount();
    fetchUnreadByUser(); // 🆕

    // Her 30 saniyede bir okunmamış mesaj kontrolü
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchUnreadByUser(); // 🆕
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/messages/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Kullanıcı listesi hatası:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axiosInstance.get('/messages/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Okunmamış mesaj hatası:', error);
    }
  };

  // 🆕 Kullanıcı bazlı okunmamış sayısı
  const fetchUnreadByUser = async () => {
    try {
      const response = await axiosInstance.get('/messages/unread-by-user');
      const unreadMap = {};
      response.data.data.forEach(item => {
        unreadMap[item._id] = item.count;
      });
      setUnreadByUser(unreadMap);
    } catch (error) {
      console.error('Kullanıcı bazlı okunmamış mesaj hatası:', error);
    }
  };

  const handleUserClick = (userId) => {
    // Mesajlar sayfasına yönlendir ve kullanıcıyı seç
    navigate('/messages', { state: { selectedUserId: userId } });
    setShowMenu(false);
  };

  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Ana Buton */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="relative w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">💬</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse shadow-lg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Kullanıcı Listesi Popup */}
        {showMenu && (
          <div className="absolute bottom-20 right-0 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span>💬</span>
                  <span>Yeni Sohbet</span>
                </h3>
                <button
                  onClick={() => setShowMenu(false)}
                  className="text-white hover:text-gray-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition"
                >
                  ✕
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Kişi ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Kullanıcı Listesi */}
            <div className="max-h-96 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-5xl mb-3">🔍</div>
                  <p className="text-sm font-medium">Kullanıcı bulunamadı</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleUserClick(user._id)}
                    className="px-5 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all border-b border-gray-100 last:border-0 group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                        {/* 🆕 Okunmamış badge */}
                        {unreadByUser[user._id] > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse shadow-lg">
                            {unreadByUser[user._id] > 9 ? '9+' : unreadByUser[user._id]}
                          </span>
                        )}
                      </div>
                      
                      {/* Kullanıcı Bilgisi */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          {user.role === 'admin' ? (
                            <>
                              <span className="text-purple-600">👑</span>
                              <span>Yönetici</span>
                            </>
                          ) : (
                            <>
                              <span className="text-blue-600">👤</span>
                              <span>Kullanıcı</span>
                            </>
                          )}
                        </p>
                      </div>
                      
                      {/* Sağ ok */}
                      <svg className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gradient-to-r from-gray-50 to-white">
              <button
                onClick={() => {
                  navigate('/messages');
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>📥</span>
                <span>Tüm Mesajları Görüntüle</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Overlay - Menü dışına tıklanınca kapat */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        ></div>
      )}
    </>
  );
};

export default FloatingChatButton;