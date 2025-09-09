import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Attendance() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingAttendance, setExistingAttendance] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // Use app's contract: keep a single fixed period number (no UI)
  const FIXED_PERIOD_NO = 1;

  const subjects = [
    'Kannada', 'English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'PT'
  ];

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedDate) {
      checkExistingAttendance();
    }
  }, [selectedClass, selectedSubject, selectedDate]);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/public-admin/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/public-admin/students/${selectedClass}`);
      setStudents(response.data);
      
      // Initialize attendance state
      const initialAttendance = {};
      response.data.forEach(student => {
        initialAttendance[student.id] = 'present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingAttendance = async () => {
    try {
      const response = await api.get('/attendance/get', {
        params: {
          className: selectedClass,
          subject: selectedSubject,
          periodNo: FIXED_PERIOD_NO,
          date: selectedDate
        }
      });
      
      if (response.data.length > 0) {
        setExistingAttendance(response.data);
        setIsEditing(true);
        
        // Populate attendance state with existing data
        const existingData = {};
        response.data.forEach(record => {
          existingData[record.student_id] = record.status;
        });
        setAttendance(existingData);
      } else {
        setExistingAttendance([]);
        setIsEditing(false);
        
        // Reset to default present
        const defaultAttendance = {};
        students.forEach(student => {
          defaultAttendance[student.id] = 'present';
        });
        setAttendance(defaultAttendance);
      }
    } catch (error) {
      console.error('Failed to check existing attendance:', error);
      setExistingAttendance([]);
      setIsEditing(false);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAllPresent = () => {
    const allPresent = {};
    students.forEach(student => {
      allPresent[student.id] = 'present';
    });
    setAttendance(allPresent);
  };

  const markAllAbsent = () => {
    const allAbsent = {};
    students.forEach(student => {
      allAbsent[student.id] = 'absent';
    });
    setAttendance(allAbsent);
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedSubject || !selectedDate) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const attendanceList = students.map(student => ({
        studentId: student.id,
        status: attendance[student.id] || 'present'
      }));

      if (isEditing) {
        await api.patch('/attendance/edit', {
          className: selectedClass,
          subject: selectedSubject,
          periodNo: FIXED_PERIOD_NO,
          date: selectedDate,
          attendanceList
        });
      } else {
        await api.post('/attendance/mark', {
          className: selectedClass,
          subject: selectedSubject,
          periodNo: FIXED_PERIOD_NO,
          date: selectedDate,
          attendanceList,
          markedBy: 'Admin'
        });
      }

      alert(isEditing ? 'Attendance updated successfully!' : 'Attendance marked successfully!');
      
    } catch (error) {
      console.error('Failed to save attendance:', error);
      alert('Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Local computed stats from current selection (no extra API calls)
  const getAttendanceStats = () => {
    const total = students.length;
    const present = Object.values(attendance).filter(status => status === 'present').length;
    const absent = Object.values(attendance).filter(status => status === 'absent').length;
    return { total, present, absent };
  };

  const stats = getAttendanceStats();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Attendance Management</h1>
              <p className="text-gray-600 mt-1">Mark and manage student attendance</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                <span className="text-2xl">❌</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Attendance Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class *
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls} value={cls}>Class {cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Subject</option>
                {['Kannada', 'English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'PT'].map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={checkExistingAttendance}
                disabled={!selectedClass || !selectedSubject || !selectedDate}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Load Attendance
              </button>
            </div>
          </div>

          {isEditing && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                📝 Editing existing attendance record for {selectedDate}
              </p>
            </div>
          )}
        </div>

        {/* Student Attendance List */}
        {students.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Student Attendance - Class {selectedClass}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={markAllPresent}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm"
                >
                  Mark All Present
                </button>
                <button
                  onClick={markAllAbsent}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm"
                >
                  Mark All Absent
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roll Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {student.profile_image ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={`http://localhost:3000/uploads/${student.profile_image}`}
                                alt=""
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">
                                  {student.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.roll_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`attendance-${student.id}`}
                              value="present"
                              checked={attendance[student.id] === 'present'}
                              onChange={() => handleAttendanceChange(student.id, 'present')}
                              className="mr-2 text-green-600"
                            />
                            <span className="text-sm text-green-600">Present</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`attendance-${student.id}`}
                              value="absent"
                              checked={attendance[student.id] === 'absent'}
                              onChange={() => handleAttendanceChange(student.id, 'absent')}
                              className="mr-2 text-red-600"
                            />
                            <span className="text-sm text-red-600">Absent</span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={saving || students.length === 0}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : (isEditing ? 'Update Attendance' : 'Mark Attendance')}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading students...</span>
          </div>
        )}
      </div>
    </div>
  );
}
