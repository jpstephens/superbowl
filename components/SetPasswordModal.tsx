'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Eye, EyeOff, Lock, Check } from 'lucide-react';

interface SetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userName?: string;
}

export default function SetPasswordModal({
  isOpen,
  onClose,
  onSuccess,
  userName,
}: SetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      // Mark has_password as true in the profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        await supabase
          .from('profiles')
          .update({ has_password: true })
          .eq('email', user.email);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Store in localStorage that they skipped, so we don't show again this session
    localStorage.setItem('skippedPasswordSetup', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#232842] to-[#1a1f35] px-6 py-5">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-1 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#cda33b]/20 flex items-center justify-center">
              <Lock className="w-6 h-6 text-[#cda33b]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}!
              </h2>
              <p className="text-sm text-gray-300">
                Set a password for easy future access
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Create Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cda33b] focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cda33b] focus:border-transparent"
                required
              />
              {confirmPassword && password === confirmPassword && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#cda33b] text-white rounded-xl font-semibold hover:bg-[#b8922f] transition-colors disabled:opacity-50"
            >
              {loading ? 'Setting Password...' : 'Set Password'}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full py-3 text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              Skip for now
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            You can always set a password later from your account settings
          </p>
        </form>
      </div>
    </div>
  );
}
