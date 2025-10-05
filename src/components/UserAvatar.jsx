import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';

const UserAvatar = ({ user, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // 🆕 Debug log
  useEffect(() => {
    console.log('UserAvatar - User data:', {
      user,
      hasProfilePhoto: user?.hasProfilePhoto,
      profilePhoto: user?.profilePhoto,
      userId: user?._id || user?.id
    });
  }, [user]);

  // Boyut ayarları
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
    '3xl': 'w-24 h-24 text-3xl'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  // Profil fotoğrafı URL'i
  const userId = user?._id || user?.id;
  const hasPhoto = user?.hasProfilePhoto || (user?.profilePhoto && user?.profilePhoto.data !== undefined);
  const photoUrl = hasPhoto && userId
    ? `${axiosInstance.defaults.baseURL}/auth/profile-photo/${userId}`
    : null;

  // 🆕 Debug log
  console.log('UserAvatar - Photo URL:', photoUrl, 'Has Photo:', hasPhoto);

  // İsim baş harfleri
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  // Fotoğraf varsa ve yükleme hatası yoksa göster
  if (photoUrl && !imageError) {
    return (
      <div className={`relative ${sizeClass} ${className}`}>
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className={`absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full animate-pulse`} />
        )}
        
        {/* Gerçek fotoğraf */}
        <img
          src={photoUrl}
          alt={`${user?.firstName || ''} ${user?.lastName || ''}`}
          className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-md transition-opacity ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Fotoğraf yoksa veya yüklenemedi ise baş harfleri göster
  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md ${className}`}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;