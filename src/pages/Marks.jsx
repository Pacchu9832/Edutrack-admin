import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Marks() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('entry'); // entry | view | analytics
  const [showModal, setShowModal] = useState(false);
  const [editingMark, setEditingMark] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [marksPerPage] = useState(10);

  const [markForm, setMarkForm] = useState({
    student_id: '',
    theory_mark: '',
    internal_mark: '',
    total_mark: '',
    grade: '',
    status: 'Pass'
  });

  const subjects = [
    'Kannada', 'English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'PT'
  ];

  const exams = [
    { value: 'I Internal Exam', label: 'I Internal Exam' },
    { value: 'II Internal Exam', label: 'II Internal Exam' },
    { value: 'Midterm Exam', label: 'Midterm Exam' },
    { value: 'III Internal Exam', label: 'III Internal Exam' },
    { value: 'IV Internal Exam', label: 'IV Internal Exam' },
    { value: 'Annual Exam ', label: 'Annual Exam' }
  ];

  const gradeScale = [
    { min: 90, max: 100, grade: 'A+', status: 'Excellent' },
    { min: 80, max: 89, grade: 'A', status: 'Very Good' },
    { min: 70, max: 79, grade: 'B+', status: 'Good' },
    { min: 60, max: 69, grade: 'B', status: 'Above Average' },
    { min: 50, max: 59, grade: 'C', status: 'Average' },
    { min: 40, max: 49, grade: 'D', status: 'Below Average' },
    { min: 0, max: 39, grade: 'F', status: 'Fail' }
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
    if (selectedClass && selectedSubject && selectedExam) {
      fetchMarks();
    }
  }, [selectedClass, selectedSubject, selectedExam]);

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
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine if exam is internal (for internal exams, only total mark is entered)
  const isInternalExam = (exam) => {
    return ['I Internal Exam', 'II Internal Exam', 'III Internal Exam', 'IV Internal Exam'].includes(exam);
  };

  // Helper function to determine if exam requires theory + internal marks (Midterm and Annual)
  const isMajorExam = (exam) => {
    return ['Midterm Exam', 'Annual Exam '].includes(exam);
  };

  const fetchMarks = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/marks', {
        params: {
          className: selectedClass,
          subject: selectedSubject,
          exam: selectedExam
        }
      });
      
      // Transform backend data to match frontend format
      const transformedMarks = response.data.map(mark => ({
        id: mark.id,
        student_id: mark.student_id,
        student_name: mark.student_name || `Student ${mark.student_id}`,
        roll_number: mark.roll_number || mark.student_id,
        class: mark.class_name,
        subject: mark.subject,
        exam: mark.exam,
        theory_mark: mark.theory_mark || 0,
        internal_mark: mark.internal_mark || 0,
        total_mark: mark.total_mark || 0,
        grade: calculateGrade(mark.total_mark || 0),
        status: mark.status || 'Fail',
        created_at: mark.created_at
      }));
      
      setMarks(transformedMarks);
    } catch (error) {
      console.error('Failed to fetch marks:', error);
      setMarks([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrade = (totalMarks) => {
    const grade = gradeScale.find(g => totalMarks >= g.min && totalMarks <= g.max);
    return grade ? grade.grade : 'F';
  };

  const openModal = (mark = null) => {
    if (mark) {
      setEditingMark(mark);
      setMarkForm({
        student_id: mark.student_id,
        theory_mark: mark.theory_mark,
        internal_mark: mark.internal_mark,
        total_mark: mark.total_mark,
        grade: mark.grade,
        status: mark.status
      });
    } else {
      setEditingMark(null);
      setMarkForm({
        student_id: '',
        theory_mark: '',
        internal_mark: '',
        total_mark: '',
        grade: '',
        status: 'Pass'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMark(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedClass || !selectedSubject || !selectedExam) {
      alert('Please select class, subject, and exam first.');
      return;
    }
    
    try {
      setSaving(true);
      const theoryMark = Number(markForm.theory_mark) || 0;
      const internalMark = Number(markForm.internal_mark) || 0;
      
      // Calculate total marks based on exam type (matching Flutter app logic)
      let totalMark;
      
      if (isMajorExam(selectedExam)) {
        // For Midterm and Annual exams: theory + internal marks
        totalMark = theoryMark + internalMark;
      } else {
        // For internal exams: only total mark is entered directly
        totalMark = theoryMark; // In this case, theory_mark field stores the total mark
      }
      
      const markData = {
        className: selectedClass,
        subject: selectedSubject,
        exam: selectedExam,
        marksList: [{
          studentId: Number(markForm.student_id),
          theoryMark: isMajorExam(selectedExam) ? theoryMark : null,
          internalMark: isMajorExam(selectedExam) ? internalMark : null,
          totalMark: totalMark,
          status: totalMark >= (isMajorExam(selectedExam) ? 35 : 9) ? 'Pass' : 'Fail'
        }],
        teacherId: null // You can add user context here
      };

      // Use the backend API
      await api.post('/marks/upsert', markData);
      alert(editingMark ? 'Mark updated successfully!' : 'Mark created successfully!');

      fetchMarks();
      closeModal();
    } catch (error) {
      console.error('Failed to save mark:', error);
      alert('Failed to save mark. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (markId) => {
    if (!window.confirm('Are you sure you want to delete this mark?')) return;

    try {
      const markToDelete = marks.find(mark => mark.id === markId);
      if (!markToDelete) return;

      // Use the backend API
      await api.delete('/marks', {
        params: {
          className: markToDelete.class,
          subject: markToDelete.subject,
          exam: markToDelete.exam,
          studentId: markToDelete.student_id
        }
      });
      
      alert('Mark deleted successfully!');
      
      // Refresh marks from database
      fetchMarks();
    } catch (error) {
      console.error('Failed to delete mark:', error);
      alert('Failed to delete mark. Please try again.');
    }
  };

  const exportToCSV = () => {
    const isMajor = isMajorExam(selectedExam);
    const headers = isMajor 
      ? ['Student Name', 'Student ID', 'Roll Number', 'Class', 'Subject', 'Exam', 'Theory Mark', 'Internal Mark', 'Total Mark', 'Grade', 'Status']
      : ['Student Name', 'Student ID', 'Roll Number', 'Class', 'Subject', 'Exam', 'Total Mark', 'Grade', 'Status'];
    
    const csvContent = [
      headers.join(','),
      ...marks.map(mark => {
        const row = [
          mark.student_name,
          mark.student_id,
          mark.roll_number || '',
          mark.class,
          mark.subject,
          mark.exam
        ];
        
        if (isMajor) {
          row.push(mark.theory_mark, mark.internal_mark);
        }
        
        row.push(mark.total_mark, mark.grade, mark.status);
        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks_${selectedClass}_${selectedSubject}_${selectedExam}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const printMarks = () => {
    const currentStats = getMarksStats();
    const isMajor = isMajorExam(selectedExam);
    
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Marks Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-item { text-align: center; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Marks Report</h1>
            <div class="info">
              <p><strong>Class:</strong> ${selectedClass} | <strong>Subject:</strong> ${selectedSubject} | <strong>Exam:</strong> ${selectedExam}</p>
              <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Max Marks:</strong> ${isMajor ? '100' : '25'} | <strong>Pass Marks:</strong> ${isMajor ? '35' : '9'}</p>
            </div>
          </div>
          
          <div class="stats">
            <div class="stat-item">
              <h3>${currentStats.total}</h3>
              <p>Total Students</p>
            </div>
            <div class="stat-item">
              <h3>${currentStats.passed}</h3>
              <p>Passed</p>
            </div>
            <div class="stat-item">
              <h3>${currentStats.failed}</h3>
              <p>Failed</p>
            </div>
            <div class="stat-item">
              <h3>${currentStats.avgMarks}%</h3>
              <p>Average</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll No</th>
                ${isMajor ? '<th>Theory Mark</th><th>Internal Mark</th>' : '<th>Obtained Mark</th>'}
                <th>Total Mark</th>
                <th>Grade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${marks.map(mark => `
                <tr>
                  <td>${mark.student_name}</td>
                  <td>${mark.roll_number || mark.student_id}</td>
                  ${isMajor ? `<td>${mark.theory_mark}</td><td>${mark.internal_mark}</td>` : `<td>${mark.total_mark}</td>`}
                  <td>${mark.total_mark}</td>
                  <td>${mark.grade}</td>
                  <td>${mark.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Pagination
  const indexOfLastMark = currentPage * marksPerPage;
  const indexOfFirstMark = indexOfLastMark - marksPerPage;
  const currentMarks = marks.slice(indexOfFirstMark, indexOfLastMark);
  const totalPages = Math.ceil(marks.length / marksPerPage);

  const getMarksStats = () => {
    const total = marks.length;
    const passed = marks.filter(m => m.status === 'Pass').length;
    const failed = marks.filter(m => m.status === 'Fail').length;
    const avgMarks = total > 0 ? Math.round(marks.reduce((sum, m) => sum + m.total_mark, 0) / total) : 0;
    
    return { total, passed, failed, avgMarks };
  };

  const stats = getMarksStats();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Marks Management</h1>
              <p className="text-gray-600 mt-1">Manage and track student academic performance</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                ← Back to Dashboard
              </button>
              {marks.length > 0 && (
                <>
                  <button
                    onClick={exportToCSV}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <span>📊</span>
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={printMarks}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <span>🖨️</span>
                    <span>Print</span>
                  </button>
                </>
              )}
              <button
                onClick={() => openModal()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Add Marks</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Entries</p>
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
                <p className="text-sm text-gray-600">Passed</p>
                <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                <span className="text-2xl">❌</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <span className="text-2xl">📈</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Average</p>
                <p className="text-2xl font-bold text-purple-600">{stats.avgMarks}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-1 mb-6 flex">
          <button
            onClick={() => setActiveTab('entry')}
            className={`px-4 py-2 text-sm font-medium rounded-md flex-1 ${
              activeTab === 'entry'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Marks Entry
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`px-4 py-2 text-sm font-medium rounded-md flex-1 ${
              activeTab === 'view'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            View Marks
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-sm font-medium rounded-md flex-1 ${
              activeTab === 'analytics'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Filter Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam *
              </label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Exam</option>
                {exams.map(exam => (
                  <option key={exam.value} value={exam.value}>{exam.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'entry' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Marks Entry</h2>
            {selectedClass && selectedSubject && selectedExam ? (
              <div>
                <p className="text-gray-600 mb-4">
                  Entering marks for <strong>{selectedSubject}</strong> - <strong>{selectedExam}</strong> - <strong>Class {selectedClass}</strong>
                </p>
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for Marks Entry</h3>
                  <p className="text-gray-600 mb-4">Click "Add Marks" to start entering student marks for this selection.</p>
                  <button
                    onClick={() => openModal()}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                  >
                    Add Marks
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select Class, Subject & Exam</h3>
                <p className="text-gray-600">Please select all required filters above to start entering marks.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'view' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Marks Records</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject & Exam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isMajorExam(selectedExam) ? 'Theory Mark' : 'Total Mark'}
                    </th>
                    {isMajorExam(selectedExam) && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Internal Mark
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentMarks.map((mark) => (
                    <tr key={mark.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{mark.student_name}</div>
                          <div className="text-sm text-gray-500">Roll: {mark.roll_number} | Class: {mark.class}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{mark.subject}</div>
                        <div className="text-sm text-gray-500">{mark.exam}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {isMajorExam(selectedExam) ? mark.theory_mark : mark.total_mark}
                      </td>
                      {isMajorExam(selectedExam) && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {mark.internal_mark}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {mark.total_mark}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          mark.grade === 'A+' || mark.grade === 'A' ? 'bg-green-100 text-green-800' :
                          mark.grade === 'B+' || mark.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                          mark.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                          mark.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {mark.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          mark.status === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {mark.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openModal(mark)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(mark.id)}
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
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Grade Distribution</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gradeScale.map(grade => {
                  const count = marks.filter(m => m.grade === grade.grade).length;
                  const percentage = marks.length > 0 ? Math.round((count / marks.length) * 100) : 0;
                  
                  return (
                    <div key={grade.grade} className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-gray-800">{count}</div>
                      <div className="text-sm text-gray-600">Grade {grade.grade}</div>
                      <div className="text-xs text-gray-500">{percentage}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Subject Performance</h2>
              <div className="space-y-4">
                {subjects.map(subject => {
                  const subjectMarks = marks.filter(m => m.subject === subject);
                  const avgMark = subjectMarks.length > 0 
                    ? Math.round(subjectMarks.reduce((sum, m) => sum + m.total_mark, 0) / subjectMarks.length)
                    : 0;
                  
                  return (
                    <div key={subject} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{subject}</div>
                        <div className="text-sm text-gray-500">{subjectMarks.length} entries</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-800">{avgMark}%</div>
                        <div className="text-sm text-gray-500">Average</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Mark Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">
                    {editingMark ? 'Edit Mark' : 'Add New Mark'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student ID *
                    </label>
                    <input
                      type="number"
                      required
                      value={markForm.student_id}
                      onChange={(e) => setMarkForm({...markForm, student_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter student ID"
                    />
                  </div>

                  {isMajorExam(selectedExam) ? (
                    <div className="grid gap-3 grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Theory Mark *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="80"
                          required
                          value={markForm.theory_mark}
                          onChange={(e) => setMarkForm({...markForm, theory_mark: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0-80"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Internal Mark *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          required
                          value={markForm.internal_mark}
                          onChange={(e) => setMarkForm({...markForm, internal_mark: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0-20"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Mark *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="25"
                        required
                        value={markForm.theory_mark}
                        onChange={(e) => setMarkForm({...markForm, theory_mark: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0-25"
                      />
                    </div>
                  )}

                  {/* Display calculated total mark */}
                  {(markForm.theory_mark || markForm.internal_mark) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <div className="text-sm text-gray-600">
                        <strong>Calculated Total Mark:</strong> {
                          isMajorExam(selectedExam) 
                            ? Number(markForm.theory_mark || 0) + Number(markForm.internal_mark || 0)
                            : Number(markForm.theory_mark || 0)
                        }
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {isMajorExam(selectedExam) 
                          ? 'Sum of Theory and Internal marks (Max: 100, Pass: 35)'
                          : 'Total mark for internal exam (Max: 25, Pass: 9)'
                        }
                      </div>
                    </div>
                  )}

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
                      disabled={saving}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : (editingMark ? 'Update Mark' : 'Add Mark')}
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
            <span className="ml-2 text-gray-600">Loading marks...</span>
          </div>
        )}
      </div>
    </div>
  );
}


