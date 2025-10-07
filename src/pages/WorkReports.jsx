import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axios';

const WorkReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState({
    reports: false,
    users: false
  });
  const [exporting, setExporting] = useState(false);
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingReport, setRejectingReport] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [filters, setFilters] = useState({
    userId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: ''
  });

  // ✅ Memoized fetch functions
  const fetchReports = useCallback(async () => {
    setLoading(prev => ({ ...prev, reports: true }));
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      if (filters.status) params.append('status', filters.status);

      const response = await axiosInstance.get(`/work-reports?${params}`);
      setReports(response.data.data || []);
    } catch (error) {
      console.error('Rapor getirme hatası:', error);
    } finally {
      setLoading(prev => ({ ...prev, reports: false }));
    }
  }, [filters.userId, filters.month, filters.year, filters.status]);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    
    setLoading(prev => ({ ...prev, users: true }));
    try {
      const response = await axiosInstance.get('/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Kullanıcı getirme hatası:', error);
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  }, [isAdmin]);

  // ✅ Paralel yükleme - mount'ta
  useEffect(() => {
    fetchReports();
    fetchUsers();
  }, [fetchReports, fetchUsers]);

  // ✅ Memoized handlers
  const handleExportExcel = useCallback(async () => {
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
      window.URL.revokeObjectURL(url);

      alert('Excel dosyası indirildi!');
    } catch (error) {
      console.error('Export hatası:', error);
      alert('Excel oluşturulamadı');
    } finally {
      setExporting(false);
    }
  }, [filters.userId, filters.month, filters.year]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Bu raporu silmek istediğinizden emin misiniz?')) return;

    try {
      await axiosInstance.delete(`/work-reports/${id}`);
      alert('Rapor silindi!');
      fetchReports();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Rapor silinemedi');
    }
  }, [fetchReports]);

  const handleStatusChange = useCallback(async (reportId, newStatus) => {
    if (newStatus === 'rejected') {
      const report = reports.find(r => r._id === reportId);
      setRejectingReport(report);
      setShowRejectModal(true);
      return;
    }

    try {
      await axiosInstance.put(`/work-reports/${reportId}`, { status: newStatus });
      alert('Rapor onaylandı!');
      fetchReports();
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      alert('Durum güncellenemedi');
    }
  }, [reports, fetchReports]);

  const handleRejectSubmit = useCallback(async () => {
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
  }, [rejectingReport, rejectionReason, fetchReports]);

  const handleNavigate = useCallback((path) => () => {
    navigate(path);
  }, [navigate]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  // ✅ Memoized status badge
  const getStatusBadge = useCallback((status) => {
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
  }, []);

  // ✅ Memoized calculations
  const totalHours = useMemo(() => {
    return reports.reduce((sum, r) => sum + r.hoursWorked, 0);
  }, [reports]);

  const avgHours = useMemo(() => {
    return reports.length > 0 ? (totalHours / reports.length).toFixed(1) : '0';
  }, [reports.length, totalHours]);

  // ✅ Skeleton loader
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
      {isAdmin && <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>}
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    </tr>
  );

  return (
    <div>
      {/* Header - ANINDA GÖRÜNÜR */}
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
              onClick={handleNavigate('/work-reports/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              + Yeni Rapor
            </button>
          )}
        </div>
      </div>

      {/* Filtreler - ANINDA GÖRÜNÜR */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı</label>
              <select
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={loading.users}
              >
                <option value="">Tüm Kullanıcılar</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>
                    {u?.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ay</label>
            <select
              value={filters.month}
              onChange={(e) => handleFilterChange('month', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tüm Aylar</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleDateString('tr-TR', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Yıl</label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
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
      {/* Özet Kartları - Skeleton veya Data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {loading.reports ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
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
                  <p className="text-3xl font-bold text-gray-900 mt-1">{avgHours}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📈</span>
                </div>
              </div>
            </div>
          </>
        )}
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
              {loading.reports ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <SkeletonRow key={i} />
                  ))}
                </>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                    <div className="text-6xl mb-4">📝</div>
                    <p>Rapor bulunamadı</p>
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
                        {report?.user?.firstName} {report?.user?.lastName}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs">
                        <div className="truncate">{report.workDescription}</div>
                        {report.project && (
                          <div className="text-xs text-gray-500 mt-1">
                            📁 Proje: {report.project}
                          </div>
                        )}
                        {report.attachmentCount > 0 && (
                          <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                            📎 {report.attachmentCount} dosya eki
                          </div>
                        )}
                        {report.rejectionReason && (
                          <div className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded border border-red-200">
                            <strong>❌ Red Sebebi:</strong> {report.rejectionReason}
                          </div>
                        )}
                      </div>
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
                        <button
                          onClick={handleNavigate(`/work-reports/${report._id}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Detayları Gör"
                        >
                          👁️
                        </button>

                        {isAdmin ? (
                          report.status === 'submitted' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(report._id, 'approved')}
                                className="text-green-600 hover:text-green-800"
                                title="Onayla"
                              >
                                ✅
                              </button>
                              <button
                                onClick={() => handleStatusChange(report._id, 'rejected')}
                                className="text-red-600 hover:text-red-800"
                                title="Reddet"
                              >
                                ❌
                              </button>
                            </>
                          )
                        ) : (
                          <>
                            {report.status !== 'approved' && report.status !== 'rejected' && (
                              <button
                                onClick={handleNavigate(`/work-reports/${report._id}/edit`)}
                                className="text-indigo-600 hover:text-indigo-800"
                                title="Düzenle"
                              >
                                ✏️
                              </button>
                            )}
                            {report.status === 'draft' && (
                              <button
                                onClick={() => handleDelete(report._id)}
                                className="text-red-600 hover:text-red-800"
                                title="Sil"
                              >
                                🗑️
                              </button>
                            )}
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

      {/* Red Modalı */}
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