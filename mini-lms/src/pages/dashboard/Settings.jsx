import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { User, Mail, Camera, Save } from 'lucide-react';

export default function Settings() {
  const { currentUser } = useAuth();
  const { users, updateUserProfile } = useData();

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatarUrl: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const userProfile = users.find(u => u.id === currentUser.uid || u.email === currentUser.email);
      if (userProfile) {
        setFormData({
          name: userProfile.name || '',
          bio: userProfile.bio || '',
          avatarUrl: userProfile.avatarUrl || ''
        });
      }
    }
  }, [currentUser, users]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatarUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const userId = currentUser.uid || currentUser.id;
    updateUserProfile(userId, formData, avatarFile);
    setAvatarFile(null);
    
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Profile & Settings</h2>
        <p className="text-slate-500">Manage your account details and public profile.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row gap-12">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4 md:w-1/3">
            <label className="w-40 h-40 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative group cursor-pointer">
              <input 
                type="file" 
                accept="image/*"
                className="hidden" 
                onChange={handleImageUpload} 
              />
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-20 h-20 text-slate-300" />
              )}
              <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </label>
            <p className="text-sm text-slate-500 text-center">
              Click the image to upload a new avatar.
            </p>
          </div>

          {/* Form Section */}
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="email" 
                    value={currentUser?.email || ''} 
                    disabled 
                    className="pl-10 w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>

              

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                <textarea 
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Tell us a little about yourself..."
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
                ></textarea>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <button 
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium shadow-sm shadow-primary-600/20"
                >
                  <Save className="w-5 h-5" /> Save Changes
                </button>
                {success && (
                  <span className="text-green-600 font-medium text-sm animate-in slide-in-from-left-4">
                    Profile updated successfully!
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
