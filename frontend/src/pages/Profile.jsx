import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useLang } from '../context/AppContext';
import Layout from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { t } = useLang();
  const [form, setForm] = useState({ full_name: '', age: '' });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    api.get('/auth/profile').then(r => setForm({ full_name: r.data.full_name, age: r.data.age }));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      const updated = { ...user, full_name: data.full_name };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      toast.success('Profile updated');
      setEditing(false);
    } catch {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={t('profile')}>
      <div className="space-y-4 py-2">
        <div className="card">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-brand-700">
              {form.full_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900">{form.full_name}</p>
              <p className="text-sm text-gray-500">{user?.phone}</p>
            </div>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">{t('fullName')}</label>
                <input className="input" value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">{t('age')}</label>
                <input className="input" type="number" value={form.age}
                  onChange={e => setForm({ ...form, age: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={loading} className="btn-primary flex-1">
                  {loading ? t('loading') : t('saveChanges')}
                </button>
                <button onClick={() => setEditing(false)} className="btn-secondary flex-1">{t('cancel')}</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex justify-between"><span>{t('age')}</span><span className="font-semibold">{form.age}</span></div>
              <div className="flex justify-between"><span>{t('phone')}</span><span className="font-semibold">{user?.phone}</span></div>
            </div>
          )}

          {!editing && (
            <button onClick={() => setEditing(true)} className="btn-secondary w-full">Edit Profile</button>
          )}
        </div>

        <Link to="/change-password">
          <div className="card flex items-center justify-between cursor-pointer hover:shadow-md transition">
            <span className="font-semibold text-sm">🔐 {t('changePassword')}</span>
            <span className="text-gray-400">→</span>
          </div>
        </Link>
      </div>
    </Layout>
  );
}
