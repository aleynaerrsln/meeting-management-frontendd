import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios'; // ✅ utils/axios kullanılıyor

const DEPARTMENTS = [
  'Yazılım Birimi',
  'Elektrik Birimi',
  'Makine Birimi',
  'Tasarım Birimi',
  'Yönetim Birimi',
  'Pazarlama Birimi'
];

const Meetings = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportingId, setExportingId] = useState(null);
  const [submitting, setSubmitting] = useState(false); // 🆕 Form gönderim durumu
  const [notification, setNotification] = useState(null); // 🆕 Modern bildirim
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    participants: [],
  });

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
  }, []);

  // 🆕 Modern bildirim gösterme
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchMeetings = async () => {
    try {
      const response = await axiosInstance.get('/meetings');
      setMeetings(response.data.data || []);
    } catch (error) {
      console.error('Toplantılar yüklenemedi:', error);
      showNotification('Toplantılar yüklenemedi', 'error');
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

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const response = await axiosInstance.get('/export/meetings', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tum-toplantilar-${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showNotification('✅ Tüm toplantılar Excel dosyası olarak indirildi!', 'success');
    } catch (error) {
      console.error('Excel export hatası:', error);
      showNotification('❌ Excel dosyası indirilemedi', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleExportAttendance = async (meetingId) => {
    try {
      setExportingId(meetingId + '-attendance');
      const response = await axiosInstance.get(`/export/attendance/${meetingId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `yoklama-${meetingId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showNotification('✅ Yoklama listesi başarıyla indirildi!', 'success');
    } catch (error) {
      console.error('Yoklama export hatası:', error);
      showNotification('❌ Yoklama listesi indirilemedi', 'error');
    } finally {
      setExportingId(null);
    }
  };

  const handleExportNotes = async (meetingId) => {
    try {
      setExportingId(meetingId + '-notes');
      const response = await axiosInstance.get(`/export/meeting-notes/${meetingId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `toplanti-raporu-${meetingId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showNotification('✅ Toplantı raporu başarıyla indirildi!', 'success');
    } catch (error) {
      console.error('Rapor export hatası:', error);
      showNotification('❌ Toplantı raporu indirilemedi', 'error');
    } finally {
      setExportingId(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleParticipantToggle = (userId) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.includes(userId)
        ? prev.participants.filter((id) => id !== userId)
        : [...prev.participants, userId],
    }));
  };

  const handleDepartmentToggle = (department) => {
    const departmentUsers = users.filter(user => 
      user.departments && user.departments.includes(department)
    );
    
    const departmentUserIds = departmentUsers.map(u => u._id);
    
    const allSelected = departmentUserIds.every(id => 
      formData.participants.includes(id)
    );
    
    setFormData((prev) => {
      if (allSelected) {
        return {
          ...prev,
          participants: prev.participants.filter(id => 
            !departmentUserIds.includes(id)
          )
        };
      } else {
        const newParticipants = [...new Set([...prev.participants, ...departmentUserIds])];
        return {
          ...prev,
          participants: newParticipants
        };
      }
    });
  };

  const handleSelectAll = () => {
    if (formData.participants.length === users.length) {
      setFormData(prev => ({ ...prev, participants: [] }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        participants: users.map(u => u._id) 
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validation
    if (formData.participants.length === 0) {
      showNotification('⚠️ En az bir katılımcı seçmelisiniz!', 'error');
      return;
    }

    setSubmitting(true); // ✅ Loading durumu başlat

    try {
      if (editingMeeting) {
        await axiosInstance.put(`/meetings/${editingMeeting._id}`, formData);
        showNotification('✅ Toplantı başarıyla güncellendi!', 'success');
      } else {
        const response = await axiosInstance.post('/meetings', formData);
        showNotification('✅ Toplantı başarıyla oluşturuldu!', 'success');
        
        // ✅ Yeni oluşturulan toplantının detay sayfasına yönlendir (opsiyonel)
        // setTimeout(() => navigate(`/meetings/${response.data.meeting._id}`), 1500);
      }

      await fetchMeetings(); // ✅ Listeyi yenile
      handleCloseModal();
    } catch (error) {
      console.error('İşlem başarısız:', error);
      showNotification(error.response?.data?.message || '❌ Bir hata oluştu', 'error');
    } finally {
      setSubmitting(false); // ✅ Loading durumu bitir
    }
  };

  const handleEdit = (meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title,
      description: meeting.description || '',
      date: meeting.date.split('T')[0],
      time: meeting.time,
      location: meeting.location,
      participants: meeting.participants.map((p) => p._id),
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu toplantıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/meetings/${id}`);
      fetchMeetings();
      showNotification('🗑️ Toplantı silindi!', 'success');
    } catch (error) {
      console.error('Silme işlemi başarısız:', error);
      showNotification(error.response?.data?.message || 'Toplantı silinemedi', 'error');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMeeting(null);
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      participants: [],
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div>
      {/* 🆕 Modern Bildirim */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div
            className={`rounded-lg shadow-lg p-4 min-w-[300px] max-w-md ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : notification.type === 'error'
                ? 'bg-red-50 border border-red-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : notification.type === 'error' ? (
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-800' : 
                  notification.type === 'error' ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-500"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Toplantılar</h1>
          <p className="text-gray-600 mt-1">Tüm toplantıları görüntüleyin ve yönetin</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {exporting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>İndiriliyor...</span>
              </>
            ) : (
              <>
                <span>📊</span>
                <span>Excel İndir</span>
              </>
            )}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            + Yeni Toplantı
          </button>
        </div>
      </div>

      {/* Meetings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meetings.map((meeting) => (
          <div key={meeting._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">{meeting.title}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  meeting.status === 'completed' ? 'bg-green-100 text-green-800' :
                  meeting.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {meeting.status === 'completed' ? 'Tamamlandı' :
                   meeting.status === 'cancelled' ? 'İptal' : 'Planlandı'}
                </span>
              </div>

              {meeting.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{meeting.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📅</span>
                  <span>{formatDate(meeting.date)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">🕐</span>
                  <span>{meeting.time}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📍</span>
                  <span>{meeting.location}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">👥</span>
                  <span>{meeting.participants?.length || 0} Katılımcı</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/meetings/${meeting._id}`)}
                  className="flex-1 px-3 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition"
                >
                  Detaylar
                </button>
                <button
                  onClick={() => handleEdit(meeting)}
                  className="px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition border border-indigo-600"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => handleDelete(meeting._id)}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition border border-red-600"
                >
                  Sil
                </button>
              </div>

              {/* Export Butonları */}
              {meeting.status !== 'cancelled' && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleExportAttendance(meeting._id)}
                    disabled={exportingId === meeting._id + '-attendance'}
                    className="w-full px-3 py-2 text-xs bg-green-600 text-white hover:bg-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    {exportingId === meeting._id + '-attendance' ? (
                      <>
                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>İndiriliyor...</span>
                      </>
                    ) : (
                      <>
                        <span>📋</span>
                        <span>Yoklama</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleExportNotes(meeting._id)}
                    disabled={exportingId === meeting._id + '-notes'}
                    className="w-full px-3 py-2 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    {exportingId === meeting._id + '-notes' ? (
                      <>
                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>İndiriliyor...</span>
                      </>
                    ) : (
                      <>
                        <span>📄</span>
                        <span>Rapor</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingMeeting ? 'Toplantıyı Düzenle' : 'Yeni Toplantı Oluştur'}
              </h3>
              {submitting && (
                <div className="flex items-center gap-2 text-indigo-600">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Kaydediliyor...</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Toplantı Başlığı *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="Örn: Haftalık Ekip Toplantısı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={submitting}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="Toplantı hakkında detaylar..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saat *</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yer *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="Örn: Toplantı Odası A"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Katılımcılar * ({formData.participants.length} seçildi)
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    disabled={submitting}
                    className="text-xs text-indigo-600 hover:text-indigo-800 disabled:text-gray-400"
                  >
                    {formData.participants.length === users.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                  </button>
                </div>

                {/* Birim Bazlı Hızlı Seçim */}
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-2">Birim Bazlı Seçim:</p>
                  <div className="flex flex-wrap gap-2">
                    {DEPARTMENTS.map((dept) => {
                      const deptUsers = users.filter(u => u.departments && u.departments.includes(dept));
                      const deptUserIds = deptUsers.map(u => u._id);
                      const allSelected = deptUserIds.every(id => formData.participants.includes(id));
                      
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => handleDepartmentToggle(dept)}
                          disabled={submitting || deptUsers.length === 0}
                          className={`px-2 py-1 text-xs rounded transition ${
                            allSelected 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          } disabled:opacity-50`}
                        >
                          {dept} ({deptUsers.length})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Kullanıcı Listesi */}
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                  {users.map((user) => (
                    <label key={user._id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.participants.includes(user._id)}
                        onChange={() => handleParticipantToggle(user._id)}
                        disabled={submitting}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">({user.email})</span>
                        {user.departments && user.departments.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {user.departments.map((dept, idx) => (
                              <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                {dept}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting || formData.participants.length === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <span>{editingMeeting ? 'Güncelle' : 'Oluştur'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Animasyon CSS */}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Meetings;