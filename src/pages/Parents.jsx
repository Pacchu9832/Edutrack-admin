import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

export default function Parents() {
  const navigate = useNavigate();
  const location = useLocation();
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedParent, setSelectedParent] = useState(null);
  const [children, setChildren] = useState([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [parentProfile, setParentProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    fetchParents();
  }, []);

  const fetchParents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      const onlyParents = (res.data || []).filter(u => u.role === 'Parent');
      setParents(onlyParents);
      const params = new URLSearchParams(location.search);
      const parentId = params.get('parentId');
      if (parentId) {
        const found = onlyParents.find(p => String(p.id) === String(parentId));
        if (found) {
          openParent(found);
        }
      }
    } catch (e) {
      console.error('Failed to fetch parents', e);
      setParents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredParents = useMemo(() => {
    const q = search.toLowerCase();
    return parents.filter(p => p.name.toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q));
  }, [parents, search]);

  const openParent = async (p) => {
    setSelectedParent(p);
    await fetchChildren(p.id);
  };

  const fetchChildren = async (parentId) => {
    try {
      const res = await api.get(`/parent/children/${parentId}`);
      console.log('Children data received:', res.data?.data);
      setChildren(res.data?.data || []);
    } catch (e) {
      console.error('Failed to fetch children', e);
      setChildren([]);
    }
  };

  const openParentProfile = async (parent) => {
    setShowProfileModal(true);
    setProfileLoading(true);
    try {
      const res = await api.get(`/parent/profile/${parent.id}`);
      setParentProfile(res.data?.data);
    } catch (e) {
      console.error('Failed to fetch parent profile:', e);
      setParentProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading parents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Parents</h1>
            <p className="text-gray-600">Manage parents and their children</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">← Back</button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <input
              type="text"
              placeholder="Search parents..."
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={() => setShowAddParentModal(true)}
              className="w-full md:w-auto px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
            >
              + Add Parent
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-4 max-h-[70vh] overflow-auto">
            <h2 className="text-lg font-semibold mb-3">Parent List</h2>
            <div className="divide-y max-h-[60vh] overflow-auto pr-1">
              {filteredParents.map(p => (
                <div key={p.id} className={`p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${selectedParent?.id===p.id? 'bg-blue-50' : ''}`}>
                  <div className="flex-1" onClick={()=>openParent(p)}>
                    <div className="font-medium text-gray-800">{p.name}</div>
                    <div className="text-sm text-gray-500">{p.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500">ID: {p.id}</div>
                    <button 
                      onClick={() => openParentProfile(p)}
                      className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 max-h-[70vh] overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Children {selectedParent ? `of ${selectedParent.name}` : ''}</h2>
              {selectedParent && (
                <button className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={()=>setShowLinkModal(true)}>Link Child</button>
              )}
            </div>
            {!selectedParent ? (
              <div className="text-gray-500">Select a parent to view children</div>
            ) : children.length === 0 ? (
              <div className="text-gray-500">No children linked. Use "Link Child" to add.</div>
            ) : (
              <div className="space-y-2">
                {children.map(c => (
                  <div key={`${c.user_id}-${c.student_id || c.id || ''}`} className="flex items-center justify-between border rounded-lg p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                        {c.profile_image_url ? <img src={c.profile_image_url} alt={c.name} className="h-10 w-10 object-cover" /> : <span className="text-gray-600 font-medium">{c.name.charAt(0).toUpperCase()}</span>}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{c.name}</div>
                        <div className="text-sm text-gray-500">Class {c.class || 'N/A'} • Roll {c.roll_number || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="space-x-2">
                      <button className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200" onClick={()=>{
                        console.log('Viewing child:', c.name, 'with user_id:', c.user_id, 'student_id:', c.student_id);
                        navigate(`/students/details/${c.user_id}?from=parents&parentId=${selectedParent.id}`, { state: { from: 'parents', parentId: selectedParent.id } });
                      }}>View</button>
                      <button className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700" onClick={async ()=>{ await api.delete(`/parent/children/${selectedParent.id}/${c.user_id}`); fetchChildren(selectedParent.id); }}>Unlink</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showLinkModal && selectedParent && (
        <LinkChildModal parentId={selectedParent.id} onClose={()=>setShowLinkModal(false)} onLinked={()=>{ setShowLinkModal(false); fetchChildren(selectedParent.id); }} />
      )}

      {showProfileModal && (
        <ParentProfileModal 
          parentProfile={parentProfile} 
          loading={profileLoading}
          onClose={() => setShowProfileModal(false)} 
          onUpdate={() => {
            setShowProfileModal(false);
            // Refresh the profile data
            if (parentProfile) {
              openParentProfile({ id: parentProfile.user_id });
            }
          }}
        />
      )}

      {showAddParentModal && (
        <AddParentModal 
          onClose={() => setShowAddParentModal(false)} 
          onParentAdded={() => {
            setShowAddParentModal(false);
            fetchParents(); // Refresh the parents list
          }}
        />
      )}
    </div>
  );
}

function LinkChildModal({ parentId, onClose, onLinked }) {
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentUserId, setStudentUserId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/public-admin/classes').then(r => setClasses(r.data || [])).catch(()=>setClasses([]));
  }, []);

  useEffect(() => {
    if (!classId) { setStudents([]); setStudentUserId(''); return; }
    const load = async () => {
      try {
        const res = await api.get(`/public-admin/students/${classId}`);
        // Convert to user_id for linking (students endpoint returns joined fields with user id unavailable; we’ll fetch users by name/email is not ideal).
        // Here we need students with user_id; adjust backend if necessary. For now assume res data includes roll_number and we can fetch user by name+email quickly.
        setStudents(res.data || []);
      } catch (e) {
        setStudents([]);
      }
    };
    load();
  }, [classId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!studentUserId) return;
    setLoading(true);
    try {
      await api.post(`/parent/children/${parentId}`, { studentUserId });
      onLinked();
    } catch (e) {
      alert('Failed to link child');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 p-4 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Link Child to Parent</h3>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Class</label>
            <select value={classId} onChange={(e)=>setClassId(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Select class</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Student</label>
            <select value={studentUserId} onChange={(e)=>setStudentUserId(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Select student</option>
              {students.map(s => (
                <option key={s.user_id || s.id} value={s.user_id || s.id}>{s.name} (Roll {s.roll_number || 'N/A'})</option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-1">Note: This expects the option value to be the student's user_id. Ensure the students API returns an id representing user id.</div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60">{loading ? 'Linking...' : 'Link Child'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}


function ParentProfileModal({ parentProfile, loading, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    occupation: '',
    emergency_contact: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (parentProfile) {
      setFormData({
        address: parentProfile.address || '',
        phone: parentProfile.phone || '',
        occupation: parentProfile.occupation || '',
        emergency_contact: parentProfile.emergency_contact || ''
      });
      // Set image preview from the profile data (local storage path)
      setImagePreview(parentProfile.profile_image_url);
    }
  }, [parentProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update profile information
      await api.post(`/parent/profile/${parentProfile.user_id}`, formData);
      
      // Upload image if selected
      if (imageFile) {
        setUploadingImage(true);
        const formDataImage = new FormData();
        formDataImage.append('profile_image', imageFile);
        await api.post(`/parent/profile/${parentProfile.user_id}/image`, formDataImage);
      }
      
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 z-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg w-full max-w-2xl p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading parent profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!parentProfile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 z-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg w-full max-w-2xl p-6">
          <div className="text-center">
            <p className="text-gray-600">Failed to load parent profile</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 p-4 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Parent Profile - {parentProfile.name}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Image Section */}
            <div className="md:col-span-1">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="h-32 w-32 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center border-2 border-gray-300">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Profile" 
                        className="h-32 w-32 object-cover"
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <span 
                      className={`text-4xl text-gray-600 font-medium ${imagePreview ? 'hidden' : 'flex'} items-center justify-center`}
                    >
                      {parentProfile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      📷
                    </label>
                  )}
                </div>
                {isEditing && (
                  <p className="text-xs text-gray-500 mt-2">Click camera icon to change image</p>
                )}
                {parentProfile.profile_image && (
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {parentProfile.profile_image}
                  </p>
                )}
              </div>
            </div>

            {/* Profile Details Section */}
            <div className="md:col-span-2">
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={parentProfile.name}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={parentProfile.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                    />
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded ${
                        isEditing ? 'bg-white' : 'bg-gray-50'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded ${
                        isEditing ? 'bg-white' : 'bg-gray-50'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows={3}
                    className={`w-full px-3 py-2 border border-gray-300 rounded ${
                      isEditing ? 'bg-white' : 'bg-gray-50'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded ${
                      isEditing ? 'bg-white' : 'bg-gray-50'
                    }`}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Edit Profile
                      </button>
                      <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Close
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving || uploadingImage}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
                      >
                        {saving || uploadingImage ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function AddParentModal({ onClose, onParentAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    address: '',
    occupation: '',
    emergency_contact: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Create parent user using public admin route
      const userResponse = await api.post('/public-admin/users', {
        name: formData.name,
        email: formData.email,
        username: formData.username,
        phone: formData.phone,
        password: formData.password,
        role: 'Parent'
      });

      if (userResponse.data.success) {
        const newParentId = userResponse.data.data.id;
        
        // Create parent profile with all details
        try {
          await api.post(`/parent/profile/${newParentId}`, {
            address: formData.address,
            occupation: formData.occupation,
            emergency_contact: formData.emergency_contact
          });
        } catch (profileError) {
          console.warn('Profile creation failed, but user was created:', profileError);
        }

        // Upload profile image if selected
        if (imageFile) {
          try {
            const formDataImage = new FormData();
            formDataImage.append('profile_image', imageFile);
            await api.post(`/parent/profile/${newParentId}/image`, formDataImage);
          } catch (imageError) {
            console.warn('Image upload failed, but parent was created:', imageError);
          }
        }
        
        onParentAdded();
      }
    } catch (error) {
      console.error('Failed to create parent:', error);
      if (error.response?.data?.message) {
        alert(`Failed to create parent: ${error.response.data.message}`);
      } else {
        alert('Failed to create parent. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 p-4 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Add New Parent</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profile Image Section */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="h-24 w-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center border-2 border-gray-300">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile Preview" className="h-24 w-24 object-cover" />
                  ) : (
                    <span className="text-2xl text-gray-600 font-medium">📷</span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  +
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">Click + to add profile photo</p>
            </div>

            {/* Basic Information */}
            <div className="border-b pb-4">
              <h4 className="text-lg font-medium text-gray-800 mb-3">Basic Information (Required)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter full name"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                      errors.username ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter username"
                  />
                  {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter password"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
            </div>

            {/* Profile Information */}
            <div className="border-b pb-4">
              <h4 className="text-lg font-medium text-gray-800 mb-3">Profile Information (Optional)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter occupation"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter emergency contact name"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full address"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
              >
                {loading ? 'Creating...' : 'Create Parent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


