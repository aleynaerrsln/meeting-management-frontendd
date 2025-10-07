import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import UserAvatar from '../components/UserAvatar';

const Messages = () => {
  const { user } = useAuth();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const hasSelectedUserRef = useRef(false);
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false); // ✅ SADECE BU DEĞİŞTİ
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByUser, setUnreadByUser] = useState({});
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newMessageText, setNewMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/messages/users', {
        params: { _: Date.now() }
      });
      setUsers(response.data.data);
    } catch (error) {
      console.error('Kullanıcı listesi hatası:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/messages/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Okunmamış mesaj hatası:', error);
    }
  }, []);

  const fetchUnreadByUser = useCallback(async () => {
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
  }, []);

  const handleSelectUser = useCallback(async (otherUser) => {
    setSelectedUser(otherUser);
    try {
      const response = await axiosInstance.get(`/messages/conversation/${otherUser._id}`);
      setConversation(response.data.data);
      fetchUnreadCount();
      fetchUnreadByUser();
    } catch (error) {
      console.error('Konuşma getirme hatası:', error);
    }
  }, [fetchUnreadCount, fetchUnreadByUser]);

  useEffect(() => {
    const initializeMessages = async () => {
      await fetchUsers();
      fetchUnreadCount();
      fetchUnreadByUser();
    };
    
    initializeMessages();
  }, [fetchUsers, fetchUnreadCount, fetchUnreadByUser]);

  useEffect(() => {
    if (users.length > 0 && location.state?.selectedUserId && !hasSelectedUserRef.current) {
      const targetUser = users.find(u => u._id === location.state.selectedUserId);
      if (targetUser) {
        handleSelectUser(targetUser);
        hasSelectedUserRef.current = true;
      }
    }
  }, [users, location.state?.selectedUserId, handleSelectUser]);

  useEffect(() => {
    return () => {
      hasSelectedUserRef.current = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    if (conversation.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [conversation.length, scrollToBottom]);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      const isUnder10MB = file.size <= 10 * 1024 * 1024;
      
      if (!isUnder10MB) {
        alert(`${file.name} dosyası 10MB'dan büyük!`);
        return false;
      }
      if (!isImage && !isPDF) {
        alert(`${file.name} dosyası desteklenmiyor! Sadece resim ve PDF gönderilebilir.`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, []);

  const removeFile = useCallback((index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    
    if ((!newMessageText.trim() && selectedFiles.length === 0) || !selectedUser) return;

    const tempMessage = {
      _id: `temp-${Date.now()}`,
      sender: { _id: user._id, firstName: user.firstName, lastName: user.lastName },
      receiver: selectedUser._id,
      content: newMessageText || '📎 Dosya eki',
      subject: 'Mesaj',
      attachments: selectedFiles.map((file, idx) => ({
        _id: `temp-file-${idx}`,
        originalName: file.name,
        mimetype: file.type,
        size: file.size
      })),
      createdAt: new Date().toISOString(),
      isRead: false,
      isSending: true
    };

    setConversation(prev => [...prev, tempMessage]);
    
    const messageToSend = newMessageText;
    const filesToSend = [...selectedFiles];
    setNewMessageText('');
    setSelectedFiles([]);

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('receiver', selectedUser._id);
      formData.append('subject', 'Mesaj');
      formData.append('content', messageToSend || '📎 Dosya eki');
      
      filesToSend.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await axiosInstance.post('/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setConversation(prev => 
        prev.map(msg => 
          msg._id === tempMessage._id ? response.data.data : msg
        )
      );
      
      fetchUnreadCount();
      fetchUnreadByUser();
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      
      setConversation(prev => prev.filter(msg => msg._id !== tempMessage._id));
      
      setNewMessageText(messageToSend);
      setSelectedFiles(filesToSend);
      
      alert(error.response?.data?.message || 'Mesaj gönderilemedi');
    } finally {
      setSending(false);
    }
  }, [newMessageText, selectedFiles, selectedUser, user, fetchUnreadCount, fetchUnreadByUser]);

  const handleDownloadAttachment = useCallback(async (messageId, attachmentId, originalName) => {
    try {
      const response = await axiosInstance.get(
        `/messages/${messageId}/attachment/${attachmentId}`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Dosya indirme hatası:', error);
      alert('Dosya indirilemedi');
    }
  }, []);

  const filteredUsers = useMemo(() => 
    users.filter(u =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    ), [users, searchTerm]
  );

  const formatMessageTime = useCallback((date) => {
    const messageDate = new Date(date);
    const today = new Date();
    
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    return messageDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }, []);

  const getFileIcon = useCallback((mimetype) => {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype === 'application/pdf') return '📄';
    return '📎';
  }, []);

  const UserItem = useCallback(({ u }) => (
    <div
      key={u._id}
      onClick={() => handleSelectUser(u)}
      className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
        selectedUser?._id === u._id 
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-600' 
          : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <UserAvatar user={u} size="lg" />
          {unreadByUser[u._id] > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse shadow-lg">
              {unreadByUser[u._id] > 9 ? '9+' : unreadByUser[u._id]}
            </span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {u.firstName} {u.lastName}
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            {u.role === 'admin' ? (
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
        
        {selectedUser?._id === u._id && (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </div>
  ), [handleSelectUser, selectedUser, unreadByUser]);

  return (
    <div className="h-[calc(100vh-64px)] flex bg-white shadow-sm overflow-hidden">
      <div className="w-96 border-r border-gray-200 flex flex-col bg-white">
        <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">💬</span>
              <span>Mesajlar</span>
            </h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-3 py-1 font-bold animate-pulse shadow-lg">
                {unreadCount} yeni
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-blue-100 font-medium">{unreadCount} okunmamış mesaj</p>
          )}
        </div>

        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Kişi ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-sm">Yükleniyor...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-sm font-medium">Kullanıcı bulunamadı</p>
            </div>
          ) : (
            filteredUsers.map((u) => <UserItem key={u._id} u={u} />)
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-5 border-b border-gray-200 bg-white flex items-center gap-3 shadow-sm">
              <UserAvatar user={selectedUser} size="xl" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <span className={selectedUser.role === 'admin' ? 'text-purple-600' : 'text-blue-600'}>
                    {selectedUser.role === 'admin' ? '👑' : '👤'}
                  </span>
                  {selectedUser.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                  <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-green-600 font-medium">Aktif</span>
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50" style={{ backgroundImage: 'linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 100%)' }}>
              {conversation.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
                    <span className="text-6xl">💬</span>
                  </div>
                  <p className="text-lg font-medium text-gray-700">Henüz mesaj yok</p>
                  <p className="text-sm text-gray-400 mt-1">İlk mesajı gönderin!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversation.map((msg) => {
                    const isMine = msg.sender._id === user._id;
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                      >
                        <div className={`max-w-lg ${isMine ? 'order-2' : 'order-1'}`}>
                          {!isMine && (
                            <div className="flex items-end gap-2 mb-1">
                              <UserAvatar user={msg.sender} size="sm" />
                              <span className="text-xs text-gray-500 font-medium">
                                {msg.sender.firstName}
                              </span>
                            </div>
                          )}
                          
                          <div
                            className={`px-4 py-3 rounded-2xl shadow-md ${
                              isMine
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                                : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                            } ${msg.isSending ? 'opacity-70' : ''}`}
                          >
                            {msg.subject !== 'Mesaj' && (
                              <p className={`text-xs font-semibold mb-1 ${isMine ? 'text-blue-100' : 'text-gray-600'}`}>
                                {msg.subject}
                              </p>
                            )}
                            
                            {msg.content && (
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {msg.content}
                                {msg.isSending && (
                                  <span className="ml-2 inline-flex items-center">
                                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  </span>
                                )}
                              </p>
                            )}
                            
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {msg.attachments.map((attachment) => (
                                  <button
                                    key={attachment._id}
                                    onClick={() => handleDownloadAttachment(msg._id, attachment._id, attachment.originalName)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition w-full text-left ${
                                      isMine
                                        ? 'bg-blue-700 hover:bg-blue-800'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                  >
                                    <span className="text-xl">{getFileIcon(attachment.mimetype)}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-xs font-medium truncate ${isMine ? 'text-white' : 'text-gray-900'}`}>
                                        {attachment.originalName}
                                      </p>
                                      <p className={`text-xs ${isMine ? 'text-blue-200' : 'text-gray-500'}`}>
                                        {(attachment.size / 1024).toFixed(1)} KB
                                      </p>
                                    </div>
                                    <svg className={`w-4 h-4 ${isMine ? 'text-blue-200' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            <p className={`text-xs mt-2 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
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

            {selectedFiles.length > 0 && (
              <div className="px-4 py-2 bg-gray-100 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-300">
                      <span className="text-lg">{getFileIcon(file.type)}</span>
                      <span className="text-xs text-gray-700 max-w-[150px] truncate">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-5 border-t border-gray-200 bg-white shadow-lg">
              <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl transition-all group shadow-sm hover:shadow-md"
                    title="Dosya ekle"
                  >
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current.accept = 'image/*';
                      fileInputRef.current?.click();
                    }}
                    className="p-3 bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 rounded-xl transition-all group shadow-sm hover:shadow-md"
                    title="Resim ekle"
                  >
                    <svg className="w-5 h-5 text-green-600 group-hover:text-green-700 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current.accept = '.pdf';
                      fileInputRef.current?.click();
                    }}
                    className="p-3 bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 rounded-xl transition-all group shadow-sm hover:shadow-md"
                    title="PDF ekle"
                  >
                    <svg className="w-5 h-5 text-red-600 group-hover:text-red-700 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>

                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 px-5 py-3.5 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  disabled={sending}
                />
                
                <button
                  type="submit"
                  disabled={sending || (!newMessageText.trim() && selectedFiles.length === 0)}
                  className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  {sending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Gönderiliyor...</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>Gönder</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </span>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50" style={{ backgroundImage: 'linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 100%)' }}>
            <div className="w-40 h-40 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-8 shadow-xl animate-pulse">
              <span className="text-8xl">💬</span>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-gray-700">Mesajlarınız</h3>
            <p className="text-sm text-gray-500">Sohbet başlatmak için soldaki listeden bir kişi seçin</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;