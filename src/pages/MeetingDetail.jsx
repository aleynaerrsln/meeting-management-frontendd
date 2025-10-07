import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';

const MeetingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('info');
  const [notification, setNotification] = useState(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFormData, setReportFormData] = useState({
    assignToUser: '',
    isPrivate: false,
    sharedWith: []
  });
  const [noteFormData, setNoteFormData] = useState({
    title: '',
    content: ''
  });

  useEffect(() => {
    fetchMeetingDetail();
    if (isAdmin) {
      fetchUsers();
    }
  }, [id]);

  const fetchMeetingDetail = async () => {
    try {
      const response = await axiosInstance.get(`/meetings/${id}`);
      setMeeting(response.data);
    } catch (error) {
      console.error('Toplantı yüklenemedi:', error);
      showNotification('Toplantı yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAttendance = async (userId, status) => {
    try {
      await axiosInstance.put(`/meetings/${id}/attendance`, { userId, status });
      fetchMeetingDetail();
      showNotification('Yoklama güncellendi!', 'success');
    } catch (error) {
      console.error('Yoklama hatası:', error);
      showNotification(error.response?.data?.message || 'Yoklama güncellenemedi', 'error');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteFormData.title || !noteFormData.content) return;

    try {
      setIsAddingNote(true);
      await axiosInstance.post(`/meetings/${id}/notes`, noteFormData);
      setNoteFormData({ title: '', content: '' });
      fetchMeetingDetail();
      showNotification('Not eklendi!', 'success');
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
    const notesCount = meeting.notes?.length || 0;

    const confirmMessage = `Toplantıyı tamamlamak istediğinizden emin misiniz?\n\n✅ Katılan: ${attendedCount}/${meeting.participants.length}\n📝 Not Sayısı: ${notesCount}\n\nTamamlandıktan sonra "Genel Bilgiler" sekmesinde rapor görünecek.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await axiosInstance.put(`/meetings/${id}`, { status: 'completed' });
      fetchMeetingDetail();
      setActiveSection('info');
      showNotification('✅ Toplantı tamamlandı! Rapor "Genel Bilgiler" sekmesinde görüntülenebilir.', 'success');
    } catch (error) {
      console.error('Toplantı tamamlama hatası:', error);
      showNotification(error.response?.data?.message || 'Toplantı tamamlanamadı', 'error');
    }
  };

  const handleCreateReport = async () => {
    try {
      console.log('📤 Gönderilen Rapor Verisi:', reportFormData);
      
      const response = await axiosInstance.post(`/meetings/${id}/create-report`, reportFormData);
      
      console.log('✅ Rapor Yanıtı:', response.data);

      setShowReportModal(false);
      showNotification('✅ Rapor çalışma raporlarına gönderildi!', 'success');
      
      setTimeout(() => {
        navigate('/work-reports');
      }, 2000);
    } catch (error) {
      console.error('❌ Rapor oluşturma hatası:', error);
      console.error('❌ Hata detayı:', error.response?.data);
      showNotification(error.response?.data?.message || 'Rapor oluşturulamadı', 'error');
    }
  };

  const handleCancelMeeting = async () => {
    if (!window.confirm('Toplantıyı iptal etmek istediğinizden emin misiniz?')) return;

    try {
      await axiosInstance.put(`/meetings/${id}`, { status: 'cancelled' });
      fetchMeetingDetail();
      showNotification('Toplantı iptal edildi!', 'success');
    } catch (error) {
      console.error('İptal hatası:', error);
      showNotification('Toplantı iptal edilemedi', 'error');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      planned: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      planned: 'Planlandı',
      completed: 'Tamamlandı',
      cancelled: 'İptal Edildi',
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Toplantı bulunamadı</div>
      </div>
    );
  }

  const attendedCount = meeting.attendance.filter(a => a.status === 'attended').length;
  const notAttendedCount = meeting.attendance.filter(a => a.status === 'not_attended').length;
  const pendingCount = meeting.attendance.filter(a => a.status === 'pending').length;

  return (
    <div>
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className={`px-6 py-3 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-50 border border-green-200' :
            notification.type === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-yellow-50 border border-yellow-200'
          }`}>
            <p className={`font-medium ${
              notification.type === 'success' ? 'text-green-800' :
              notification.type === 'error' ? 'text-red-800' :
              'text-yellow-800'
            }`}>
              {notification.message}
            </p>
          </div>
        </div>
      )}

      {/* Rapor Oluşturma Modalı */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                📤 Raporu Çalışma Raporlarına Gönder
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Bu rapor "Çalışma Raporları" sayfasında görünecek
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raporu Hangi Kullanıcıya Ata?
                </label>
                <select
                  value={reportFormData.assignToUser}
                  onChange={(e) => setReportFormData({ ...reportFormData, assignToUser: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Kendime Ata</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={reportFormData.isPrivate}
                  onChange={(e) => setReportFormData({ ...reportFormData, isPrivate: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm text-gray-700">
                  🔒 Gizli (Sadece ben görebilirim)
                </label>
              </div>

              {!reportFormData.isPrivate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raporu Kimlerle Paylaş? (Opsiyonel)
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {users.map(user => (
                      <label key={user._id} className="flex items-center space-x-2 py-2 hover:bg-gray-50 px-2 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reportFormData.sharedWith.includes(user._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setReportFormData({
                                ...reportFormData,
                                sharedWith: [...reportFormData.sharedWith, user._id]
                              });
                            } else {
                              setReportFormData({
                                ...reportFormData,
                                sharedWith: reportFormData.sharedWith.filter(id => id !== user._id)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">
                          {user.firstName} {user.lastName}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ℹ️ Rapor Özeti:
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Toplantı notları rapor içeriği olacak</li>
                  <li>• Varsayılan 2 saat çalışma süresi atanacak</li>
                  <li>• Durum otomatik "Onaylandı" olacak</li>
                  <li>• Çalışma Raporları sayfasında görünecek</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleCreateReport}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                ✅ Rapor Oluştur ve Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/meetings')}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Geri Dön
        </button>
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{meeting.title}</h1>
            {meeting.description && (
              <p className="text-gray-600">{meeting.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(meeting.status)}`}>
              {getStatusText(meeting.status)}
            </span>
            {isAdmin && meeting.status === 'planned' && (
              <>
                <button
                  onClick={handleCompleteMeeting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  ✅ Toplantıyı Tamamla
                </button>
                <button
                  onClick={handleCancelMeeting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  ❌ İptal Et
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveSection('info')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeSection === 'info'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 Genel Bilgiler
          </button>
          <button
            onClick={() => setActiveSection('attendance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeSection === 'attendance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            ✓ Yoklama
          </button>
          <button
            onClick={() => setActiveSection('notes')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeSection === 'notes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📝 Notlar
          </button>
        </nav>
      </div>

      {/* Content Sections */}
      {activeSection === 'info' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Toplantı Detayları</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Tarih</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(meeting.date).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Saat</p>
                  <p className="text-base font-medium text-gray-900">{meeting.time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Yer</p>
                  <p className="text-base font-medium text-gray-900">{meeting.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Oluşturan</p>
                  <p className="text-base font-medium text-gray-900">
                    {meeting.createdBy?.firstName} {meeting.createdBy?.lastName}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">İstatistikler</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Toplam Katılımcı:</span>
                  <span className="font-semibold">{meeting.participants.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Katılan:</span>
                  <span className="font-semibold text-green-600">{attendedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Katılmayan:</span>
                  <span className="font-semibold text-red-600">{notAttendedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bekleyen:</span>
                  <span className="font-semibold text-gray-600">{pendingCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Not Sayısı:</span>
                  <span className="font-semibold">{meeting.notes?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Toplantı Raporu Özeti */}
          {meeting.status === 'completed' && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-lg border-2 border-green-300 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    📋 Toplantı Raporu
                    <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs">
                      Tamamlandı
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Toplantı notlarından oluşturulan özet rapor
                  </p>
                </div>

              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                  {meeting.title} - Toplantı Özeti
                </h4>
                
                <div className="space-y-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">📅 Tarih:</span>
                      <span className="ml-2 font-medium">
                        {new Date(meeting.date).toLocaleDateString('tr-TR')} {meeting.time}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">📍 Yer:</span>
                      <span className="ml-2 font-medium">{meeting.location}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">👥 Katılımcı:</span>
                      <span className="ml-2 font-medium">{meeting.participants.length} kişi</span>
                    </div>
                    <div>
                      <span className="text-gray-500">✅ Katılan:</span>
                      <span className="ml-2 font-medium text-green-600">{attendedCount} kişi</span>
                    </div>
                  </div>
                </div>

                <hr className="my-4" />

                <h5 className="font-semibold text-gray-900 mb-3">📝 Toplantı Notları:</h5>
                {meeting.notes && meeting.notes.length > 0 ? (
                  <div className="space-y-4">
                    {meeting.notes.map((note, index) => (
                      <div key={note._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <h6 className="font-semibold text-gray-900">
                            {index + 1}. {note.title}
                          </h6>
                          <span className="text-xs text-gray-500">
                            {new Date(note.createdAt).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {note.createdBy?.firstName} {note.createdBy?.lastName}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Toplantıda not eklenmedi.</p>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Katılımcılar ({meeting.participants.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {meeting.participants.map((participant) => (
                <div
                  key={participant._id}
                  className="flex items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold">
                      {participant.firstName[0]}{participant.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {participant.firstName} {participant.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{participant.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Yoklama Section */}
      {activeSection === 'attendance' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Katılım Durumu</h3>
            <p className="text-sm text-gray-600 mt-1">
              Katılan: {attendedCount} / Katılmayan: {notAttendedCount} / Bekleyen: {pendingCount}
            </p>
          </div>
          <div className="divide-y">
            {meeting.attendance.map((attendance) => {
              const participant = meeting.participants.find(p => p._id === attendance.user._id);
              const status = attendance.status;

              return (
                <div key={attendance.user._id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-semibold">
                        {participant?.firstName[0]}{participant?.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {participant?.firstName} {participant?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{participant?.email}</p>
                    </div>
                  </div>
                  {isAdmin && meeting.status === 'planned' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAttendance(attendance.user._id, 'attended')}
                        className={`px-3 py-1 rounded text-sm ${
                          status === 'attended' ? 'bg-green-600 text-white' : 'bg-gray-200'
                        }`}
                      >
                        ✓ Katıldı
                      </button>
                      <button
                        onClick={() => handleAttendance(attendance.user._id, 'not_attended')}
                        className={`px-3 py-1 rounded text-sm ${
                          status === 'not_attended' ? 'bg-red-600 text-white' : 'bg-gray-200'
                        }`}
                      >
                        ✗ Katılmadı
                      </button>
                    </div>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      status === 'attended' ? 'bg-green-100 text-green-800' :
                      status === 'not_attended' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {status === 'attended' ? '✓ Katıldı' :
                       status === 'not_attended' ? '✗ Katılmadı' : '⏳ Bekliyor'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notlar Section */}
      {activeSection === 'notes' && (
        <div className="space-y-6">
          {meeting.status === 'planned' && isAdmin && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Yeni Not Ekle</h3>
              <form onSubmit={handleAddNote} className="space-y-4">
                <input
                  type="text"
                  placeholder="Not Başlığı"
                  value={noteFormData.title}
                  onChange={(e) => setNoteFormData({ ...noteFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <textarea
                  placeholder="Not İçeriği"
                  value={noteFormData.content}
                  onChange={(e) => setNoteFormData({ ...noteFormData, content: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <button
                  type="submit"
                  disabled={isAddingNote}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isAddingNote ? 'Ekleniyor...' : '+ Not Ekle'}
                </button>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Toplantı Notları ({meeting.notes?.length || 0})</h3>
            </div>
            {meeting.notes && meeting.notes.length > 0 ? (
              <div className="divide-y">
                {meeting.notes.map((note, index) => (
                  <div key={note._id} className="px-6 py-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">Not {index + 1}: {note.title}</h4>
                      {meeting.status === 'planned' && isAdmin && (
                        <button
                          onClick={() => handleDeleteNote(note._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          🗑️ Sil
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {note.createdBy?.firstName} {note.createdBy?.lastName} • {new Date(note.createdAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">
                Henüz not eklenmemiş
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingDetail;