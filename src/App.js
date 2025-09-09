import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Attendance from './pages/Attendance';
import Timetable from './pages/Timetable';
import LeaveRequests from './pages/LeaveRequests';
import Notices from './pages/Notices';
import Marks from './pages/Marks';
import Reports from './pages/Reports.jsx';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { UserAuthProvider } from './contexts/UserAuthContext';
import ClassSelect from './pages/ClassSelect';
import StudentList from './pages/StudentList';
import TeacherProfile from './pages/TeacherProfile';
import StudentDetails from './pages/StudentDetails';
import ParentProfile from './pages/ParentProfile';
import Parents from './pages/Parents';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-open sidebar on desktop, closed on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);  
      }
    };

    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex min-h-screen bg-gray-100">
                <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
                
                {/* Main Content */}
<div className={`flex-grow overflow-auto transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
                  {/* Top Navigation Bar */}
                  <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={toggleSidebar}
                        className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded transition-colors"
                        title="Toggle Sidebar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                      <h1 className="text-lg font-semibold text-gray-800">EduTrack Admin</h1>
                      <div className="w-9"></div> {/* Spacer for centering */}
                    </div>
                  </div>

                  {/* Page Content */}
                  <div className="w-full">
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/users" element={<Users />} />
                        <Route path="/teachers/:id" element={<TeacherProfile />} />
                      <Route path="/attendance" element={<Attendance />} />
                      <Route path="/timetable" element={<Timetable />} />
                      <Route path="/leaves" element={<LeaveRequests />} />
                      <Route path="/notices" element={<Notices />} />
                      <Route path="/marks" element={<Marks />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/students/class-select" element={<ClassSelect />} />
                      <Route path="/students/list/:classId" element={<StudentList />} />
                      <Route path="/students/details/:studentId" element={<StudentDetails />} />
                      <Route path="/parents" element={<Parents />} />
                      <Route path="/parents/:id" element={<ParentProfile />} />
                      <Route path="*" element={<Navigate to="/dashboard" />} />
                    </Routes>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <UserAuthProvider>
      <AppContent />
    </UserAuthProvider>
  );
}