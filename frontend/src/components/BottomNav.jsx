import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AppContext';

export default function BottomNav() {
  const { user } = useAuth();
  const loc = useLocation();
  if (!user || user.role === 'admin') return null;

  const isActive = (path) => loc.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 max-w-lg mx-auto">
      <div className="flex items-center justify-around h-16 px-6">
        <NavTab to="/" active={isActive('/')} icon="📋" label="Games" />
        <NavTab to="/my-spots" active={isActive('/my-spots')} icon="🎟️" label="My Spots" />
      </div>
    </nav>
  );
}

function NavTab({ to, active, icon, label }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-0.5 min-w-[64px]">
      <span className="text-xl">{icon}</span>
      <span className={`text-[11px] font-semibold ${active ? 'text-[#3db87a]' : 'text-gray-400'}`}>{label}</span>
      {active && <div className="w-1 h-1 rounded-full bg-[#3db87a] mt-0.5" />}
    </Link>
  );
}
