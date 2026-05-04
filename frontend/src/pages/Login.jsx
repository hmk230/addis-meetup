import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useLang } from '../context/AppContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login'); // 'login' | 'forgot'
  const [form, setForm] = useState({ phone: '', password: '' });
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      if (data.user.must_change_password) navigate('/change-password');
      else if (data.user.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In production this would notify admin — for now just show success
      await new Promise(r => setTimeout(r, 800));
      setForgotSent(true);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:36 }}>
        <div style={{ width:64, height:64, background:'#4CAF82', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>⚽</div>
        <div style={{ fontSize:26, fontWeight:800, color:'#1a1d23' }}>Addis Football</div>
      </div>

      <div style={{ background:'white', borderRadius:24, padding:'28px 24px', width:'100%', maxWidth:400, boxShadow:'0 8px 32px rgba(0,0,0,.12)' }}>

        {/* Language toggle */}
        <div style={{ textAlign:'right', marginBottom:16 }}>
          <button onClick={toggleLang} style={{ fontSize:11, fontWeight:700, background:'#f1f3f5', border:'none', padding:'4px 10px', borderRadius:8, cursor:'pointer', color:'#495057' }}>
            {lang === 'en' ? 'አማ' : 'EN'}
          </button>
        </div>

        {tab === 'login' && (
          <>
            <div style={{ display:'flex', background:'#f1f3f5', borderRadius:12, padding:4, marginBottom:24 }}>
              <button style={{ flex:1, padding:10, border:'none', borderRadius:9, fontSize:14, fontWeight:600, background:'white', color:'#1a1d23', boxShadow:'0 1px 4px rgba(0,0,0,.1)', cursor:'pointer' }}>Log In</button>
              <Link to="/signup" style={{ flex:1, padding:10, textAlign:'center', textDecoration:'none', fontSize:14, fontWeight:600, color:'#868e96', display:'flex', alignItems:'center', justifyContent:'center' }}>Sign Up</Link>
            </div>
            <form onSubmit={handleLogin}>
              <label style={{ fontSize:13, fontWeight:600, color:'#343a40', marginBottom:6, display:'block' }}>{t('phone')}</label>
              <input style={{ width:'100%', border:'1.5px solid #dee2e6', borderRadius:12, padding:'14px 16px', fontSize:15, outline:'none', marginBottom:16, fontFamily:'inherit' }}
                type="tel" placeholder="+251 9..." value={form.phone}
                onChange={e => setForm({...form, phone:e.target.value})} required />
              <label style={{ fontSize:13, fontWeight:600, color:'#343a40', marginBottom:6, display:'block' }}>{t('password')}</label>
              <input style={{ width:'100%', border:'1.5px solid #dee2e6', borderRadius:12, padding:'14px 16px', fontSize:15, outline:'none', marginBottom:8, fontFamily:'inherit' }}
                type="password" value={form.password}
                onChange={e => setForm({...form, password:e.target.value})} required />
              <div style={{ textAlign:'right', marginBottom:16 }}>
                <button type="button" onClick={() => setTab('forgot')} style={{ fontSize:12, color:'#4CAF82', fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>Forgot password?</button>
              </div>
              <button style={{ width:'100%', background:'#4CAF82', color:'white', border:'none', borderRadius:14, padding:16, fontSize:16, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(76,175,130,.35)' }}
                disabled={loading}>{loading ? t('loading') : 'Log In'}</button>
            </form>
          </>
        )}

        {tab === 'forgot' && !forgotSent && (
          <>
            <button onClick={() => setTab('login')} style={{ background:'none', border:'none', fontSize:13, color:'#868e96', cursor:'pointer', marginBottom:20, display:'flex', alignItems:'center', gap:4 }}>← Back to Log In</button>
            <div style={{ textAlign:'center', marginBottom:22 }}>
              <div style={{ fontSize:44, marginBottom:10 }}>🔐</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#1a1d23', marginBottom:6 }}>Reset Password</div>
              <div style={{ fontSize:13, color:'#868e96', lineHeight:1.5 }}>Enter your phone number. The admin will reset your password and send you a temporary one via Telegram.</div>
            </div>
            <form onSubmit={handleForgot}>
              <label style={{ fontSize:13, fontWeight:600, color:'#343a40', marginBottom:6, display:'block' }}>{t('phone')}</label>
              <input style={{ width:'100%', border:'1.5px solid #dee2e6', borderRadius:12, padding:'14px 16px', fontSize:15, outline:'none', marginBottom:16, fontFamily:'inherit' }}
                type="tel" placeholder="+251 9..." value={forgotPhone}
                onChange={e => setForgotPhone(e.target.value)} required />
              <button style={{ width:'100%', background:'#4CAF82', color:'white', border:'none', borderRadius:14, padding:16, fontSize:16, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(76,175,130,.35)' }}
                disabled={loading}>{loading ? t('loading') : 'Send Reset Request'}</button>
            </form>
          </>
        )}

        {tab === 'forgot' && forgotSent && (
          <>
            <button onClick={() => setTab('login')} style={{ background:'none', border:'none', fontSize:13, color:'#868e96', cursor:'pointer', marginBottom:20 }}>← Back to Log In</button>
            <div style={{ background:'#fff8e6', border:'1px solid #ffd97d', borderRadius:12, padding:'14px 16px', fontSize:13, color:'#7c5c00', marginBottom:16, lineHeight:1.6 }}>
              📩 <strong>Request sent!</strong> The admin will reset your password and message you on Telegram with a temporary password.
            </div>
            {[
              'Admin receives your request and resets your password.',
              'You get a temporary password via Telegram @AddisMeetupAdmin.',
              'Log in with the temp password — you\'ll be asked to set a new one.'
            ].map((s, i) => (
              <div key={i} style={{ display:'flex', gap:12, marginBottom:12 }}>
                <div style={{ width:26, height:26, borderRadius:'50%', background:'#4CAF82', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, flexShrink:0 }}>{i+1}</div>
                <div style={{ fontSize:13, color:'#343a40', lineHeight:1.5, paddingTop:3 }}>{s}</div>
              </div>
            ))}
            <button onClick={() => setTab('login')} style={{ width:'100%', background:'#4CAF82', color:'white', border:'none', borderRadius:14, padding:16, fontSize:16, fontWeight:700, cursor:'pointer', marginTop:8 }}>Back to Log In</button>
          </>
        )}
      </div>
    </div>
  );
}
