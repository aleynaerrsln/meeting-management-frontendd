import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../utils/axios';

const Messages = () => {
  const { user } = useAuth();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByUser, setUnreadByUser] = useState({}); // Her kullanıcıdan okunmamış sayısı
  
  // Seçili kullanıcı ve konuşma
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Yeni mesaj
  const [newMessageText, setNewMessageText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchUnreadCount();
    
    // Floating button'dan gelen kullanıcı
    if (location.state?.selectedUserId) {
      const user = users.find(u => u._id === location.state.selectedUserId);
      if (user) {
        handleSelectUser(user);
      }
    }
  }, [location.state]);

  useEffect(() => {
    // Konuşma değiştiğinde en alta scroll
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/messages/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Kullanıcı listesi hatası:', error);
    } finally {
      setLoading(false);
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

  const handleSelectUser = async (otherUser) => {
    setSelectedUser(otherUser);
    try {
      const response = await axiosInstance.get(`/messages/conversation/${otherUser._id}`);
      setConversation(response.data.data);
      fetchUnreadCount();
    } catch (error) {
      console.error('Konuşma getirme hatası:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessageText.trim() || !selectedUser) return;

    setSending(true);
    try {
      await axiosInstance.post('/messages', {
        receiver: selectedUser._id,
        subject: 'Mesaj',
        content: newMessageText
      });
      
      setNewMessageText('');
      // Konuşmayı yenile
      handleSelectUser(selectedUser);
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      alert(error.response?.data?.message || 'Mesaj gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMessageTime = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    return messageDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-180px)] flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Sol Taraf - Kullanıcı Listesi */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Başlık */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-lg font-semibold text-white">Mesajlar</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-blue-100">{unreadCount} okunmamış mesaj</p>
          )}
        </div>

        {/* Arama */}
        <div className="p-3 border-b border-gray-200">
          <input
            type="text"
            placeholder="Kişi ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Kullanıcılar */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Yükleniyor...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-sm">Kullanıcı bulunamadı</p>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u._id}
                onClick={() => handleSelectUser(u)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition ${
                  selectedUser?._id === u._id ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-gray-500">
                      {u.role === 'admin' ? '👑 Yönetici' : '👤 Kullanıcı'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sağ Taraf - Sohbet Alanı */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Sohbet Başlığı */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedUser.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                </p>
              </div>
            </div>

            {/* Mesajlar */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {conversation.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="text-6xl mb-4">💬</div>
                  <p>Henüz mesaj yok. İlk mesajı gönderin!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversation.map((msg) => {
                    const isMine = msg.sender._id === user._id;
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-md ${isMine ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              isMine
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                            }`}
                          >
                            {msg.subject !== 'Mesaj' && (
                              <p className={`text-xs font-semibold mb-1 ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                                {msg.subject}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                              {formatMessageTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Mesaj Gönderme Alanı */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessageText.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {sending ? '...' : '📤'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="text-8xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2">Mesajlarınız</h3>
            <p className="text-sm">Sohbet başlatmak için soldaki listeden bir kişi seçin</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;