import React, { useEffect } from 'react';
import { Shield, Users, Database, Activity, RefreshCw } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { users, courses, updateUserRole, toggleUserStatus, refreshUsers } = useData();

  useEffect(() => {
    // Refresh users on mount to catch any new registrations
    refreshUsers();
  }, []);

  const activeInstructors = users.filter(u => u.role === 'instructor' && u.status === 'Active').length;

  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.keys(roleCounts).map(role => ({ name: role.charAt(0).toUpperCase() + role.slice(1), users: roleCounts[role] }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Admin Control Panel</h2>
        <p className="text-slate-500">Platform overview and user management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-primary-500">
          <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Total Users</p>
            <h3 className="text-2xl font-bold text-slate-900">{users.length}</h3>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-blue-500">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Active Instructors</p>
            <h3 className="text-2xl font-bold text-slate-900">{activeInstructors}</h3>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-green-500">
          <div className="p-3 bg-green-50 rounded-lg text-green-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Total Courses</p>
            <h3 className="text-2xl font-bold text-slate-900">{courses.length}</h3>
          </div>
        </div>

      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">Platform Users</h3>
          <button onClick={refreshUsers} className="text-sm flex items-center gap-1 font-medium text-primary-600 hover:text-primary-700 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">User Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900">{user.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={user.role} 
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      className={`bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none capitalize text-sm font-medium ${
                        user.role === 'admin' ? 'text-purple-400' :
                        user.role === 'instructor' ? 'text-blue-400' : 'text-slate-500'
                      }`}
                    >
                      <option value="student" className="text-slate-500">Student</option>
                      <option value="instructor" className="text-blue-400">Instructor</option>
                      <option value="admin" className="text-purple-400">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleUserStatus(user.id)}
                      className={`transition-colors text-sm font-medium ${user.status === 'Active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                    >
                      {user.status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
