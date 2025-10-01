import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Hoş geldiniz, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          İşte bugünkü özet ve son durumunuz
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
              📅
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Bu hafta
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">0</h3>
          <p className="text-sm text-gray-600 mt-1">Yaklaşan Toplantı</p>
        </div>

        {!isAdmin && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                ⏱️
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                Bu hafta
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">0</h3>
            <p className="text-sm text-gray-600 mt-1">Çalışma Saati</p>
          </div>
        )}

        {isAdmin && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                  👥
                </div>
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                  Aktif
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">0</h3>
              <p className="text-sm text-gray-600 mt-1">Toplam Kullanıcı</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">
                  📊
                </div>
                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                  Bu ay
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">0</h3>
              <p className="text-sm text-gray-600 mt-1">Çalışma Raporu</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center text-2xl">
                  ✅
                </div>
                <span className="text-xs font-medium text-pink-600 bg-pink-50 px-3 py-1 rounded-full">
                  Tamamlandı
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">0</h3>
              <p className="text-sm text-gray-600 mt-1">Toplantı</p>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isAdmin ? (
            <>
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition text-left">
                <div className="text-2xl mb-2">➕</div>
                <h3 className="font-medium text-gray-900">Yeni Toplantı</h3>
                <p className="text-sm text-gray-600">Toplantı oluştur</p>
              </button>
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition text-left">
                <div className="text-2xl mb-2">👤</div>
                <h3 className="font-medium text-gray-900">Kullanıcı Ekle</h3>
                <p className="text-sm text-gray-600">Yeni kullanıcı kaydet</p>
              </button>
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition text-left">
                <div className="text-2xl mb-2">📈</div>
                <h3 className="font-medium text-gray-900">Rapor Görüntüle</h3>
                <p className="text-sm text-gray-600">Detaylı raporlar</p>
              </button>
            </>
          ) : (
            <>
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition text-left">
                <div className="text-2xl mb-2">📝</div>
                <h3 className="font-medium text-gray-900">Rapor Gir</h3>
                <p className="text-sm text-gray-600">Çalışma raporu ekle</p>
              </button>
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition text-left">
                <div className="text-2xl mb-2">📅</div>
                <h3 className="font-medium text-gray-900">Toplantılarım</h3>
                <p className="text-sm text-gray-600">Yaklaşan toplantılar</p>
              </button>
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition text-left">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-medium text-gray-900">Raporlarım</h3>
                <p className="text-sm text-gray-600">Geçmiş raporlar</p>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;