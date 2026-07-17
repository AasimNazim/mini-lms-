import React, { useState, useEffect } from 'react';
import { Users, PlusCircle, BookOpen, Star, Edit, Trash2, X, FileText, CheckCircle, Calendar } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function InstructorDashboard() {
  const { currentUser } = useAuth();
  const { 
    courses, addCourse, updateCourse, deleteCourse, 
    assignments, addAssignment, 
    submissions, gradeSubmission,
    enrollments, users,
    attendance, markAttendance
  } = useData();
  
  const myCourses = courses.filter(c => c.instructorId === currentUser.uid);
  
  const totalStudents = myCourses.reduce((acc, curr) => acc + curr.students, 0);
  const avgRating = myCourses.length ? (myCourses.reduce((acc, curr) => acc + curr.rating, 0) / myCourses.length).toFixed(1) : 0;

  const attendanceCourseIds = myCourses.map(c => c.id);
  const myAttendance = attendance ? attendance.filter(a => attendanceCourseIds.includes(a.courseId)) : [];
  const presentCount = myAttendance.filter(a => a.status === 'Present').length;
  const attPercentage = myAttendance.length === 0 ? 100 : Math.round((presentCount / myAttendance.length) * 100);

  const [activeTab, setActiveTab] = useState('Overview');

  // Course Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', status: 'Draft', modules: [] });

  // Assignment Modal State
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentData, setAssignmentData] = useState({ courseId: '', title: '', description: '' });

  // Grade Modal State
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeData, setGradeData] = useState({ marks: '', feedback: '' });

  // Attendance State
  const [attCourseId, setAttCourseId] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attRecords, setAttRecords] = useState({});

  useEffect(() => {
    if (attCourseId && attDate) {
      const existingRecords = attendance.filter(a => a.courseId === attCourseId && a.date === attDate);
      const newAttRecords = {};
      
      const enrolledStudents = enrollments.filter(e => e.courseId === attCourseId).map(e => {
        return users.find(u => u.id === e.userId);
      }).filter(Boolean);

      enrolledStudents.forEach(student => {
        const record = existingRecords.find(r => r.studentId === student.id);
        newAttRecords[student.id] = record ? record.status : 'Present'; // Default to Present
      });
      setAttRecords(newAttRecords);
    } else {
      setAttRecords({});
    }
  }, [attCourseId, attDate, attendance, enrollments, users]);

  // Handlers
  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', status: 'Draft', modules: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditingId(course.id);
    setFormData({ title: course.title, description: course.description, status: course.status, modules: course.modules || [] });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateCourse(editingId, formData);
    } else {
      addCourse({
        ...formData,
        instructorId: currentUser.uid,
        instructorName: currentUser.email.split('@')[0]
      });
    }
    setIsModalOpen(false);
  };

  const handleAssignmentSubmit = (e) => {
    e.preventDefault();
    addAssignment(assignmentData);
    setIsAssignmentModalOpen(false);
    setAssignmentData({ courseId: '', title: '', description: '' });
  };

  const handleGradeSubmit = (e) => {
    e.preventDefault();
    gradeSubmission(gradingSubmission.id, gradeData.marks, gradeData.feedback);
    setGradingSubmission(null);
    setGradeData({ marks: '', feedback: '' });
  };

  const saveAttendance = () => {
    const recordsToSave = Object.keys(attRecords).map(studentId => ({
      studentId,
      status: attRecords[studentId]
    }));
    markAttendance(attCourseId, attDate, recordsToSave);
    alert('Attendance saved successfully!');
  };

  // Filter lists for tabs
  const myCourseIds = myCourses.map(c => c.id);
  const myAssignments = assignments.filter(a => myCourseIds.includes(a.courseId));
  const mySubmissions = submissions.filter(s => myCourseIds.includes(s.courseId));

  const enrolledStudentsForAtt = attCourseId 
    ? enrollments.filter(e => e.courseId === attCourseId).map(e => users.find(u => u.id === e.userId)).filter(Boolean)
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Instructor Dashboard</h2>
          <p className="text-slate-500">Manage your courses, assignments, and students.</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 gap-6">
        {['Overview', 'Assignments & Marks', 'Attendance'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === tab ? 'text-primary-600' : 'text-slate-500 hover:text-slate-900'}`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-t-full"></span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex justify-end">
            <button 
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <PlusCircle className="w-5 h-5" />
              Create Course
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-5 h-5 text-primary-600" />
                <span className="text-slate-500 font-medium">Total Courses</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-900">{myCourses.length}</h3>
            </div>
            <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-slate-500 font-medium">Total Students</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-900">{totalStudents}</h3>
            </div>

          </div>

          <div className="glass-panel p-6 rounded-2xl mb-8 flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Enrollment Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={myCourses.map(c => ({ name: c.title, value: c.students }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {myCourses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">My Courses</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">Course Title</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Students</th>
                    <th className="px-6 py-4 font-medium">Rating</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {myCourses.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No courses found. Create one!</td>
                    </tr>
                  ) : myCourses.map(course => (
                    <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-900">{course.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.status === 'Published' ? 'bg-green-50 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                          {course.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{course.students}</td>
                      <td className="px-6 py-4 text-slate-500">
                        <div className="flex items-center gap-1">
                          {course.rating > 0 ? (
                            <>
                              <Star className="w-4 h-4 text-yellow-600 fill-current" />
                              <span>{course.rating}</span>
                            </>
                          ) : (
                            <span>-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          <button onClick={() => openEditModal(course)} className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors flex items-center gap-1">
                            <Edit className="w-4 h-4" /> Edit
                          </button>
                          <button onClick={() => deleteCourse(course.id)} className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors flex items-center gap-1">
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Assignments & Marks' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-slate-900">Assignments</h3>
            <button 
              onClick={() => setIsAssignmentModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              New Assignment
            </button>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">My Assignments</h3>
                <p className="text-sm text-slate-500">Assignments created for your courses.</p>
              </div>
              <span className="text-sm text-slate-500">{myAssignments.length} assignment{myAssignments.length === 1 ? '' : 's'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">Assignment</th>
                    <th className="px-6 py-4 font-medium">Course</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {myAssignments.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center text-slate-500">No assignments created yet.</td>
                    </tr>
                  ) : myAssignments.map(assignment => {
                    const course = courses.find(c => c.id === assignment.courseId);
                    return (
                      <tr key={assignment.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{assignment.title}</td>
                        <td className="px-6 py-4 text-slate-500">{course?.title || 'Unknown Course'}</td>
                        <td className="px-6 py-4 text-slate-500 line-clamp-1">{assignment.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Student Submissions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">Student</th>
                    <th className="px-6 py-4 font-medium">Assignment</th>
                    <th className="px-6 py-4 font-medium">Course</th>
                    <th className="px-6 py-4 font-medium">File</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {mySubmissions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No submissions found.</td>
                    </tr>
                  ) : mySubmissions.map(submission => {
                    const student = users.find(u => u.id === submission.studentId);
                    const assignment = assignments.find(a => a.id === submission.assignmentId);
                    const course = courses.find(c => c.id === submission.courseId);
                    return (
                      <tr key={submission.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-900">{student ? student.name || student.email.split('@')[0] : 'Unknown'}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{assignment ? assignment.title : 'Unknown'}</td>
                        <td className="px-6 py-4 text-slate-500">{course ? course.title : 'Unknown'}</td>
                        <td className="px-6 py-4 text-primary-600">
                          {submission.fileUrl ? (
                            <a 
                              href={submission.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="hover:underline font-medium text-primary-600"
                              download={submission.fileName}
                            >
                              {submission.fileName}
                            </a>
                          ) : (
                            <span>{submission.fileName}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            submission.status === 'Graded' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-600'
                          }`}>
                            {submission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => {
                              setGradingSubmission(submission);
                              setGradeData({ marks: submission.marks || '', feedback: submission.feedback || '' });
                            }}
                            className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors flex items-center gap-1"
                          >
                            <Edit className="w-4 h-4" /> {submission.status === 'Graded' ? 'Edit Marks' : 'Grade'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Attendance' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-500 mb-1.5">Select Course</label>
              <select
                value={attCourseId}
                onChange={(e) => setAttCourseId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-slate-900 appearance-none"
              >
                <option value="">-- Select a Course --</option>
                {myCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-500 mb-1.5">Select Date</label>
              <input
                type="date"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-slate-900"
              />
            </div>
            <button 
              onClick={saveAttendance}
              disabled={!attCourseId || enrolledStudentsForAtt.length === 0}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium text-sm h-10"
            >
              Save Attendance
            </button>
          </div>

          {attCourseId && (
            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Student List</h3>
                <span className="text-sm text-slate-500">Date: {attDate}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                    <tr>
                      <th className="px-6 py-4 font-medium">Student Name</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {enrolledStudentsForAtt.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-slate-500">No students enrolled in this course yet.</td>
                      </tr>
                    ) : enrolledStudentsForAtt.map(student => (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-900">{student.name || student.email.split('@')[0]}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{student.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-500 hover:text-slate-900">
                              <input 
                                type="radio" 
                                name={`att-${student.id}`} 
                                value="Present"
                                checked={attRecords[student.id] === 'Present'}
                                onChange={(e) => setAttRecords({...attRecords, [student.id]: e.target.value})}
                                className="accent-primary-500"
                              />
                              Present
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-500 hover:text-slate-900">
                              <input 
                                type="radio" 
                                name={`att-${student.id}`} 
                                value="Absent"
                                checked={attRecords[student.id] === 'Absent'}
                                onChange={(e) => setAttRecords({...attRecords, [student.id]: e.target.value})}
                                className="accent-red-500"
                              />
                              Absent
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-500 hover:text-slate-900">
                              <input 
                                type="radio" 
                                name={`att-${student.id}`} 
                                value="Leave"
                                checked={attRecords[student.id] === 'Leave'}
                                onChange={(e) => setAttRecords({...attRecords, [student.id]: e.target.value})}
                                className="accent-yellow-500"
                              />
                              Leave
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold text-slate-900 mb-6">{editingId ? 'Edit Course' : 'Create Course'}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1.5">Course Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1.5">Description</label>
                <textarea
                  required
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-slate-900 resize-none"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-slate-900 appearance-none"
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>

              <div className="border-t border-slate-200 pt-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-slate-500">Curriculum Modules</label>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, modules: [...(formData.modules||[]), { id: 'm'+Date.now(), title: 'New Module', lessons: [] }]})}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700"
                  >
                    + Add Module
                  </button>
                </div>
                
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                  {(formData.modules || []).map((mod, mIdx) => (
                    <div key={mod.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={mod.title}
                          onChange={(e) => {
                            const newM = [...formData.modules];
                            newM[mIdx].title = e.target.value;
                            setFormData({...formData, modules: newM});
                          }}
                          className="flex-1 px-3 py-1.5 text-sm bg-white border border-slate-300 rounded focus:border-primary-500 outline-none text-slate-900"
                          placeholder="Module Title"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const newM = [...formData.modules];
                            newM.splice(mIdx, 1);
                            setFormData({...formData, modules: newM});
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded border border-transparent"
                        ><Trash2 className="w-4 h-4"/></button>
                      </div>
                      
                      <div className="pl-4 space-y-2 border-l-2 border-slate-200">
                        {mod.lessons.map((lesson, lIdx) => (
                          <div key={lesson.id} className="flex flex-col gap-2 bg-white p-3 rounded border border-slate-200">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={lesson.title}
                                onChange={(e) => {
                                  const newM = [...formData.modules];
                                  newM[mIdx].lessons[lIdx].title = e.target.value;
                                  setFormData({...formData, modules: newM});
                                }}
                                className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded focus:border-primary-500 outline-none text-slate-900"
                                placeholder="Lesson Title"
                              />
                              <select 
                                value={lesson.type}
                                onChange={(e) => {
                                  const newM = [...formData.modules];
                                  newM[mIdx].lessons[lIdx].type = e.target.value;
                                  setFormData({...formData, modules: newM});
                                }}
                                className="px-2 py-1 text-xs border border-slate-300 rounded text-slate-700 outline-none"
                              >
                                <option value="video">Video</option>
                                <option value="reading">Reading</option>
                              </select>
                              <button 
                                type="button"
                                onClick={() => {
                                  const newM = [...formData.modules];
                                  newM[mIdx].lessons.splice(lIdx, 1);
                                  setFormData({...formData, modules: newM});
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                              ><X className="w-3 h-3"/></button>
                            </div>
                            <input
                              type="text"
                              value={lesson.content}
                              onChange={(e) => {
                                const newM = [...formData.modules];
                                newM[mIdx].lessons[lIdx].content = e.target.value;
                                setFormData({...formData, modules: newM});
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:border-primary-500 outline-none text-slate-900"
                              placeholder={lesson.type === 'video' ? 'YouTube Embed URL (e.g. https://www.youtube.com/embed/...)' : 'Reading Content'}
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newM = [...formData.modules];
                            newM[mIdx].lessons.push({ id: 'l'+Date.now(), title: 'New Lesson', type: 'video', content: '', durationMinutes: 10 });
                            setFormData({...formData, modules: newM});
                          }}
                          className="text-xs font-medium text-primary-600 hover:text-primary-700 mt-2 block"
                        >+ Add Lesson</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                  {editingId ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 relative">
            <button 
              onClick={() => setIsAssignmentModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Create Assignment</h3>
            
            <form onSubmit={handleAssignmentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1.5">Select Course</label>
                <select
                  required
                  value={assignmentData.courseId}
                  onChange={(e) => setAssignmentData({...assignmentData, courseId: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-slate-900 appearance-none"
                >
                  <option value="">-- Select a Course --</option>
                  {myCourses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1.5">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={assignmentData.title}
                  onChange={(e) => setAssignmentData({...assignmentData, title: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1.5">Instructions</label>
                <textarea
                  required
                  rows="3"
                  value={assignmentData.description}
                  onChange={(e) => setAssignmentData({...assignmentData, description: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-slate-900 resize-none"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsAssignmentModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 relative">
            <button 
              onClick={() => setGradingSubmission(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Grade Submission</h3>
            
            <div className="mb-4 text-sm text-slate-500">
              <p>File: <span className="text-primary-600">{gradingSubmission.fileName}</span></p>
            </div>

            <form onSubmit={handleGradeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1.5">Marks</label>
                <input
                  type="number"
                  required
                  value={gradeData.marks}
                  onChange={(e) => setGradeData({...gradeData, marks: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1.5">Feedback</label>
                <textarea
                  rows="3"
                  value={gradeData.feedback}
                  onChange={(e) => setGradeData({...gradeData, feedback: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-slate-900 resize-none"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setGradingSubmission(null)} className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                  Submit Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
