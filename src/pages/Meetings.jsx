import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axios';

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
  const { user, isAdmin } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportingId, setExportingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    participants: [],
  });

  // ✅ Memoized notification handler
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ✅ Memoized fetch functions
  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/meetings');
      setMeetings(response.data.data || []);
    } catch (error) {
      console.error('Toplantılar yüklenemedi:', error);
      showNotification('Toplantılar yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error);
    }
  }, []);

  // ✅ Tek useEffect - mount'ta çalışır
  useEffect(() => {
    const loadData = async () => {
      await fetchMeetings();
      if (isAdmin) {
        await fetchUsers();
      }
    };
    loadData();
  }, [fetchMeetings, fetchUsers, isAdmin]);

  // ✅ Memoized date formatter
  const formatDate = useCallback((date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  // ✅ Memoized user attendance status
  const getUserAttendanceStatus = useCallback((meeting) => {
    const attendance = meeting.attendance?.find(a => a.user._id === user._id || a.user === user._id);
    return attendance?.status || 'pending';
  }, [user._id]);

  // ✅ Memoized handlers
  const handleCloseModal = useCallback(() => {
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
  }, []);

  const handleExportExcel = useCallback(async () => {
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
      showNotification('Excel indirilemedi', 'error');
    } finally {
      setExporting(false);
    }
  }, [showNotification]);

  const handleExportAttendance = useCallback(async (meetingId) => {
    try {
      setExportingId(meetingId + '-attendance');
      const response = await axiosInstance.get(`/export/attendance/${meetingId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `yoklama-${meetingId}-${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showNotification('✅ Yoklama listesi indirildi!', 'success');
    } catch (error) {
      console.error('Yoklama export hatası:', error);
      showNotification('Yoklama listesi indirilemedi', 'error');
    } finally {
      setExportingId(null);
    }
  }, [showNotification]);

  const handleExportNotes = useCallback(async (meetingId) => {
    try {
      setExportingId(meetingId + '-notes');
      const response = await axiosInstance.get(`/export/meeting-notes/${meetingId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `notlar-${meetingId}-${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showNotification('✅ Toplantı notları indirildi!', 'success');
    } catch (error) {
      console.error('Notlar export hatası:', error);
      showNotification('Toplantı notları indirilemedi', 'error');
    } finally {
      setExportingId(null);
    }
  }, [showNotification]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.time || !formData.location) {
      showNotification('⚠️ Lütfen tüm zorunlu alanları doldurun', 'error');
      return;
    }

    setSubmitting(true);

    try {
      if (editingMeeting) {
        await axiosInstance.put(`/meetings/${editingMeeting._id}`, formData);
        showNotification('✅ Toplantı başarıyla güncellendi!', 'success');
      } else {
        await axiosInstance.post('/meetings', formData);
        showNotification('✅ Toplantı başarıyla oluşturuldu!', 'success');
      }

      await fetchMeetings();
      handleCloseModal();
    } catch (error) {
      console.error('İşlem başarısız:', error);
      showNotification(error.response?.data?.message || '❌ Bir hata oluştu', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [formData, editingMeeting, showNotification, fetchMeetings, handleCloseModal]);

  const handleEdit = useCallback((meeting) => {
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
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Bu toplantıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/meetings/${id}`);
      fetchMeetings();
      showNotification('🗑️ Toplantı silindi!', 'success');
    } catch (error) {
      console.error('Silme hatası:', error);
      showNotification('Toplantı silinemedi', 'error');
    }
  }, [fetchMeetings, showNotification]);

  // ✅ Memoized form change handler
  const handleFormChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleParticipantToggle = useCallback((userId) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.includes(userId)
        ? prev.participants.filter(id => id !== userId)
        : [...prev.participants, userId]
    }));
  }, []);

  // 🆕 Tümünü Seç/Temizle (Toggle)
  const handleSelectAll = useCallback(() => {
    const allUserIds = users.map(u => u._id);
    const allSelected = allUserIds.every(id => formData.participants.includes(id));
    
    if (allSelected) {
      // Hepsi seçiliyse, tümünü temizle
      setFormData(prev => ({
        ...prev,
        participants: []
      }));
    } else {
      // Değilse, tümünü seç
      setFormData(prev => ({
        ...prev,
        participants: allUserIds
      }));
    }
  }, [users, formData.participants]);

  // 🆕 Seçimi Temizle
  const handleDeselectAll = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      participants: []
    }));
  }, []);

  // 🆕 Birim Bazlı Seçim
  const handleSelectDepartment = useCallback((dept) => {
    const deptUsers = departmentUsers[dept] || [];
    const deptUserIds = deptUsers.map(u => u._id);
    
    const allSelected = deptUserIds.every(id => formData.participants.includes(id));
    
    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        participants: prev.participants.filter(id => !deptUserIds.includes(id))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        participants: [...new Set([...prev.participants, ...deptUserIds])]
      }));
    }
  }, [formData.participants]);

  // ✅ Memoized department users
  const departmentUsers = useMemo(() => {
    return DEPARTMENTS.reduce((acc, dept) => {
      acc[dept] = users.filter(u => u.departments?.includes(dept));
      return acc;
    }, {});
  }, [users]);

  return (
    <div>
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slideIn">
          <div className={`rounded-lg shadow-lg p-4 max-w-md ${
            notification.type === 'success' ? 'bg-green-50 border border-green-200' :
            notification.type === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {notification.message}
                </p>
              </div>
              <button onClick={() => setNotification(null)} className="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? 'Toplantı Yönetimi' : 'Toplantılarım'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Tüm toplantıları yönetin' : 'Katıldığınız toplantıları görüntüleyin'}
          </p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <>
              <button
                onClick={handleExportExcel}
                disabled={exporting || meetings.length === 0}
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
            </>
          )}
        </div>
      </div>

      {/* Meetings Grid */}
      {meetings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-gray-500">
            {isAdmin ? 'Henüz toplantı oluşturulmamış.' : 'Henüz hiçbir toplantıya davet edilmediniz.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((meeting) => {
            const userAttendanceStatus = getUserAttendanceStatus(meeting);
            
            return (
              <div key={meeting._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
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

                  {/* Admin Actions */}
                  {isAdmin ? (
                    <>
                      <div className="flex gap-2 mb-3">
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

                      {meeting.status !== 'cancelled' && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleExportAttendance(meeting._id)}
                            disabled={exportingId === meeting._id + '-attendance'}
                            className="w-full px-3 py-2 text-xs bg-green-600 text-white hover:bg-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                          >
                            {exportingId === meeting._id + '-attendance' ? '⏳' : '📊'} Yoklama
                          </button>
                          <button
                            onClick={() => handleExportNotes(meeting._id)}
                            disabled={exportingId === meeting._id + '-notes'}
                            className="w-full px-3 py-2 text-xs bg-purple-600 text-white hover:bg-purple-700 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                          >
                            {exportingId === meeting._id + '-notes' ? '⏳' : '📝'} Notlar
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate(`/meetings/${meeting._id}`)}
                        className="w-full px-3 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition mb-2"
                      >
                        Detayları Gör
                      </button>
                      
                      {!isAdmin && meeting.status !== 'cancelled' && (
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <span className="text-gray-600">Katılım Durumunuz:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            userAttendanceStatus === 'attended' ? 'bg-green-100 text-green-800' :
                            userAttendanceStatus === 'not_attended' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {userAttendanceStatus === 'attended' ? '✅ Katıldı' :
                             userAttendanceStatus === 'not_attended' ? '❌ Katılmadı' :
                             '⏳ Bekliyor'}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingMeeting ? 'Toplantıyı Düzenle' : 'Yeni Toplantı Oluştur'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Toplantı Başlığı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Örn: Haftalık Ekip Toplantısı"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Toplantının amacını ve gündemini kısaca açıklayın..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarih <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleFormChange('date', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Saat <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleFormChange('time', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Örn: Toplantı Odası A, Zoom"
                  required
                />
              </div>

              {/* 🆕 Yeni Katılımcı Seçim Sistemi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Katılımcılar ({formData.participants.length} seçili)
                </label>

                {/* Birim Butonları */}
                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2">Ekip Seçimi (tıklayarak tüm ekibi ekle/çıkar):</p>
                  <div className="flex flex-wrap gap-2">
                    {DEPARTMENTS.map((dept) => {
                      const deptUsers = departmentUsers[dept] || [];
                      if (deptUsers.length === 0) return null;

                      const deptUserIds = deptUsers.map(u => u._id);
                      const allSelected = deptUserIds.every(id => formData.participants.includes(id));

                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => handleSelectDepartment(dept)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            allSelected
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {allSelected && '✓ '}
                          {dept}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tüm Üyeler Listesi */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">Tüm Üyeler:</p>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
                    >
                      ✓ Tümünü Seç
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {users.map((u) => (
                      <label
                        key={u._id}
                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={formData.participants.includes(u._id)}
                          onChange={() => handleParticipantToggle(u._id)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          {u.firstName} {u.lastName}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Kaydediliyor...' : editingMeeting ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;