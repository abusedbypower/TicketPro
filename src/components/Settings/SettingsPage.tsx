import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { User, Lock, Trash2, Shield, Save } from 'lucide-react';

export function SettingsPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setMessage('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    const confirmText = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmText !== 'DELETE') {
      setError('Account deletion cancelled');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call the delete function (this would need to be implemented with proper admin checks)
      const { error } = await supabase.rpc('delete_user_account', {
        user_id_to_delete: user?.id
      });

      if (error) throw error;

      // Sign out the user
      await supabase.auth.signOut();
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-6 w-6" />
              Account Settings
            </h1>
          </div>

          <div className="p-6 space-y-8">
            {/* Profile Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Profile Information
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">{profile?.full_name || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">
                      {profile?.role?.replace('_', ' ') || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <p className="mt-1 text-sm text-gray-900">{profile?.department || 'Not set'}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  To update your profile information, please contact your administrator.
                </p>
              </div>
            </div>

            {/* Change Password */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </h2>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={8}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Messages */}
            {message && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">{message}</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Danger Zone */}
            {profile?.role !== 'admin' && (
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-lg font-medium text-red-900 mb-4 flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-red-900 mb-2">Delete Account</h3>
                  <p className="text-sm text-red-700 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}