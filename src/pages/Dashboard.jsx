import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Toplantıları çek
      const meetingsRes = await axiosInstance.get('/meetings');
      const meetings = meetingsRes.data.data || [];

      // Bugünün tarihini al
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Yaklaşan toplantılar (bugünden sonraki)
      const upcoming = meetings.filter(m => {
        const meetingDate = new Date(m.date);
        meetingDate.setHours(0, 0, 0, 0);
        return meetingDate >= today && m.status === 'planned';
      });

      // Tamamlanan toplantılar
      const completed = meetings.filter(m => m.status === 'completed');

      setUpcomingMeetingsList(upcoming.slice(0, 5)); // İlk 5 tanesini göster

      // Admin için ek veriler
      if (isAdmin) {
        // Kullanıcıları çek
        const usersRes = await axiosInstance.get('/users');
        const users = usersRes.data.data || [];

        // Tüm çalışma raporlarını çek
        const reportsRes = await axiosInstance.get('/work-reports');
        const reports = reportsRes.data.data || [];

        setStats({
          upcomingMeetings: upcoming.length,
          totalMeetings: meetings.length,
          totalUsers: users.filter(u => u.isActive).length,
          totalReports: reports.length,
          completedMeetings: completed.length,
          weeklyHours: reportsRes.data.totalHours || 0
        });
      } else {
        // Kullanıcı için bu haftaki çalışma saatlerini çek
        const currentYear = new Date().getFullYear();
        const currentWeek = getWeekNumber(new Date());

        try {
          const weeklySummaryRes = await axiosInstance.get('/work-reports/summary/weekly', {
            params: { week: currentWeek, year: currentYear }
          });
          
          const reportsRes = await axiosInstance.get('/work-reports');
          const myReports = reportsRes.data.data || [];

          setRecentReports(myReports.slice(0, 5));

          setStats({
            upcomingMeetings: upcoming.length,
            totalMeetings: meetings.length,
            weeklyHours: weeklySummaryRes.data.totalHours || 0,
            totalReports: myReports.length,
            completedMeetings: completed.length
          });
        } catch (error) {
          console.error('Haftalık özet çekilemedi:', error);
          setStats({
            upcomingMeetings: upcoming.length,
            totalMeetings: meetings.length,
            weeklyHours: 0,
            totalReports: 0,
            completedMeetings: completed.length
          });
        }
      }
    } catch (error) {
      console.error('Dashboard verileri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Haftanın kaçıncı haftası olduğunu hesapla
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Hoş geldiniz, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          İşte bugünkü özet ve son durumunuz
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Yaklaşan Toplantılar */}
        <div 
          onClick={() => navigate('/meetings')}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer"
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

        {/* Kullanıcı için Haftalık Çalışma Saati */}
        {!isAdmin && (
          <div 
            onClick={() => navigate('/work-reports')}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer"
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
        )}

        {/* Toplam Raporlar */}
        <div 
          onClick={() => navigate(isAdmin ? '/work-reports' : '/work-reports')}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer"
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

        {/* Admin için Toplam Kullanıcılar */}
        {isAdmin && (
          <div 
            onClick={() => navigate('/users')}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer"
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
        )}

        {/* Tamamlanan Toplantılar */}
        {!isAdmin && (
          <div 
            onClick={() => navigate('/meetings')}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer"
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
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yaklaşan Toplantılar Listesi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Yaklaşan Toplantılar</h2>
            <button
              onClick={() => navigate('/meetings')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Tümünü Gör →
            </button>
          </div>
          <div className="p-6">
            {upcomingMeetingsList.length > 0 ? (
              <div className="space-y-4">
                {upcomingMeetingsList.map((meeting) => (
                  <div
                    key={meeting._id}
                    onClick={() => navigate(`/meetings/${meeting._id}`)}
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
                    onClick={() => navigate('/meetings/create')}
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
                onClick={() => navigate('/work-reports')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Tümünü Gör →
              </button>
            </div>
            <div className="p-6">
              {recentReports.length > 0 ? (
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
                    onClick={() => navigate('/work-reports/create')}
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
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isAdmin ? (
            <>
              <button
                onClick={() => navigate('/meetings/create')}
                className="flex items-center justify-center p-4 bg-white rounded-lg hover:shadow-md transition border border-gray-200"
              >
                <span className="text-2xl mr-3">📅</span>
                <span className="font-medium text-gray-900">Yeni Toplantı</span>
              </button>
              <button
                onClick={() => navigate('/users')}
                className="flex items-center justify-center p-4 bg-white rounded-lg hover:shadow-md transition border border-gray-200"
              >
                <span className="text-2xl mr-3">👤</span>
                <span className="font-medium text-gray-900">Kullanıcı Ekle</span>
              </button>
              <button
                onClick={() => navigate('/work-reports')}
                className="flex items-center justify-center p-4 bg-white rounded-lg hover:shadow-md transition border border-gray-200"
              >
                <span className="text-2xl mr-3">📊</span>
                <span className="font-medium text-gray-900">Raporları Görüntüle</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/meetings')}
                className="flex items-center justify-center p-4 bg-white rounded-lg hover:shadow-md transition border border-gray-200"
              >
                <span className="text-2xl mr-3">📅</span>
                <span className="font-medium text-gray-900">Toplantılarım</span>
              </button>
              <button
                onClick={() => navigate('/work-reports/create')}
                className="flex items-center justify-center p-4 bg-white rounded-lg hover:shadow-md transition border border-gray-200"
              >
                <span className="text-2xl mr-3">📝</span>
                <span className="font-medium text-gray-900">Rapor Ekle</span>
              </button>
              <button
                onClick={() => navigate('/work-reports')}
                className="flex items-center justify-center p-4 bg-white rounded-lg hover:shadow-md transition border border-gray-200"
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