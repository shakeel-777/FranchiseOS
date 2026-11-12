import { useState } from 'react';
import { ProfileAPI } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { roleLabel } from '../../utils/format';

export default function Settings() {
  const { currentUser, updateCurrentUser } = useAuth();
  const toast = useToast();
  const u = currentUser?.user || {};

  const [profile, setProfile] = useState({ first_name: u.first_name || '', last_name: u.last_name || '', email: u.email || '', phone: currentUser?.phone || '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [savingPw, setSavingPw] = useState(false);

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await ProfileAPI.update(profile);
      updateCurrentUser(updated);
      toast('Profile updated', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pw.new_password !== pw.confirm_password) {
      toast('New passwords do not match', 'error');
      return;
    }
    setSavingPw(true);
    try {
      await ProfileAPI.changePassword({ current_password: pw.current_password, new_password: pw.new_password });
      toast('Password changed successfully', 'success');
      setPw({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <>
      <div className="page-header"><h2>Settings</h2><p className="text-muted">Manage your profile and account preferences</p></div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header"><h3>Profile</h3></div>
          <form onSubmit={saveProfile} style={{ padding: '.5rem 0' }}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">First Name</label><input value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Last Name</label><input value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label">Email</label><input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Phone</label><input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Role</label><input value={roleLabel(currentUser?.role)} disabled /></div>
            <div className="form-group"><label className="form-label">Franchises</label><input value={(currentUser?.franchise_names && currentUser.franchise_names.length > 0) ? currentUser.franchise_names.join(', ') : (currentUser?.franchise_name || 'None assigned')} disabled /></div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save Profile'}</button>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="card-header"><h3>Change Password</h3></div>
          <form onSubmit={changePassword} style={{ padding: '.5rem 0' }}>
            <div className="form-group"><label className="form-label">Current Password</label><input type="password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">New Password</label><input type="password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Confirm New Password</label><input type="password" value={pw.confirm_password} onChange={(e) => setPw({ ...pw, confirm_password: e.target.value })} /></div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={savingPw}>{savingPw ? 'Saving...' : 'Change Password'}</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
