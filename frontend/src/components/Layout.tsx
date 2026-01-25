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
  Globe,
  ChevronLeft,
  ChevronRight
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
  
  // Collapsible state with localStorage persistence
  const [collapsed, setCollapsed] = React.useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  const toggleCollapsed = () => {
    const newValue = !collapsed;
    setCollapsed(newValue);
    localStorage.setItem('sidebar-collapsed', String(newValue));
  };

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

  const sidebarWidth = collapsed ? 'w-16' : 'w-64';
  const mainMargin = collapsed ? 'lg:ml-16' : 'lg:ml-64';

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
        fixed top-0 left-0 z-50 h-full ${sidebarWidth} bg-white border-r transform transition-all duration-200 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <span className="font-bold text-xl text-primary">{t('common.appName')}</span>
          )}
          {collapsed && (
            <span className="font-bold text-xl text-primary">J</span>
          )}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`p-2 space-y-1 ${collapsed ? 'px-2' : 'p-4 space-y-2'}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive 
                    ? 'bg-primary text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle button - Desktop only */}
        <button
          onClick={toggleCollapsed}
          className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 items-center justify-center rounded-full border bg-white shadow-sm hover:bg-gray-50 transition-colors"
          title={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          )}
        </button>

        {/* Bottom section */}
        <div className={`absolute bottom-0 left-0 right-0 border-t bg-white ${collapsed ? 'p-2' : 'p-4'}`}>
          {/* Language Selector */}
          <div className="relative mb-2">
            <button
              onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
              title={collapsed ? 'Change language' : undefined}
              className={`flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 w-full rounded hover:bg-gray-100 ${
                collapsed ? 'justify-center p-2' : 'px-2 py-1'
              }`}
            >
              <Globe className="h-4 w-4 shrink-0" />
              {!collapsed && (languages.find(l => l.code === i18n.language)?.nativeName || 'English')}
            </button>
            {languageMenuOpen && (
              <div className={`absolute bottom-full mb-1 bg-white border rounded-lg shadow-lg ${
                collapsed ? 'left-full ml-1 w-32' : 'left-0 w-full'
              }`}>
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

          {/* User info */}
          {!collapsed && (
            <div className="mb-3 text-sm">
              <div className="font-medium">{user?.first_name} {user?.last_name}</div>
              <div className="text-gray-500 truncate">{user?.email}</div>
            </div>
          )}

          {/* Logout button */}
          {collapsed ? (
            <button
              onClick={handleLogout}
              title={t('auth.logout')}
              className="flex items-center justify-center w-full p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          ) : (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('auth.logout')}
            </Button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className={`${mainMargin} min-h-screen transition-all duration-200 ease-in-out`}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
