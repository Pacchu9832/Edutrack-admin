import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

const initialForm = {
  name: "",
  username: "",
  roll_number: "",
  email: "",
  phone: "",
  password: "",
  role: "Teacher",
  subject: "",
  experience: "",
  qualification: "",
  address: "",
  gender: "",
  dob: "",
  joining_date: "",
  salary: "",
  emergency_contact: "",
  avatarUrl: ""
};

export default function Users() {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [selectedRole, setSelectedRole] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [viewMode, setViewMode] = useState('table');

  const roles = [
    { value: 'Teacher', label: 'Teacher', icon: '👩‍🏫' },
    { value: 'Parent', label: 'Parent', icon: '👨‍👩‍👧‍👦' },
    { value: 'Admin', label: 'Admin', icon: '👨‍💼' },
    { value: 'Student', label: 'Student', icon: '🎓' }
  ];

  const subjects = [
    // Added to match your DB values
    'Kannada', 'Hindi', 'Math', 'Science', 'English', 'Social Science', 'PT',
    // Common subjects
    'Social Studies', 'Mathematics', 'Computer Science', 'Physics', 'Chemistry',
    'Biology', 'History', 'Geography', 'Economics', 'Physical Education', 'Art', 'Music'
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  // Read ?role=Teacher from query to default-filter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam) {
      setSelectedRole(roleParam);
    }
    
  }, [location.search]);

  useEffect(() => {
    filterUsers();
  }, [users, selectedRole, search]);

  useEffect(() => {
    setShowBulkActions(selectedUsers.length > 0);
  }, [selectedUsers]);

  // Pagination (compute before render)
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users');
      let usersData = response.data || [];

      // Enrich Teachers with subject, phone, and avatar using teacher details endpoint
      const teacherIds = usersData.filter(u => u.role === 'Teacher').map(u => u.id);
      if (teacherIds.length > 0) {
        try {
          const profiles = await Promise.all(
            teacherIds.map(id => api.get(`/teacher/details/${id}`).then(r => ({ id, subject: r.data?.subject || '', phone: r.data?.phone || '', avatarUrl: r.data?.details?.profile_image_url || '' })))
          );
          const byId = Object.fromEntries(profiles.map(p => [p.id, p]));
          usersData = usersData.map(u => (
            u.role === 'Teacher'
              ? { ...u, subject: byId[u.id]?.subject || u.subject, phone: byId[u.id]?.phone || u.phone, avatarUrl: byId[u.id]?.avatarUrl || '' }
              : u
          ));
        } catch (enrichErr) {
          console.warn('Could not enrich teachers with details:', enrichErr);
        }
      }

      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    if (search) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        (user.phone && user.phone.includes(search))
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const roleStats = getRoleStats();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {selectedRole === 'Teacher' ? 'Teachers' : 'User Management'}
              </h1>
              <p className="text-gray-600 mt-1">
                {selectedRole === 'Teacher' ? 'Manage teachers and their profiles' : 'Manage teachers, parents, and administrators'}
              </p>
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
                <span>{selectedRole === 'Teacher' ? 'Add Teacher' : 'Add User'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Role Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {roles.map(role => (
            <div key={role.value} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                  <span className="text-2xl">{role.icon}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{role.label}s</p>
                  <p className="text-2xl font-bold text-gray-800">{roleStats[role.value] || 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search and Filters */}
            <div className="flex-1 flex gap-4 items-center">
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.icon} {role.label}
                  </option>
                ))}
              </select>

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

            <div className="text-sm text-gray-600">
              {filteredUsers.length} {selectedRole === 'Teacher' ? 'teachers' : 'users'} found
            </div>
          </div>

          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-blue-800">{selectedUsers.length} users selected</span>
              <div className="space-x-2">
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Users Display */}
        {viewMode === 'table' ? (
          <UserTable
            users={currentUsers}
            selectedUsers={selectedUsers}
            onToggleSelect={toggleUserSelection}
            onSelectAll={selectAllUsers}
            onEdit={openModal}
            onDelete={handleDelete}
          />
        ) : (
          <UserCards
            users={currentUsers}
            selectedUsers={selectedUsers}
            onToggleSelect={toggleUserSelection}
            onEdit={openModal}
            onDelete={handleDelete}
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

        {/* User Modal */}
        {showModal && (
          <UserModal
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            onClose={closeModal}
            isEdit={!!editId}
            subjects={subjects}
            roles={roles}
          />
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading users...</span>
          </div>
        )}
      </div>
    </div>
  );

  function getRoleStats() {
    const stats = {};
    roles.forEach(role => {
      stats[role.value] = users.filter(user => user.role === role.value).length;
    });
    return stats;
  }

  function openModal(user = null) {
    if (user) {
      setEditId(user.id);
      setForm({
        ...user,
        password: "" // Don't pre-fill password
      });
    } else {
      setEditId(null);
      setForm(initialForm);
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm(initialForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editId) {
        // For now, local update for editing existing user (extend as needed)
        const updatedUsers = users.map(user => 
          user.id === editId ? { ...user, ...form } : user
        );
        setUsers(updatedUsers);
        alert('User updated successfully!');
      } else {
        // Create via backend when adding a Teacher
        if (form.role === 'Teacher') {
          const formData = new FormData();
          const imageInput = document.getElementById('teacher-profile-image-input');
          const imageFile = imageInput && imageInput.files && imageInput.files[0] ? imageInput.files[0] : null;

          const fields = [
            'name','email','username','phone','password','subject','experience','qualification','address','gender','dob','joining_date','salary','emergency_contact','bio'
          ];
          fields.forEach(key => {
            const value = form[key];
            if (value !== undefined && value !== null && value !== '') {
              formData.append(key, value);
            }
          });
          if (imageFile) {
            formData.append('profile_image', imageFile);
          }
          await api.post('/admin/teachers', formData);
          await fetchUsers();
          alert('Teacher created successfully!');
        } else {
          // For non-teacher roles, keep local add for now
          const newUser = { ...form, id: Date.now(), status: 'active' };
          setUsers([...users, newUser]);
          alert('User created successfully!');
        }
      }
      closeModal();
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Failed to save user. Please try again.');
    }
  }

  async function handleDelete(userId) {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      setUsers(users.filter(user => user.id !== userId));
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user. Please try again.');
    }
  }

  function handleBulkDelete() {
    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) return;
    try {
      setUsers(users.filter(user => !selectedUsers.includes(user.id)));
      setSelectedUsers([]);
      alert('Users deleted successfully!');
    } catch (error) {
      console.error('Failed to delete users:', error);
      alert('Failed to delete users. Please try again.');
    }
  }

  function toggleUserSelection(userId) {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }

  function selectAllUsers() {
    if (selectedUsers.length === currentUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(currentUsers.map(u => u.id));
    }
  }
}

