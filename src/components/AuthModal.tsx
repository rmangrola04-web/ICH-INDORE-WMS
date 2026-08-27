import React, { useState } from 'react';
import { ShieldCheck, LogIn, UserPlus, X, AlertCircle, Key, User, Shield } from 'lucide-react';
import { UserRole, UserAccount } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: UserAccount) => void;
  registeredUsers: UserAccount[];
  onRegisterUser: (newUser: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onLoginSuccess,
  registeredUsers,
  onRegisterUser,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('SUPERVISOR');
  const [username, setUsername] = useState<string>('supervisor');
  const [password, setPassword] = useState<string>('super123');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [regFullName, setRegFullName] = useState<string>('');
  const [regRole, setRegRole] = useState<UserRole>('SUPERVISOR');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === 'ADMIN') {
      setUsername('admin');
      setPassword('admin123');
    } else if (role === 'SUPERVISOR') {
      setUsername('supervisor');
      setPassword('super123');
    } else if (role === 'SECURITY') {
      setUsername('security');
      setPassword('gate123');
    } else if (role === 'OPERATOR') {
      setUsername('operator');
      setPassword('op123');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const inputUser = username.trim().toLowerCase();
    const inputPass = password.trim();

    // Check matched user in registeredUsers
    const matchedUser = registeredUsers.find(
      (u) =>
        u.username.toLowerCase() === inputUser &&
        u.password === inputPass &&
        u.role === selectedRole
    );

    if (matchedUser) {
      onLoginSuccess(matchedUser);
    } else {
      setErrorMessage('Invalid username or password for the selected role.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regUsername.trim() || !regPassword.trim()) {
      return;
    }

    const trimmedUser = regUsername.trim().toLowerCase();
    if (registeredUsers.some((u) => u.username.toLowerCase() === trimmedUser)) {
      setErrorMessage('Username already exists. Please pick another username.');
      return;
    }

    const words = regFullName.trim().split(' ');
    const initials =
      words.length > 1
        ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
        : regFullName.slice(0, 2).toUpperCase();

    const newUser: UserAccount = {
      fullName: regFullName.trim(),
      role: regRole,
      username: trimmedUser,
      password: regPassword.trim(),
      avatarInitials: initials || 'US',
    };

    onRegisterUser(newUser);
    setRegSuccessMsg(`Account created for ${newUser.fullName}! You can now login.`);
    setIsRegisterOpen(false);

    // Auto populate login form
    setSelectedRole(newUser.role);
    setUsername(newUser.username);
    setPassword(newUser.password || '');

    setTimeout(() => {
      setRegSuccessMsg(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-glacier rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-5 border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="text-center space-y-1.5">
          <div className="inline-flex p-3 bg-slate-800 rounded-2xl text-slate-100 mb-1 shadow-md shadow-slate-300">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">AHPL & AIL Logistics</h1>
          <p className="text-xs text-slate-500 font-medium">Warehouse Access & Dock Portal</p>
        </div>

        {regSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 text-center animate-in fade-in">
            {regSuccessMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              className="w-full input-glacier rounded-xl p-2.5 text-xs font-semibold cursor-pointer"
            >
              <option value="ADMIN">Admin (Full Access & Control)</option>
              <option value="SUPERVISOR">Supervisor (Loading, Plan Scan & Log)</option>
              <option value="SECURITY">Security Guard (Gate In / Out Only)</option>
              <option value="OPERATOR">Operator (Live Docks Overview)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Username"
                required
                className="w-full input-glacier rounded-xl p-2.5 pl-8 text-xs focus:outline-none"
              />
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full input-glacier rounded-xl p-2.5 pl-8 text-xs focus:outline-none"
              />
              <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>

          {errorMessage && (
            <div className="text-xs text-rose-700 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Secure Login</span>
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className="text-xs text-slate-600 hover:text-slate-900 font-semibold underline cursor-pointer"
            >
              + Create New User Account
            </button>
          </div>
        </form>

        <div className="p-3 bg-slate-100/80 rounded-2xl text-[11px] text-slate-600 space-y-1 border border-slate-200">
          <p className="font-bold text-slate-800">Default Credentials:</p>
          <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-700">
            <span
              onClick={() => handleRoleChange('ADMIN')}
              className="cursor-pointer hover:text-blue-700"
            >
              Admin: admin / admin123
            </span>
            <span
              onClick={() => handleRoleChange('SECURITY')}
              className="cursor-pointer hover:text-blue-700"
            >
              Security: security / gate123
            </span>
            <span
              onClick={() => handleRoleChange('SUPERVISOR')}
              className="cursor-pointer hover:text-blue-700"
            >
              Supervisor: supervisor / super123
            </span>
            <span
              onClick={() => handleRoleChange('OPERATOR')}
              className="cursor-pointer hover:text-blue-700"
            >
              Operator: operator / op123
            </span>
          </div>
        </div>
      </div>

      {/* REGISTRATION MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="glass-glacier rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-slate-700" />
                <span>Register New User Account</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  required
                  className="w-full input-glacier rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Role</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full input-glacier rounded-xl p-2.5 font-medium cursor-pointer"
                >
                  <option value="SUPERVISOR">Supervisor (Loading & Plan Log)</option>
                  <option value="SECURITY">Security Guard (Gate In/Out)</option>
                  <option value="OPERATOR">Operator (Live Docks View)</option>
                  <option value="ADMIN">Admin (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Username</label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Choose username"
                  required
                  className="w-full input-glacier rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Set password"
                  required
                  className="w-full input-glacier rounded-xl p-2.5"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm mt-2 cursor-pointer flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>Save & Register User</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
