import React, { useState } from 'react';
import { X, ShieldCheck, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Check credentials immediately
    if (cleanUser === 'rain' && cleanPass === 'snow') {
      try {
        sessionStorage.setItem('kaal_admin_auth', 'true');
        localStorage.setItem('kaal_admin_auth', 'true');
      } catch {}

      // Fire-and-forget backend notification
      fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      }).catch(() => {});

      // Instant redirection to presentation
      window.location.assign('/presentation/index.html');
      return;
    }

    // If invalid
    setError('Invalid credentials. Please check your username and password.');
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-[#121217] border border-[#262635] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          aria-label="Close admin login"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Admin Defense Access</h2>
            <p className="text-xs text-amber-400/90 font-medium">SD • Technical Presentation Gateway</p>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          Authenticate to enter the complete technical masterclass, 7-layer architecture workflow, and interactive AI guide.
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User size={16} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                required
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 bg-[#181822] border border-[#2a2a3c] focus:border-amber-400 rounded-xl text-white text-base sm:text-sm outline-none transition placeholder-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full pl-9 pr-4 py-2.5 bg-[#181822] border border-[#2a2a3c] focus:border-amber-400 rounded-xl text-white text-base sm:text-sm outline-none transition placeholder-gray-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Enter Technical Presentation</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#262635] text-center">
          <span className="text-[11px] text-gray-400">
            Protected Admin Route • Authorized Personnel Only
          </span>
        </div>
      </div>
    </div>
  );
};
