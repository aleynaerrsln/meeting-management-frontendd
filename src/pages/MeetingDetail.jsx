import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

const MeetingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetingDetail();
  }, [id]);

  const fetchMeetingDetail = async () => {
    try {
      const response = await axiosInstance.get(`/meetings/${id}`);
      setMeeting(response.data);
    } catch (error) {
      console.error('Toplantı detayı yüklenemedi:', error);
      alert('Toplantı bulunamadı');
      navigate('/meetings');
    } finally {
      setLoading(false);
    }
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
      alert(error.response?.data?.message || 'Yoklama işaretlenemedi');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axiosInstance.put(`/meetings/${id}`, {
        status: newStatus,
      });
      fetchMeetingDetail();
    } catch (error) {
      console.error('Durum değiştirme hatası:', error);
      alert(error.response?.data?.message || 'Durum değiştirilemedi');
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

  const getStatusLabel = (status) => {
    const labels = {
      planned: 'Planlandı',
      completed: 'Tamamlandı',
      cancelled: 'İptal Edildi',
    };
    return labels[status] || status;
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
      <div className="text-center py-12">
        <p className="text-gray-500">Toplantı bulunamadı</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/meetings')}
          className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-2"
        >
          ← Geri Dön
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{meeting.title}</h1>
            {meeting.description && (
              <p className="text-gray-600 mt-2">{meeting.description}</p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(meeting.status)}`}>
            {getStatusLabel(meeting.status)}
          </span>
        </div>
      </div>

      {/* Meeting Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">📅 Tarih</p>
          <p className="text-lg font-semibold text-gray-900">
            {new Date(meeting.date).toLocaleDateString('tr-TR')}
          </p>
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

      {/* Status Actions */}
      {meeting.status === 'planned' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Toplantı Durumu</h2>
          <div className="flex gap-3">
            <button
              onClick={() => handleStatusChange('completed')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              ✓ Toplantıyı Tamamla
            </button>
            <button
              onClick={() => handleStatusChange('cancelled')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              ✕ Toplantıyı İptal Et
            </button>
          </div>
        </div>
      )}

      {/* Attendance List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Yoklama Listesi</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {meeting.participants?.map((participant) => {
            const status = getAttendanceStatus(participant._id);
            return (
              <div key={participant._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                    {participant.firstName.charAt(0)}{participant.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {participant.firstName} {participant.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{participant.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {status === 'pending' && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                      ⏳ Beklemede
                    </span>
                  )}
                  {status === 'attended' && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      ✓ Katıldı
                    </span>
                  )}
                  {status === 'not_attended' && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      ✕ Katılmadı
                    </span>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAttendance(participant._id, 'attended')}
                      className={`p-2 rounded-lg transition ${
                        status === 'attended'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-green-100'
                      }`}
                      title="Katıldı"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handleAttendance(participant._id, 'not_attended')}
                      className={`p-2 rounded-lg transition ${
                        status === 'not_attended'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-red-100'
                      }`}
                      title="Katılmadı"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {meeting.attendance?.filter((a) => a.status === 'attended').length || 0}
          </p>
          <p className="text-sm text-gray-600">Katıldı</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {meeting.attendance?.filter((a) => a.status === 'not_attended').length || 0}
          </p>
          <p className="text-sm text-gray-600">Katılmadı</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {meeting.attendance?.filter((a) => a.status === 'pending').length || 0}
          </p>
          <p className="text-sm text-gray-600">Beklemede</p>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetail;