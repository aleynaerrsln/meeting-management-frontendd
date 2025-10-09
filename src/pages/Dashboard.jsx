import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios'; // ✅ DOĞRU IMPORT

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showLogo, setShowLogo] = useState(true);
  
  // ✅ TEK BİR LOADING STATE
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    upcomingMeetings: 0,
    totalMeetings: 0,
    completedMeetings: 0,
    weeklyHours: 0,
    totalReports: 0,
    totalUsers: 0
  });

  const [upcomingMeetingsList, setUpcomingMeetingsList] = useState([]);
  const [recentReports, setRecentReports] = useState([]);

  // ✅ Bugünün tarihi - memoized
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // ✅ Haftanın kaçıncı haftası - memoized
  const currentWeek = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.floor(diff / oneWeek) + 1;
  }, []);

  // ✅ Mevcut yıl
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // ✅ Mevcut tarih bilgileri - memoized
  const currentDateInfo = useMemo(() => {
    const now = new Date();
    return {
      formatted: now.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
      })
    };
  }, []);

  // ✅ Tarih formatlama - memoized
  const formatDate = useCallback((date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  // ✅ Navigation handler - memoized
  const handleNavigate = useCallback((path) => () => {
    navigate(path);
  }, [navigate]);

  // ✅ HIZLI VERİ YÜKLEME - Sadece gerekli olanlar
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        // ✅ İlk önce toplantıları yükle (en önemli)
        const meetingsPromise = axiosInstance.get('/meetings').catch(() => ({ data: { data: [] } }));
        
        // ✅ Sonra raporları yükle
        let reportsPromise;
        if (isAdmin) {
          reportsPromise = axiosInstance.get('/work-reports').catch(() => ({ data: { data: [] } }));
        } else {
          reportsPromise = axiosInstance.get('/work-reports', {
            params: { userId: user?._id }
          }).catch(() => ({ data: { data: [] } }));
        }

        // ✅ Haftalık özet
        const weeklyPromise = axiosInstance.get('/work-reports/weekly-summary', {
          params: {
            week: currentWeek,
            year: currentYear,
            userId: isAdmin ? undefined : user?._id
          }
        }).catch(() => ({ data: { totalHours: 0 } }));

        // ✅ Admin ise kullanıcılar
        const usersPromise = isAdmin 
          ? axiosInstance.get('/users').catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } });

        // ✅ Tüm istekleri paralel çalıştır
        const [meetingsRes, reportsRes, weeklyRes, usersRes] = await Promise.all([
          meetingsPromise,
          reportsPromise,
          weeklyPromise,
          usersPromise
        ]);

        // ✅ Toplantılar
        const meetings = meetingsRes.data.data || [];
        const userMeetings = isAdmin 
          ? meetings 
          : meetings.filter(m => 
              m.participants?.some(p => 
                (typeof p === 'object' ? p._id : p) === user?._id
              )
            );

        const upcoming = userMeetings
          .filter(m => {
            const meetingDate = new Date(m.date);
            meetingDate.setHours(0, 0, 0, 0);
            return meetingDate >= today;
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 5);

        setUpcomingMeetingsList(upcoming);

        // ✅ Raporlar
        const reports = reportsRes.data.data || [];
        setRecentReports(reports.slice(0, 5));

        // ✅ Kullanıcılar (Admin)
        const users = usersRes.data.data || [];

        // ✅ Stats'ı bir kerede güncelle
        setStats({
          upcomingMeetings: upcoming.length,
          totalMeetings: userMeetings.length,
          completedMeetings: userMeetings.filter(m => m.status === 'completed').length,
          weeklyHours: weeklyRes.data.totalHours || 0,
          totalReports: reports.length,
          totalUsers: users.filter(u => u.isActive !== false).length
        });

      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user?._id, isAdmin, today, currentWeek, currentYear]);

  // ✅ Skeleton Loader Component
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
      </div>
      <div className="w-16 h-8 bg-gray-200 rounded mb-2"></div>
      <div className="w-32 h-4 bg-gray-200 rounded"></div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Logo Banner - ANINDA GÖRÜNÜR */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {showLogo && (
              <div className="relative">
                <img 
                  src="/images/logo.png" 
                  alt="Logo" 
                  className="w-16 h-16 object-contain bg-white/10 backdrop-blur-sm rounded-xl p-2 shadow-lg"
                  onError={() => setShowLogo(false)}
                  loading="eager"
                />
                <div className="absolute inset-0 bg-white/20 rounded-xl blur-xl -z-10"></div>
              </div>
            )}
            
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                Toplantı ve Çalışma Yönetim Sistemi
              </h1>
              <p className="text-blue-100 text-sm md:text-base">
                Hoş geldiniz, <span className="font-semibold">{user?.firstName} {user?.lastName}</span>! 👋
              </p>
              
              {user?.departments && user.departments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {user.departments.map((dept, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm border border-white/30"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-center md:text-right">
            <p className="text-white/90 font-semibold text-base md:text-lg">
              {currentDateInfo.formatted}
            </p>
            <p className="text-blue-100 text-sm mt-1 flex items-center justify-center md:justify-end gap-2">
              {isAdmin ? (
                <>
                  <span>👑</span>
                  <span className="font-medium">Yönetici Paneli</span>
                </>
              ) : (
                <>
                  <span>👤</span>
                  <span className="font-medium">Kullanıcı Paneli</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Yaklaşan Toplantılar */}
        {loading ? (
          <SkeletonCard />
        ) : (
          <div 
            onClick={handleNavigate('/meetings')}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                📅
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Yaklaşan
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.upcomingMeetings}</h3>
            <p className="text-sm text-gray-600 mt-1">Yaklaşan Toplantı</p>
          </div>
        )}

        {/* Haftalık Çalışma Saati */}
        {loading ? (
          <SkeletonCard />
        ) : (
          <div 
            onClick={handleNavigate('/work-reports')}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                ⏱️
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                Bu hafta
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.weeklyHours}h</h3>
            <p className="text-sm text-gray-600 mt-1">Çalışma Saati</p>
          </div>
        )}

        {/* Toplam Raporlar */}
        {loading ? (
          <SkeletonCard />
        ) : (
          <div 
            onClick={handleNavigate('/work-reports')}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                📝
              </div>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                Toplam
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalReports}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {isAdmin ? 'Çalışma Raporu' : 'Raporlarım'}
            </p>
          </div>
        )}

        {/* Admin: Kullanıcılar / Kullanıcı: Tamamlanan */}
        {loading ? (
          <SkeletonCard />
        ) : isAdmin ? (
          <div 
            onClick={handleNavigate('/users')}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">
                👥
              </div>
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                Aktif
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsers}</h3>
            <p className="text-sm text-gray-600 mt-1">Toplam Kullanıcı</p>
          </div>
        ) : (
          <div 
            onClick={handleNavigate('/meetings')}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">
                ✅
              </div>
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                Tamamlandı
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.completedMeetings}</h3>
            <p className="text-sm text-gray-600 mt-1">Tamamlanan Toplantı</p>
          </div>
        )}
      </div>

      {/* Yaklaşan Toplantılar Listesi */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">📅 Yaklaşan Toplantılar</h2>
          <button
            onClick={handleNavigate('/meetings')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Tümünü Gör →
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start p-4 bg-gray-50 rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                    <div className="w-full h-3 bg-gray-200 rounded"></div>
                    <div className="w-1/3 h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingMeetingsList.length > 0 ? (
            <div className="space-y-3">
              {upcomingMeetingsList.map((meeting) => (
                <div
                  key={meeting._id}
                  onClick={handleNavigate(`/meetings/${meeting._id}`)}
                  className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-xl">📅</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {meeting.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {meeting.description || 'Açıklama yok'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>📍 {meeting.location || 'Konum belirtilmemiş'}</span>
                      <span>🕐 {meeting.time || 'Saat belirtilmemiş'}</span>
                      <span>📅 {formatDate(meeting.date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-gray-500 mb-4">Yaklaşan toplantı bulunmuyor</p>
              {isAdmin && (
                <button
                  onClick={handleNavigate('/meetings')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  Yeni Toplantı Oluştur
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Son Çalışma Raporları - Sadece Kullanıcı için */}
      {!isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">📝 Son Çalışma Raporlarım</h2>
            <button
              onClick={handleNavigate('/work-reports')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Tümünü Gör →
            </button>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start p-4 bg-gray-50 rounded-lg animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4"></div>
                    <div className="flex-1 space-y-2">
                      <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                      <div className="w-full h-3 bg-gray-200 rounded"></div>
                      <div className="w-1/3 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentReports.length > 0 ? (
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div
                    key={report._id}
                    onClick={handleNavigate(`/work-reports/${report._id}`)}
                    className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-xl">📝</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {report.project || 'Genel Çalışma'}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {report.workDescription}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>📅 {formatDate(report.date)}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {report.hoursWorked || 0} saat
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-500 mb-4">Henüz çalışma raporu eklenmemiş</p>
                <button
                  onClick={handleNavigate('/work-reports/create')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  Yeni Rapor Ekle
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Hızlı İşlemler</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isAdmin ? (
            <>
              <button
                onClick={handleNavigate('/meetings')}
                className="flex items-center justify-center p-4 bg-white rounded-lg hover:shadow-md transition-all border border-gray-200 transform hover:scale-105"
              >
                <span className="text-2xl mr-3">📅</span>
                <span className="font-medium text-gray-900">Yeni Toplantı</span>
              </button>
              <button
                onClick={handleNavigate('/users')}
                className="flex items-center justify-center p-4 bg-white rounded-lg hover:shadow-md transition-all border border-gray-200 transform hover:scale-105"
              >
                <span className="text-2xl mr-3">👤</span>
                <span className="font-medium text-gray-900">Kullanıcı Ekle</span>
              </button>
              <button
                onClick={handleNavigate('/work-reports')}
                className="flex items-center justify-center p-4 bg-white rounded-lg hover:shadow-md transition-all border border-gray-200 transform hover:scale-105"
              >
                <span className="text-2xl mr-3">📊</span>
                <span className="font-medium text-gray-900">Raporları Görüntüle</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleNavigate('/meetings')}
                className="flex items-center justify-center p-4 bg-white rounded-lg hover:shadow-md transition-all border border-gray-200 transform hover:scale-105"
              >
                <span className="text-2xl mr-3">📅</span>
                <span className="font-medium text-gray-900">Toplantılarım</span>
              </button>
              <button
                onClick={handleNavigate('/work-reports/create')}
                className="flex items-center justify-center p-4 bg-white rounded-lg hover:shadow-md transition-all border border-gray-200 transform hover:scale-105"
              >
                <span className="text-2xl mr-3">📝</span>
                <span className="font-medium text-gray-900">Rapor Ekle</span>
              </button>
              <button
                onClick={handleNavigate('/work-reports')}
                className="flex items-center justify-center p-4 bg-white rounded-lg hover:shadow-md transition-all border border-gray-200 transform hover:scale-105"
              >
                <span className="text-2xl mr-3">📊</span>
                <span className="font-medium text-gray-900">Raporlarım</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;