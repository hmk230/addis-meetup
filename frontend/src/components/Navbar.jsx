import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useLang } from '../context/AppContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, toggleLang } = useLang();
  const location = useNavigate();
  const navigate = useNavigate();
  const loc = useLocation();

  if (!user) return null;

  const handleLogout = () => { logout(); navigate('/login'); };
  const isAdmin = user.role === 'admin';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4 max-w-lg mx-auto shadow-sm">
      {/* Logo */}
      <Link to={isAdmin ? '/admin' : '/'} className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[#3db87a] rounded-xl flex items-center justify-center text-white text-base">⚽</div>
        <span className="font-bold text-[15px] text-gray-900">Addis Football</span>
      </Link>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button onClick={toggleLang} className="text-[11px] font-bold bg-gray-100 px-2 py-1 rounded-lg text-gray-500 hover:bg-gray-200 transition">
          {lang === 'en' ? 'አማ' : 'EN'}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1.5"
        >
          <div className="w-5 h-5 bg-[#3db87a] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
            {user.full_name?.[0]?.toUpperCase()}
          </div>
          <span className="text-[12px] font-semibold text-gray-700">{user.full_name?.split(' ')[0]}</span>
        </button>
      </div>
    </header>
  );
}
