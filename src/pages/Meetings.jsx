import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

const Meetings = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportingId, setExportingId] = useState(null); // Hangi toplantı export ediliyor
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

  const fetchMeetings = async () => {
    try {
      const response = await axiosInstance.get('/meetings');
      setMeetings(response.data.data || []);
    } catch (error) {
      console.error('Toplantılar yüklenemedi:', error);
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

  // Tüm toplantıları export et
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

      alert('✅ Tüm toplantılar Excel dosyası olarak indirildi!');
    } catch (error) {
      console.error('Excel export hatası:', error);
      alert('❌ Excel dosyası indirilemedi');
    } finally {
      setExporting(false);
    }
  };

  // Tekil toplantı - Yoklama listesi indir
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

      alert('✅ Yoklama listesi başarıyla indirildi!');
    } catch (error) {
      console.error('Yoklama export hatası:', error);
      alert('❌ Yoklama listesi indirilemedi');
    } finally {
      setExportingId(null);
    }
  };

  // Tekil toplantı - Not raporu indir
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

      alert('✅ Toplantı raporu başarıyla indirildi!');
    } catch (error) {
      console.error('Rapor export hatası:', error);
      alert('❌ Toplantı raporu indirilemedi');
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingMeeting) {
        await axiosInstance.put(`/meetings/${editingMeeting._id}`, formData);
      } else {
        await axiosInstance.post('/meetings', formData);
      }

      fetchMeetings();
      handleCloseModal();
      alert(editingMeeting ? 'Toplantı güncellendi!' : 'Toplantı oluşturuldu!');
    } catch (error) {
      console.error('İşlem başarısız:', error);
      alert(error.response?.data?.message || 'Bir hata oluştu');
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
      alert('Toplantı silindi!');
    } catch (error) {
      console.error('Silme işlemi başarısız:', error);
      alert(error.response?.data?.message || 'Toplantı silinemedi');
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

  const getStatusBadge = (status) => {
    const badges = {
      planned: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const texts = {
      planned: 'Planlandı',
      completed: 'Tamamlandı',
      cancelled: 'İptal Edildi',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {texts[status]}
      </span>
    );
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Toplantılar</h1>
          <p className="text-gray-600 mt-1">Tüm toplantıları yönetin</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            disabled={exporting || meetings.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                <span>📥</span>
                <span>Tümünü İndir (Excel)</span>
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

      {/* Meetings List */}
      <div className="space-y-4">
        {meetings.map((meeting) => (
          <div
            key={meeting._id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{meeting.title}</h3>
                  {getStatusBadge(meeting.status)}
                </div>
                {meeting.description && (
                  <p className="text-gray-600 mb-4">{meeting.description}</p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tarih</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(meeting.date).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Saat</p>
                    <p className="text-sm font-medium text-gray-900">{meeting.time}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Yer</p>
                    <p className="text-sm font-medium text-gray-900">{meeting.location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Katılımcılar</p>
                    <p className="text-sm font-medium text-gray-900">
                      {meeting.participants.length} kişi
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {meeting.participants.map((participant) => (
                    <span
                      key={participant._id}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                    >
                      {participant.firstName} {participant.lastName}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* SAĞ TARAF - BUTONLAR */}
              <div className="flex flex-col gap-2 ml-4">
                {/* CRUD Butonları */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/meetings/${meeting._id}`)}
                    className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded"
                  >
                    Detay
                  </button>
                  <button
                    onClick={() => handleEdit(meeting)}
                    className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(meeting._id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    Sil
                  </button>
                </div>

                {/* 👇 YENİ: 2 İNDİRME BUTONU */}
                <div className="border-t pt-2 mt-2 space-y-1">
                  {/* 1. Yoklama Listesi Butonu */}
                  <button
                    onClick={() => handleExportAttendance(meeting._id)}
                    disabled={exportingId === meeting._id + '-attendance'}
                    className="w-full px-3 py-2 text-xs bg-purple-600 text-white hover:bg-purple-700 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
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
                        <span>Yoklama Listesi</span>
                      </>
                    )}
                  </button>

                  {/* 2. Not Raporu Butonu */}
                  <button
                    onClick={() => handleExportNotes(meeting._id)}
                    disabled={exportingId === meeting._id + '-notes'}
                    className="w-full px-3 py-2 text-xs bg-teal-600 text-white hover:bg-teal-700 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
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
                        <span>Not Raporu</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {meetings.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">Henüz toplantı oluşturulmamış</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingMeeting ? 'Toplantıyı Düzenle' : 'Yeni Toplantı Oluştur'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlık
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tarih
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Saat
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yer
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Katılımcılar
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {users.map((user) => (
                      <label
                        key={user._id}
                        className="flex items-center space-x-2 py-2 hover:bg-gray-50 px-2 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.participants.includes(user._id)}
                          onChange={() => handleParticipantToggle(user._id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">
                          {user.firstName} {user.lastName} ({user.email})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  {editingMeeting ? 'Güncelle' : 'Oluştur'}
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