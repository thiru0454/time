import React, { useState } from 'react';
import { auth } from '@/integrations/firebase/faculty';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const StudentAuth: React.FC = () => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      setUser(cred.user);
      setMessage('Registration successful!');
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setUser(cred.user);
      setMessage('Login successful!');
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setMessage('Logged out.');
  };

  if (user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-6">Welcome, {user.email}</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleLogout}>Logout</button>
        {message && <div className="text-green-600 mt-4">{message}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
        <div className="flex justify-center mb-6 gap-2">
          <button className={`px-4 py-2 rounded ${tab === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setTab('login')}>Login</button>
          <button className={`px-4 py-2 rounded ${tab === 'register' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setTab('register')}>Register</button>
        </div>
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 border rounded" />
            <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
          </form>
        )}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 border rounded" />
            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full px-3 py-2 border rounded" />
            <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
          </form>
        )}
        {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
        {message && <div className="text-green-600 mt-4 text-center">{message}</div>}
      </div>
    </div>
  );
};

export default StudentAuth; 