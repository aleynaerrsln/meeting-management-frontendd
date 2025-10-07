import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showLogo, setShowLogo] = useState(true);
  const [loading, setLoading] = useState({
    meetings: true,
    reports: true,
    users: true
  });
  const [stats, setStats] = useState({
    upcomingMeetings: 0,
    totalMeetings: 0,
    weeklyHours: 0,
    totalUsers: 0,
    totalReports: 0,
    completedMeetings: 0
  });
  const [upcomingMeetingsList, setUpcomingMeetingsList] = useState([]);
  const [recentReports, setRecentReports] = useState([]);

  // ✅ Haftanın kaçıncı haftası - memoized
  const getWeekNumber = useCallback((date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }, []);

  // ✅ Tarih formatlama - memoized
  const formatDate = useCallback((date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  // ✅ Bugünün tarihi - memoized
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // ✅ Mevcut tarih bilgileri - memoized
  const currentDateInfo = useMemo(() => {
    return {
      formatted: new Date().toLocaleDateString('tr-TR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }),
      year: new Date().getFullYear(),
      week: getWeekNumber(new Date())
    };
  }, [getWeekNumber]);

  // 🚀 PARALEL YÜKLEME - Toplantılar
  const fetchMeetings = useCallback(async () => {
    try {
      const meetingsRes = await axiosInstance.get('/meetings');
      const meetings = meetingsRes.data.data || [];

      const upcoming = meetings.filter(m => {
        const meetingDate = new Date(m.date);
        meetingDate.setHours(0, 0, 0, 0);
        return meetingDate >= today && m.status === 'planned';
      });

      const completed = meetings.filter(m => m.status === 'completed');

      setUpcomingMeetingsList(upcoming.slice(0, 5));
      
      setStats(prev => ({
        ...prev,
        upcomingMeetings: upcoming.length,
        totalMeetings: meetings.length,
        completedMeetings: completed.length
      }));
    } catch (error) {
      console.error('Toplantılar yüklenemedi:', error);
    } finally {
      setLoading(prev => ({ ...prev, meetings: false }));
    }
  }, [today]);

  // 🚀 PARALEL YÜKLEME - Raporlar (Kullanıcı)
  const fetchUserReports = useCallback(async () => {
    if (isAdmin) {
      setLoading(prev => ({ ...prev, reports: false }));
      return;
    }

    try {
      const [weeklySummaryRes, reportsRes] = await Promise.all([
        axiosInstance.get('/work-reports/summary/weekly', {
          params: { week: currentDateInfo.week, year: currentDateInfo.year }
        }).catch(() => ({ data: { totalHours: 0 } })),
        axiosInstance.get('/work-reports')
      ]);

      const myReports = reportsRes.data.data || [];
      setRecentReports(myReports.slice(0, 5));

      setStats(prev => ({
        ...prev,
        weeklyHours: weeklySummaryRes.data.totalHours || 0,
        totalReports: myReports.length
      }));
    } catch (error) {
      console.error('Raporlar yüklenemedi:', error);
    } finally {
      setLoading(prev => ({ ...prev, reports: false }));
    }
  }, [isAdmin, currentDateInfo.week, currentDateInfo.year]);

  // 🚀 PARALEL YÜKLEME - Admin Verileri
  const fetchAdminData = useCallback(async () => {
    if (!isAdmin) {
      setLoading(prev => ({ ...prev, users: false, reports: false }));
      return;
    }

    try {
      const [usersRes, reportsRes] = await Promise.all([
        axiosInstance.get('/users'),
        axiosInstance.get('/work-reports')
      ]);

      const users = usersRes.data.data || [];
      const reports = reportsRes.data.data || [];

      setStats(prev => ({
        ...prev,
        totalUsers: users.filter(u => u.isActive).length,
        totalReports: reports.length,
        weeklyHours: reportsRes.data.totalHours || 0
      }));
    } catch (error) {
      console.error('Admin verileri yüklenemedi:', error);
    } finally {
      setLoading(prev => ({ ...prev, users: false, reports: false }));
    }
  }, [isAdmin]);

  // ✅ PARALEL YÜKLEME - Tüm veriler aynı anda yüklenecek
  useEffect(() => {
    fetchMeetings();
    fetchUserReports();
    fetchAdminData();
  }, [fetchMeetings, fetchUserReports, fetchAdminData]);

  // ✅ Navigation handler - memoized
  const handleNavigate = useCallback((path) => () => {
    navigate(path);
  }, [navigate]);

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
    <div>
      {/* Logo Banner - ANINDA GÖRÜNÜR */}
      <div className="mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {showLogo && (
              <div className="relative">
                <img 
                  src="/images/logo.png" 
                  alt="Logo" 
                  className="w-16 h-16 object-contain bg-white/10 backdrop-blur-sm rounded-xl p-2 shadow-lg"
                  onError={() => setShowLogo(false)}
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
              {user?.role === 'admin' ? (
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

      {/* Stats Grid - ANINDA GÖRÜNÜR (Skeleton veya Data) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Yaklaşan Toplantılar */}
        {loading.meetings ? (
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

        {/* Haftalık Çalışma Saati (Kullanıcı) */}
        {!isAdmin && (
          loading.reports ? (
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
              <h3 className="text-2xl font-bold text-gray-900">{stats.weeklyHours}</h3>
              <p className="text-sm text-gray-600 mt-1">Çalışma Saati</p>
            </div>
          )
        )}

        {/* Toplam Raporlar */}
        {loading.reports ? (
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

        {/* Admin: Toplam Kullanıcılar / Kullanıcı: Tamamlanan Toplantılar */}
        {isAdmin ? (
          loading.users ? (
            <SkeletonCard />
          ) : (
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
          )
        ) : (
          loading.meetings ? (
            <SkeletonCard />
          ) : (
            <div 
              onClick={handleNavigate('/meetings')}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-2xl">
                  ✅
                </div>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  Tamamlandı
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.completedMeetings}</h3>
              <p className="text-sm text-gray-600 mt-1">Tamamlanan Toplantı</p>
            </div>
          )
        )}
      </div>
      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yaklaşan Toplantılar Listesi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Yaklaşan Toplantılar</h2>
            <button
              onClick={handleNavigate('/meetings')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition"
            >
              Tümünü Gör →
            </button>
          </div>
          <div className="p-6">
            {loading.meetings ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start p-4 bg-gray-50 rounded-lg animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4"></div>
                    <div className="flex-1 space-y-2">
                      <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                      <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
                      <div className="w-1/3 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingMeetingsList.length > 0 ? (
              <div className="space-y-4">
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
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {meeting.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {formatDate(meeting.date)} • {meeting.time}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        📍 {meeting.location}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {meeting.participants?.length || 0} kişi
                      </span>
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
                    onClick={handleNavigate('/meetings/create')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    Yeni Toplantı Oluştur
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Son Çalışma Raporları (Kullanıcı için) */}
        {!isAdmin && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Son Çalışma Raporlarım</h2>
              <button
                onClick={handleNavigate('/work-reports')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition"
              >
                Tümünü Gör →
              </button>
            </div>
            <div className="p-6">
              {loading.reports ? (
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
                <div className="space-y-4">
                  {recentReports.map((report) => (
                    <div
                      key={report._id}
                      className="flex items-start p-4 bg-gray-50 rounded-lg"
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
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(report.date)}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {report.hoursWorked} saat
                        </span>
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

        {/* Admin için Genel Özet */}
        {isAdmin && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Sistem Özeti</h2>
            </div>
            <div className="p-6">
              {loading.reports || loading.users ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg mr-3"></div>
                        <div className="space-y-2">
                          <div className="w-24 h-4 bg-gray-200 rounded"></div>
                          <div className="w-20 h-3 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                      <div className="w-12 h-8 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        📊
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Toplam Toplantı</p>
                        <p className="text-xs text-gray-600">Tüm zamanlar</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-blue-600">{stats.totalMeetings}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        ✅
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Tamamlanan</p>
                        <p className="text-xs text-gray-600">Başarıyla tamamlandı</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-green-600">{stats.completedMeetings}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        📝
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Toplam Rapor</p>
                        <p className="text-xs text-gray-600">Çalışma raporları</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-purple-600">{stats.totalReports}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                        👥
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Aktif Kullanıcı</p>
                        <p className="text-xs text-gray-600">Sistemde kayıtlı</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-orange-600">{stats.totalUsers}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Hızlı İşlemler</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isAdmin ? (
            <>
              <button
                onClick={handleNavigate('/meetings/create')}
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