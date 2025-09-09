import { Link, useLocation } from 'react-router-dom';
import { useUserAuth } from "../contexts/UserAuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';

export default function Sidebar({ isOpen, onClose }) {
  const { logout, user } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState({
    dashboard: true,
    crm: false,
    analytics: false,
    forms: false,
    ui: false,
    tables: false
  });

  // Close sidebar on route change (mobile behavior)
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      onClose();
    }
  }, [location.pathname, isOpen, onClose]);

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isActive = (path) => location.pathname === path;

  const menuSections = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      ),
      items: [
        { to: '/dashboard', label: 'Overview', badge: null }
      ]
    },
    {
      id: 'students',
      title: 'Students',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      items: [
        { to: '/users', label: 'All Users', badge: null },
        { to: '/students/class-select', label: 'Students', badge: null }
      ]
    },
    {
      id: 'academics',
      title: 'Academics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      items: [
        { to: '/marks', label: 'Marks Management', badge: 'NEW' },
        { to: '/attendance', label: 'Attendance', badge: null },
        { to: '/reports', label: 'Reports', badge: null }
      ]
    },
    {
      id: 'management',
      title: 'Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      items: [
        { to: '/notices', label: 'Notices', badge: null },
        { to: '/leaves', label: 'Leave Requests', badge: null },
        { to: '/timetable', label: 'Timetable', badge: null }
      ]
    }
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white h-screen overflow-y-auto z-50 transform transition-all duration-300 ease-in-out shadow-2xl border-r border-slate-700/50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header with Logo, Close Button and Logout */}
        <div className="p-4 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg animate-pulse-subtle">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">EduTrack</span>
                <div className="text-xs text-slate-400 font-medium">Admin Panel</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Close button - visible on mobile */}
              <button 
                onClick={onClose}
                className="lg:hidden bg-slate-700 hover:bg-slate-600 text-white p-2 rounded transition-colors"
                title="Close Sidebar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button 
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                title="Logout"
              >
                Logout
              </button>
            </div>
          </div>
        
        {/* Admin Profile Info */}
        {user && (
          <div className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 rounded-xl p-4 mb-4 backdrop-blur-sm border border-slate-600/30 shadow-lg">
            <div className="flex items-start space-x-3 mb-3">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-xl animate-gradient">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-slate-700 animate-pulse"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">{user.name || 'Admin User'}</div>
                <div className="text-xs text-slate-300 truncate">{user.email || 'admin@edutrack.com'}</div>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                    {user.role || 'Super Admin'}
                  </div>
                  <div className="text-xs text-green-400 flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                    Online
                  </div>
                </div>
              </div>
            </div>
            
            {/* Profile Stats */}
            <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
              <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg p-3 text-center shadow-md hover:shadow-lg transition-all duration-200">
                <div className="font-bold text-white text-lg">{user.loginCount || '127'}</div>
                <div className="text-slate-300 font-medium">Logins</div>
              </div>
              <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg p-3 text-center shadow-md hover:shadow-lg transition-all duration-200">
                <div className="font-bold text-white text-lg">{user.lastActive || '2h'}</div>
                <div className="text-slate-300 font-medium">Last Active</div>
              </div>
            </div>

            {/* Admin Permissions */}
            <div className="space-y-2">
              <div className="text-xs text-slate-300 font-semibold flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Admin Access
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="text-xs bg-gradient-to-r from-green-600 to-green-500 text-white px-2 py-1 rounded-full shadow-sm">
                  ✓ Full Access
                </span>
                <span className="text-xs bg-gradient-to-r from-blue-600 to-blue-500 text-white px-2 py-1 rounded-full shadow-sm">
                  ✓ User Mgmt
                </span>
                <span className="text-xs bg-gradient-to-r from-purple-600 to-purple-500 text-white px-2 py-1 rounded-full shadow-sm">
                  ✓ Reports
                </span>
              </div>
            </div>

            {/* Quick Profile Actions */}
            <div className="mt-3 pt-3 border-t border-slate-600">
              <div className="flex space-x-2">
                <button className="flex-1 text-xs bg-slate-600 hover:bg-slate-500 text-white py-2 px-3 rounded transition-colors">
                  👤 Profile
                </button>
                <button className="flex-1 text-xs bg-slate-600 hover:bg-slate-500 text-white py-2 px-3 rounded transition-colors">
                  ⚙️ Settings
                </button>
              </div>
            </div>

            {/* Last Login Info */}
            <div className="mt-2 text-xs text-slate-400 text-center">
              Last login: {user.lastLogin || 'Today at 9:30 AM'}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="p-4">
        <div className="text-xs text-slate-300 mb-4 font-semibold flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Navigation
        </div>
        
        {menuSections.map((section) => (
          <div key={section.id} className="mb-2">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-600 transition-all duration-200 group hover:shadow-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="text-lg group-hover:scale-110 transition-transform duration-200">{section.icon}</div>
                <span className="text-sm font-semibold text-slate-200 group-hover:text-white">{section.title}</span>
                {section.badge && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shadow-sm ${
                    section.badge === 'NEW' ? 'bg-gradient-to-r from-blue-500 to-blue-400 text-white' : 'bg-gradient-to-r from-orange-500 to-orange-400 text-white'
                  }`}>
                    {section.badge}
                  </span>
                )}
              </div>
              <svg className={`w-4 h-4 transform transition-all duration-200 text-slate-400 group-hover:text-white ${
                openSections[section.id] ? 'rotate-90' : ''
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {openSections[section.id] && (
              <div className="ml-6 mt-2 space-y-1 animate-fade-in">
                {section.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center justify-between py-2.5 px-4 rounded-lg text-sm transition-all duration-200 group ${
                      isActive(item.to) 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg transform scale-105' 
                        : 'text-slate-300 hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-600 hover:text-white hover:transform hover:scale-105'
                    }`}
                  >
                    <span className="font-medium group-hover:font-semibold">{item.label}</span>
                    {item.badge && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium shadow-sm animate-pulse-subtle ${
                        item.badge === 'HOT' ? 'bg-gradient-to-r from-red-500 to-red-400 text-white' : 
                        item.badge === 'NEW' ? 'bg-gradient-to-r from-green-500 to-green-400 text-white' :
                        'bg-gradient-to-r from-orange-500 to-orange-400 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
    </>
  );
}