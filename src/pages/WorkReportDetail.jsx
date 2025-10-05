import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiEdit, 
  FiTrash2, 
  FiClock, 
  FiCalendar, 
  FiUser,
  FiDownload,
  FiFile,
  FiImage,
  FiX
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axios';

const WorkReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [deletingAttachment, setDeletingAttachment] = useState(null);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/work-reports/${id}`);
      setReport(response.data);
    } catch (error) {
      console.error('Rapor yüklenemedi:', error);
      showNotification('Rapor yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDelete = async () => {
    if (!confirm('Bu raporu silmek istediğinizden emin misiniz?')) return;

    try {
      await axiosInstance.delete(`/work-reports/${id}`);
      showNotification('Rapor başarıyla silindi', 'success');
      setTimeout(() => navigate('/work-reports'), 1500);
    } catch (error) {
      console.error('Rapor silinemedi:', error);
      showNotification('Rapor silinemedi', 'error');
    }
  };

  const handleDownloadAttachment = async (attachmentId, filename) => {
    try {
      const response = await axiosInstance.get(
        `/work-reports/${id}/attachment/${attachmentId}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showNotification('Dosya indiriliyor...', 'success');
    } catch (error) {
      console.error('Dosya indirilemedi:', error);
      showNotification('Dosya indirilemedi', 'error');
    }
  };

  const handleDeleteAttachment = async (attachmentId, filename) => {
    if (!confirm(`"${filename}" dosyasını silmek istediğinizden emin misiniz?`)) return;

    try {
      setDeletingAttachment(attachmentId);
      await axiosInstance.delete(`/work-reports/${id}/attachment/${attachmentId}`);
      showNotification('Dosya başarıyla silindi', 'success');
      await fetchReport(); // Raporu yenile
    } catch (error) {
      console.error('Dosya silinemedi:', error);
      showNotification('Dosya silinemedi', 'error');
    } finally {
      setDeletingAttachment(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimetype) => {
    if (mimetype === 'application/pdf') return <FiFile className="text-red-500" size={24} />;
    if (mimetype.startsWith('image/')) return <FiImage className="text-blue-500" size={24} />;
    return <FiFile className="text-gray-500" size={24} />;
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    const labels = {
      draft: 'Taslak',
      submitted: 'Gönderildi',
      approved: 'Onaylandı',
      rejected: 'Reddedildi'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Rapor yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Rapor bulunamadı</p>
        <button
          onClick={() => navigate('/work-reports')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  const canEdit = user.role === 'admin' || report.user._id === user._id;

  return (
    <div className="max-w-4xl mx-auto">
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/work-reports')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <FiArrowLeft />
            <span>Geri Dön</span>
          </button>

          <div className="flex items-center gap-3">
            {getStatusBadge(report.status)}
            
            {canEdit && (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/work-reports/${id}/edit`)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiEdit size={18} />
                  <span>Düzenle</span>
                </button>

                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FiTrash2 size={18} />
                  <span>Sil</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Rapor Bilgileri */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiUser className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Kullanıcı</p>
              <p className="font-medium text-gray-800">
                {report.user.firstName} {report.user.lastName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <FiCalendar className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tarih</p>
              <p className="font-medium text-gray-800">
                {new Date(report.date).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiClock className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Çalışma Saati</p>
              <p className="font-medium text-gray-800">
                {report.startTime} - {report.endTime} ({report.hoursWorked} saat)
              </p>
            </div>
          </div>

          {report.project && (
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiFile className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Proje</p>
                <p className="font-medium text-gray-800">{report.project}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Çalışma Açıklaması */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Çalışma Açıklaması</h3>
        <p className="text-gray-700 whitespace-pre-wrap">{report.workDescription}</p>
      </div>

      {/* Notlar */}
      {report.notes && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Ek Notlar</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{report.notes}</p>
        </div>
      )}

      {/* 🆕 Dosya Ekleri Bölümü */}
      {report.attachments && report.attachments.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Dosya Ekleri ({report.attachments.length})
          </h3>
          
          <div className="grid grid-cols-1 gap-3">
            {report.attachments.map((attachment) => (
              <div
                key={attachment._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getFileIcon(attachment.mimetype)}
                  <div>
                    <p className="font-medium text-gray-800">{attachment.originalName}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{formatFileSize(attachment.size)}</span>
                      <span>•</span>
                      <span>{attachment.fileType === 'pdf' ? 'PDF' : 'Resim'}</span>
                      <span>•</span>
                      <span>{new Date(attachment.uploadedAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadAttachment(attachment._id, attachment.originalName)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="İndir"
                  >
                    <FiDownload size={20} />
                  </button>

                  {canEdit && (
                    <button
                      onClick={() => handleDeleteAttachment(attachment._id, attachment.originalName)}
                      disabled={deletingAttachment === attachment._id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Sil"
                    >
                      {deletingAttachment === attachment._id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                      ) : (
                        <FiX size={20} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Red Sebebi */}
      {report.status === 'rejected' && report.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-3">Red Sebebi</h3>
          <p className="text-red-700">{report.rejectionReason}</p>
        </div>
      )}
    </div>
  );
};

export default WorkReportDetail;