import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useUserAuth } from "../contexts/UserAuthContext";

export default function Timetable() {
  const navigate = useNavigate();
  const { token } = useUserAuth();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [timetableData, setTimetableData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [viewMode, setViewMode] = useState('class'); // 'class', 'teacher', or 'student'
  const [error, setError] = useState('');

  const [periodForm, setPeriodForm] = useState({
    class_name: '',
    day_of_week: '',
    period_no: '',
    start_time: '',
    end_time: '',
    subject: '',
    teacher_id: ''
  });

  const subjects = [
    'Kannada', 'English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'PT'
  ];

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  const timeSlots = [
    { period: 1, start: '09:00', end: '09:55' },
    { period: 2, start: '10:00', end: '10:50' },
    { period: 3, start: '11:10', end: '12:05' },
    { period: 4, start: '12:05', end: '13:00' },
    { period: 5, start: '14:00', end: '14:55' },
    { period: 6, start: '15:00', end: '15:55' }
  ];

  useEffect(() => {
    if (!token) {
      setError('Please login to access this page');
      return;
    }
    fetchClasses();
    fetchTeachers();
  }, [token]);

  useEffect(() => {
    if (selectedClass && token) {
      fetchTimetable();
    }
  }, [selectedClass, token]);

  const fetchClasses = async () => {
    try {
      setError('');
      const response = await api.get('/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      setError('Failed to fetch classes. Please check your connection and try again.');
    }
  };

  const fetchTeachers = async () => {
    try {
      setError('');
      // Use the detailed teachers endpoint from admin routes
      const response = await api.get('/admin/teachers/detailed');
      setTeachers(response.data);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      setError('Failed to fetch teachers. Please check your connection and try again.');
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/timetable/class/${selectedClass}`);
      const timetableEntries = response.data;
      
      // Transform the flat array into organized structure
      const organizedTimetable = {};
      timetableEntries.forEach(entry => {
        if (!organizedTimetable[entry.day_of_week]) {
          organizedTimetable[entry.day_of_week] = {};
        }
        organizedTimetable[entry.day_of_week][entry.period_no] = {
          id: entry.id,
          subject: entry.subject,
          teacher: entry.teacher_name || 'TBD',
          teacher_id: entry.teacher_id,
          start_time: entry.start_time,
          end_time: entry.end_time
        };
      });
      
      setTimetableData(organizedTimetable);
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Failed to fetch timetable. Please check your connection and try again.');
      }
      setTimetableData({});
    } finally {
      setLoading(false);
    }
  };

  const openModal = (day = '', period = '', existingData = null) => {
    const timeSlot = timeSlots.find(slot => slot.period === parseInt(period));
    
    setEditingSlot({ day, period });
    setPeriodForm({
      class_name: selectedClass,
      day_of_week: day,
      period_no: period,
      start_time: timeSlot?.start || '',
      end_time: timeSlot?.end || '',
      subject: existingData?.subject || '',
      teacher_id: existingData?.teacher_id || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSlot(null);
    setPeriodForm({
      class_name: '',
      day_of_week: '',
      period_no: '',
      start_time: '',
      end_time: '',
      subject: '',
      teacher_id: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      if (editingSlot?.day && timetableData[editingSlot.day]?.[editingSlot.period]) {
        // Update existing entry
        const entryId = timetableData[editingSlot.day][editingSlot.period].id;
        await api.put(`/timetable/${entryId}`, periodForm);
      } else {
        // Add new entry
        await api.post('/timetable', periodForm);
      }
      
      // Refresh timetable data
      await fetchTimetable();
      closeModal();
    } catch (error) {
      console.error('Failed to save timetable entry:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Failed to save timetable entry. Please try again.');
      }
    }
  };

  const deletePeriod = async (day, period) => {
    if (window.confirm('Are you sure you want to delete this period?')) {
      try {
        setError('');
        const entry = timetableData[day]?.[period];
        if (entry?.id) {
          await api.delete(`/timetable/${entry.id}`);
        }
        await fetchTimetable();
      } catch (error) {
        console.error('Failed to delete period:', error);
        if (error.response?.status === 401) {
          setError('Authentication failed. Please login again.');
        } else {
          setError('Failed to delete period. Please try again.');
        }
      }
    }
  };

  const exportTimetable = () => {
    const dataStr = JSON.stringify(timetableData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `timetable-${selectedClass}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const printTimetable = () => {
    window.print();
  };

  const getBreakInfo = (period) => {
    if (period === 3) return { label: 'Morning Break (11:00 - 11:10)' };
    if (period === 4) return { label: 'Lunch Break (13:00 - 14:00)' };
    return null;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Timetable Management</h1>
          <p className="text-gray-600">Manage class timetables and schedule periods</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a class...</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('class')}
                className={`px-4 py-2 rounded-md font-medium ${
                  viewMode === 'class'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Class View
              </button>
              <button
                onClick={() => setViewMode('teacher')}
                className={`px-4 py-2 rounded-md font-medium ${
                  viewMode === 'teacher'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Teacher View
              </button>
              <button
                onClick={() => setViewMode('student')}
                className={`px-4 py-2 rounded-md font-medium ${
                  viewMode === 'student'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Student View
              </button>
            </div>

            {selectedClass && (
              <>
                <button
                  onClick={exportTimetable}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                >
                  Export
                </button>
                <button
                  onClick={printTimetable}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
                >
                  Print
                </button>
              </>
            )}
          </div>
        </div>

        {/* Timetable Display */}
        {selectedClass && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {viewMode === 'class' ? `${selectedClass} Timetable` : 
                 viewMode === 'teacher' ? 'Teacher Timetable' : 'Student Timetable'}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Period
                    </th>
                    {daysOfWeek.map(day => (
                      <th key={day} className="border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot, index) => (
                    <React.Fragment key={slot.period}>
                      <tr>
                        <td className="border border-gray-200 px-4 py-3 bg-gray-50 font-medium text-sm">
                          <div>Period {slot.period}</div>
                          <div className="text-xs text-gray-600">
                            {slot.start} - {slot.end}
                          </div>
                        </td>
                        {daysOfWeek.map(day => {
                          const periodData = timetableData[day]?.[slot.period];
                          return (
                            <td key={day} className="border border-gray-200 px-2 py-3 text-center relative group">
                              {periodData ? (
                                <div className={`${viewMode === 'student' ? '' : 'cursor-pointer'}`} onClick={viewMode === 'student' ? undefined : () => openModal(day, slot.period, periodData)}>
                                  <div className="font-medium text-sm text-gray-900">
                                    {periodData.subject}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {periodData.teacher}
                                  </div>
                                  {viewMode !== 'student' && (
                                    <div className="absolute inset-0 bg-blue-100 opacity-0 group-hover:opacity-20 transition-opacity rounded"></div>
                                  )}
                                </div>
                              ) : (
                                viewMode !== 'student' ? (
                                  <button
                                    onClick={() => openModal(day, slot.period)}
                                    className="w-full h-full min-h-[60px] border-2 border-dashed border-gray-300 rounded hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center"
                                  >
                                    <span className="text-gray-400 text-sm">+ Add</span>
                                  </button>
                                ) : (
                                  <div className="w-full h-full min-h-[60px] border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                                    <span className="text-gray-400 text-sm">Free Period</span>
                                  </div>
                                )
                              )}
                              
                              {periodData && (
                                <button
                                  onClick={() => deletePeriod(day, slot.period)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ×
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      
                      {/* Break rows */}
                      {getBreakInfo(slot.period) && (
                        <tr>
                          <td className="border border-gray-200 px-4 py-2 bg-yellow-50 font-medium text-sm text-center" colSpan={daysOfWeek.length + 1}>
                            ☕ {getBreakInfo(slot.period).label}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Legend:</h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-dashed border-gray-300 rounded mr-2"></div>
                  <span>Click to add period</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-100 rounded mr-2"></div>
                  <span>Click to edit period</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                  <span>Hover and click × to delete</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Period Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">
                    {editingSlot?.day && timetableData[editingSlot.day]?.[editingSlot.period] ? 'Edit Period' : 'Add Period'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <select
                      value={periodForm.subject}
                      onChange={(e) => setPeriodForm({...periodForm, subject: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select subject...</option>
                      {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teacher
                    </label>
                    <select
                      value={periodForm.teacher_id}
                      onChange={(e) => setPeriodForm({...periodForm, teacher_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select teacher...</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name} - {teacher.subjects?.join(', ') || 'No subjects assigned'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={periodForm.start_time}
                        onChange={(e) => setPeriodForm({...periodForm, start_time: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={periodForm.end_time}
                        onChange={(e) => setPeriodForm({...periodForm, end_time: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium"
                    >
                      {editingSlot?.day && timetableData[editingSlot.day]?.[editingSlot.period] ? 'Update' : 'Add'} Period
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading timetable...</span>
          </div>
        )}

        {/* No Class Selected */}
        {!selectedClass && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Class Selected</h3>
            <p className="text-gray-600">Please select a class from the dropdown above to view and manage its timetable.</p>
          </div>
        )}
      </div>
    </div>
  );
}
