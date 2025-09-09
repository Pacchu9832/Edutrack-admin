import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Notices() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [noticesPerPage] = useState(10);

  const [noticeForm, setNoticeForm] = useState({
    reason: '',
    message: '',
    notice_date: new Date().toISOString().split('T')[0],
    class_ids: [],
    student_user_ids: [],
    send_to_parents: false,
    priority: 'normal',
    type: 'general'
  });

  const noticeTypes = [
    { value: 'general', label: 'General Notice', icon: '📢' },
    { value: 'academic', label: 'Academic Notice', icon: '📚' },
    { value: 'holiday', label: 'Holiday Notice', icon: '🏖️' },
    { value: 'event', label: 'Event Notice', icon: '🎉' },
    { value: 'emergency', label: 'Emergency Notice', icon: '🚨' },
    { value: 'exam', label: 'Exam Notice', icon: '📝' },
    { value: 'meeting', label: 'Meeting Notice', icon: '👥' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low Priority', color: 'bg-gray-100 text-gray-800' },
    { value: 'normal', label: 'Normal Priority', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'High Priority', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    fetchNotices();
    fetchClasses();
    fetchAllStudents();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      // Mock notices data since we don't have a full notices API yet
      const mockNotices = [
        {
          id: 1,
          reason: 'Parent-Teacher Meeting',
          message: 'Parent-Teacher meeting will be conducted on 25th January 2024. All parents are requested to attend.',
          notice_date: '2024-01-15',
          type: 'meeting',
          priority: 'high',
          send_to_parents: true,
          created_at: '2024-01-15T10:00:00Z',
          classes: ['8', '9', '10'],
          recipients_count: 150
        },
        {
          id: 2,
          reason: 'Annual Exam Schedule',
          message: 'Annual examinations will commence from 1st March 2024. Detailed schedule will be provided soon.',
          notice_date: '2024-01-10',
          type: 'exam',
          priority: 'urgent',
          send_to_parents: true,
          created_at: '2024-01-10T09:00:00Z',
          classes: ['10', '11', '12'],
          recipients_count: 200
        },
        {
          id: 3,
          reason: 'Republic Day Celebration',
          message: 'School will organize Republic Day celebration on 26th January. All students should attend in uniform.',
          notice_date: '2024-01-20',
          type: 'event',
          priority: 'normal',
          send_to_parents: false,
          created_at: '2024-01-08T11:00:00Z',
          classes: ['8', '9', '10', '11', '12'],
          recipients_count: 300
        }
      ];
      setNotices(mockNotices);
    } catch (error) {
      console.error('Failed to fetch notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const response = await api.get('/allstudents');
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const openModal = (notice = null) => {
    if (notice) {
      setEditingNotice(notice);
      setNoticeForm({
        reason: notice.reason,
        message: notice.message,
        notice_date: notice.notice_date,
        class_ids: notice.classes || [],
        student_user_ids: [],
        send_to_parents: notice.send_to_parents,
        priority: notice.priority,
        type: notice.type
      });
    } else {
      setEditingNotice(null);
      setNoticeForm({
        reason: '',
        message: '',
        notice_date: new Date().toISOString().split('T')[0],
        class_ids: [],
        student_user_ids: [],
        send_to_parents: false,
        priority: 'normal',
        type: 'general'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNotice(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const noticeData = {
        ...noticeForm,
        sender_user_id: 1 // Admin user ID - should come from auth context
      };

      if (editingNotice) {
        // Update existing notice
        // await api.put(`/notices/${editingNotice.id}`, noticeData);
        console.log('Updating notice:', noticeData);
      } else {
        // Create new notice
        await api.post('/notices', noticeData);
      }

      fetchNotices();
      closeModal();
      alert(editingNotice ? 'Notice updated successfully!' : 'Notice created successfully!');
    } catch (error) {
      console.error('Failed to save notice:', error);
      alert('Failed to save notice. Please try again.');
    }
  };

  const handleDelete = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;

    try {
      // await api.delete(`/notices/${noticeId}`);
      setNotices(notices.filter(notice => notice.id !== noticeId));
      alert('Notice deleted successfully!');
    } catch (error) {
      console.error('Failed to delete notice:', error);
      alert('Failed to delete notice. Please try again.');
    }
  };

  const handleClassToggle = (classId) => {
    setNoticeForm(prev => ({
      ...prev,
      class_ids: prev.class_ids.includes(classId)
        ? prev.class_ids.filter(id => id !== classId)
        : [...prev.class_ids, classId]
    }));
  };

  const selectAllClasses = () => {
    setNoticeForm(prev => ({
      ...prev,
      class_ids: classes.map(cls => cls)
    }));
  };

  const clearAllClasses = () => {
    setNoticeForm(prev => ({
      ...prev,
      class_ids: []
    }));
  };

  // Pagination
  const indexOfLastNotice = currentPage * noticesPerPage;
  const indexOfFirstNotice = indexOfLastNotice - noticesPerPage;
  const currentNotices = notices.slice(indexOfFirstNotice, indexOfLastNotice);
  const totalPages = Math.ceil(notices.length / noticesPerPage);

  const getPriorityColor = (priority) => {
    const level = priorityLevels.find(p => p.value === priority);
    return level ? level.color : 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type) => {
    const noticeType = noticeTypes.find(t => t.value === type);
    return noticeType ? noticeType.icon : '📢';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Notice Management</h1>
              <p className="text-gray-600 mt-1">Create and manage school notices</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={() => openModal()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Create Notice</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <span className="text-2xl">📢</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Notices</p>
                <p className="text-2xl font-bold text-gray-800">{notices.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <span className="text-2xl">📝</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-green-600">
                  {notices.filter(n => new Date(n.created_at).getMonth() === new Date().getMonth()).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                <span className="text-2xl">🚨</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Urgent Notices</p>
                <p className="text-2xl font-bold text-red-600">
                  {notices.filter(n => n.priority === 'urgent').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <span className="text-2xl">👨‍👩‍👧‍👦</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Parent Notices</p>
                <p className="text-2xl font-bold text-purple-600">
                  {notices.filter(n => n.send_to_parents).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notices List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recent Notices</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentNotices.map((notice) => (
                  <tr key={notice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getTypeIcon(notice.type)}</span>
                          <div className="text-sm font-medium text-gray-900">{notice.reason}</div>
                        </div>
                        <div className="text-sm text-gray-500 mt-1 max-w-md truncate">
                          {notice.message}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                          {notice.type}
                        </span>
                        <br />
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notice.priority)}`}>
                          {notice.priority}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(notice.notice_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {notice.recipients_count} recipients
                      </div>
                      <div className="text-sm text-gray-500">
                        Classes: {notice.classes?.join(', ') || 'All'}
                        {notice.send_to_parents && <span className="ml-2 text-purple-600">+ Parents</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openModal(notice)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(notice.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200">
              <div className="flex justify-center">
                <nav className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        currentPage === page
                          ? 'bg-blue-500 text-white border border-blue-500'
                          : 'bg-white border border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Notice Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">
                    {editingNotice ? 'Edit Notice' : 'Create New Notice'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notice Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={noticeForm.reason}
                        onChange={(e) => setNoticeForm({...noticeForm, reason: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter notice title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notice Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={noticeForm.notice_date}
                        onChange={(e) => setNoticeForm({...noticeForm, notice_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notice Type *
                      </label>
                      <select
                        value={noticeForm.type}
                        onChange={(e) => setNoticeForm({...noticeForm, type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        {noticeTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority Level *
                      </label>
                      <select
                        value={noticeForm.priority}
                        onChange={(e) => setNoticeForm({...noticeForm, priority: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        {priorityLevels.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notice Message *
                    </label>
                    <textarea
                      required
                      value={noticeForm.message}
                      onChange={(e) => setNoticeForm({...noticeForm, message: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter detailed notice message"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Classes
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <button
                        type="button"
                        onClick={selectAllClasses}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={clearAllClasses}
                        className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {classes.map(cls => (
                        <label key={cls} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={noticeForm.class_ids.includes(cls)}
                            onChange={() => handleClassToggle(cls)}
                            className="mr-2 rounded border-gray-300"
                          />
                          <span className="text-sm">Class {cls}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sendToParents"
                      checked={noticeForm.send_to_parents}
                      onChange={(e) => setNoticeForm({...noticeForm, send_to_parents: e.target.checked})}
                      className="mr-2 rounded border-gray-300"
                    />
                    <label htmlFor="sendToParents" className="text-sm font-medium text-gray-700">
                      Send to Parents as well
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      {editingNotice ? 'Update Notice' : 'Create Notice'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading notices...</span>
          </div>
        )}
      </div>
    </div>
  );
}
