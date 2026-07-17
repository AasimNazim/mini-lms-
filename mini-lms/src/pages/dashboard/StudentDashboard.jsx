import React, { useState } from 'react';
import { PlayCircle, Clock, CheckCircle2, Search, BookOpen, FileText, Award, Upload, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentDashboard() {
  const { courses, enrollments, enrollCourse, assignments, submissions, submitAssignment, attendance } = useData();
  const { currentUser } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [uploadFiles, setUploadFiles] = useState({});
  const [justSubmitted, setJustSubmitted] = useState({});
  const [isUploading, setIsUploading] = useState({});
  const [uploadError, setUploadError] = useState('');

  const myEnrollments = enrollments.filter(e => e.userId === currentUser.uid);
  const enrolledCourseIds = myEnrollments.map(e => e.courseId);
  
  const enrolledCourses = courses.filter(c => enrolledCourseIds.includes(c.id));
  
  // Available courses are those published and not yet enrolled
  const availableCourses = courses.filter(c => 
    c.status === 'Published' && 
    !enrolledCourseIds.includes(c.id) &&
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedCount = myEnrollments.filter(e => e.progress === 100).length;

  const totalMinutesLearned = myEnrollments.reduce((acc, enrollment) => {
    const course = courses.find(c => c.id === enrollment.courseId);
    let minutes = 0;
    if (course?.modules && enrollment.completedLessons) {
      course.modules.forEach(m => {
        m.lessons.forEach(l => {
          if (enrollment.completedLessons.includes(l.id)) {
            minutes += (l.durationMinutes || 0);
          }
        });
      });
    }
    return acc + minutes;
  }, 0);
  
  const hoursLearned = Math.round((totalMinutesLearned / 60) * 10) / 10;

  
  const myAttendance = attendance ? attendance.filter(a => a.studentId === currentUser.uid) : [];
  const presentCount = myAttendance.filter(a => a.status === 'Present').length;
  const totalAttDays = myAttendance.length;
  const attPercentage = totalAttDays === 0 ? 100 : Math.round((presentCount / totalAttDays) * 100);

  const myAssignments = assignments.filter(a => enrolledCourseIds.includes(a.courseId));
  const mySubmissions = submissions.filter(s => s.studentId === currentUser.uid);

  const handleFileUpload = async (assignmentId, courseId) => {
    const file = uploadFiles[assignmentId];
    if (!file) return;
    
    setIsUploading(prev => ({ ...prev, [assignmentId]: true }));
    setUploadError('');
    
    try {
      const res = await submitAssignment({
        assignmentId,
        studentId: currentUser.uid,
        courseId,
        fileName: file.name
      }, file);
      if (res) setJustSubmitted(prev => ({ ...prev, [assignmentId]: res }));
    } catch (error) {
      console.error('Failed to submit assignment:', error);
      setUploadError(error.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setIsUploading(prev => ({ ...prev, [assignmentId]: false }));
      setUploadFiles((prev) => ({ ...prev, [assignmentId]: null }));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">My Learning</h2>
        <p className="text-slate-500">Welcome back! Continue where you left off.</p>
      </div>

      <div className="flex border-b border-slate-200 gap-6">
        {['Overview', 'Assignments', 'Grades'].map(tab => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
              <div className="p-4 bg-primary-50 rounded-xl text-primary-600">
                <PlayCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{enrolledCourses.length}</h3>
                <p className="text-slate-500 text-sm">Enrolled Courses</p>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
              <div className="p-4 bg-green-50 rounded-xl text-green-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{completedCount}</h3>
                <p className="text-slate-500 text-sm">Completed Courses</p>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
              <div className="p-4 bg-purple-50 rounded-xl text-purple-600">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{attPercentage}%</h3>
                <p className="text-slate-500 text-sm">Attendance ({presentCount}/{totalAttDays})</p>
              </div>
            </div>

          </div>

          {enrolledCourses.length > 0 && (
            <>
              <h3 className="text-xl font-semibold text-slate-900 mt-8 mb-4">In Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map(course => {
                  const enrollment = myEnrollments.find(e => e.courseId === course.id);
                  return (
                    <div key={course.id} className="glass-panel rounded-2xl overflow-hidden group hover:border-primary-500/30 transition-all duration-300">
                      <div className="h-32 bg-slate-200 relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-slate-100"></div>
                        <BookOpen className="w-12 h-12 text-primary-500/40 relative z-10" />
                      </div>
                      <div className="p-6">
                        <h4 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors">{course.title}</h4>
                        <p className="text-sm text-slate-500 mb-4">By {course.instructorName}</p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Progress</span>
                            <span className="text-slate-900 font-medium">{enrollment.progress}%</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${enrollment.progress || 0}%` }}
                            ></div>
                          </div>
                          
                          <Link 
                            to={`/dashboard/course/${course.id}`}
                            className="mt-4 block w-full text-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium text-sm"
                          >
                            Continue Learning
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <hr className="border-slate-200 my-8" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h3 className="text-xl font-semibold text-slate-900">Available Courses</h3>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search courses..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-primary-500 outline-none w-full md:w-64"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCourses.length === 0 ? (
              <p className="text-slate-500 col-span-full">No new courses available to enroll right now.</p>
            ) : availableCourses.map(course => (
              <div key={course.id} className="glass-panel rounded-2xl overflow-hidden group hover:border-primary-500/30 transition-all duration-300 flex flex-col">
                <div className="p-6 flex-1">
                  <h4 className="text-lg font-bold text-slate-900 mb-1">{course.title}</h4>
                  <p className="text-xs text-primary-600 mb-3">By {course.instructorName}</p>
                  <p className="text-sm text-slate-500 line-clamp-2">{course.description}</p>
                </div>
                <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50/50">
                  <div className="text-sm text-slate-500">{course.students} students</div>
                  <button 
                    onClick={() => enrollCourse(currentUser.uid, course.id)}
                    className="px-4 py-1.5 bg-primary-50 hover:bg-primary-600 text-primary-600 hover:text-white rounded-lg transition-colors text-sm font-medium border border-primary-500/30 hover:border-transparent"
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Assignments' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              <h3 className="text-xl font-semibold text-slate-900">Course Assignments</h3>
            </div>
            <div className="p-6 grid gap-6">
              {uploadError && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm mb-2 border border-red-200">
                  {uploadError}
                </div>
              )}
              {myAssignments.length === 0 ? (
                <p className="text-slate-500">No assignments available yet.</p>
              ) : myAssignments.map(assignment => {
                const course = courses.find(c => c.id === assignment.courseId);
                const submission = mySubmissions.find(s => s.assignmentId === assignment.id) || justSubmitted[assignment.id];
                return (
                  <div key={assignment.id} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">{assignment.title}</h4>
                        <p className="text-xs text-primary-600">{course?.title}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        submission?.status === 'Graded' ? 'bg-green-50 text-green-700' :
                        submission?.status === 'Submitted' ? 'bg-blue-50 text-blue-700' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>
                        {submission ? submission.status : 'Pending'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">{assignment.description}</p>
                    
                    {!submission ? (
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                        <input
                          type="file"
                          onChange={(e) => setUploadFiles((prev) => ({ ...prev, [assignment.id]: e.target.files[0] || null }))}
                          className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        />
                        <button 
                          onClick={() => handleFileUpload(assignment.id, assignment.courseId)}
                          disabled={!uploadFiles[assignment.id] || isUploading[assignment.id]}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                        >
                          {isUploading[assignment.id] ? (
                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Uploading...</>
                          ) : (
                            <><Upload className="w-4 h-4" /> Upload</>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500">
                        <FileText className="w-4 h-4" />
                        <span>Submitted File: </span>
                        {submission.fileUrl ? (
                          <a 
                            href={submission.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary-600 hover:text-primary-700 hover:underline font-medium"
                            download={submission.fileName}
                          >
                            {submission.fileName}
                          </a>
                        ) : (
                          <span>{submission.fileName}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Grades' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <h3 className="text-xl font-semibold text-slate-900">My Grades</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">Assignment</th>
                    <th className="px-6 py-4 font-medium">Course</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Marks</th>
                    <th className="px-6 py-4 font-medium">Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {mySubmissions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No submissions yet.</td>
                    </tr>
                  ) : mySubmissions.map(submission => {
                    const assignment = assignments.find(a => a.id === submission.assignmentId);
                    const course = courses.find(c => c.id === submission.courseId);
                    return (
                      <tr key={submission.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-900">{assignment?.title || 'Unknown Assignment'}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{course?.title || 'Unknown Course'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            submission.status === 'Graded' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {submission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                            submission.marks >= 80 ? 'bg-green-100 text-green-700' :
                            submission.marks >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            submission.marks !== null ? 'bg-red-100 text-red-700' : 'text-slate-900'
                          }`}>
                            {submission.marks !== null ? submission.marks : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {submission.feedback || '-'}
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
    </div>
  );
}
