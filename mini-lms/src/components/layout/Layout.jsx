import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, LogOut, LayoutDashboard, Settings, Users } from 'lucide-react';

export default function Layout() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
      {/* Sidebar Navigation */}
      <nav className="md:w-64 bg-white border-r border-slate-200 shadow-sm z-10 flex flex-col transition-all duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-primary-600 rounded-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Mini LMS
          </h1>
        </div>

        <div className="flex-1 px-4 space-y-2 mt-4">
          {currentUser && (
            <div className="mb-8 px-3 py-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-sm font-medium text-slate-900 truncate">{currentUser.email}</p>
              <p className="text-xs font-semibold text-primary-700 capitalize mt-1 px-2 py-0.5 bg-primary-100 rounded-md inline-block border border-primary-200">
                {userRole || 'student'}
              </p>
            </div>
          )}

          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900 font-medium text-sm">
            <LayoutDashboard className="w-5 h-5 text-slate-400" />
            <span>Dashboard</span>
          </Link>
          
          {userRole === 'admin' && (
            <Link to="/dashboard/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900 font-medium text-sm">
              <Users className="w-5 h-5 text-slate-400" />
              <span>Manage Users</span>
            </Link>
          )}

          <Link to="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900 font-medium text-sm">
            <Settings className="w-5 h-5 text-slate-400" />
            <span>Settings</span>
          </Link>
        </div>

        <div className="p-4 mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-100 font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto relative bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
