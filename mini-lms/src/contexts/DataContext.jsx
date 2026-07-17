import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, storage, isUsingPlaceholder } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [enrollments, setEnrollments] = useState([]); // Array of { userId, courseId, progress }
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [attendance, setAttendance] = useState([]);

  // Initial Data Load & Synchronization
  useEffect(() => {
    if (isUsingPlaceholder) {
      const savedCourses = JSON.parse(localStorage.getItem('mockCourses') || '[]');
      if (savedCourses.length === 0) {
        // Seed some initial courses
        const initialCourses = [
          { 
            id: 'c1', title: 'Introduction to React', description: 'Learn the basics of React.', instructorId: 'inst1', instructorName: 'Jane Doe', students: 15, rating: 4.8, status: 'Published',
            modules: [
              {
                id: 'm1',
                title: 'Getting Started',
                lessons: [
                  { id: 'l1', title: 'React Crash Course', type: 'video', content: 'https://www.youtube.com/embed/Tn6-PIqc4UM', durationMinutes: 45 },
                  { id: 'l2', title: 'Reading Materials', type: 'reading', content: 'Read the official React documentation. Focus on Components, Props, and State.', durationMinutes: 15 }
                ]
              }
            ]
          },
          { id: 'c2', title: 'Advanced Tailwind CSS', description: 'Master utility-first styling.', instructorId: 'inst1', instructorName: 'Jane Doe', students: 8, rating: 4.9, status: 'Published', modules: [] }
        ];
        localStorage.setItem('mockCourses', JSON.stringify(initialCourses));
        setCourses(initialCourses);
      } else {
        setCourses(savedCourses);
      }

      const savedUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
      setUsers(savedUsers);

      const savedEnrollments = JSON.parse(localStorage.getItem('mockEnrollments') || '[]');
      setEnrollments(savedEnrollments);

      const savedAssignments = JSON.parse(localStorage.getItem('mockAssignments') || '[]');
      setAssignments(savedAssignments);

      const savedSubmissions = JSON.parse(localStorage.getItem('mockSubmissions') || '[]');
      setSubmissions(savedSubmissions);

      const savedAttendance = JSON.parse(localStorage.getItem('mockAttendance') || '[]');
      setAttendance(savedAttendance);
      return;
    }

    // Real Firebase onSnapshot real-time synchronization
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(list);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(list);
    });

    const unsubEnrollments = onSnapshot(collection(db, 'enrollments'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEnrollments(list);
    });

    const unsubAssignments = onSnapshot(collection(db, 'assignments'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssignments(list);
    });

    const unsubSubmissions = onSnapshot(collection(db, 'submissions'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(list);
    });

    const unsubAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAttendance(list);
    });

    return () => {
      unsubCourses();
      unsubUsers();
      unsubEnrollments();
      unsubAssignments();
      unsubSubmissions();
      unsubAttendance();
    };
  }, []);

  // Listen for localStorage changes from other tabs when using placeholder data
  useEffect(() => {
    if (!isUsingPlaceholder) return;

    const storageHandler = (e) => {
      if (!e.key) return;
      try {
        if (e.key === 'mockAssignments') setAssignments(JSON.parse(e.newValue || '[]'));
        if (e.key === 'mockSubmissions') setSubmissions(JSON.parse(e.newValue || '[]'));
        if (e.key === 'mockCourses') setCourses(JSON.parse(e.newValue || '[]'));
        if (e.key === 'mockUsers') setUsers(JSON.parse(e.newValue || '[]'));
        if (e.key === 'mockEnrollments') setEnrollments(JSON.parse(e.newValue || '[]'));
        if (e.key === 'mockAttendance') setAttendance(JSON.parse(e.newValue || '[]'));
      } catch (err) {
        console.error('Error handling storage event in DataContext:', err);
      }
    };

    window.addEventListener('storage', storageHandler);
    return () => window.removeEventListener('storage', storageHandler);
  }, []);

  // --- COURSE OPERATIONS ---
  const addCourse = async (courseData) => {
    if (isUsingPlaceholder) {
      const newCourse = {
        id: 'course_' + Math.random().toString(36).substr(2, 9),
        students: 0,
        rating: 0,
        modules: [],
        ...courseData
      };
      const updatedCourses = [...courses, newCourse];
      setCourses(updatedCourses);
      localStorage.setItem('mockCourses', JSON.stringify(updatedCourses));
      return;
    }
    await addDoc(collection(db, 'courses'), {
      students: 0,
      rating: 0,
      modules: [],
      ...courseData
    });
  };

  const updateCourse = async (id, updates) => {
    if (isUsingPlaceholder) {
      const updatedCourses = courses.map(c => c.id === id ? { ...c, ...updates } : c);
      setCourses(updatedCourses);
      localStorage.setItem('mockCourses', JSON.stringify(updatedCourses));
      return;
    }
    await updateDoc(doc(db, 'courses', id), updates);
  };

  const deleteCourse = async (id) => {
    if (isUsingPlaceholder) {
      const updatedCourses = courses.filter(c => c.id !== id);
      setCourses(updatedCourses);
      localStorage.setItem('mockCourses', JSON.stringify(updatedCourses));
      
      // Also remove related enrollments
      const updatedEnrollments = enrollments.filter(e => e.courseId !== id);
      setEnrollments(updatedEnrollments);
      localStorage.setItem('mockEnrollments', JSON.stringify(updatedEnrollments));
      return;
    }
    await deleteDoc(doc(db, 'courses', id));
    
    // Also remove related enrollments
    const enrollQuery = query(collection(db, 'enrollments'), where('courseId', '==', id));
    const snapshot = await getDocs(enrollQuery);
    snapshot.forEach(async (document) => {
      await deleteDoc(doc(db, 'enrollments', document.id));
    });
  };

  // --- ENROLLMENT OPERATIONS ---
  const enrollCourse = async (userId, courseId) => {
    if (isUsingPlaceholder) {
      if (enrollments.find(e => e.userId === userId && e.courseId === courseId)) return;
      const newEnrollment = { id: 'enr_' + Math.random().toString(36).substr(2, 9), userId, courseId, progress: 0, completedLessons: [] };
      const updatedEnrollments = [...enrollments, newEnrollment];
      setEnrollments(updatedEnrollments);
      localStorage.setItem('mockEnrollments', JSON.stringify(updatedEnrollments));

      // Increment student count in course
      const course = courses.find(c => c.id === courseId);
      if (course) {
        updateCourse(courseId, { students: course.students + 1 });
      }
      return;
    }

    const existing = enrollments.find(e => e.userId === userId && e.courseId === courseId);
    if (existing) return;

    await addDoc(collection(db, 'enrollments'), {
      userId,
      courseId,
      progress: 0,
      completedLessons: []
    });

    const course = courses.find(c => c.id === courseId);
    if (course) {
      await updateDoc(doc(db, 'courses', courseId), {
        students: (course.students || 0) + 1
      });
    }
  };

  // --- USER OPERATIONS (For Admin) ---
  const updateUserRole = async (userId, newRole) => {
    if (isUsingPlaceholder) {
      const updatedUsers = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
      setUsers(updatedUsers);
      localStorage.setItem('mockUsers', JSON.stringify(updatedUsers));
      return;
    }
    await updateDoc(doc(db, 'users', userId), { role: newRole });
  };

  const updateUserProfile = async (userId, profileData, avatarFile) => {
    if (isUsingPlaceholder) {
      const updatedUsers = users.map(u => u.id === userId ? { ...u, ...profileData } : u);
      setUsers(updatedUsers);
      localStorage.setItem('mockUsers', JSON.stringify(updatedUsers));
      return;
    }

    let finalProfileData = { ...profileData };

    if (avatarFile) {
      try {
        const storageRef = ref(storage, `avatars/${userId}_${avatarFile.name}`);
        const uploadResult = await uploadBytes(storageRef, avatarFile);
        const downloadUrl = await getDownloadURL(uploadResult.ref);
        finalProfileData.avatarUrl = downloadUrl;
      } catch (err) {
        console.error("Avatar upload failed:", err);
      }
    }

    await updateDoc(doc(db, 'users', userId), finalProfileData);
  };

  const toggleUserStatus = async (userId) => {
    if (isUsingPlaceholder) {
      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          return { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' };
        }
        return u;
      });
      setUsers(updatedUsers);
      localStorage.setItem('mockUsers', JSON.stringify(updatedUsers));
      return;
    }
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newStatus = (user.status || 'Active') === 'Active' ? 'Suspended' : 'Active';
    await updateDoc(doc(db, 'users', userId), { status: newStatus });
  };

  const refreshUsers = async () => {
    if (isUsingPlaceholder) {
      const savedUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
      setUsers(savedUsers);
      return;
    }
    const snapshot = await getDocs(collection(db, 'users'));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setUsers(list);
  };

  // --- ASSIGNMENT OPERATIONS ---
  const addAssignment = async (assignmentData) => {
    if (isUsingPlaceholder) {
      const storedAssignments = JSON.parse(localStorage.getItem('mockAssignments') || '[]');
      const newAssignment = {
        id: 'ass_' + Math.random().toString(36).substr(2, 9),
        ...assignmentData,
      };
      const updatedAssignments = [...storedAssignments, newAssignment];
      setAssignments(updatedAssignments);
      localStorage.setItem('mockAssignments', JSON.stringify(updatedAssignments));
      return;
    }
    await addDoc(collection(db, 'assignments'), assignmentData);
  };

  const submitAssignment = async (submissionData, file) => {
    if (isUsingPlaceholder) {
      const storedSubmissions = JSON.parse(localStorage.getItem('mockSubmissions') || '[]');
      const storedAssignments = JSON.parse(localStorage.getItem('mockAssignments') || '[]');
      const assignment = assignments.find(a => a.id === submissionData.assignmentId) || storedAssignments.find(a => a.id === submissionData.assignmentId);
      const newSubmission = {
        id: 'sub_' + Math.random().toString(36).substr(2, 9),
        courseId: submissionData.courseId || assignment?.courseId,
        ...submissionData,
        status: 'Submitted',
        marks: null,
        feedback: '',
        createdAt: new Date().toISOString(),
      };

      if (!newSubmission.fileName && file) {
        newSubmission.fileName = file.name;
      }

      // If student already submitted, replace
      const filtered = storedSubmissions.filter(s => !(s.assignmentId === submissionData.assignmentId && s.studentId === submissionData.studentId));
      const updatedSubmissions = [...filtered, newSubmission];
      setSubmissions(updatedSubmissions);
      localStorage.setItem('mockSubmissions', JSON.stringify(updatedSubmissions));
      return newSubmission;
    }

    let finalSubmissionData = {
      assignmentId: submissionData.assignmentId || '',
      studentId: submissionData.studentId || '',
      courseId: submissionData.courseId || '',
      fileName: submissionData.fileName || file?.name || 'Unknown File',
      status: 'Submitted',
      marks: null,
      feedback: '',
      createdAt: new Date().toISOString()
    };

    if (file) {
      if (file.size < 500 * 1024) { // Less than 500KB, use base64 to avoid slow Storage uploads
        try {
          const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
          });
          finalSubmissionData.fileUrl = base64Data;
          finalSubmissionData.fileName = file.name;
        } catch (err) {
          console.error("Failed to read file as base64:", err);
        }
      } else {
        try {
          const storageRef = ref(storage, `submissions/${submissionData.assignmentId}/${submissionData.studentId}_${file.name}`);
          const uploadResult = await uploadBytes(storageRef, file);
          const downloadUrl = await getDownloadURL(uploadResult.ref);
          finalSubmissionData.fileUrl = downloadUrl;
          finalSubmissionData.fileName = file.name;
        } catch (err) {
          console.error("Assignment file upload failed:", err);
        }
      }
    }

    // Use a deterministic ID to avoid needing a composite index query
    const docId = `${submissionData.assignmentId}_${submissionData.studentId}`;
    await setDoc(doc(db, 'submissions', docId), finalSubmissionData, { merge: true });
    return { id: docId, ...finalSubmissionData };
  };

  const gradeSubmission = async (submissionId, marks, feedback) => {
    if (isUsingPlaceholder) {
      const storedSubmissions = JSON.parse(localStorage.getItem('mockSubmissions') || '[]');
      const updatedSubmissions = storedSubmissions.map(s => 
        s.id === submissionId ? { ...s, status: 'Graded', marks: Number(marks), feedback } : s
      );
      setSubmissions(updatedSubmissions);
      localStorage.setItem('mockSubmissions', JSON.stringify(updatedSubmissions));
      return;
    }
    await updateDoc(doc(db, 'submissions', submissionId), {
      status: 'Graded',
      marks: Number(marks),
      feedback
    });
  };

  // --- ATTENDANCE OPERATIONS ---
  const markAttendance = async (courseId, date, attendanceRecords) => {
    if (isUsingPlaceholder) {
      // Remove existing records for this course and date to allow updating
      const filtered = attendance.filter(a => !(a.courseId === courseId && a.date === date));
      const newRecords = attendanceRecords.map(r => ({
        id: 'att_' + Math.random().toString(36).substr(2, 9),
        courseId,
        date,
        studentId: r.studentId,
        status: r.status
      }));
      const updatedAttendance = [...filtered, ...newRecords];
      setAttendance(updatedAttendance);
      localStorage.setItem('mockAttendance', JSON.stringify(updatedAttendance));
      return;
    }

    // Write new records to Firestore using deterministic IDs to replace existing ones without needing a query
    for (const record of attendanceRecords) {
      const docId = `${courseId}_${date}_${record.studentId}`;
      await setDoc(doc(db, 'attendance', docId), {
        courseId,
        date,
        studentId: record.studentId,
        status: record.status
      });
    }
  };

  const markLessonCompleted = async (enrollmentId, lessonId) => {
    const enrollment = enrollments.find(e => e.id === enrollmentId);
    if (!enrollment) return;
    
    if (enrollment.completedLessons?.includes(lessonId)) return;
    
    const newCompletedLessons = [...(enrollment.completedLessons || []), lessonId];
    
    const course = courses.find(c => c.id === enrollment.courseId);
    let totalLessons = 0;
    if (course?.modules) {
      course.modules.forEach(m => totalLessons += (m.lessons?.length || 0));
    }
    
    const progress = totalLessons > 0 ? Math.round((newCompletedLessons.length / totalLessons) * 100) : 100;

    if (isUsingPlaceholder) {
      const updatedEnrollments = enrollments.map(e => e.id === enrollmentId ? { ...e, completedLessons: newCompletedLessons, progress } : e);
      setEnrollments(updatedEnrollments);
      localStorage.setItem('mockEnrollments', JSON.stringify(updatedEnrollments));
      return;
    }

    await updateDoc(doc(db, 'enrollments', enrollmentId), {
      completedLessons: newCompletedLessons,
      progress
    });
  };

  const value = {
    courses,
    users,
    enrollments,
    assignments,
    submissions,
    attendance,
    addCourse,
    updateCourse,
    deleteCourse,
    enrollCourse,
    updateUserRole,
    toggleUserStatus,
    refreshUsers,
    addAssignment,
    submitAssignment,
    gradeSubmission,
    markAttendance,
    updateUserProfile,
    markLessonCompleted
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
