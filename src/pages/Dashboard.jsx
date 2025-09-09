import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [quickStats, setQuickStats] = useState({
    presentToday: 85,
    pendingLeaves: 12,
    upcomingEvents: 5,
    todayAttendance: 89
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch dashboard stats using public route
    api.get("/public-admin/stats")
      .then(res => setStats(res.data))
      .catch(err => {
        console.error('Failed to fetch stats:', err);
        // Fallback data for development
        setStats({
          studentCount: 91,
          teacherCount: 7,
          parentCount: 15,
          adminCount: 1
        });
      });

    // Mock recent activities
    setRecentActivities([
      { id: 1, action: "New student registered", user: "John Doe", time: "2 minutes ago", type: "success" },
      { id: 2, action: "Leave request submitted", user: "Jane Smith", time: "15 minutes ago", type: "warning" },
      { id: 3, action: "Attendance marked", user: "Prof. Wilson", time: "1 hour ago", type: "info" },
      { id: 4, action: "Timetable updated", user: "Admin", time: "2 hours ago", type: "info" },
      { id: 5, action: "Parent meeting scheduled", user: "Mary Johnson", time: "3 hours ago", type: "success" }
    ]);
  }, []);

  if (!stats) return <div className="text-center py-10">Loading dashboard...</div>;

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
          EduTrack Admin Dashboard
        </h1>
        <p className="text-gray-600 text-lg">Welcome back! Here's what's happening in your school today.</p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up">
        <StatCard
          title="Students"
          count={stats.studentCount}
          icon="🎓"
          color="bg-blue-500"
          textColor="text-white"
          onClick={() => navigate("/students/class-select")}
          trend="+5.2%"
          trendUp={true}
        />
        <StatCard
          title="Teachers"
          count={stats.teacherCount}
          icon="👩‍🏫"
          color="bg-green-500"
          textColor="text-white"
          onClick={() => navigate("/users?role=Teacher")}
          trend="+2.1%"
          trendUp={true}
        />
        <StatCard
          title="Parents"
          count={stats.parentCount}
          icon="👨‍👩‍👧‍👦"
          color="bg-yellow-500"
          textColor="text-white"
          onClick={() => navigate("/parents")}
          trend="+1.8%"
          trendUp={true}
        />
        <StatCard
          title="Admins"
          count={stats.adminCount}
          icon="🛡️"
          color="bg-purple-500"
          textColor="text-white"
          trend="0%"
          trendUp={false}
        />
        {/* New: User Management card */}
        <StatCard
          title="User Management"
          count={(stats.studentCount || 0) + (stats.teacherCount || 0) + (stats.parentCount || 0) + (stats.adminCount || 0)}
          icon="👥"
          color="bg-slate-600"
          textColor="text-white"
          onClick={() => navigate("/users")}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <SecondaryStatCard
          title="Today's Attendance"
          value={quickStats.todayAttendance + "%"}
          icon="✅"
          color="bg-emerald-100 text-emerald-700"
        />
        <SecondaryStatCard
          title="Present Today"
          value={quickStats.presentToday}
          icon="👥"
          color="bg-blue-100 text-blue-700"
        />
        <SecondaryStatCard
          title="Pending Leaves"
          value={quickStats.pendingLeaves}
          icon="📋"
          color="bg-orange-100 text-orange-700"
          onClick={() => navigate("/leaves")}
        />
        <SecondaryStatCard
          title="Upcoming Events"
          value={quickStats.upcomingEvents}
          icon="📅"
          color="bg-indigo-100 text-indigo-700"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
            <span className="mr-2">⚡</span> Quick Actions
          </h2>
          <div className="space-y-3">
            <QuickActionButton
              icon="➕"
              label="Add New Student"
              onClick={() => navigate("/students/class-select")}
              color="bg-blue-500"
            />
            <QuickActionButton
              icon="📊"
              label="View Reports"
              onClick={() => navigate("/reports")}
              color="bg-green-500"
            />
            <QuickActionButton
              icon="📝"
              label="Create Notice"
              onClick={() => navigate("/notices")}
              color="bg-purple-500"
            />
            <QuickActionButton
              icon="⏰"
              label="Update Timetable"
              onClick={() => navigate("/timetable")}
              color="bg-orange-500"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
            <span className="mr-2">📊</span> Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
          <div className="mt-4 text-center">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All Activities →
            </button>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
            <span className="mr-2">📈</span> Monthly Overview
          </h2>
          <div className="space-y-4">
            <ProgressItem label="Student Enrollment" value={75} color="bg-blue-500" />
            <ProgressItem label="Teacher Satisfaction" value={88} color="bg-green-500" />
            <ProgressItem label="Parent Engagement" value={67} color="bg-yellow-500" />
            <ProgressItem label="System Usage" value={92} color="bg-purple-500" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
            <span className="mr-2">🔧</span> System Status
          </h2>
          <div className="space-y-4">
            <StatusItem label="Database" status="Operational" color="text-green-600" />
            <StatusItem label="API Services" status="Operational" color="text-green-600" />
            <StatusItem label="Backup System" status="Running" color="text-blue-600" />
            <StatusItem label="Security" status="Secure" color="text-green-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, count, icon, color, textColor, onClick, trend, trendUp }) {
  return (
    <div
      className={`rounded-xl shadow-lg p-6 cursor-pointer hover:scale-105 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${color} ${textColor} backdrop-blur-sm border border-white/20`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-4xl animate-bounce-subtle">{icon}</div>
        {trend && (
          <div className={`text-sm font-semibold px-2 py-1 rounded-full ${trendUp ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
            {trendUp ? '↗' : '↘'} {trend}
          </div>
        )}
      </div>
      <div className="text-4xl font-bold mb-2 animate-count-up">{count}</div>
      <div className="text-lg font-medium opacity-90">{title}</div>
    </div>
  );
}

function SecondaryStatCard({ title, value, icon, color, onClick }) {
  return (
    <div
      className={`rounded-xl shadow-md p-6 ${color} ${onClick ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''} transition-all duration-300 border border-white/30 backdrop-blur-sm`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold mb-1 animate-pulse-subtle">{value}</div>
          <div className="text-sm font-medium opacity-80">{title}</div>
        </div>
        <div className="text-3xl animate-float">{icon}</div>
      </div>
    </div>
  );
}

function QuickActionButton({ icon, label, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 ${color} text-white p-4 rounded-xl hover:opacity-90 hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg`}
    >
      <span className="text-xl animate-pulse-subtle">{icon}</span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function ActivityItem({ activity }) {
  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
      <div className={`w-3 h-3 rounded-full animate-pulse ${getTypeColor(activity.type).replace('text-', 'bg-').replace('-800', '-500')}`}></div>
      <div className="flex-1">
        <div className="font-semibold text-gray-800">{activity.action}</div>
        <div className="text-sm text-gray-600 font-medium">by {activity.user}</div>
      </div>
      <div className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">{activity.time}</div>
    </div>
  );
}

function ProgressItem({ label, value, color }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
}

function StatusItem({ label, status, color }) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-gray-700">{label}</span>
      <span className={`font-medium ${color}`}>● {status}</span>
    </div>
  );
}