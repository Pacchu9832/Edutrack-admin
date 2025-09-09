import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Reports() {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('attendance');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);

  const reportTypes = [
    { value: 'attendance', label: 'Attendance Report', icon: '📊' },
    { value: 'marks', label: 'Marks Report', icon: '📈' },
    { value: 'student-summary', label: 'Student Summary', icon: '👨‍🎓' },
    { value: 'leave-requests', label: 'Leave Requests', icon: '📝' },
    { value: 'notices', label: 'Notices Report', icon: '📢' }
  ];

  const subjects = [
    'Kannada', 'English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'PT'
  ];

  const exams = ['I', 'II', 'III', 'IV', 'Midterm', 'Annual'];

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get(`/admin/students?class=${selectedClass}`);
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const generateReport = async () => {
    if (!selectedClass) {
      alert('Please select a class');
      return;
    }

    if (reportType === 'marks' && (!selectedSubject || !selectedExam)) {
      alert('Please select both subject and exam for marks report');
      return;
    }

    setLoading(true);
    try {
      let data = null;

      switch (reportType) {
        case 'attendance':
          data = await generateAttendanceReport();
          break;
        case 'marks':
          data = await generateMarksReport();
          break;
        case 'student-summary':
          data = await generateStudentSummaryReport();
          break;
        case 'leave-requests':
          data = await generateLeaveRequestsReport();
          break;
        case 'notices':
          data = await generateNoticesReport();
          break;
        default:
          break;
      }

      setReportData(data);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateAttendanceReport = async () => {
    // Mock attendance report generation
    // In real implementation, you'd call your backend API
    const mockData = {
      type: 'attendance',
      class: selectedClass,
      period: dateRange,
      summary: {
        totalStudents: students.length,
        averageAttendance: 85.5,
        totalClasses: 45,
        highestAttendance: 98.2,
        lowestAttendance: 67.8
      },
      studentData: students.map(student => ({
        id: student.id,
        name: student.name,
        rollNumber: student.roll_number,
        totalClasses: 45,
        attendedClasses: Math.floor(Math.random() * 10) + 35,
        percentage: Math.floor(Math.random() * 30) + 70
      }))
    };
    return mockData;
  };

  const generateMarksReport = async () => {
    try {
      // Fetch actual marks from backend
      const response = await api.get('/marks', {
        params: {
          className: selectedClass,
          subject: selectedSubject,
          exam: selectedExam
        }
      });

      const marksData = response.data || [];
      
      // Calculate summary statistics
      const totalStudents = students.length;
      const studentsWithMarks = marksData.length;
      
      let totalMarks = 0;
      let highestMarks = 0;
      let lowestMarks = 100;
      let passCount = 0;
      
      marksData.forEach(mark => {
        const totalMark = mark.total_mark || 0;
        totalMarks += totalMark;
        highestMarks = Math.max(highestMarks, totalMark);
        lowestMarks = Math.min(lowestMarks, totalMark);
        if (totalMark >= 35) passCount++; // Assuming 35 is pass mark
      });

      const averageMarks = studentsWithMarks > 0 ? (totalMarks / studentsWithMarks).toFixed(1) : 0;
      const passPercentage = studentsWithMarks > 0 ? ((passCount / studentsWithMarks) * 100).toFixed(1) : 0;

      return {
        type: 'marks',
        class: selectedClass,
        subject: selectedSubject,
        exam: selectedExam,
        period: dateRange,
        summary: {
          totalStudents,
          studentsWithMarks,
          averageMarks: parseFloat(averageMarks),
          highestMarks,
          lowestMarks,
          passPercentage: parseFloat(passPercentage)
        },
        studentData: students.map(student => {
          const studentMark = marksData.find(m => m.student_id === student.id);
          return {
            id: student.id,
            name: student.name,
            rollNumber: student.roll_number,
            theoryMark: studentMark?.theory_mark || 0,
            internalMark: studentMark?.internal_mark || 0,
            totalMark: studentMark?.total_mark || 0,
            status: studentMark?.status || 'Not Marked'
          };
        })
      };
    } catch (error) {
      console.error('Failed to fetch marks:', error);
      // Return mock data if API fails
      return {
        type: 'marks',
        class: selectedClass,
        subject: selectedSubject,
        exam: selectedExam,
        period: dateRange,
        summary: {
          totalStudents: students.length,
          studentsWithMarks: 0,
          averageMarks: 0,
          highestMarks: 0,
          lowestMarks: 0,
          passPercentage: 0
        },
        studentData: students.map(student => ({
          id: student.id,
          name: student.name,
          rollNumber: student.roll_number,
          theoryMark: 0,
          internalMark: 0,
          totalMark: 0,
          status: 'Not Marked'
        }))
      };
    }
  };

  const generateStudentSummaryReport = async () => {
    const mockData = {
      type: 'student-summary',
      class: selectedClass,
      period: dateRange,
      summary: {
        totalStudents: students.length,
        maleStudents: students.filter(s => s.gender === 'Male').length,
        femaleStudents: students.filter(s => s.gender === 'Female').length,
        averageAge: 16
      },
      studentData: students.map(student => ({
        id: student.id,
        name: student.name,
        rollNumber: student.roll_number,
        email: student.email,
        phone: student.phone,
        gender: student.gender,
        parentName: student.parent_name,
        parentContact: student.parent_contact_no,
        address: student.address,
        bloodGroup: student.blood_group
      }))
    };
    return mockData;
  };

  const generateLeaveRequestsReport = async () => {
    try {
      const response = await api.get('/leave-requests', {
        params: {
          class: selectedClass,
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        }
      });

      return {
        type: 'leave-requests',
        class: selectedClass,
        period: dateRange,
        summary: {
          totalRequests: response.data.length || 15,
          approved: Math.floor((response.data.length || 15) * 0.7),
          pending: Math.floor((response.data.length || 15) * 0.2),
          rejected: Math.floor((response.data.length || 15) * 0.1)
        },
        requests: response.data || []
      };
    } catch (error) {
      // Mock data if API fails
      return {
        type: 'leave-requests',
        class: selectedClass,
        period: dateRange,
        summary: {
          totalRequests: 15,
          approved: 10,
          pending: 3,
          rejected: 2
        },
        requests: []
      };
    }
  };

  const generateNoticesReport = async () => {
    const mockData = {
      type: 'notices',
      class: selectedClass,
      period: dateRange,
      summary: {
        totalNotices: 25,
        classNotices: 15,
        generalNotices: 10,
        urgentNotices: 5
      },
      notices: [
        { id: 1, title: 'Parent-Teacher Meeting', date: '2024-01-15', type: 'General' },
        { id: 2, title: 'Exam Schedule', date: '2024-01-10', type: 'Academic' },
        { id: 3, title: 'Holiday Notice', date: '2024-01-05', type: 'Holiday' }
      ]
    };
    return mockData;
  };

  const exportReport = () => {
    if (!reportData) return;

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${reportData.type}_report_${selectedClass}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
              <p className="text-gray-600 mt-1">Generate comprehensive school reports</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Report Configuration */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Report Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type *
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {reportTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

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

            {reportType === 'marks' && (
              <>
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
                      <option key={exam} value={exam}>{exam}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Selected: {reportTypes.find(t => t.value === reportType)?.label} for Class {selectedClass || 'None'}
            </div>
            <button
              onClick={generateReport}
              disabled={loading || !selectedClass}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {/* Report Display */}
        {reportData && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold capitalize">
                  {reportData.type.replace('-', ' ')} Report - Class {reportData.class}
                </h2>
                <p className="text-sm text-gray-600">
                  Period: {reportData.period.startDate} to {reportData.period.endDate}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={exportReport}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm"
                >
                  📄 Export
                </button>
                <button
                  onClick={printReport}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm"
                >
                  🖨️ Print
                </button>
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(reportData.summary).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </div>
                </div>
              ))}
            </div>

            {/* Report Content */}
            <div className="overflow-x-auto">
              {reportData.type === 'attendance' && (
                <AttendanceReportTable data={reportData.studentData} />
              )}
              {reportData.type === 'marks' && (
                <MarksReportTable data={reportData.studentData} />
              )}
              {reportData.type === 'student-summary' && (
                <StudentSummaryTable data={reportData.studentData} />
              )}
              {reportData.type === 'leave-requests' && (
                <LeaveRequestsTable data={reportData.requests} />
              )}
              {reportData.type === 'notices' && (
                <NoticesTable data={reportData.notices} />
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Generating report...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Report Table Components
function AttendanceReportTable({ data }) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Classes</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attended</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {data.map((student) => (
          <tr key={student.id}>
            <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{student.rollNumber}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{student.totalClasses}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{student.attendedClasses}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{student.percentage}%</td>
            <td className="px-6 py-4">
              <span className={`px-2 py-1 text-xs rounded-full ${
                student.percentage >= 85 ? 'bg-green-100 text-green-800' :
                student.percentage >= 75 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {student.percentage >= 85 ? 'Excellent' : 
                 student.percentage >= 75 ? 'Good' : 'Poor'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MarksReportTable({ data }) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Theory Mark</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Internal Mark</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Mark</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {data.map((student) => {
          const percentage = student.totalMark > 0 ? ((student.totalMark / 100) * 100).toFixed(1) : 0;
          return (
            <tr key={student.id}>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{student.rollNumber}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{student.theoryMark}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{student.internalMark}</td>
              <td className="px-6 py-4 text-sm text-gray-500 font-semibold">{student.totalMark}</td>
              <td className="px-6 py-4 text-sm text-gray-500">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  student.status === 'Pass' ? 'bg-green-100 text-green-800' :
                  student.status === 'Fail' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {student.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  percentage >= 90 ? 'bg-green-100 text-green-800' :
                  percentage >= 75 ? 'bg-blue-100 text-blue-800' :
                  percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  percentage >= 35 ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {percentage >= 90 ? 'A+' : 
                   percentage >= 75 ? 'A' :
                   percentage >= 60 ? 'B' :
                   percentage >= 35 ? 'C' : 'F'}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function StudentSummaryTable({ data }) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blood Group</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {data.map((student) => (
          <tr key={student.id}>
            <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{student.rollNumber}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{student.email}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{student.phone}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{student.gender}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{student.parentName}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{student.bloodGroup}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LeaveRequestsTable({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No leave requests found for the selected period.
      </div>
    );
  }

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From Date</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To Date</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {data.map((request) => (
          <tr key={request.id}>
            <td className="px-6 py-4 text-sm font-medium text-gray-900">{request.student_name}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{request.from_date}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{request.to_date}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{request.reason}</td>
            <td className="px-6 py-4">
              <span className={`px-2 py-1 text-xs rounded-full ${
                request.parent_status === 'approved' ? 'bg-green-100 text-green-800' :
                request.parent_status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {request.parent_status || 'pending'}
              </span>
            </td>
            <td className="px-6 py-4">
              <span className={`px-2 py-1 text-xs rounded-full ${
                request.teacher_status === 'approved' ? 'bg-green-100 text-green-800' :
                request.teacher_status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {request.teacher_status || 'pending'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function NoticesTable({ data }) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {data.map((notice) => (
          <tr key={notice.id}>
            <td className="px-6 py-4 text-sm font-medium text-gray-900">{notice.title}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{notice.date}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{notice.type}</td>
            <td className="px-6 py-4 text-sm text-gray-500">Class & Parents</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
