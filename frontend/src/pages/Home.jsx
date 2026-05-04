import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useLang } from '../context/AppContext';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import api from '../lib/api';
import { MapPin, Calendar, Users } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const { t } = useLang();
  const [meetups, setMeetups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/meetups').then(r => setMeetups(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="py-5">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Hey, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">{t('tagline')}</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="card h-32 animate-pulse bg-gray-100" />)}
          </div>
        ) : meetups.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">⚽</div>
            <p>{t('noMeetups')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetups.map(m => (
              <Link to={`/meetup/${m.id}`} key={m.id}>
                <div className="card hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-brand-500">
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="font-bold text-gray-900 text-base leading-tight pr-2">{m.title}</h2>
                    <StatusBadge status={m.status} />
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-brand-500 shrink-0" />
                      <span>{m.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-brand-500 shrink-0" />
                      <span>{new Date(m.date_time).toLocaleString('en-ET', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-brand-500 shrink-0" />
                      <span>{m.spots_remaining} / {m.max_players} spots left</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-brand-600 font-bold">{m.price?.toLocaleString()} ETB</span>
                    <span className={`text-xs font-semibold ${m.status === 'open' ? 'text-brand-600' : 'text-gray-400'}`}>
                      {m.status === 'open' ? 'Register →' : 'Closed'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
