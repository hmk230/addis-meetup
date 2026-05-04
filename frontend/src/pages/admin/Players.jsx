import { useEffect, useState } from 'react';
import { useLang } from '../../context/AppContext';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { KeyRound, Search } from 'lucide-react';

export default function AdminPlayers() {
  const { t } = useLang();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resetModal, setResetModal] = useState(null); // { id, name }
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    api.get('/admin/users').then(r => setPlayers(r.data)).finally(() => setLoading(false));
  }, []);

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setResetting(true);
    try {
      await api.post(`/admin/users/${resetModal.id}/reset-password`, { new_password: newPassword });
      toast.success(`Password reset for ${resetModal.name}`);
      setResetModal(null);
      setNewPassword('');
      // Update UI to show must_change flag
      setPlayers(ps => ps.map(p => p.id === resetModal.id ? { ...p, must_change_password: true } : p));
    } catch {
      toast.error('Reset failed');
    } finally {
      setResetting(false);
    }
  };

  const filtered = players.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  );

  return (
    <Layout title={t('players')}>
      {/* Search */}
      <div className="relative py-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 mt-1.5 text-gray-400" />
        <input className="input pl-9" placeholder="Search by name or phone..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="card h-16 animate-pulse bg-gray-100" />)}</div>
      ) : (
        <div className="space-y-2 pb-4">
          <p className="text-xs text-gray-400 mb-1">{filtered.length} players</p>
          {filtered.map(player => (
            <div key={player.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center text-sm font-bold text-brand-700 shrink-0">
                  {player.full_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{player.full_name}
                    {player.must_change_password && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">⚠ must change pw</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">{player.phone} · Age {player.age}</p>
                </div>
              </div>
              <button onClick={() => { setResetModal({ id: player.id, name: player.full_name }); setNewPassword(''); }}
                className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1.5 rounded-lg font-medium transition shrink-0">
                <KeyRound size={12} /> Reset
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Reset password modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5">
            <h3 className="font-bold text-lg mb-1">{t('resetPassword')}</h3>
            <p className="text-sm text-gray-500 mb-4">for <span className="font-semibold text-gray-800">{resetModal.name}</span></p>
            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2 mb-4">
              The user will be required to change their password on next login.
            </p>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('newPassword')}</label>
              <input className="input" type="password" placeholder="Min. 6 characters"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={handleReset} disabled={resetting} className="btn-primary flex-1">
                {resetting ? t('loading') : t('resetPassword')}
              </button>
              <button onClick={() => setResetModal(null)} className="btn-secondary flex-1">{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
