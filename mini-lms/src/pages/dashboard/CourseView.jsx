import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { PlayCircle, FileText, CheckCircle, ChevronLeft } from 'lucide-react';

export default function CourseView() {
  const { id } = useParams();
  const { courses, enrollments, markLessonCompleted } = useData();
  const { currentUser } = useAuth();
  
  const [activeLesson, setActiveLesson] = useState(null);

  const course = courses.find(c => c.id === id);
  const enrollment = enrollments.find(e => e.courseId === id && e.userId === currentUser.uid);

  useEffect(() => {
    // Select first lesson by default if none selected
    if (course?.modules?.length > 0 && !activeLesson) {
      const firstModule = course.modules[0];
      if (firstModule.lessons.length > 0) {
        setActiveLesson(firstModule.lessons[0]);
      }
    }
  }, [course, activeLesson]);

  if (!course || !enrollment) {
    return <div className="p-8">Course not found or you are not enrolled.</div>;
  }

  const handleComplete = () => {
    if (activeLesson) {
      markLessonCompleted(enrollment.id, activeLesson.id);
    }
  };

  const isLessonCompleted = (lessonId) => {
    return enrollment.completedLessons?.includes(lessonId);
  };

const getEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1];
      const ampersandPosition = videoId.indexOf('&');
      if (ampersandPosition !== -1) {
        videoId = videoId.substring(0, ampersandPosition);
      }
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1];
    } else if (url.includes('youtube.com/embed/')) {
      return url;
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative -m-8">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 px-8 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <h2 className="text-xl font-bold text-slate-900">{course.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-slate-500">Progress:</div>
          <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${enrollment.progress || 0}%` }}
            ></div>
          </div>
          <span className="text-sm font-bold text-primary-600">{enrollment.progress || 0}%</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Curriculum */}
        <div className="w-80 bg-white border-r border-slate-200 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Course Content</h3>
            
            {course.modules?.length === 0 ? (
              <p className="text-slate-500 text-sm">No modules available yet.</p>
            ) : (
              <div className="space-y-4">
                {course.modules?.map((module, mIdx) => (
                  <div key={module.id} className="space-y-2">
                    <h4 className="font-semibold text-slate-900 text-sm">Section {mIdx + 1}: {module.title}</h4>
                    <div className="space-y-1 pl-2 border-l-2 border-slate-100">
                      {module.lessons.map(lesson => {
                        const completed = isLessonCompleted(lesson.id);
                        const isActive = activeLesson?.id === lesson.id;
                        
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setActiveLesson(lesson)}
                            className={`w-full text-left px-3 py-2.5 flex items-start gap-3 rounded-lg transition-colors ${
                              isActive ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <div className="mt-0.5">
                              {completed ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : lesson.type === 'video' ? (
                                <PlayCircle className={`w-4 h-4 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                              ) : (
                                <FileText className={`w-4 h-4 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'} line-clamp-2`}>
                                {lesson.title}
                              </p>

                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Video/Reading */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {activeLesson ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Embedded Content */}
                {activeLesson.type === 'video' ? (
                  <div className="aspect-video w-full bg-slate-900">
                    <iframe 
                      className="w-full h-full"
                      src={getEmbedUrl(activeLesson.content)}
                      title={activeLesson.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="p-12 min-h-[400px] flex items-center justify-center bg-slate-50 border-b border-slate-100">
                    <div className="prose max-w-none text-slate-700 text-center md:text-left">
                      {/* If it's not a video, show the content text (reading module) */}
                      <div className="text-lg leading-relaxed whitespace-pre-wrap">
                        {activeLesson.content || 'Content will be displayed here.'}
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">{activeLesson.title}</h1>
                    <p className="text-slate-500 mt-1">Please ensure you complete the lesson entirely before marking as done.</p>
                  </div>
                  <button 
                    onClick={handleComplete}
                    disabled={isLessonCompleted(activeLesson.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                      isLessonCompleted(activeLesson.id) 
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-primary-600/20'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    {isLessonCompleted(activeLesson.id) ? 'Completed' : 'Mark as Completed'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <PlayCircle className="w-16 h-16 text-slate-300 mb-4" />
              <p>Select a lesson from the curriculum to start learning.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
