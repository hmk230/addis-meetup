import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLang } from '../context/AppContext';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import PaymentInfo from '../components/PaymentInfo';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { MapPin, Calendar, Users, Upload } from 'lucide-react';

// Tiered discount pricing
// 1 game = full price, 2 = save 25% of base, 3-4 = save 50% of base, × players
function calcTotal(base, games, players) {
  let perPlayer;
  if (games === 1)      perPlayer = base;
  else if (games === 2) perPlayer = base * 2 - base * 0.25;
  else if (games === 3) perPlayer = base * 3 - base * 0.50;
  else if (games === 4) perPlayer = base * 4 - base * 0.50;
  else                  perPlayer = base * games;
  return Math.round(perPlayer * players * 100) / 100;
}
function discountPct(games) {
  if (games === 2) return 25;
  if (games >= 3) return 50;
  return 0;
}
function savingAmt(base, games, players) {
  if (games === 2) return base * 0.25 * players;
  if (games >= 3) return base * 0.50 * players;
  return 0;
}
function fmt(n) {
  return n % 1 !== 0 ? n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n.toLocaleString();
}

export default function MeetupDetail() {
  const { id } = useParams();
  const { t } = useLang();
  const [meetup, setMeetup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selGames, setSelGames] = useState(0);
  const [players, setPlayers] = useState(1);
  const [registering, setRegistering] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get(`/meetups/${id}`).then(r => setMeetup(r.data)).finally(() => setLoading(false));
  }, [id]);

  const total = meetup && selGames > 0 ? calcTotal(meetup.price, selGames, players) : 0;
  const disc = discountPct(selGames);
  const saving = meetup && selGames > 0 ? savingAmt(meetup.price, selGames, players) : 0;
  const rawTotal = meetup ? meetup.price * (selGames || 1) * players : 0;

  const handleRegister = async () => {
    if (selGames === 0) return toast.error('Please select number of games');
    setRegistering(true);
    try {
      const { data } = await api.post('/registrations', { meetup_id: id, player_count: players, game_count: selGames });
      setRegistration(data.registration);
      setPaymentInfo(data.payment_info);
      toast.success('Spot reserved! 🎉');
      const updated = await api.get(`/meetups/${id}`);
      setMeetup(updated.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setRegistering(false); }
  };

  const handleUpload = async () => {
    if (!screenshot || !registration) return;
    const formData = new FormData();
    formData.append('screenshot', screenshot);
    setUploading(true);
    try {
      await api.post(`/registrations/${registration.id}/screenshot`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Screenshot uploaded!');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const TILES = [
    { n: 1, disc: 'Full price', cls: 'text-gray-400' },
    { n: 2, disc: '25% off 🎉', cls: 'text-amber-600' },
    { n: 3, disc: '50% off 🔥', best: true, cls: 'text-green-700' },
    { n: 4, disc: '50% off 🔥', best: true, cls: 'text-green-700' },
  ];

  if (loading) return <Layout back><div className="py-8 text-center text-gray-400">{t('loading')}</div></Layout>;
  if (!meetup) return <Layout back><div className="py-8 text-center text-gray-400">Not found</div></Layout>;

  return (
    <Layout back>
      <div className="py-4 space-y-4">
        {/* Header */}
        <div className="card">
          <div className="flex items-start justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900 leading-tight pr-2">{meetup.title}</h1>
            <StatusBadge status={meetup.status} />
          </div>
          {meetup.description && <p className="text-gray-600 text-sm mb-3">{meetup.description}</p>}
          <div className="space-y-1.5 text-sm text-gray-500">
            <div className="flex items-center gap-2"><MapPin size={14} className="text-green-500" />{meetup.location}</div>
            <div className="flex items-center gap-2"><Calendar size={14} className="text-green-500" />
              {new Date(meetup.date_time).toLocaleString('en-ET', { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
            <div className="flex items-center gap-2"><Users size={14} className="text-green-500" />
              {meetup.spots_remaining} / {meetup.max_players} spots remaining
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
            <span className="text-green-600 font-bold text-xl">{meetup.price?.toLocaleString()} ETB</span>
            <span className="text-gray-400 text-sm">/ player per game</span>
          </div>
        </div>

        {/* Registration form */}
        {!registration && meetup.status === 'open' && meetup.spots_remaining > 0 && (
          <div className="card space-y-5">
            <h3 className="font-bold text-base">Registration Details</h3>

            {/* Game tiles */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">How many games this week?</p>
              <div className="grid grid-cols-4 gap-2">
                {TILES.map(({ n, disc: dl, best, cls }) => (
                  <div key={n} onClick={() => setSelGames(n)}
                    className={`relative text-center p-2.5 rounded-xl border-2 cursor-pointer transition-all ${selGames === n ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    {best && <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">BEST</span>}
                    <div className="text-xl font-black text-gray-900">{n}</div>
                    <div className="text-[9px] text-gray-400">game{n > 1 ? 's' : ''}</div>
                    <div className={`text-[10px] font-bold mt-1 ${cls}`}>{dl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Player counter */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Number of Players</p>
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <span className="text-sm font-semibold text-gray-700">Players</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setPlayers(Math.max(1, players - 1))}
                    className="w-9 h-9 rounded-xl border border-gray-200 bg-white font-bold text-xl flex items-center justify-center hover:border-green-500 hover:bg-green-50 hover:text-green-600 transition-all">−</button>
                  <span className="text-xl font-black w-6 text-center">{players}</span>
                  <button onClick={() => setPlayers(Math.min(10, players + 1))}
                    className="w-9 h-9 rounded-xl border border-gray-200 bg-white font-bold text-xl flex items-center justify-center hover:border-green-500 hover:bg-green-50 hover:text-green-600 transition-all">+</button>
                </div>
              </div>
            </div>

            {/* Price breakdown */}
            {selGames > 0 && (
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <div className="bg-gray-900 px-4 py-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-white">💰 Price Breakdown</span>
                  {disc > 0 && <span className="text-xs font-bold bg-white/20 text-white px-2.5 py-1 rounded-full">{disc}% OFF</span>}
                </div>
                <div className="bg-white divide-y divide-gray-100">
                  <div className="flex justify-between items-center px-4 py-3 text-sm">
                    <span className="text-gray-500">{selGames} game{selGames>1?'s':''} × {players} player{players>1?'s':''}</span>
                    <span className={`font-semibold ${disc > 0 ? 'line-through text-gray-400' : 'text-gray-900'}`}>{fmt(rawTotal)} ETB</span>
                  </div>
                  {disc > 0 && (
                    <div className="flex justify-between items-center px-4 py-3 text-sm">
                      <span className="text-gray-500">{disc}% discount (save {fmt(saving)} ETB)</span>
                      <span className="font-bold text-amber-600">− {fmt(saving)} ETB</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm font-bold text-gray-900">Total</span>
                    <span className="text-xl font-black text-green-600">{fmt(total)} ETB</span>
                  </div>
                </div>
              </div>
            )}

            {disc > 0 && selGames > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center text-sm font-bold text-green-800">
                🎉 You save {fmt(saving)} ETB with the {disc}% discount!
              </div>
            )}

            <button onClick={handleRegister} disabled={registering || selGames === 0}
              className="btn-primary w-full">
              {registering ? t('loading') : selGames > 0
                ? `Reserve ${selGames} game${selGames>1?'s':''} · ${players} player${players>1?'s':''} – ${fmt(total)} ETB`
                : 'Reserve Spots'}
            </button>
          </div>
        )}

        {/* Post-registration */}
        {registration && (
          <>
            <div className="card bg-green-50 border-green-200">
              <p className="text-green-700 font-semibold text-sm">✅ Spot reserved! Your reference code: <span className="font-mono font-black">{registration.ref_code}</span></p>
            </div>
            <PaymentInfo info={paymentInfo} price={meetup.price} playerCount={registration.player_count} total={registration.total_amount} refCode={registration.ref_code} />
            <div className="card">
              <h3 className="font-bold mb-3 text-sm">{t('uploadScreenshot')}</h3>
              <input type="file" accept="image/*" className="text-sm mb-3" onChange={e => setScreenshot(e.target.files[0])} />
              <button onClick={handleUpload} disabled={!screenshot || uploading} className="btn-primary w-full flex items-center justify-center gap-2">
                <Upload size={16} /> {uploading ? t('loading') : t('uploadScreenshot')}
              </button>
            </div>
          </>
        )}

        {meetup.status === 'closed' && !registration && (
          <div className="card text-center text-gray-500">
            <div className="text-3xl mb-2">🔒</div>
            <p className="font-semibold">This meetup is closed</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
