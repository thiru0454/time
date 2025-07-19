import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signIn, signUp, resetPassword, createProfile, getProfileById } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Auth: React.FC = () => {
  const [tab, setTab] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { data, error } = await signIn({ email, password });
    if (error) setError(error.message);
    else {
      setMessage('Login successful!');
      // Fetch user profile and store role in localStorage
      const userId = data?.user?.id;
      if (userId) {
        const { data: profile, error: profileError } = await getProfileById(userId);
        if (!profileError && profile?.role) {
          localStorage.setItem('userRole', profile.role);
        }
      }
    }
    setLoading(false);
  };

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
    const { data, error } = await signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Wait for user to exist in the users table
    const userId = data?.user?.id;
    if (userId) {
      // Retry profile creation up to 3 times with a delay
      let profileError = null;
      for (let i = 0; i < 3; i++) {
        const { error: err } = await createProfile({ id: userId, role: 'student' });
        if (!err) {
          profileError = null;
          break;
        }
        profileError = err;
        await new Promise(res => setTimeout(res, 500)); // wait 500ms before retry
      }
      if (profileError) {
        setError(`Registration succeeded, but failed to create profile: ${profileError.message || profileError}. Contact support.`);
        setLoading(false);
        return;
      }
    }
    setMessage('Registration successful! Check your email for confirmation.');
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error } = await resetPassword(email);
    if (error) setError(error.message);
    else setMessage('Password reset email sent!');
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <div className="flex justify-center mb-6 gap-2">
            <Button variant={tab === 'login' ? 'default' : 'outline'} onClick={() => setTab('login')}>Login</Button>
            <Button variant={tab === 'register' ? 'default' : 'outline'} onClick={() => setTab('register')}>Register</Button>
            <Button variant={tab === 'reset' ? 'default' : 'outline'} onClick={() => setTab('reset')}>Reset Password</Button>
          </div>
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
              <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</Button>
            </form>
          )}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
              <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Registering...' : 'Register'}</Button>
            </form>
          )}
          {tab === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Email'}</Button>
            </form>
          )}
          {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
          {message && <div className="text-green-600 mt-4 text-center">{message}</div>}
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default Auth; 