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
  const [expandedReports, setExpandedReports] = useState({});
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
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchReports();
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

      alert('Çalışma raporları Excel olarak indirildi!');
    } catch (error) {
      console.error('Excel export hatası:', error);
      alert('Excel dosyası indirilemedi');
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
            {exporting ? 'İndiriliyor...' : '📥 Excel İndir'}
          </button>
          {!isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              + Yeni Rapor
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Tüm Kullanıcılar</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Hafta"
              value={filters.week}
              onChange={(e) => setFilters({ ...filters, week: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
              min="1"
              max="53"
            />

            <input
              type="number"
              placeholder="Yıl"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            />

            <input
              type="number"
              placeholder="Ay"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
              min="1"
              max="12"
            />

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Tüm Durumlar</option>
              <option value="draft">Taslak</option>
              <option value="submitted">Gönderildi</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
            </select>
          </div>
        </div>
      )}

      {/* Stats - MODERN KARTLAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 mb-1 font-medium">Toplam Rapor</p>
              <p className="text-3xl font-bold text-blue-900">{reports.length}</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-700 mb-1 font-medium">Toplam Saat</p>
              <p className="text-3xl font-bold text-indigo-900">{totalHours}h</p>
            </div>
            <div className="text-4xl">⏰</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 mb-1 font-medium">Ortalama Saat</p>
              <p className="text-3xl font-bold text-green-900">
                {reports.length > 0 ? (totalHours / reports.length).toFixed(1) : 0}h
              </p>
            </div>
            <div className="text-4xl">📈</div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report._id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden"
          >
            {/* Rapor Başlığı */}
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {getStatusBadge(report.status)}
                    <span className="text-sm text-gray-500">
                      {new Date(report.date).toLocaleDateString('tr-TR')}
                    </span>
                    {report.project && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                        📁 {report.project}
                      </span>
                    )}
                    
                    {report.meeting && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                        📅 {report.meeting.title}
                      </span>
                    )}

                    {report.isPrivate && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium">
                        🔒 Gizli
                      </span>
                    )}

                    {report.sharedWith && report.sharedWith.length > 0 && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                        👥 {report.sharedWith.length} kişi
                      </span>
                    )}
                  </div>

                  <p className="text-gray-800 text-sm line-clamp-2 mb-3 leading-relaxed">
                    {report.workDescription}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="text-base">⏰</span>
                      <span className="font-medium">{report.hoursWorked} saat</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-base">📅</span>
                      <span>{report.week}. hafta</span>
                    </span>
                    {isAdmin && (
                      <span className="flex items-center gap-1">
                        <span className="text-base">👤</span>
                        <span>{report.user.firstName} {report.user.lastName}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Sağ Taraf Butonları */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => setExpandedReports(prev => ({
                      ...prev,
                      [report._id]: !prev[report._id]
                    }))}
                    className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1 whitespace-nowrap transition"
                  >
                    {expandedReports[report._id] ? '▲ Gizle' : '▼ Detay'}
                  </button>

                  {report.meeting && (
                    <button
                      onClick={() => window.location.href = `/meetings/${report.meeting._id}`}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded-lg whitespace-nowrap transition"
                    >
                      📅 Toplantı
                    </button>
                  )}

                  {!report.meeting && (!isAdmin || report.user._id === user.id) && (
                    <>
                      <button
                        onClick={() => handleEdit(report)}
                        className="px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        ✏️ Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(report._id)}
                        className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        🗑️ Sil
                      </button>
                    </>
                  )}

                  {isAdmin && report.status === 'submitted' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(report._id, 'approved')}
                        className="px-3 py-1.5 text-xs bg-green-600 text-white hover:bg-green-700 rounded-lg transition"
                      >
                        ✓ Onayla
                      </button>
                      <button
                        onClick={() => handleStatusChange(report._id, 'rejected')}
                        className="px-3 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700 rounded-lg transition"
                      >
                        ✗ Reddet
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Açılır Detaylar */}
            {expandedReports[report._id] && (
              <div className="px-5 pb-5 border-t border-gray-100 pt-4 bg-gray-50">
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">📝 Çalışma Detayları</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-lg border border-gray-200">
                    {report.workDescription}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Çalışma Saati</p>
                    <p className="text-sm font-semibold text-gray-900">{report.hoursWorked} saat</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Hafta</p>
                    <p className="text-sm font-semibold text-gray-900">{report.week}. hafta</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Yıl</p>
                    <p className="text-sm font-semibold text-gray-900">{report.year}</p>
                  </div>
                  {isAdmin && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Kullanıcı</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {report.user.firstName} {report.user.lastName}
                      </p>
                    </div>
                  )}
                </div>

                {report.sharedWith && report.sharedWith.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-3">
                    <p className="text-xs font-semibold text-green-900 mb-2">👥 Paylaşıldığı Kişiler</p>
                    <div className="flex flex-wrap gap-2">
                      {report.sharedWith.map(u => (
                        <span key={u._id} className="px-2 py-1 bg-white text-green-700 rounded-lg text-xs border border-green-200">
                          {u.firstName} {u.lastName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {report.notes && (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <p className="text-xs font-semibold text-amber-900 mb-1">💡 Ekstra Notlar</p>
                    <p className="text-sm text-amber-800">{report.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {reports.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-500 text-lg">Henüz rapor eklenmemiş</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
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