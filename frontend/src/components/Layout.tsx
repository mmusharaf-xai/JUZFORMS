import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { languages } from '@/i18n';
import { 
  FileText, 
  Database, 
  Settings, 
  LogOut,
  Menu,
  X,
  Globe
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setLanguageMenuOpen(false);
  };

  const navItems = [
    { path: '/forms', label: t('nav.forms'), icon: FileText },
    { path: '/databases', label: t('nav.databases'), icon: Database },
    { path: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold text-xl text-primary">{t('common.appName')}</span>
        </div>
        <div className="text-sm text-gray-600">
          {user?.first_name} {user?.last_name}
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r transform transition-transform duration-200
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b flex items-center justify-between">
          <span className="font-bold text-xl text-primary">{t('common.appName')}</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          {/* Language Selector */}
          <div className="relative mb-3">
            <button
              onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 w-full px-2 py-1 rounded hover:bg-gray-100"
            >
              <Globe className="h-4 w-4" />
              {languages.find(l => l.code === i18n.language)?.nativeName || 'English'}
            </button>
            {languageMenuOpen && (
              <div className="absolute bottom-full left-0 mb-1 w-full bg-white border rounded-lg shadow-lg">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                      i18n.language === lang.code ? 'bg-gray-50 font-medium' : ''
                    }`}
                  >
                    {lang.nativeName}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-3 text-sm">
            <div className="font-medium">{user?.first_name} {user?.last_name}</div>
            <div className="text-gray-500 truncate">{user?.email}</div>
          </div>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t('auth.logout')}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