// User Table Component
function UserTable({ users, selectedUsers, onToggleSelect, onSelectAll, onEdit, onDelete }) {
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
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={onSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => onToggleSelect(user.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div
                        className="text-sm font-medium text-gray-900 cursor-pointer hover:underline"
                        onClick={() => {
                          if (user.role === 'Teacher') navigate(`/teachers/${user.id}`);
                          else if (user.role === 'Parent') navigate(`/parents/${user.id}`);
                        }}
                      >
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'Teacher' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'Parent' ? 'bg-green-100 text-green-800' :
                    user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{user.phone || 'N/A'}</div>
                  <div className="text-xs">{user.username || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role === 'Teacher' && (
                    <div>
                      <div>{user.subject || 'N/A'}</div>
                      <div className="text-xs">{user.experience || 'N/A'}</div>
                    </div>
                  )}
                  {user.role === 'Parent' && (
                    <div>
                      <div className="text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/parents/${user.id}`)}>
                        View children
                      </div>
                    </div>
                  )}
                  {user.role === 'Admin' && (
                    <div>
                      <div>{user.permissions || 'Standard'}</div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status || 'active'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onEdit(user)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
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

// User Cards Component
function UserCards({ users, selectedUsers, onToggleSelect, onEdit, onDelete }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {users.map((user) => (
        <div key={user.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <input
              type="checkbox"
              checked={selectedUsers.includes(user.id)}
              onChange={() => onToggleSelect(user.id)}
              className="rounded border-gray-300"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(user)}
                className="text-blue-600 hover:text-blue-900 text-sm"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(user.id)}
                className="text-red-600 hover:text-red-900 text-sm"
              >
                🗑️
              </button>
            </div>
          </div>
          
          <div className="text-center mb-3">
            <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center mx-auto mb-2 overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-16 w-16 object-cover" />
              ) : (
                <span className="text-gray-600 font-medium text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <h3
              className="font-medium text-gray-900 cursor-pointer hover:underline"
              onClick={() => {
                if (user.role === 'Teacher') navigate(`/teachers/${user.id}`);
                else if (user.role === 'Parent') navigate(`/parents/${user.id}`);
              }}
            >
              {user.name}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user.role === 'Teacher' ? 'bg-blue-100 text-blue-800' :
              user.role === 'Parent' ? 'bg-green-100 text-green-800' :
              user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {user.role}
            </span>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <p>📧 {user.email}</p>
            <p>📱 {user.phone || 'N/A'}</p>
            {user.role === 'Teacher' && (
              <>
                <p>📚 {user.subject || 'N/A'}</p>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Pagination Component
function Pagination({ currentPage, totalPages, onPageChange }) {
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
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
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

// User Modal Component
function UserModal({ form, setForm, onSubmit, onClose, isEdit, subjects, roles }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {isEdit ? 'Edit User' : 'Add New User'}
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
                  Role *
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({...form, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.icon} {role.label}
                    </option>
                  ))}
                </select>
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

              {form.role === 'Teacher' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm({...form, subject: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience
                    </label>
                    <input
                      type="text"
                      value={form.experience}
                      onChange={(e) => setForm({...form, experience: e.target.value})}
                      placeholder="e.g., 5 years"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={form.joining_date}
                      onChange={(e) => setForm({...form, joining_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Salary
                    </label>
                    <input
                      type="number"
                      value={form.salary}
                      onChange={(e) => setForm({...form, salary: e.target.value})}
                      placeholder="Monthly salary"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profile Image
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                        {form.avatarUrl ? (
                          <img src={form.avatarUrl} alt="preview" className="h-16 w-16 object-cover" />
                        ) : (
                          <span className="text-xs text-gray-500">No image</span>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        id="teacher-profile-image-input"
                        onChange={(e) => {
                          const file = e.target.files && e.target.files[0];
                          if (file) {
                            const objectUrl = URL.createObjectURL(file);
                            setForm({ ...form, avatarUrl: objectUrl });
                          }
                        }}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

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
                  Emergency Contact
                </label>
                <input
                  type="tel"
                  value={form.emergency_contact}
                  onChange={(e) => setForm({...form, emergency_contact: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
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

            {form.role === 'Teacher' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qualification
                </label>
                <textarea
                  value={form.qualification}
                  onChange={(e) => setForm({...form, qualification: e.target.value})}
                  rows={2}
                  placeholder="e.g., M.Sc Mathematics, B.Ed"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

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
                {isEdit ? 'Update User' : 'Add User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}