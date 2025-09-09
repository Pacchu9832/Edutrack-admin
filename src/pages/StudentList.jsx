import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";
import { useUserAuth } from '../contexts/UserAuthContext';

const initialForm = {
  name: "",
  username: "",
  roll_number: "",
  email: "",
  phone: "",
  password: "",
  gender: "",
  dob: "",
  address: "",
  blood_group: "",
  parent_name: "",
  parent_contact_no: "",
  parent_address: "",
  class: "",
};

export default function StudentList() {
  const { user, token } = useUserAuth();
  const { classId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);
  const [error, setError] = useState(null);

  // Helper to get the correct image URL
  const getProfileImageUrl = (profile_image) => {
    if (!profile_image) return null;
    if (profile_image.startsWith("http")) return profile_image;
    return `http://localhost:3000/uploads/${profile_image}`;
  };

  // Fetch students
  useEffect(() => {
    fetchStudents();
  }, [classId]);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the public route to fetch students by class (no authentication required)
      const res = await api.get(`/public-admin/students/${classId}`);
      console.log('Fetched students:', res.data);
      
      // Transform the data to match the expected format
      const transformedStudents = res.data.map(student => ({
        id: student.id,
        name: student.name,
        roll_number: student.roll_number,
        class: student.class,
        // Add default values for missing fields
        username: student.username || '',
        email: student.email || '',
        phone: student.phone || '',
        dob: student.dob || '',
        gender: student.gender || '',
        address: student.address || '',
        blood_group: student.blood_group || '',
        parent_name: student.parent_name || '',
        parent_contact_no: student.parent_contact_no || '',
        parent_address: student.parent_address || '',
        profile_image: student.profile_image || ''
      }));
      
      setStudents(transformedStudents);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setError('Failed to fetch students. Please check your connection.');
      setStudents([]);
    }
    setLoading(false);
  };

  // Filter and sort students
  const filteredAndSortedStudents = students
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) ||
                           student.email.toLowerCase().includes(search.toLowerCase()) ||
                           (student.roll_number && student.roll_number.toString().includes(search));
      
      if (filterBy === 'all') return matchesSearch;
      if (filterBy === 'male') return matchesSearch && student.gender === 'Male';
      if (filterBy === 'female') return matchesSearch && student.gender === 'Female';
      return matchesSearch;
    })
    .sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      if (sortBy === 'roll_number') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredAndSortedStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredAndSortedStudents.length / studentsPerPage);

  const openModal = (student = null) => {
    if (student) {
      setEditId(student.id);
      setForm({
        name: student.name || "",
        username: student.username || "",
        roll_number: student.roll_number || "",
        email: student.email || "",
        phone: student.phone || "",
        password: "", // Don't pre-fill password
        gender: student.gender || "",
        dob: student.dob || "",
        address: student.address || "",
        blood_group: student.blood_group || "",
        parent_name: student.parent_name || "",
        parent_contact_no: student.parent_contact_no || "",
        parent_address: student.parent_address || "",
        class: classId,
      });
    } else {
      setEditId(null);
      setForm({ ...initialForm, class: classId });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm(initialForm);
    setProfileImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!token) {
      alert('You must be logged in to perform this action. Please log in again.');
      return;
    }

    try {
      const formData = new FormData();
      
      // Add all form fields to FormData
      Object.keys(form).forEach(key => {
        if (form[key] !== undefined && form[key] !== null && form[key] !== "") {
          formData.append(key, form[key]);
        }
      });
      
      // Add profile image if selected
      if (profileImageFile) {
        formData.append('profile_image', profileImageFile);
      }

      if (editId) {
        // Update existing student - use admin route for updates
        console.log('Updating student with ID:', editId, 'Token:', token ? 'Present' : 'Missing');
        await api.put(`/admin/students/${editId}`, formData);
      } else {
        // Add new student - use admin route for adding
        console.log('Adding new student. Token:', token ? 'Present' : 'Missing');
        await api.post('/admin/addStudentWithImage', formData);
      }
      
      fetchStudents();
      closeModal();
    } catch (error) {
      console.error('Failed to save student:', error);
      if (error.response?.status === 401) {
        alert('Authentication failed. Please log in again.');
      } else {
        alert('Failed to save student. Please try again.');
      }
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    
    // Check if user is authenticated
    if (!token) {
      alert('You must be logged in to perform this action. Please log in again.');
      return;
    }

    try {
      console.log('Deleting student with ID:', studentId, 'Token:', token ? 'Present' : 'Missing');
      await api.delete(`/admin/students/${studentId}`);
      fetchStudents();
    } catch (error) {
      console.error('Failed to delete student:', error);
      if (error.response?.status === 401) {
        alert('Authentication failed. Please log in again.');
      } else {
        alert('Failed to delete student. Please try again.');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedStudents.length} students?`)) return;
    
    // Check if user is authenticated
    if (!token) {
      alert('You must be logged in to perform this action. Please log in again.');
      return;
    }

    try {
      console.log('Bulk deleting students. Token:', token ? 'Present' : 'Missing');
      await api.post('/admin/students/bulk', {
        action: 'delete',
        studentIds: selectedStudents
      });
      setSelectedStudents([]);
      setShowBulkActions(false);
      fetchStudents();
    } catch (error) {
      console.error('Failed to delete students:', error);
      if (error.response?.status === 401) {
        alert('Authentication failed. Please log in again.');
      } else {
        alert('Failed to delete students. Please try again.');
      }
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    if (selectedStudents.length === currentStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(currentStudents.map(s => s.id));
    }
  };

  useEffect(() => {
    setShowBulkActions(selectedStudents.length > 0);
  }, [selectedStudents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Class {classId} Students</h1>
              <p className="text-gray-600 mt-1">{filteredAndSortedStudents.length} students found</p>
              {error && (
                <p className="text-red-600 mt-1">{error}</p>
              )}
              {/* Authentication Status */}
              <div className="mt-2 flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  token ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {token ? '✅ Authenticated' : '❌ Not Authenticated'}
                </span>
                {user && (
                  <span className="text-sm text-gray-600">
                    Logged in as: {user.name} ({user.role})
                  </span>
                )}
                {token && (
                  <button
                    onClick={() => {
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      window.location.reload();
                    }}
                    className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/students/class-select')}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                ← Back to Classes
              </button>
              <button
                onClick={() => openModal()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Add Student</span>
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters and View Controls */}
            <div className="flex items-center space-x-3">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Students</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="name">Sort by Name</option>
                <option value="roll_number">Sort by Roll No.</option>
                <option value="email">Sort by Email</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>

              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded ${viewMode === 'table' ? 'bg-white shadow' : ''}`}
                >
                  📋
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1 rounded ${viewMode === 'cards' ? 'bg-white shadow' : ''}`}
                >
                  📱
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-blue-800">{selectedStudents.length} students selected</span>
              <div className="space-x-2">
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedStudents([])}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Students Display */}
        {students.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-500 mb-4">This class doesn't have any students yet.</p>
            <button
              onClick={() => openModal()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Add First Student
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <StudentTable 
            students={currentStudents}
            selectedStudents={selectedStudents}
            onToggleSelect={toggleStudentSelection}
            onSelectAll={selectAllStudents}
            onEdit={openModal}
            onDelete={handleDelete}
            getProfileImageUrl={getProfileImageUrl}
          />
        ) : (
          <StudentCards 
            students={currentStudents}
            selectedStudents={selectedStudents}
            onToggleSelect={toggleStudentSelection}
            onEdit={openModal}
            onDelete={handleDelete}
            getProfileImageUrl={getProfileImageUrl}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}

        {/* Modal */}
        {showModal && (
          <StudentModal
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            onClose={closeModal}
            isEdit={!!editId}
            profileImageFile={profileImageFile}
            setProfileImageFile={setProfileImageFile}
          />
        )}
      </div>
    </div>
  );
}

// Student Table Component
function StudentTable({ students, selectedStudents, onToggleSelect, onSelectAll, onEdit, onDelete, getProfileImageUrl }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedStudents.length === students.length && students.length > 0}
                  onChange={onSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => onToggleSelect(student.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {getProfileImageUrl(student.profile_image) ? (
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={getProfileImageUrl(student.profile_image)}
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
                      <div className="text-sm font-medium text-gray-900 cursor-pointer hover:underline" onClick={() => navigate(`/students/details/${student.id}`)}>{student.name}</div>
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </div>
              </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {student.roll_number || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{student.phone || 'N/A'}</div>
                  <div className="text-xs">{student.gender || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{student.parent_name || 'N/A'}</div>
                  <div className="text-xs">{student.parent_contact_no || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                    onClick={() => onEdit(student)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  Edit
                </button>
                <button
                    onClick={() => onDelete(student.id)}
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
    </div>
  );
}

// Student Cards Component
function StudentCards({ students, selectedStudents, onToggleSelect, onEdit, onDelete, getProfileImageUrl }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {students.map((student) => (
        <div key={student.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <input
              type="checkbox"
              checked={selectedStudents.includes(student.id)}
              onChange={() => onToggleSelect(student.id)}
              className="rounded border-gray-300"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(student)}
                className="text-blue-600 hover:text-blue-900 text-sm"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(student.id)}
                className="text-red-600 hover:text-red-900 text-sm"
              >
                🗑️
              </button>
            </div>
          </div>
          
          <div className="text-center mb-3">
            <div className="cursor-pointer" onClick={() => navigate(`/students/details/${student.id}`)}>
              {getProfileImageUrl(student.profile_image) ? (
                <img
                  className="h-16 w-16 rounded-full object-cover mx-auto mb-2"
                  src={getProfileImageUrl(student.profile_image)}
                  alt=""
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center mx-auto mb-2">
                  <span className="text-gray-600 font-medium text-lg">
                    {student.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <h3 className="font-medium text-gray-900 cursor-pointer hover:underline" onClick={() => navigate(`/students/details/${student.id}`)}>{student.name}</h3>
            <p className="text-sm text-gray-500">Roll: {student.roll_number || 'N/A'}</p>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <p>📧 {student.email}</p>
            <p>📱 {student.phone || 'N/A'}</p>
            <p>👤 {student.gender || 'N/A'}</p>
            <p>👨‍👩‍👧‍👦 {student.parent_name || 'N/A'}</p>
              </div>
            </div>
          ))}
        </div>
  );
}

// Pagination Component
function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="flex justify-center mt-6">
      <nav className="flex space-x-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              currentPage === page
                ? 'bg-blue-500 text-white border border-blue-500'
                : 'bg-white border border-gray-300 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {page}d
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </button>
      </nav>
    </div>
  );
}

// Student Modal Component
function StudentModal({ form, setForm, onSubmit, onClose, isEdit, profileImageFile, setProfileImageFile }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {isEdit ? 'Edit Student' : 'Add New Student'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({...form, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Roll Number
                </label>
                <input
                  type="text"
                  value={form.roll_number}
                  onChange={(e) => setForm({...form, roll_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({...form, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({...form, gender: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({...form, dob: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blood Group
                </label>
                <select
                  value={form.blood_group}
                  onChange={(e) => setForm({...form, blood_group: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({...form, address: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Name
                </label>
              <input
                  type="text"
                value={form.parent_name}
                  onChange={(e) => setForm({...form, parent_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Contact
                </label>
              <input
                  type="tel"
                value={form.parent_contact_no}
                  onChange={(e) => setForm({...form, parent_contact_no: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Address
              </label>
              <textarea
                value={form.parent_address}
                onChange={(e) => setForm({...form, parent_address: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
              <input
                  type="password"
                  required={!isEdit}
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProfileImageFile(e.target.files[0])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                {isEdit ? 'Update' : 'Add'} Student
                </button>
              </div>
            </form>
          </div>
        </div>
    </div>
  );
}
