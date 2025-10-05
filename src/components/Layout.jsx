import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import FloatingChatButton from './FloatingChatButton';
import UserAvatar from './UserAvatar'; // 🆕 AVATAR COMPONENT

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // 🆕 Messages sayfasında padding olmasın
  const isMessagesPage = location.pathname === '/messages';

  const adminMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Kullanıcılar', path: '/users', icon: '👥' },
    { name: 'Toplantılar', path: '/meetings', icon: '📅' },
    { name: 'Çalışma Raporları', path: '/work-reports', icon: '📝' },
    { name: 'Sponsorluklar', path: '/sponsorships', icon: '🤝' },
    { name: 'Mesajlar', path: '/messages', icon: '💬' },
  ];

  const userMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Toplantılarım', path: '/meetings', icon: '📅' },
    { name: 'Çalışma Raporlarım', path: '/work-reports', icon: '📝' },
    { name: 'Sponsorluklar', path: '/sponsorships', icon: '🤝' },
    { name: 'Mesajlar', path: '/messages', icon: '💬' },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shadow-sm`}
      >
        {/* Logo */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-blue-600">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              {/* 🆕 Logo */}
              <img 
                src="/logo.png
                " 
                alt="Logo" 
                className="w-10 h-10 object-contain rounded-lg bg-white p-1"
                onError={(e) => {
                  e.target.style.display = 'none'; // Logo yoksa gizle
                }}
              />
              <h1 className="text-xl font-bold text-white">Toplantı Yönetim</h1>
            </div>
          )}
          {!sidebarOpen && (
            <img 
              src="/logo.png
              " 
              alt="Logo" 
              className="w-10 h-10 object-contain rounded-lg bg-white p-1 mx-auto"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/10 text-white transition"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition ${
                    isActive(item.path)
                      ? 'bg-indigo-50 text-indigo-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {sidebarOpen && (
                    <span className="ml-3 text-sm">{item.name}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info */}
        <div className="px-4 py-4 border-t border-gray-200">
          {sidebarOpen ? (
            <div className="flex items-center space-x-3">
              {/* 🆕 UserAvatar Component */}
              <UserAvatar user={user} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${
                  isAdmin 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {isAdmin ? 'Admin' : 'Kullanıcı'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              {/* 🆕 UserAvatar Component - Küçük */}
              <UserAvatar user={user} size="lg" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 shadow-sm">
          <div className="h-full px-8 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {menuItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
              </h2>
            </div>
            
            {/* User Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                <span>{user?.firstName}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowUserMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    👤 Profil Ayarları
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    🚪 Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {/* 🆕 Messages sayfasında padding yok, diğer sayfalarda var */}
          <div className={isMessagesPage ? '' : 'max-w-7xl mx-auto px-8 py-8'}>
            {children}
          </div>
        </main>
      </div>

      {/* Dropdown dışına tıklanınca kapat */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}

      {/* 🆕 Floating Chat Button - Sağ alt köşede sabit */}
      <FloatingChatButton />
    </div>
  );
};

export default Layout;