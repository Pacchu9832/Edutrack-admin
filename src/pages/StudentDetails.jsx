import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function StudentDetails() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enter, setEnter] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchProfile();
  }, [studentId]);

  useEffect(() => {
    const t = setTimeout(() => setEnter(true), 10);
    return () => clearTimeout(t);
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching profile for studentId:', studentId);
      const res = await api.get(`/public-admin/student/${studentId}`);
      console.log('Profile data received:', res.data);
      setProfile(res.data);
      setEditForm({
        name: res.data.name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        roll_number: res.data.roll_number || '',
        class: res.data.class || '',
        gender: res.data.gender || '',
        dob: res.data.dob || '',
        blood_group: res.data.blood_group || '',
        address: res.data.address || '',
        parent_name: res.data.parent_name || '',
        parent_contact_no: res.data.parent_contact_no || '',
        parent_address: res.data.parent_address || '',
      });
    } catch (e) {
      console.error('Failed to fetch student profile', e);
      setError('Failed to fetch student profile');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = () => {
    if (!profile) return null;
    if (profile.profile_image_url) return profile.profile_image_url;
    if (profile.profile_image) return `http://localhost:3000/uploads/${profile.profile_image}`;
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-lg w-full text-center">
          <div className="text-red-500 text-5xl mb-3">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Unable to load student</h2>
          <p className="text-gray-600 mb-4">{error || 'Student not found.'}</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Go Back</button>
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Contact',
      items: [
        { label: 'Email', value: profile.email || 'N/A' },
        { label: 'Phone', value: profile.phone || 'N/A' },
      ],
      icon: '📞',
    },
    {
      title: 'Academic',
      items: [
        { label: 'Class', value: profile.class || 'N/A' },
        { label: 'Roll Number', value: profile.roll_number || 'N/A' },
      ],
      icon: '🎓',
    },
    {
      title: 'Personal',
      items: [
        { label: 'Gender', value: profile.gender || 'N/A' },
        { label: 'Date of Birth', value: profile.dob || 'N/A' },
        { label: 'Blood Group', value: profile.blood_group || 'N/A' },
      ],
      icon: '🧍',
    },
    {
      title: 'Address',
      items: [
        { label: 'Home Address', value: profile.address || 'N/A' },
      ],
      icon: '🏠',
    },
    {
      title: 'Parent/Guardian',
      items: [
        { label: 'Name', value: profile.parent_name || 'N/A' },
        { label: 'Contact', value: profile.parent_contact_no || 'N/A' },
        { label: 'Address', value: profile.parent_address || 'N/A' },
      ],
      icon: '👨‍👩‍👧‍👦',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Student Profile</h1>
            <p className="text-gray-600 mt-1">Detailed information and contact</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => {
              const search = new URLSearchParams(window.location.search);
              const from = search.get('from');
              const parentId = search.get('parentId');
              if (from === 'parents' && parentId) {
                navigate(`/parents?parentId=${parentId}`);
              } else {
                navigate(`/students/list/${profile.class}`);
              }
            }} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">← Back</button>
            <button onClick={() => navigate(`/students/list/${profile.class}`)} className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800">Class {profile.class}</button>
            <button onClick={() => setShowEdit(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Edit</button>
          </div>
        </div>

        {/* Hero Card */}
        <div className={`bg-white rounded-2xl shadow-sm overflow-hidden mb-6 transition-all duration-500 ${enter ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} max-h-[40vh] overflow-auto`}> 
          <div className="p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 p-1">
                <div className="h-full w-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                  {getImageUrl() ? (
                    <img src={getImageUrl()} alt={profile.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl text-gray-600 font-semibold">{profile.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>
              <span className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full shadow">Active</span>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-semibold text-gray-900">{profile.name}</h2>
              <p className="text-gray-600">Roll No: {profile.roll_number || 'N/A'} • Class {profile.class || 'N/A'}</p>
              <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">{profile.gender || 'Unknown'}</span>
                {profile.blood_group && (
                  <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs rounded-full">Blood: {profile.blood_group}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Animated Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-h-[45vh] overflow-auto pr-1">
          {cards.map((card, idx) => (
            <div
              key={card.title}
              className={`bg-white rounded-xl shadow-sm p-5 transition-all duration-500 ${enter ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${(idx + 1) * 60}ms` }}
            >
              <div className="flex items-center mb-3">
                <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 text-lg">{card.icon}</div>
                <h3 className="text-lg font-semibold text-gray-800">{card.title}</h3>
              </div>
              <div className="space-y-2">
                {card.items.map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between border-b last:border-0 pb-2">
                    <span className="text-gray-500 text-sm">{label}</span>
                    <span className="text-gray-900 text-sm font-medium text-right ml-4 max-w-[60%]">{value || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showEdit && (
        <EditStudentModal
          form={editForm}
          setForm={setEditForm}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            fetchProfile();
          }}
          studentId={profile.studentId}
          currentImageUrl={getImageUrl()}
        />
      )}
    </div>
  );
}

function EditStudentModal({ form, setForm, onClose, onSaved, studentId, currentImageUrl }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || null);

  useEffect(() => {
    setPreviewUrl(currentImageUrl || null);
  }, [currentImageUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null) formData.append(k, v);
      });
      if (selectedImageFile) {
        formData.append('profile_image', selectedImageFile);
      }
      await api.put(`/admin/students/${studentId}`, formData);
      onSaved();
    } catch (e) {
      console.error('Failed to update student', e);
      setError('Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Edit Student</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                  {previewUrl ? (
                    <img src={previewUrl} alt="preview" className="h-16 w-16 object-cover" />
                  ) : (
                    <span className="text-xs text-gray-500">No image</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0];
                    if (file) {
                      setSelectedImageFile(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input className="w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input className="w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input className="w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                <input className="w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500" value={form.roll_number} onChange={(e) => setForm({ ...form, roll_number: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <input className="w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select className="w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input className="w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500" type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                <input className="w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500" value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input className="w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
                <input className="w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500" value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Contact</label>
                <input className="w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500" value={form.parent_contact_no} onChange={(e) => setForm({ ...form, parent_contact_no: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Address</label>
                <input className="w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500" value={form.parent_address} onChange={(e) => setForm({ ...form, parent_address: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


