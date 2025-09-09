import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ParentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [parent, setParent] = useState(null);
  const [children, setChildren] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all users and pick the parent by id (no dedicated endpoint yet)
        const [usersRes, childrenRes] = await Promise.all([
          api.get('/admin/users'),
          api.get(`/parent/children/${id}`)
        ]);
        const found = (usersRes.data || []).find(u => String(u.id) === String(id));
        setParent(found || null);
        setChildren(childrenRes.data?.data || []);
      } catch (e) {
        console.error('Failed to load parent profile:', e);
        setError('Failed to load parent details');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading parent profile...</p>
        </div>
      </div>
    );
  }

  if (error || !parent) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="mb-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">← Back</button>
          <div className="bg-red-50 text-red-700 p-4 rounded">{error || 'Parent not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-green-500 text-white flex items-center justify-center text-2xl">
              {(parent?.name || '?').charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{parent?.name}</h1>
              <p className="text-gray-600">Parent</p>
            </div>
          </div>
          <div className="space-x-2">
            <button onClick={() => navigate(-1)} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">← Back</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Parent Details</h2>
            <Info label="Name" value={parent?.name} />
            <Info label="Email" value={parent?.email} />
            <Info label="Phone" value={parent?.phone || 'N/A'} />
            <Info label="Role" value={parent?.role} />
            <Info label="Children" value={children.length} />
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Children</h2>
            </div>
            {children.length === 0 ? (
              <div className="text-gray-600 text-sm">No children linked to this parent.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {children.map((child) => (
                  <ChildCard key={child.user_id} child={child} onOpen={() => navigate(`/students/details/${child.user_id}`)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="mb-3">
      <div className="text-gray-500 text-sm mb-1">{label}</div>
      <div className="text-gray-900 font-medium text-sm">{value}</div>
    </div>
  );
}

function ChildCard({ child, onOpen }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
          {child.profile_image_url ? (
            <img src={child.profile_image_url} alt={child.name} className="h-12 w-12 object-cover" />
          ) : (
            <span className="text-gray-600 font-semibold">{child.name?.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{child.name}</div>
          <div className="text-gray-500 text-sm truncate">Class {child.class || 'N/A'} • Roll {child.roll_number || 'N/A'}</div>
        </div>
        <button onClick={onOpen} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">View</button>
      </div>
    </div>
  );
}


