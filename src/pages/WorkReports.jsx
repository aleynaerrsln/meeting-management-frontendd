import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';

const WorkReports = () => {
  const { user, isAdmin } = useAuth();
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    userId: '',
    week: '',
    year: new Date().getFullYear(),
    month: '',
    status: ''
  });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    workDescription: '',
    hoursWorked: '',
    project: '',
    notes: ''
  });

  useEffect(() => {
    fetchReports();
    if (isAdmin) {
      fetchUsers();
    }
  }, [filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.userId) params.userId = filters.userId;
      if (filters.week) params.week = filters.week;
      if (filters.year) params.year = filters.year;
      if (filters.month) params.month = filters.month;
      if (filters.status) params.status = filters.status;

      const response = await axiosInstance.get('/work-reports', { params });
      setReports(response.data.data || []);
    } catch (error) {
      console.error('Raporlar yüklenemedi:', error);
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
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.week) params.append('week', filters.week);
      if (filters.year) params.append('year', filters.year);
      if (filters.month) params.append('month', filters.month);
      if (filters.status) params.append('status', filters.status);

      const response = await axiosInstance.get(`/export/work-reports?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `calisma-raporlari-${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert('✅ Çalışma raporları Excel olarak indirildi!');
    } catch (error) {
      console.error('Excel export hatası:', error);
      alert('❌ Excel dosyası indirilemedi');
    } finally {
      setExporting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReport) {
        await axiosInstance.put(`/work-reports/${editingReport._id}`, formData);
        alert('Rapor güncellendi!');
      } else {
        await axiosInstance.post('/work-reports', formData);
        alert('Rapor oluşturuldu!');
      }
      setShowModal(false);
      fetchReports();
      resetForm();
    } catch (error) {
      console.error('Hata:', error);
      alert(error.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setFormData({
      date: report.date.split('T')[0],
      workDescription: report.workDescription,
      hoursWorked: report.hoursWorked,
      project: report.project || '',
      notes: report.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu raporu silmek istediğinizden emin misiniz?')) return;
    try {
      await axiosInstance.delete(`/work-reports/${id}`);
      alert('Rapor silindi!');
      fetchReports();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Rapor silinemedi');
    }
  };

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await axiosInstance.put(`/work-reports/${reportId}`, { status: newStatus });
      alert('Durum güncellendi!');
      fetchReports();
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      alert('Durum güncellenemedi');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      workDescription: '',
      hoursWorked: '',
      project: '',
      notes: ''
    });
    setEditingReport(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    const texts = {
      draft: 'Taslak',
      submitted: 'Gönderildi',
      approved: 'Onaylandı',
      rejected: 'Reddedildi'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {texts[status]}
      </span>
    );
  };

  const totalHours = reports.reduce((sum, r) => sum + r.hoursWorked, 0);

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
          <h1 className="text-3xl font-bold text-gray-900">Çalışma Raporları</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Tüm çalışma raporlarını yönetin' : 'Çalışma raporlarınızı görüntüleyin'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            disabled={exporting || reports.length === 0}
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
                <span>📥</span>
                <span>Excel İndir</span>
              </>
            )}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            + Yeni Rapor
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {isAdmin && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Kullanıcı</label>
              <select
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tüm Kullanıcılar</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Hafta</label>
            <input
              type="number"
              placeholder="Hafta No"
              value={filters.week}
              onChange={(e) => setFilters({ ...filters, week: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              min="1"
              max="53"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Yıl</label>
            <input
              type="number"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Ay</label>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tüm Aylar</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}. Ay</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Durum</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tümü</option>
              <option value="draft">Taslak</option>
              <option value="submitted">Gönderildi</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Toplam Rapor</p>
          <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Toplam Saat</p>
          <p className="text-2xl font-bold text-indigo-600">{totalHours}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Ortalama Saat</p>
          <p className="text-2xl font-bold text-green-600">
            {reports.length > 0 ? (totalHours / reports.length).toFixed(1) : 0}
          </p>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report._id}
            className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition ${
              report.meeting ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {report.meeting && (
                    <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                      📅 Toplantı Raporu
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {report.project || 'Genel Çalışma'}
                  </h3>
                  {getStatusBadge(report.status)}
                  {report.isPrivate && (
                    <span className="px-2 py-1 bg-gray-600 text-white rounded text-xs">
                      🔒 Gizli
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-4">{report.workDescription}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tarih</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(report.date).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Saat</p>
                    <p className="text-sm font-medium text-gray-900">{report.hoursWorked} saat</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Hafta</p>
                    <p className="text-sm font-medium text-gray-900">{report.week}. hafta</p>
                  </div>
                  {isAdmin && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Kullanıcı</p>
                      <p className="text-sm font-medium text-gray-900">
                        {report.user.firstName} {report.user.lastName}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* YENİ: Toplantı Bilgisi */}
                {report.meeting && (
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg border border-blue-200">
                    <p className="text-xs font-medium text-blue-900 mb-1">📅 Toplantı:</p>
                    <p className="text-sm text-blue-800 font-medium">{report.meeting.title}</p>
                  </div>
                )}

                {/* YENİ: Paylaşım Bilgisi */}
                {report.sharedWith && report.sharedWith.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs font-medium text-green-900 mb-1">👥 Paylaşıldı:</p>
                    <p className="text-sm text-green-800">
                      {report.sharedWith.map(u => `${u.firstName} ${u.lastName}`).join(', ')}
                    </p>
                  </div>
                )}

                {report.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-1">Notlar:</p>
                    <p className="text-sm text-gray-600">{report.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2 ml-4">
                {/* Toplantı raporları düzenlenemez/silinemez */}
                {!report.meeting && (!isAdmin || report.user._id === user.id) && (
                  <>
                    <button
                      onClick={() => handleEdit(report)}
                      className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(report._id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      Sil
                    </button>
                  </>
                )}
                
                {/* Toplantı raporuysa toplantıya git */}
                {report.meeting && (
                  <button
                    onClick={() => window.location.href = `/meetings/${report.meeting._id}`}
                    className="px-3 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded"
                  >
                    📅 Toplantıya Git
                  </button>
                )}

                {isAdmin && report.status === 'submitted' && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleStatusChange(report._id, 'approved')}
                      className="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 rounded"
                    >
                      ✓ Onayla
                    </button>
                    <button
                      onClick={() => handleStatusChange(report._id, 'rejected')}
                      className="px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 rounded"
                    >
                      ✗ Reddet
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {reports.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">Henüz rapor eklenmemiş</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingReport ? 'Raporu Düzenle' : 'Yeni Rapor Oluştur'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tarih
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proje (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={formData.project}
                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Proje adı"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Çalışma Açıklaması
                  </label>
                  <textarea
                    value={formData.workDescription}
                    onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Bugün yaptığınız çalışmaları detaylı açıklayın..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Çalışma Saati
                  </label>
                  <input
                    type="number"
                    value={formData.hoursWorked}
                    onChange={(e) => setFormData({ ...formData, hoursWorked: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Saat"
                    min="0"
                    max="24"
                    step="0.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notlar (Opsiyonel)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ekstra notlar..."
                  />
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
                  {editingReport ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkReports;