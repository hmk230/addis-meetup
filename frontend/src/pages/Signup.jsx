import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useLang } from '../context/AppContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Signup() {
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', phone: '', age: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (parseInt(form.age) < 10 || parseInt(form.age) > 80) return toast.error('Enter a valid age');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', {
        full_name: form.full_name, phone: form.phone, age: form.age, password: form.password
      });
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const f = (k) => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">⚽</div>
          <h1 className="text-2xl font-bold text-gray-900">{t('appName')}</h1>
        </div>
        <div className="card">
          <h2 className="text-lg font-bold mb-5">{t('signup')}</h2>
          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('fullName')}</label>
              <input className="input" type="text" {...f('full_name')} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('phone')}</label>
              <input className="input" type="tel" placeholder="+251..." {...f('phone')} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('age')}</label>
              <input className="input" type="number" min="10" max="80" {...f('age')} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('password')}</label>
              <input className="input" type="password" {...f('password')} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('confirmPassword')}</label>
              <input className="input" type="password" {...f('confirm')} required />
            </div>
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? t('loading') : t('signup')}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-semibold">{t('login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
