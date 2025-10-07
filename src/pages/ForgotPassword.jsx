import { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../utils/axios'; // ✅ SADECE BURASI DEĞİŞTİ

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/forgot-password', { email });
      setSuccess(true);
      console.log('✅ Şifre sıfırlama bağlantısı gönderildi');
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative"
        style={{
          backgroundImage: 'url(/images/login-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Arka plan overlay - Siyah karartma */}
        <div className="absolute inset-0 bg-black/50"></div>
        
        {/* Başarı Mesajı */}
        <div className="relative z-10 max-w-md w-full mx-4">
          <div 
            className="rounded-2xl shadow-2xl p-8 border border-white/20"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">E-posta Gönderildi!</h2>
              <p className="text-gray-600 mb-6">
                Şifre sıfırlama bağlantısı <strong>{email}</strong> adresine gönderildi.
                <br />
                <span className="text-sm text-gray-500 mt-2 block">
                  Lütfen e-posta kutunuzu kontrol edin.
                </span>
              </p>
              <Link
                to="/login"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Giriş Sayfasına Dön
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative"
      style={{
        backgroundImage: 'url(/images/login-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Arka plan overlay - Siyah karartma */}
      <div className="absolute inset-0 bg-black/50"></div>
      
      {/* Şifre Sıfırlama Formu */}
      <div className="relative z-10 max-w-md w-full mx-4">
        <div 
          className="rounded-2xl shadow-2xl p-8 border border-white/20"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
          }}
        >
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <img 
                src="/images/logo.png" 
                alt="Logo" 
                className="h-20 w-auto object-contain"
              />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Şifremi Unuttum</h1>
            <p className="text-gray-600">E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-posta Adresi
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ornek@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:text-blue-800 transition"
              >
                ← Giriş Sayfasına Dön
              </Link>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;