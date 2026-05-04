import { useEffect, useState } from 'react';
import { useLang } from '../context/AppContext';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import PaymentInfo from '../components/PaymentInfo';
import api from '../lib/api';
import { MapPin, Calendar } from 'lucide-react';

export default function MySpots() {
  const { t } = useLang();
  const [data, setData] = useState({ registrations: [], payment_info: null });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/registrations/my').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <Layout title={t('mySpots')}>
      {loading ? (
        <div className="space-y-3 py-4">
          {[1,2].map(i => <div key={i} className="card h-24 animate-pulse bg-gray-100" />)}
        </div>
      ) : data.registrations.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p>No registrations yet</p>
        </div>
      ) : (
        <div className="space-y-3 py-2">
          {data.registrations.map(reg => (
            <div key={reg.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900 text-sm leading-tight pr-2">{reg.meetups?.title}</h3>
                <StatusBadge status={reg.payment_status} />
              </div>
              <div className="space-y-1 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1.5"><MapPin size={12} className="text-brand-500" />{reg.meetups?.location}</div>
                <div className="flex items-center gap-1.5"><Calendar size={12} className="text-brand-500" />
                  {new Date(reg.meetups?.date_time).toLocaleString('en-ET', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
                <div className="text-gray-500">Players: <span className="font-semibold">{reg.player_count}</span></div>
                <div className="text-gray-500">Total: <span className="font-bold text-brand-600">{(reg.meetups?.price * reg.player_count).toLocaleString()} ETB</span></div>
              </div>

              {reg.payment_status === 'pending' && (
                <button onClick={() => setExpanded(expanded === reg.id ? null : reg.id)}
                  className="text-xs text-brand-600 font-semibold">
                  {expanded === reg.id ? 'Hide' : '💳 View Payment Details'}
                </button>
              )}

              {expanded === reg.id && (
                <div className="mt-3">
                  <PaymentInfo info={data.payment_info} price={reg.meetups?.price} playerCount={reg.player_count} />
                </div>
              )}

              {reg.payment_screenshot_url && (
                <div className="mt-2">
                  <a href={reg.payment_screenshot_url} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-600 underline">View uploaded screenshot</a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
