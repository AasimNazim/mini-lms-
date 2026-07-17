import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/layout/Layout';
import PrivateRoute from './routes/PrivateRoute';
import DashboardRouter from './pages/dashboard/DashboardRouter';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import InstructorDashboard from './pages/dashboard/InstructorDashboard';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import Settings from './pages/dashboard/Settings';
import CourseView from './pages/dashboard/CourseView';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={<Layout />}>
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <DashboardRouter />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/dashboard/student" 
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/dashboard/instructor" 
                element={
                  <PrivateRoute allowedRoles={['instructor', 'admin']}>
                    <InstructorDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/dashboard/admin" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/dashboard/settings" 
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/dashboard/course/:id" 
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <CourseView />
                  </PrivateRoute>
                } 
              />
            </Route>
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
