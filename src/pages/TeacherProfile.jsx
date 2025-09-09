import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function TeacherProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teacher, setTeacher] = useState(null);
  const [details, setDetails] = useState(null);
  const [teaches, setTeaches] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");
        const [detailsRes, teachRes, scheduleRes] = await Promise.all([
          api.get(`/teacher/details/${id}`),
          api.get(`/teacher/subjects-classes/${id}`),
          api.get(`/teacher/schedule/today/${id}`)
        ]);
        setTeacher(detailsRes.data);
        setDetails(detailsRes.data?.details || null);
        setTeaches(teachRes.data);
        setTodaySchedule(scheduleRes.data);
      } catch (err) {
        console.error("Failed to load teacher profile:", err);
        setError("Failed to load teacher details");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const openEdit = () => {
    setForm({
      gender: details?.gender || "",
      dob: details?.dob ? details.dob.substring(0,10) : "",
      joining_date: details?.joining_date ? details.joining_date.substring(0,10) : "",
      experience_years: details?.experience_years || "",
      qualification: details?.qualification || "",
      address: details?.address || "",
      emergency_contact: details?.emergency_contact || "",
      salary: details?.salary || "",
      bio: details?.bio || "",
    });
    setShowEdit(true);
  };

  const saveDetails = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/teacher/details/${id}`, form);
      if (selectedFile) {
        const fd = new FormData();
        fd.append('profile_image', selectedFile);
        setUploading(true);
        await api.post(`/teacher/details/${id}/profile-image`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setUploading(false);
      }
      setShowEdit(false);
      // Refresh
      const res = await api.get(`/teacher/details/${id}`);
      setTeacher(res.data);
      setDetails(res.data.details || null);
      setSelectedFile(null);
    } catch (err) {
      console.error('Failed to save teacher details:', err);
      alert('Failed to save details');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teacher details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="mb-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">← Back</button>
          <div className="bg-red-50 text-red-700 p-4 rounded">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center ring-2 ring-white shadow">
              {details?.profile_image_url ? (
                <img src={details.profile_image_url} alt="profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl text-white bg-blue-500 h-full w-full flex items-center justify-center">{(teacher?.name||'?').charAt(0)}</span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{teacher?.name}</h1>
              <p className="text-gray-600">Teacher • {teacher?.subject || "Subject not set"}</p>
            </div>
          </div>
          <div className="space-x-2">
            <button onClick={openEdit} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition-transform hover:scale-[1.02]">Edit Details</button>
            <button onClick={() => navigate(-1)} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">← Back</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 transform transition-all hover:shadow-md max-h-[520px] overflow-auto">
            <h2 className="text-xl font-semibold mb-4">Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <Info label="Name" value={teacher?.name} />
              <Info label="Email" value={teacher?.email} />
              <Info label="Phone" value={teacher?.phone || 'N/A'} />
              <Info label="Role" value={teacher?.role} />
              <Info label="Primary Subject" value={teacher?.subject || 'N/A'} />
              <Info label="Experience" value={details?.experience_years ? `${details.experience_years} years` : 'N/A'} />
              <Info label="Qualification" value={details?.qualification || 'N/A'} />
              <Info label="Gender" value={details?.gender || 'N/A'} />
              <Info label="DOB" value={details?.dob || 'N/A'} />
              <Info label="Joining Date" value={details?.joining_date || 'N/A'} />
              <Info label="Salary" value={details?.salary ? `₹ ${details.salary}` : 'N/A'} />
              <Info label="Emergency Contact" value={details?.emergency_contact || 'N/A'} />
              <div className="md:col-span-2">
                <Info label="Address" value={details?.address || 'N/A'} />
              </div>
              <div className="md:col-span-2">
                <Info label="Bio" value={details?.bio || 'N/A'} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 transform transition-all hover:shadow-md max-h-[520px] overflow-auto">
            <h2 className="text-xl font-semibold mb-4">Teaches</h2>
            {teaches.length === 0 ? (
              <div className="text-gray-600 text-sm">No assignments found</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {teaches.map((t, idx) => (
                  <li key={idx} className="flex justify-between bg-gray-50 rounded p-3 hover:bg-gray-100 transition-colors">
                    <span className="font-medium">{t.subject}</span>
                    <span className="text-gray-600">Class {t.class_name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 transform transition-all hover:shadow-md max-h-[420px] overflow-auto">
          <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
          {todaySchedule.length === 0 ? (
            <div className="text-gray-600 text-sm">No classes scheduled today</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Class</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Period</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Subject</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {todaySchedule.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{p.class_name}</td>
                      <td className="px-4 py-2">{p.period_number}</td>
                      <td className="px-4 py-2">{p.subject}</td>
                      <td className="px-4 py-2">{p.start_time} - {p.end_time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <EditDetailsModal
          form={form}
          setForm={setForm}
          onClose={() => setShowEdit(false)}
          onSubmit={saveDetails}
          onFileChange={(file)=>setSelectedFile(file)}
          uploading={uploading}
        />
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-gray-500 mb-1">{label}</div>
      <div className="font-medium text-gray-800">{value}</div>
    </div>
  );
}

function EditDetailsModal({ form, setForm, onClose, onSubmit, onFileChange, uploading }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-auto animate-[fadeIn_0.2s_ease-out] max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold">Edit Teacher Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <form onSubmit={onSubmit} className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Gender">
              <select value={form.gender || ''} onChange={(e)=>setForm({...form, gender: e.target.value})} className="w-full border rounded px-3 py-2">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </Field>
            <Field label="DOB">
              <input type="date" value={form.dob || ''} onChange={(e)=>setForm({...form, dob: e.target.value})} className="w-full border rounded px-3 py-2" />
            </Field>
            <Field label="Joining Date">
              <input type="date" value={form.joining_date || ''} onChange={(e)=>setForm({...form, joining_date: e.target.value})} className="w-full border rounded px-3 py-2" />
            </Field>
            <Field label="Experience (years)">
              <input type="number" value={form.experience_years || ''} onChange={(e)=>setForm({...form, experience_years: e.target.value})} className="w-full border rounded px-3 py-2" />
            </Field>
            <Field label="Salary">
              <input type="number" value={form.salary || ''} onChange={(e)=>setForm({...form, salary: e.target.value})} className="w-full border rounded px-3 py-2" />
            </Field>
            <Field label="Emergency Contact">
              <input type="text" value={form.emergency_contact || ''} onChange={(e)=>setForm({...form, emergency_contact: e.target.value})} className="w-full border rounded px-3 py-2" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Qualification">
                <input type="text" value={form.qualification || ''} onChange={(e)=>setForm({...form, qualification: e.target.value})} className="w-full border rounded px-3 py-2" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Address">
                <textarea rows={2} value={form.address || ''} onChange={(e)=>setForm({...form, address: e.target.value})} className="w-full border rounded px-3 py-2" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Profile Image (upload)">
                <input type="file" accept="image/*" onChange={(e)=>onFileChange(e.target.files?.[0] || null)} className="w-full" />
                {uploading && <div className="text-xs text-gray-500 mt-1">Uploading...</div>}
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Bio">
                <textarea rows={3} value={form.bio || ''} onChange={(e)=>setForm({...form, bio: e.target.value})} className="w-full border rounded px-3 py-2" />
              </Field>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      {children}
    </label>
  );
}
