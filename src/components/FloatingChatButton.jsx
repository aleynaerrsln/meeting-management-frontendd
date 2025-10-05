import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';

const FloatingChatButton = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [users, setUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchUnreadCount();

    // Her 30 saniyede bir okunmamış mesaj kontrolü
    const interval = setInterval(() => {
      fetchUnreadCount();
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
          className="relative w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
        >
          <span className="text-2xl">💬</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Kullanıcı Listesi Popup */}
        {showMenu && (
          <div className="absolute bottom-20 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">Yeni Sohbet Başlat</h3>
                <button
                  onClick={() => setShowMenu(false)}
                  className="text-white hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                placeholder="Kişi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-gray-900 text-sm focus:outline-none"
              />
            </div>

            {/* Kullanıcı Listesi */}
            <div className="max-h-96 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="text-sm">Kullanıcı bulunamadı</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleUserClick(user._id)}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.role === 'admin' ? '👑 Yönetici' : '👤 Kullanıcı'}
                        </p>
                      </div>
                      <span className="text-blue-600 text-xl">→</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-3 bg-gray-50">
              <button
                onClick={() => {
                  navigate('/messages');
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                📥 Tüm Mesajları Görüntüle
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FloatingChatButton;