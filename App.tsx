
import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import CurrentPageDisplay from './pages/CurrentPageDisplay';
import { ClockIcon, ListBulletIcon, ChartBarIcon, SettingsIcon, SunIcon, MoonIcon } from './components/icons';
import { useAppContext } from './contexts/AppContext';

// Main Application Layout (Navbar and Footer wrapper)
const MainAppLayout: React.FC = () => {
  const { settings, updateSettings } = useAppContext();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Focus', icon: <ClockIcon className="w-5 h-5 mr-2" /> },
    { path: '/boards', label: 'Boards', icon: <ListBulletIcon className="w-5 h-5 mr-2" /> },
    { path: '/stats', label: 'Stats', icon: <ChartBarIcon className="w-5 h-5 mr-2" /> },
    { path: '/settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5 mr-2" /> },
  ];

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' });
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="bg-neutral-50 dark:bg-neutral-800 shadow-md fixed w-full top-0 left-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              FocusFlow
            </Link>
            <div className="flex items-center space-x-1 sm:space-x-2">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-2 py-2 sm:px-3 text-sm font-medium rounded-md transition-colors duration-150
                    ${location.pathname === item.path 
                      ? 'bg-primary-100 dark:bg-primary-700 text-primary-600 dark:text-primary-200' 
                      : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  title={item.label} // Tooltip for icon-only on small screens
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              ))}
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors duration-150"
                aria-label="Toggle theme"
                title="Toggle theme"
              >
                {settings.theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-grow pt-20 pb-8 container mx-auto px-4"> {/* Increased pt */}
        <CurrentPageDisplay />
      </main>
      <footer className="bg-neutral-100 dark:bg-neutral-800 text-center py-4 text-sm text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-700">
        FocusFlow &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};


const App: React.FC = () => {
  const { settings } = useAppContext();

  // Apply theme to body
   React.useEffect(() => {
    const body = document.body;
    if (settings.theme === 'dark') {
      body.classList.add('dark', 'bg-neutral-900', 'text-neutral-100');
      body.classList.remove('bg-neutral-100', 'text-neutral-900');
    } else {
      body.classList.remove('dark', 'bg-neutral-900', 'text-neutral-100');
      body.classList.add('bg-neutral-100', 'text-neutral-900');
    }
    body.classList.add('transition-colors', 'duration-300');
  }, [settings.theme]);


  return (
      <Routes>
        <Route 
          path="/*" 
          element={<MainAppLayout />} 
        />
      </Routes>
  );
};

export default App;
