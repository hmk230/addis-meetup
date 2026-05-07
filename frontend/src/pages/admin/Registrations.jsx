import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLang } from '../../context/AppContext';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Image } from 'lucide-react';

const STATUSES = ['pending', 'approved', 'rejected'];

export default function AdminRegistrations() {
  // Route is /admin/meetups/:id/registrations — param name is "id"
  const { id } = useParams(); // 'id' matches the :id in main.jsx
  const { t } = useLang();
  const [registrations, setRegistrations] = useState([]);
  const [meetup, setMeetup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!id) return;
    
    Promise.all([
      api.get(`/registrations/meetup/${id}`), // Send the 'id' to the backend
      api.get(`/meetups/${id}`)
    ]).then(([r, m]) => {
      setRegistrations(r.data);
      setMeetup(m.data);
    }).catch(() => toast.error('Failed to load registrations'))
      .finally(() => setLoading(false));
  }, [id]);
  // ... rest of component


  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/registrations/${id}/status`, { payment_status: status });
      setRegistrations(regs => regs.map(r => r.id === id ? { ...r, payment_status: data.payment_status } : r));
      toast.success(`Marked as ${status}`);
    } catch {
      toast.error('Update failed');
    }
  };

  const filtered = filter === 'all' ? registrations : registrations.filter(r => r.payment_status === filter);
  const counts = {
    all: registrations.length,
    pending: registrations.filter(r => r.payment_status === 'pending').length,
    approved: registrations.filter(r => r.payment_status === 'approved').length,
    rejected: registrations.filter(r => r.payment_status === 'rejected').length,
  };

  function fmtAmount(n) {
    if (!n) return '—';
    return Number(n).toLocaleString('en', { minimumFractionDigits: n % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 }) + ' ETB';
  }

  return (
    <Layout title={meetup?.title || 'Registrations'} back>
      {/* Filter tabs */}
      <div className="flex gap-2 py-3 overflow-x-auto">
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition ${
              filter === s ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card h-24 animate-pulse bg-gray-100" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-3xl mb-2">📋</div>
          <p>No registrations found</p>
        </div>
      ) : (
        <div className="space-y-3 pb-4">
          {filtered.map(reg => (
            <div key={reg.id} className="card">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-sm">{reg.users?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{reg.users?.phone} · Age {reg.users?.age}</p>
                </div>
                <StatusBadge status={reg.payment_status} />
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                <span>👥 {reg.player_count} player{reg.player_count > 1 ? 's' : ''}</span>
                <span>🎮 {reg.game_count || 1} game{(reg.game_count || 1) > 1 ? 's' : ''}</span>
                <span>💰 {fmtAmount(reg.total_amount)}</span>
                <span>🕐 {new Date(reg.registered_at).toLocaleDateString()}</span>
                {reg.ref_code && <span className="col-span-2 font-mono font-bold text-green-600">🎫 {reg.ref_code}</span>}
              </div>

              {/* Screenshot */}
              {reg.payment_screenshot_url ? (
                <button onClick={() => setLightbox(reg.payment_screenshot_url)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold mb-3 hover:underline">
                  <Image size={13} /> View Payment Screenshot
                </button>
              ) : (
                <p className="text-xs text-gray-300 mb-3 italic">No screenshot uploaded yet</p>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button onClick={() => updateStatus(reg.id, 'approved')}
                  disabled={reg.payment_status === 'approved'}
                  className={`flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-xl transition ${
                    reg.payment_status === 'approved'
                      ? 'bg-green-100 text-green-600 cursor-default'
                      : 'bg-green-50 hover:bg-green-100 text-green-700'
                  }`}>
                  <CheckCircle size={13} /> Approve
                </button>
                <button onClick={() => updateStatus(reg.id, 'pending')}
                  disabled={reg.payment_status === 'pending'}
                  className={`flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-xl transition ${
                    reg.payment_status === 'pending'
                      ? 'bg-amber-100 text-amber-600 cursor-default'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                  }`}>
                  <Clock size={13} /> Pending
                </button>
                <button onClick={() => updateStatus(reg.id, 'rejected')}
                  disabled={reg.payment_status === 'rejected'}
                  className={`flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-xl transition ${
                    reg.payment_status === 'rejected'
                      ? 'bg-red-100 text-red-600 cursor-default'
                      : 'bg-red-50 hover:bg-red-100 text-red-700'
                  }`}>
                  <XCircle size={13} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <div className="relative max-w-sm w-full">
            <img src={lightbox} alt="Payment screenshot" className="w-full rounded-2xl" />
            <button onClick={() => setLightbox(null)}
              className="absolute top-3 right-3 bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center font-bold shadow">×</button>
          </div>
        </div>
      )}
    </Layout>
  );
}
