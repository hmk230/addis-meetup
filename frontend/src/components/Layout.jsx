import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { useAuth } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function Layout({ children, back, backTo, title }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPlayer = user?.role === 'player';

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Navbar />
      <main className="pt-14 pb-20 max-w-lg mx-auto min-h-screen">
        {back && (
          <button
            onClick={() => backTo ? navigate(backTo) : navigate(-1)}
            className="flex items-center gap-1.5 text-gray-500 text-sm font-medium px-4 pt-4 pb-1 hover:text-gray-700"
          >
            ← Back to Games
          </button>
        )}
        {children}
      </main>
      {isPlayer && <BottomNav />}
    </div>
  );
}
