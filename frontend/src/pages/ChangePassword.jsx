import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useLang } from '../context/AppContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function ChangePassword() {
  const { user, setUser } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: form.current_password,
        new_password: form.new_password
      });
      toast.success('Password changed!');
      const updated = { ...user, must_change_password: false };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="card">
          <div className="text-center mb-5">
            <div className="text-3xl mb-2">🔐</div>
            <h2 className="text-lg font-bold">{t('changePassword')}</h2>
            {user?.must_change_password && (
              <p className="text-sm text-amber-600 mt-1">Your password was reset by admin. Please set a new one.</p>
            )}
          </div>
          <form onSubmit={handle} className="space-y-4">
            {!user?.must_change_password && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">{t('currentPassword')}</label>
                <input className="input" type="password" value={form.current_password}
                  onChange={e => setForm({ ...form, current_password: e.target.value })} required />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('newPassword')}</label>
              <input className="input" type="password" value={form.new_password}
                onChange={e => setForm({ ...form, new_password: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('confirmPassword')}</label>
              <input className="input" type="password" value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })} required />
            </div>
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? t('loading') : t('saveChanges')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
