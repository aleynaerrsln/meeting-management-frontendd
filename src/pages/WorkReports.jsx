import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axios';

const WorkReports = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  
  // 🆕 Red modal state'leri
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingReport, setRejectingReport] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    workDescription: '',
    startTime: '',
    endTime: '',
    project: '',
    notes: ''
  });

  const [filters, setFilters] = useState({
    userId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: ''
  });

  useEffect(() => {
    fetchReports();
    if (isAdmin) {
      fetchUsers();
    }
  }, [filters]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      if (filters.status) params.append('status', filters.status);

      const response = await axiosInstance.get(`/work-reports?${params}`);
      setReports(response.data.data);
    } catch (error) {
      console.error('Rapor getirme hatası:', error);
      alert('Raporlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Kullanıcı getirme hatası:', error);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);

      const response = await axiosInstance.get(`/export/work-reports?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `calisma_raporlari_${filters.year}_${filters.month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      alert('Excel dosyası indirildi!');
    } catch (error) {
      console.error('Export hatası:', error);
      alert('Excel oluşturulamadı');
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
      
      handleCloseModal();
      fetchReports();
    } catch (error) {
      console.error('Form gönderme hatası:', error);
      alert(error.response?.data?.message || 'İşlem başarısız');
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setFormData({
      date: report.date.split('T')[0],
      workDescription: report.workDescription,
      startTime: report.startTime,
      endTime: report.endTime,
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

  // 🆕 Güncellenmiş durum değiştirme fonksiyonu
  const handleStatusChange = async (reportId, newStatus) => {
    if (newStatus === 'rejected') {
      // Red için modal aç
      const report = reports.find(r => r._id === reportId);
      setRejectingReport(report);
      setShowRejectModal(true);
      return;
    }

    // Onay direkt çalışsın
    try {
      await axiosInstance.put(`/work-reports/${reportId}`, { status: newStatus });
      alert('Rapor onaylandı!');
      fetchReports();
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      alert('Durum güncellenemedi');
    }
  };

  // 🆕 Red modalı submit fonksiyonu
  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      alert('Lütfen red sebebini yazın');
      return;
    }

    try {
      await axiosInstance.put(`/work-reports/${rejectingReport._id}`, { 
        status: 'rejected',
        rejectionReason: rejectionReason
      });
      alert('Rapor reddedildi ve kullanıcıya bildirim gönderildi!');
      setShowRejectModal(false);
      setRejectingReport(null);
      setRejectionReason('');
      fetchReports();
    } catch (error) {
      console.error('Red işlemi hatası:', error);
      alert('Rapor reddedilemedi');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      workDescription: '',
      startTime: '',
      endTime: '',
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
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
          {texts[status]}
        </span>
        {status === 'rejected' && (
          <span className="text-red-500 text-lg" title="Bu rapor reddedildi">
            ⚠️
          </span>
        )}
      </div>
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
            {exporting ? '📥 İndiriliyor...' : '📊 Excel İndir'}
          </button>
          
          {!isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              + Yeni Rapor
            </button>
          )}
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı</label>
              <select
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tüm Kullanıcılar</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ay</label>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleString('tr-TR', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Yıl</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tüm Durumlar</option>
              <option value="draft">Taslak</option>
              <option value="submitted">Gönderildi</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Rapor</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{reports.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Saat</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalHours.toFixed(1)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⏰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ortalama Saat</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {reports.length > 0 ? (totalHours / reports.length).toFixed(1) : '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Raporlar Tablosu */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Açıklama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saatler
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Süre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                    Rapor bulunamadı
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(report.date).toLocaleDateString('tr-TR')}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.user.firstName} {report.user.lastName}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">{report.workDescription}</div>
                      {report.project && (
                        <div className="text-xs text-gray-500 mt-1">
                          Proje: {report.project}
                        </div>
                      )}
                      {/* 🆕 Red sebebi gösterimi */}
                      {report.rejectionReason && (
                        <div className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded border border-red-200">
                          <strong>❌ Red Sebebi:</strong> {report.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.startTime} - {report.endTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {report.hoursWorked} saat
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {isAdmin ? (
                          <>
                            {report.status !== 'approved' && (
                              <button
                                onClick={() => handleStatusChange(report._id, 'approved')}
                                className="text-green-600 hover:text-green-800 font-medium text-lg"
                                title="Onayla"
                              >
                                ✓
                              </button>
                            )}
                            {report.status !== 'rejected' && (
                              <button
                                onClick={() => handleStatusChange(report._id, 'rejected')}
                                className="text-red-600 hover:text-red-800 font-medium text-lg"
                                title="Reddet"
                              >
                                ✗
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(report._id)}
                              className="text-red-600 hover:text-red-800"
                              title="Sil"
                            >
                              🗑️
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(report)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Düzenle"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(report._id)}
                              className="text-red-600 hover:text-red-800"
                              title="Sil"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rapor Oluşturma/Düzenleme Modalı */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingReport ? 'Raporu Düzenle' : 'Yeni Rapor Oluştur'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarih
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Çalışma Açıklaması
                </label>
                <textarea
                  value={formData.workDescription}
                  onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Ne üzerinde çalıştınız?"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlangıç Saati
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bitiş Saati
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proje (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Proje adı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notlar (Opsiyonel)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Ek notlar..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingReport ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🆕 Red Sebebi Modalı */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
              <h3 className="text-lg font-semibold text-red-900 flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                Raporu Reddet
              </h3>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                <strong>{rejectingReport?.user?.firstName} {rejectingReport?.user?.lastName}</strong> kullanıcısının raporunu reddediyorsunuz. Lütfen red sebebini açıklayın:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows="4"
                placeholder="Örn: Eksik bilgi, hatalı saat girişi, yetersiz açıklama..."
                autoFocus
              />

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectingReport(null);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  İptal
                </button>
                <button
                  onClick={handleRejectSubmit}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Reddet ve Bildir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkReports;