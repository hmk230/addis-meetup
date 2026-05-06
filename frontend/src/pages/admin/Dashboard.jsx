import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../context/AppContext';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { Users, Calendar, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { t } = useLang();
  const [stats, setStats] = useState({ meetups: 0, players: 0, approved: 0 });
  const [recentMeetups, setRecentMeetups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/meetups'),
      api.get('/admin/users'),
    ]).then(([m, u]) => {
      setRecentMeetups(m.data.slice(0, 4));
      setStats({ meetups: m.data.length, players: u.data.length });
    }).finally(() => setLoading(false));
  }, []);

  return (
    <Layout title={t('adminPanel')}>
      <div className="space-y-5 py-2">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center">
            <Calendar size={22} className="text-brand-500 mx-auto mb-1" />
            <div className="text-2xl font-bold">{stats.meetups}</div>
            <div className="text-xs text-gray-500">{t('meetups')}</div>
          </div>
          <div className="card text-center">
            <Users size={22} className="text-brand-500 mx-auto mb-1" />
            <div className="text-2xl font-bold">{stats.players}</div>
            <div className="text-xs text-gray-500">{t('players')}</div>
          </div>
        </div>

        {/* Quick links */}
		<div className="grid grid-cols-2 gap-3">
  {/* Existing links... */}
  <Link to="/admin/meetups/new">...</Link>
  <Link to="/admin/players">...</Link>

  {/* Add this new link below them */}
  <Link to="/admin/settings">
    <div className="card text-center cursor-pointer hover:shadow-md transition">
      <div className="text-2xl mb-1">⚙️</div>
      <div className="text-sm font-semibold">Settings</div>
    </div>
  </Link>
</div>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/admin/meetups/new">
            <div className="card bg-brand-600 text-white text-center cursor-pointer hover:bg-brand-700 transition">
              <div className="text-2xl mb-1">+</div>
              <div className="text-sm font-semibold">{t('createMeetup')}</div>
            </div>
          </Link>
          <Link to="/admin/players">
            <div className="card text-center cursor-pointer hover:shadow-md transition">
              <div className="text-2xl mb-1">👥</div>
              <div className="text-sm font-semibold">{t('players')}</div>
            </div>
          </Link>
        </div>

        {/* Recent meetups */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">{t('upcomingGames')}</h2>
            <Link to="/admin/meetups" className="text-sm text-brand-600 font-semibold">See all →</Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2].map(i => <div key={i} className="card h-16 animate-pulse bg-gray-100" />)}</div>
          ) : (
            <div className="space-y-2">
              {recentMeetups.map(m => (
                <Link to={`/admin/meetups/${m.id}/registrations`} key={m.id}>
                  <div className="card flex items-center justify-between cursor-pointer hover:shadow-md transition">
                    <div>
                      <p className="font-semibold text-sm">{m.title}</p>
                      <p className="text-xs text-gray-400">{m.spots_remaining}/{m.max_players} spots</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${m.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {m.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
