import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

export default function ClassSelect() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [classStats, setClassStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch available classes using public route
      const classesResponse = await api.get('/public-admin/classes');
      const availableClasses = classesResponse.data.map(String);

      // Restrict to 8, 9, 10 and ensure order 8, 9, 10
      const priority = ['8', '9', '10'];
      const filtered = availableClasses.filter(c => priority.includes(c));
      const classesToShow = (filtered.length > 0
        ? priority.filter(c => filtered.includes(c))
        : priority);
      setClasses(classesToShow);
      
      // Fetch student count for each class using the public route
      const statsPromises = classesToShow.map(async (cls) => {
        try {
          const response = await api.get(`/public-admin/students/${cls}`);
          return { class: cls, count: response.data.length };
        } catch (err) {
          console.error(`Error fetching students for class ${cls}:`, err);
          return { class: cls, count: 0 };
        }
      });
      
      const stats = await Promise.all(statsPromises);
      const statsObj = {};
      stats.forEach(stat => {
        statsObj[stat.class] = stat.count;
      });
      setClassStats(statsObj);
      
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes');
      // Fallback to default classes
      setClasses(['8', '9', '10', '11', '12']);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Select Class</h1>
          <p className="text-gray-600">Choose a class to view and manage students</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
            <button 
              onClick={fetchClasses}
              className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Class Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {classes.map(cls => (
            <ClassCard
              key={cls}
              className={cls}
              studentCount={classStats[cls] || 0}
              onClick={() => navigate(`/students/list/${cls}`)}
            />
          ))}
        </div>

        {/* Add New Class Button */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => {/* TODO: Implement add class modal */}}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
          >
            <span>➕</span>
            <span>Add New Class</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{classes.length}</div>
              <div className="text-sm text-gray-600">Total Classes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(classStats).reduce((sum, count) => sum + count, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(Object.values(classStats).reduce((sum, count) => sum + count, 0) / classes.length) || 0}
              </div>
              <div className="text-sm text-gray-600">Avg per Class</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.max(...Object.values(classStats), 0)}
              </div>
              <div className="text-sm text-gray-600">Largest Class</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClassCard({ className, studentCount, onClick }) {
  const getClassIcon = (cls) => {
    const icons = {
      '8': '🎯', '9': '📚', '10': '🎓', '11': '🚀', '12': '👑'
    };
    return icons[cls] || '📖';
  };

  const getGradientClass = (cls) => {
    const gradients = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600', 
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-red-400 to-red-600',
      'from-yellow-400 to-yellow-600',
      'from-teal-400 to-teal-600'
    ];
    return gradients[parseInt(cls) % gradients.length];
  };

  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${getGradientClass(className)} rounded-xl shadow-lg p-6 text-white cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-4xl">{getClassIcon(className)}</div>
        <div className="bg-white bg-opacity-20 rounded-full px-3 py-1">
          <span className="text-sm font-medium">{studentCount} students</span>
        </div>
      </div>
      
      <div className="mb-2">
        <h3 className="text-2xl font-bold">Class {className}</h3>
        <p className="text-white text-opacity-80">Manage students and records</p>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-white text-opacity-80">
          {studentCount > 0 ? 'Click to view' : 'No students yet'}
        </div>
        <div className="bg-white bg-opacity-20 rounded-full p-2">
          <span className="text-lg">→</span>
        </div>
      </div>
    </div>
  );
}