import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getUser, getProfileById, createProfile, resetPassword } from '@/integrations/supabase/client';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      setMessage(null);
      const { data: userData, error: userError } = await getUser();
      if (userError || !userData?.user) {
        setError('Not logged in.');
        setLoading(false);
        return;
      }
      setEmail(userData.user.email);
      const userId = userData.user.id;
      const { data: profileData, error: profileError } = await getProfileById(userId);
      if (profileError || !profileData) {
        setError('Profile not found.');
        setLoading(false);
        return;
      }
      setProfile(profileData);
      setFullName(profileData.full_name || '');
      setAvatarUrl(profileData.avatar_url || '');
      setRole(profileData.role);
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    if (!profile) return;
    const { error: updateError } = await createProfile({
      id: profile.id,
      full_name: fullName,
      avatar_url: avatarUrl,
      role: role
    });
    if (updateError) setError('Failed to update profile.');
    else setMessage('Profile updated successfully!');
    setSaving(false);
  };

  const handlePasswordReset = async () => {
    setError(null);
    setMessage(null);
    if (!email) return;
    const { error: resetError } = await resetPassword(email);
    if (resetError) setError('Failed to send reset email.');
    else setMessage('Password reset email sent!');
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-600">{error}</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">My Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input type="email" value={email} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <Input type="text" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Avatar URL</label>
            <Input type="text" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <Input type="text" value={role} disabled />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </form>
        <Button variant="outline" className="w-full mt-4" onClick={handlePasswordReset}>Send Password Reset Email</Button>
        {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
        {message && <div className="text-green-600 mt-4 text-center">{message}</div>}
      </Card>
    </div>
  );
};

export default Profile; 