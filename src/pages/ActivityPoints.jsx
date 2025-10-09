import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard, getUserHistory } from '../api/activityPointApi';
import { FiTrendingUp, FiAward, FiUsers, FiClock } from 'react-icons/fi';
import AddPointModal from '../components/AddPointModal';
import HistoryModal from '../components/HistoryModal';

export default function ActivityPoints() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [historyData, setHistoryData] = useState(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await getLeaderboard();
      setLeaderboard(data.data);
    } catch (error) {
      console.error('Liderlik tablosu hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async (userId) => {
    try {
      const data = await getUserHistory(userId);
      setHistoryData(data);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Geçmiş yükleme hatası:', error);
    }
  };

  const getRankBadge = (index) => {
    const badges = {
      0: { color: 'bg-yellow-500', icon: '🥇' },
      1: { color: 'bg-gray-400', icon: '🥈' },
      2: { color: 'bg-amber-600', icon: '🥉' }
    };
    return badges[index] || { color: 'bg-blue-500', icon: '🏆' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FiTrendingUp className="text-blue-600" />
              Çalışma İstatistikleri
            </h1>
            <p className="text-gray-600 mt-2">
              Ekip üyelerinin performans puanları ve sıralaması
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FiAward />
              Puan Ekle
            </button>
          )}
        </div>
      </div>

      {/* Stats Card */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white max-w-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Toplam Katılımcı</p>
              <p className="text-4xl font-bold mt-2">{leaderboard.length}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-4">
              <FiUsers className="text-3xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sıra
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Birim
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Toplam Puan
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktivite Sayısı
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((item, index) => {
                const badge = getRankBadge(index);
                return (
                  <tr
                    key={item._id}
                    className={`hover:bg-gray-50 transition-colors ${
                      index < 3 ? 'bg-yellow-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-full ${badge.color} text-white flex items-center justify-center font-bold text-sm`}>
                          {index + 1}
                        </span>
                        {index < 3 && <span className="text-2xl">{badge.icon}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.hasProfilePhoto ? (
                          <img
                            src={`http://localhost:5000/api/auth/profile-photo/${item._id}`}
                            alt={`${item.firstName} ${item.lastName}`}
                            className="h-10 w-10 rounded-full object-cover mr-3"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3"
                          style={{ display: item.hasProfilePhoto ? 'none' : 'flex' }}
                        >
                          <span className="text-blue-600 font-semibold">
                            {item.firstName?.[0]}{item.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.firstName} {item.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{item.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {item.departments?.map((dept, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                          >
                            {dept}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-2xl font-bold text-blue-600">
                        +{item.totalPoints}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                        {item.activityCount} aktivite
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleViewHistory(item._id)}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 mx-auto"
                        >
                          <FiClock />
                          Geçmiş
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddPointModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchLeaderboard();
            setShowAddModal(false);
          }}
        />
      )}

      {showHistoryModal && historyData && (
        <HistoryModal
          data={historyData}
          onClose={() => {
            setShowHistoryModal(false);
            setHistoryData(null);
          }}
          onSuccess={fetchLeaderboard}
        />
      )}
    </div>
  );
}