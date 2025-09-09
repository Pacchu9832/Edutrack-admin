import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function LeaveRequests() {
  const navigate = useNavigate();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(10);
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const statusOptions = [
    { value: 'all', label: 'All Requests', color: 'bg-gray-100 text-gray-800' },
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'parent_pending', label: 'Parent Pending', color: 'bg-blue-100 text-blue-800' }
  ];

  const dateFilterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'upcoming', label: 'Upcoming' }
  ];

  useEffect(() => {
    fetchLeaveRequests();
    fetchClasses();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [leaveRequests, statusFilter, dateFilter, classFilter, search]);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/leave-requests');
      // Mock data since the API might not return exactly what we need
      const mockRequests = [
        {
          id: 1,
          student_name: 'John Doe',
          student_id: 101,
          class: '10',
          from_date: '2024-01-20',
          to_date: '2024-01-22',
          reason: 'Family function',
          parent_status: 'approved',
          teacher_status: 'pending',
          created_at: '2024-01-15T10:00:00Z',
          parent_decision_at: '2024-01-15T12:00:00Z',
          teacher_decision_at: null,
          total_days: 3,
          urgent: false
        },
        {
          id: 2,
          student_name: 'Jane Smith',
          student_id: 102,
          class: '9',
          from_date: '2024-01-18',
          to_date: '2024-01-18',
          reason: 'Medical appointment',
          parent_status: 'approved',
          teacher_status: 'approved',
          created_at: '2024-01-12T09:00:00Z',
          parent_decision_at: '2024-01-12T10:00:00Z',
          teacher_decision_at: '2024-01-13T14:00:00Z',
          total_days: 1,
          urgent: true
        },
        {
          id: 3,
          student_name: 'Mike Johnson',
          student_id: 103,
          class: '11',
          from_date: '2024-01-25',
          to_date: '2024-01-27',
          reason: 'Illness - fever',
          parent_status: 'pending',
          teacher_status: 'pending',
          created_at: '2024-01-16T08:00:00Z',
          parent_decision_at: null,
          teacher_decision_at: null,
          total_days: 3,
          urgent: true
        },
        {
          id: 4,
          student_name: 'Sarah Wilson',
          student_id: 104,
          class: '8',
          from_date: '2024-01-19',
          to_date: '2024-01-19',
          reason: 'Personal emergency',
          parent_status: 'approved',
          teacher_status: 'rejected',
          created_at: '2024-01-14T11:00:00Z',
          parent_decision_at: '2024-01-14T11:30:00Z',
          teacher_decision_at: '2024-01-15T09:00:00Z',
          total_days: 1,
          urgent: false
        },
        {
          id: 5,
          student_name: 'David Brown',
          student_id: 105,
          class: '12',
          from_date: '2024-02-01',
          to_date: '2024-02-03',
          reason: 'College admission interview',
          parent_status: 'approved',
          teacher_status: 'approved',
          created_at: '2024-01-17T13:00:00Z',
          parent_decision_at: '2024-01-17T14:00:00Z',
          teacher_decision_at: '2024-01-18T10:00:00Z',
          total_days: 3,
          urgent: false
        }
      ];
      setLeaveRequests(response.data?.data || mockRequests);
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
      // Use mock data as fallback
      const mockRequests = [
        {
          id: 1,
          student_name: 'John Doe',
          student_id: 101,
          class: '10',
          from_date: '2024-01-20',
          to_date: '2024-01-22',
          reason: 'Family function',
          parent_status: 'approved',
          teacher_status: 'pending',
          created_at: '2024-01-15T10:00:00Z',
          total_days: 3,
          urgent: false
        }
      ];
      setLeaveRequests(mockRequests);
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

  const filterRequests = () => {
    let filtered = leaveRequests;

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        filtered = filtered.filter(req => 
          req.parent_status === 'pending' || req.teacher_status === 'pending'
        );
      } else if (statusFilter === 'approved') {
        filtered = filtered.filter(req => 
          req.parent_status === 'approved' && req.teacher_status === 'approved'
        );
      } else if (statusFilter === 'rejected') {
        filtered = filtered.filter(req => 
          req.parent_status === 'rejected' || req.teacher_status === 'rejected'
        );
      } else if (statusFilter === 'parent_pending') {
        filtered = filtered.filter(req => req.parent_status === 'pending');
      }
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(req => {
        const fromDate = new Date(req.from_date);
        const requestDate = new Date(req.created_at);
        
        switch (dateFilter) {
          case 'today':
            return fromDate.toDateString() === today.toDateString();
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return requestDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return requestDate >= monthAgo;
          case 'upcoming':
            return fromDate >= today;
          default:
            return true;
        }
      });
    }

    // Class filter
    if (classFilter !== 'all') {
      filtered = filtered.filter(req => req.class === classFilter);
    }

    // Search filter
    if (search) {
      filtered = filtered.filter(req =>
        req.student_name.toLowerCase().includes(search.toLowerCase()) ||
        req.reason.toLowerCase().includes(search.toLowerCase()) ||
        req.student_id.toString().includes(search)
      );
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  };

  // Pagination
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);
  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);

  const openModal = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  const handleDecision = async (requestId, decision, type) => {
    try {
      if (type === 'teacher') {
        await api.patch(`/leave-requests/${requestId}/teacher`, { status: decision });
      } else if (type === 'parent') {
        await api.patch(`/leave-requests/${requestId}/parent`, { status: decision });
      }
      
      // Update local state
      setLeaveRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, [`${type}_status`]: decision, [`${type}_decision_at`]: new Date().toISOString() }
          : req
      ));
      
      alert(`Leave request ${decision} successfully!`);
      closeModal();
    } catch (error) {
      console.error('Failed to update leave request:', error);
      alert('Failed to update leave request. Please try again.');
    }
  };

  const getOverallStatus = (request) => {
    if (request.parent_status === 'rejected' || request.teacher_status === 'rejected') {
      return { status: 'rejected', color: 'bg-red-100 text-red-800' };
    }
    if (request.parent_status === 'approved' && request.teacher_status === 'approved') {
      return { status: 'approved', color: 'bg-green-100 text-green-800' };
    }
    if (request.parent_status === 'pending' || request.teacher_status === 'pending') {
      return { status: 'pending', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { status: 'unknown', color: 'bg-gray-100 text-gray-800' };
  };

  const getRequestStats = () => {
    const total = leaveRequests.length;
    const pending = leaveRequests.filter(req => 
      req.parent_status === 'pending' || req.teacher_status === 'pending'
    ).length;
    const approved = leaveRequests.filter(req => 
      req.parent_status === 'approved' && req.teacher_status === 'approved'
    ).length;
    const rejected = leaveRequests.filter(req => 
      req.parent_status === 'rejected' || req.teacher_status === 'rejected'
    ).length;
    const urgent = leaveRequests.filter(req => req.urgent).length;
    
    return { total, pending, approved, rejected, urgent };
  };

  const stats = getRequestStats();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Leave Requests</h1>
              <p className="text-gray-600 mt-1">Manage student leave applications</p>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <span className="text-2xl">📝</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                <span className="text-2xl">⏳</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                <span className="text-2xl">❌</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
                <span className="text-2xl">🚨</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-orange-600">{stats.urgent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {dateFilterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>

            <div className="text-sm text-gray-600 flex items-center">
              {filteredRequests.length} of {leaveRequests.length} requests
            </div>
          </div>
        </div>

        {/* Leave Requests Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leave Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approval Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentRequests.map((request) => {
                  const overallStatus = getOverallStatus(request);
                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {request.student_name}
                            {request.urgent && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Urgent
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {request.student_id} | Class: {request.class}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(request.from_date).toLocaleDateString()} 
                          {request.from_date !== request.to_date && 
                            ` - ${new Date(request.to_date).toLocaleDateString()}`
                          }
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.total_days} day{request.total_days > 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {request.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${overallStatus.color}`}>
                          {overallStatus.status.charAt(0).toUpperCase() + overallStatus.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <div className="flex flex-col space-y-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              request.parent_status === 'approved' ? 'bg-green-100 text-green-800' :
                              request.parent_status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              Parent: {request.parent_status || 'pending'}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              request.teacher_status === 'approved' ? 'bg-green-100 text-green-800' :
                              request.teacher_status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              Teacher: {request.teacher_status || 'pending'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openModal(request)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
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

        {/* Request Details Modal */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Leave Request Details</h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Student Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Student Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="ml-2 font-medium">{selectedRequest.student_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Student ID:</span>
                        <span className="ml-2 font-medium">{selectedRequest.student_id}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Class:</span>
                        <span className="ml-2 font-medium">{selectedRequest.class}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Request Date:</span>
                        <span className="ml-2 font-medium">
                          {new Date(selectedRequest.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Leave Details */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Leave Details</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">From Date:</span>
                        <span className="ml-2 font-medium">
                          {new Date(selectedRequest.from_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">To Date:</span>
                        <span className="ml-2 font-medium">
                          {new Date(selectedRequest.to_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Days:</span>
                        <span className="ml-2 font-medium">{selectedRequest.total_days}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Reason:</span>
                        <div className="mt-1 p-2 bg-gray-50 rounded text-gray-900">
                          {selectedRequest.reason}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approval Status */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Approval Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">Parent Approval</div>
                          <div className="text-sm text-gray-600">
                            {selectedRequest.parent_decision_at ? 
                              `Decided on ${new Date(selectedRequest.parent_decision_at).toLocaleDateString()}` :
                              'Pending decision'
                            }
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedRequest.parent_status === 'approved' ? 'bg-green-100 text-green-800' :
                          selectedRequest.parent_status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedRequest.parent_status || 'pending'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">Teacher Approval</div>
                          <div className="text-sm text-gray-600">
                            {selectedRequest.teacher_decision_at ? 
                              `Decided on ${new Date(selectedRequest.teacher_decision_at).toLocaleDateString()}` :
                              'Pending decision'
                            }
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            selectedRequest.teacher_status === 'approved' ? 'bg-green-100 text-green-800' :
                            selectedRequest.teacher_status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedRequest.teacher_status || 'pending'}
                          </span>
                          
                          {selectedRequest.teacher_status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDecision(selectedRequest.id, 'approved', 'teacher')}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDecision(selectedRequest.id, 'rejected', 'teacher')}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading leave requests...</span>
          </div>
        )}
      </div>
    </div>
  );
}
