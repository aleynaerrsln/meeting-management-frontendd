import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

const MeetingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [activeSection, setActiveSection] = useState('info');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchMeetingDetail();
  }, [id]);

  const fetchMeetingDetail = async () => {
    try {
      const response = await axiosInstance.get(`/meetings/${id}`);
      setMeeting(response.data);
      
      if (response.data.status === 'completed') {
        setShowNotes(true);
        setShowAttendance(true);
      }
    } catch (error) {
      console.error('Toplantı detayı yüklenemedi:', error);
      showNotification('Toplantı bulunamadı', 'error');
      navigate('/meetings');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStartMeeting = () => {
    setShowAttendance(true);
    setShowNotes(true);
    setActiveSection('attendance');
    showNotification('Toplantı başladı! Artık yoklama alabilir ve not ekleyebilirsiniz.', 'success');
  };

  const handleAttendance = async (userId, status) => {
    try {
      await axiosInstance.put(`/meetings/${id}/attendance`, {
        userId,
        status,
      });
      fetchMeetingDetail();
    } catch (error) {
      console.error('Yoklama işaretleme hatası:', error);
      showNotification(error.response?.data?.message || 'Yoklama işaretlenemedi', 'error');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.content.trim()) {
      showNotification('Lütfen başlık ve içerik girin', 'error');
      return;
    }

    try {
      setIsAddingNote(true);
      await axiosInstance.post(`/meetings/${id}/notes`, newNote);
      setNewNote({ title: '', content: '' });
      fetchMeetingDetail();
      showNotification('Not başarıyla eklendi!', 'success');
    } catch (error) {
      console.error('Not ekleme hatası:', error);
      showNotification(error.response?.data?.message || 'Not eklenemedi', 'error');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Bu notu silmek istediğinizden emin misiniz?')) return;

    try {
      await axiosInstance.delete(`/meetings/${id}/notes/${noteId}`);
      fetchMeetingDetail();
      showNotification('Not silindi!', 'success');
    } catch (error) {
      console.error('Not silme hatası:', error);
      showNotification(error.response?.data?.message || 'Not silinemedi', 'error');
    }
  };

  const handleCompleteMeeting = async () => {
    const attendedCount = meeting.attendance.filter(a => a.status === 'attended').length;
    const notAttendedCount = meeting.attendance.filter(a => a.status === 'not_attended').length;
    const pendingCount = meeting.attendance.filter(a => a.status === 'pending').length;
    const notesCount = meeting.notes?.length || 0;

    const confirmMessage = `Toplantıyı tamamlamak istediğinizden emin misiniz?\n\nYoklama Özeti:\n✅ Katılan: ${attendedCount}\n❌ Katılmayan: ${notAttendedCount}\n⏳ Bekleyen: ${pendingCount}\n\n📝 Toplam Not: ${notesCount}`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await axiosInstance.put(`/meetings/${id}`, {
        status: 'completed',
      });
      
      showNotification(`Toplantı başarıyla tamamlandı! Katılım: ${attendedCount}/${meeting.participants.length} | Not Sayısı: ${notesCount}`, 'success');
      
      // Genel Bilgiler sekmesine geç
      setActiveSection('info');
      fetchMeetingDetail();
    } catch (error) {
      console.error('Toplantı tamamlama hatası:', error);
      showNotification(error.response?.data?.message || 'Toplantı tamamlanamadı', 'error');
    }
  };

  const handleCancelMeeting = async () => {
    if (!window.confirm('Toplantıyı iptal etmek istediğinizden emin misiniz?')) return;

    try {
      await axiosInstance.put(`/meetings/${id}`, {
        status: 'cancelled',
      });
      fetchMeetingDetail();
      showNotification('Toplantı iptal edildi', 'warning');
    } catch (error) {
      console.error('Toplantı iptal hatası:', error);
      showNotification(error.response?.data?.message || 'Toplantı iptal edilemedi', 'error');
    }
  };

  const getAttendanceStatus = (userId) => {
    const attendance = meeting?.attendance?.find((a) => a.user._id === userId);
    return attendance?.status || 'pending';
  };

  const getStatusColor = (status) => {
    const colors = {
      planned: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.planned;
  };

  const getStatusText = (status) => {
    const texts = {
      planned: '📅 Planlandı',
      completed: '✅ Tamamlandı',
      cancelled: '❌ İptal Edildi',
    };
    return texts[status] || status;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Toplantı bulunamadı</p>
      </div>
    );
  }

  const attendedCount = meeting.attendance?.filter(a => a.status === 'attended').length || 0;
  const notAttendedCount = meeting.attendance?.filter(a => a.status === 'not_attended').length || 0;
  const pendingCount = meeting.attendance?.filter(a => a.status === 'pending').length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Notification Modal */}
      {notification && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className={`bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all ${
            notification.type === 'success' ? 'border-l-4 border-green-500' :
            notification.type === 'error' ? 'border-l-4 border-red-500' :
            'border-l-4 border-yellow-500'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && (
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {notification.type === 'error' && (
                  <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {notification.type === 'warning' && (
                  <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/meetings')}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2 transition"
        >
          ← Geri Dön
        </button>
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{meeting.title}</h1>
            {meeting.description && (
              <p className="text-gray-600 max-w-2xl">{meeting.description}</p>
            )}
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(meeting.status)}`}>
            {getStatusText(meeting.status)}
          </span>
        </div>
      </div>

      {/* Toplantı Bilgileri Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">📅 Tarih</p>
          <p className="text-lg font-semibold text-gray-900">{formatDate(meeting.date)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">🕐 Saat</p>
          <p className="text-lg font-semibold text-gray-900">{meeting.time}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">📍 Yer</p>
          <p className="text-lg font-semibold text-gray-900">{meeting.location}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">👥 Katılımcı</p>
          <p className="text-lg font-semibold text-gray-900">
            {meeting.participants?.length || 0} kişi
          </p>
        </div>
      </div>

      {/* Toplantı Başlat/Bitir Butonları */}
      {meeting.status === 'planned' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Toplantı İşlemleri</h2>
          <div className="flex gap-3 flex-wrap">
            {!showAttendance && !showNotes && (
              <button
                onClick={handleStartMeeting}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold shadow-md"
              >
                ▶️ Toplantıyı Başlat
              </button>
            )}
            {(showAttendance || showNotes) && (
              <>
                <button
                  onClick={handleCompleteMeeting}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold shadow-md"
                >
                  ✓ Toplantıyı Tamamla
                </button>
                <button
                  onClick={handleCancelMeeting}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold shadow-md"
                >
                  ✕ İptal Et
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      {(showAttendance || showNotes || meeting.status === 'completed') && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveSection('info')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeSection === 'info'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📋 Genel Bilgiler
              </button>
              {(showAttendance || meeting.status === 'completed') && (
                <button
                  onClick={() => setActiveSection('attendance')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                    activeSection === 'attendance'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  ✅ Yoklama ({attendedCount}/{meeting.participants?.length})
                </button>
              )}
              {(showNotes || meeting.status === 'completed') && (
                <button
                  onClick={() => setActiveSection('notes')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                    activeSection === 'notes'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📝 Notlar ({meeting.notes?.length || 0})
                </button>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Content Sections */}
      {activeSection === 'info' && (
        <div className="space-y-6">
          {/* Toplantı Tamamlanmışsa Rapor Göster */}
          {meeting.status === 'completed' && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6 mb-6">
              <div className="flex items-center mb-4">
                <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-2xl font-bold text-gray-900">📋 Toplantı Raporu</h2>
              </div>

              {/* Yoklama Özeti */}
              <div className="bg-white rounded-lg p-5 mb-4 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm mr-2">Yoklama</span>
                  Katılım Durumu
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Toplam Katılımcı</p>
                    <p className="text-3xl font-bold text-gray-900">{meeting.participants?.length || 0}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-700 mb-1">✅ Katılan</p>
                    <p className="text-3xl font-bold text-green-700">{attendedCount}</p>
                    <p className="text-xs text-green-600 mt-1">
                      {((attendedCount / meeting.participants?.length) * 100).toFixed(0)}% katılım
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <p className="text-sm text-red-700 mb-1">❌ Katılmayan</p>
                    <p className="text-3xl font-bold text-red-700">{notAttendedCount}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <p className="text-sm text-yellow-700 mb-1">⏳ Bekleyen</p>
                    <p className="text-3xl font-bold text-yellow-700">{pendingCount}</p>
                  </div>
                </div>

                {/* Katılanlar Listesi */}
                {attendedCount > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Katılan Kişiler:</h4>
                    <div className="flex flex-wrap gap-2">
                      {meeting.attendance
                        ?.filter(a => a.status === 'attended')
                        .map(a => (
                          <span key={a.user._id} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            ✓ {a.user.firstName} {a.user.lastName}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Katılmayanlar Listesi */}
                {notAttendedCount > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Katılmayan Kişiler:</h4>
                    <div className="flex flex-wrap gap-2">
                      {meeting.attendance
                        ?.filter(a => a.status === 'not_attended')
                        .map(a => (
                          <span key={a.user._id} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                            ✗ {a.user.firstName} {a.user.lastName}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notlar Özeti */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm mr-2">Notlar</span>
                  Toplantı Notları ({meeting.notes?.length || 0} Adet)
                </h3>
                {meeting.notes && meeting.notes.length > 0 ? (
                  <div className="space-y-3">
                    {meeting.notes.map((note, index) => (
                      <div key={note._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {index + 1}. {note.title}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {new Date(note.createdAt).toLocaleString('tr-TR')}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap text-sm">{note.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          📝 {note.createdBy?.firstName} {note.createdBy?.lastName}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Toplantı notu eklenmemiş</p>
                )}
              </div>
            </div>
          )}

          {/* Katılımcılar Listesi */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Katılımcılar</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {meeting.participants?.map((participant) => (
                <div
                  key={participant._id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {participant.firstName?.[0]}{participant.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {participant.firstName} {participant.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{participant.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Yoklama Bölümü */}
      {activeSection === 'attendance' && (showAttendance || meeting.status === 'completed') && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Yoklama Listesi</h2>
              <div className="flex gap-2 text-sm">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">✓ {attendedCount}</span>
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full">✗ {notAttendedCount}</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">⏳ {pendingCount}</span>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {meeting.participants?.map((participant) => {
              const status = getAttendanceStatus(participant._id);
              return (
                <div
                  key={participant._id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {participant.firstName?.[0]}{participant.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {participant.firstName} {participant.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{participant.email}</p>
                    </div>
                  </div>
                  
                  {meeting.status === 'planned' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAttendance(participant._id, 'attended')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          status === 'attended'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                        }`}
                      >
                        ✓ Katıldı
                      </button>
                      <button
                        onClick={() => handleAttendance(participant._id, 'not_attended')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          status === 'not_attended'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-red-100'
                        }`}
                      >
                        ✗ Katılmadı
                      </button>
                    </div>
                  )}
                  
                  {meeting.status !== 'planned' && (
                    <span
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        status === 'attended'
                          ? 'bg-green-100 text-green-800'
                          : status === 'not_attended'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {status === 'attended' ? '✓ Katıldı' : status === 'not_attended' ? '✗ Katılmadı' : '⏳ Beklemede'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notlar Bölümü */}
      {activeSection === 'notes' && (showNotes || meeting.status === 'completed') && (
        <div className="space-y-6">
          {/* Not Ekleme Formu */}
          {meeting.status === 'planned' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni Not Ekle</h3>
              <form onSubmit={handleAddNote} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Not Başlığı
                  </label>
                  <input
                    type="text"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    placeholder="Örn: Karar Noktaları, Aksiyon Maddeleri..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Not İçeriği
                  </label>
                  <textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    placeholder="Not detaylarını buraya yazın..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAddingNote}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                >
                  {isAddingNote ? 'Ekleniyor...' : '+ Not Ekle'}
                </button>
              </form>
            </div>
          )}

          {/* Notlar Listesi */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Toplantı Notları ({meeting.notes?.length || 0})
              </h2>
            </div>
            
            {meeting.notes && meeting.notes.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {meeting.notes.map((note, index) => (
                  <div key={note._id} className="px-6 py-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        Not {index + 1}: {note.title}
                      </h3>
                      {meeting.status === 'planned' && (
                        <button
                          onClick={() => handleDeleteNote(note._id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium transition"
                        >
                          🗑️ Sil
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap mb-2">{note.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        👤 {note.createdBy?.firstName} {note.createdBy?.lastName}
                      </span>
                      <span>
                        🕐 {new Date(note.createdAt).toLocaleString('tr-TR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">Henüz not eklenmemiş</p>
                {meeting.status === 'planned' && (
                  <p className="text-sm text-gray-400 mt-2">Yukarıdaki formdan not ekleyebilirsiniz</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingDetail;