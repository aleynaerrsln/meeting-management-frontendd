import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axios';

const Profile = () => {
  const { user, checkAuth } = useAuth();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [notification, setNotification] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    departments: [], // 🆕 Birimler
    lastLogin: '',
    createdAt: '',
    hasProfilePhoto: false
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axiosInstance.get('/auth/profile');
      setProfileData(response.data);
      
      if (response.data.hasProfilePhoto) {
        setProfilePhotoUrl(`${axiosInstance.defaults.baseURL}/auth/profile-photo/${response.data._id}`);
      }
    } catch (error) {
      console.error('Profil yüklenemedi:', error);
      showNotification('Profil bilgileri yüklenemedi', 'error');
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Lütfen sadece resim dosyası yükleyin', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('Fotoğraf boyutu 5MB\'dan küçük olmalıdır', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    setUploadingPhoto(true);
    try {
      await axiosInstance.post('/auth/upload-profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      showNotification('Profil fotoğrafı başarıyla yüklendi!', 'success');
      await fetchProfile();
      await checkAuth();
      window.location.reload();
    } catch (error) {
      console.error('Fotoğraf yükleme hatası:', error);
      showNotification(
        error.response?.data?.message || 'Fotoğraf yüklenemedi',
        'error'
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!confirm('Profil fotoğrafınızı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await axiosInstance.delete('/auth/profile-photo');
      showNotification('Profil fotoğrafı silindi', 'success');
      setProfilePhotoUrl(null);
      await fetchProfile();
      await checkAuth();
    } catch (error) {
      console.error('Fotoğraf silme hatası:', error);
      showNotification('Fotoğraf silinemedi', 'error');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('Yeni şifreler eşleşmiyor!', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showNotification('Yeni şifre en az 6 karakter olmalıdır', 'error');
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      showNotification('Şifre başarıyla değiştirildi!', 'success');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error);
      showNotification(
        error.response?.data?.message || 'Şifre değiştirilemedi',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleName = (role) => {
    return role === 'admin' ? 'Yönetici' : 'Kullanıcı';
  };

  const getRoleBadge = (role) => {
    return role === 'admin'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Notification Modal */}
      {notification && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div
            className={`bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all ${
              notification.type === 'success'
                ? 'border-l-4 border-green-500'
                : 'border-l-4 border-red-500'
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{notification.message}</p>
              </div>
              <button onClick={() => setNotification(null)} className="ml-4 text-gray-400 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profil Ayarları</h1>
        <p className="text-gray-600 mt-2">
          Hesap bilgilerinizi görüntüleyin ve şifrenizi değiştirin
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-8 border-b border-gray-200">
          <div className="flex items-center space-x-6">
            {/* Avatar with Upload */}
            <div className="flex-shrink-0 relative group">
              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt="Profil Fotoğrafı"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  {profileData.firstName?.charAt(0)}{profileData.lastName?.charAt(0)}
                </div>
              )}
              
              <div className="absolute bottom-0 right-0 flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition shadow-lg disabled:opacity-50"
                  title="Fotoğraf yükle"
                >
                  {uploadingPhoto ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
                
                {profilePhotoUrl && (
                  <button
                    onClick={handlePhotoDelete}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg"
                    title="Fotoğrafı sil"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {profileData.firstName} {profileData.lastName}
              </h2>
              <p className="text-gray-600 mt-1">{profileData.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadge(profileData.role)}`}>
                  {getRoleName(profileData.role)}
                </span>
                
                {/* 🆕 Birimler gösterimi */}
                {profileData.departments && profileData.departments.length > 0 && (
                  profileData.departments.map((dept, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                    >
                      {dept}
                    </span>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Fotoğrafınızın üzerine gelerek değiştirebilir veya silebilirsiniz
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 Genel Bilgiler
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'password'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔐 Şifre Değiştir
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ad</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900">{profileData.firstName}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Soyad</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900">{profileData.lastName}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900">{profileData.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900">{getRoleName(profileData.role)}</p>
                  </div>
                </div>

                {/* 🆕 Birimler listesi */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Birimler</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    {profileData.departments && profileData.departments.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profileData.departments.map((dept, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                          >
                            {dept}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Hiçbir birime atanmamış</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Son Giriş</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900">{formatDate(profileData.lastLogin)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hesap Oluşturma</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900">{formatDate(profileData.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      Profil bilgilerinizi değiştirmek için lütfen yöneticinizle iletişime geçin.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div>
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mevcut Şifre</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mevcut şifrenizi girin"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Yeni şifrenizi girin (en az 6 karakter)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre (Tekrar)</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Yeni şifrenizi tekrar girin"
                    required
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800 font-medium">Güvenlik İpuçları:</p>
                      <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                        <li>Şifreniz en az 6 karakter olmalıdır</li>
                        <li>Büyük harf, küçük harf ve rakam kullanın</li>
                        <li>Kolay tahmin edilebilecek şifreler kullanmayın</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;