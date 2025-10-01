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
      setMeetings(response.data.data);
    } catch (error) {
      console.error('Toplantılar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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
      date: new Date(meeting.date).toISOString().split('T')[0],
      time: meeting.time,
      location: meeting.location,
      participants: meeting.participants.map((p) => p._id),
    });
    setShowModal(true);
  };

  const handleDelete = async (meetingId) => {
    if (!window.confirm('Bu toplantıyı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/meetings/${meetingId}`);
      fetchMeetings();
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
      planned: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Planlandı' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Tamamlandı' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'İptal Edildi' },
    };
    const badge = badges[status] || badges.planned;
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Toplantılar</h1>
          <p className="text-gray-600 mt-1">Tüm toplantıları yönetin</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          + Yeni Toplantı
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {meetings.map((meeting) => (
          <div
            key={meeting._id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {meeting.title}
                  </h3>
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
              <div className="flex gap-2 ml-4">
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
            </div>
          </div>
        ))}

        {meetings.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">Henüz toplantı oluşturulmamış</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingMeeting ? 'Toplantı Düzenle' : 'Yeni Toplantı Oluştur'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Toplantı Başlığı
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
                <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {users.map((user) => (
                    <label
                      key={user._id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.participants.includes(user._id)}
                        onChange={() => handleParticipantToggle(user._id)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-900">
                        {user.firstName} {user.lastName} ({user.email})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
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