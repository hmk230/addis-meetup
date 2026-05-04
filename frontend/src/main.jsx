import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useAuth } from './context/AppContext';
import './index.css';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import MeetupDetail from './pages/MeetupDetail';
import MySpots from './pages/MySpots';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import AdminDashboard from './pages/admin/Dashboard';
import AdminMeetups from './pages/admin/Meetups';
import AdminMeetupForm from './pages/admin/MeetupForm';
import AdminRegistrations from './pages/admin/Registrations';
import AdminPlayers from './pages/admin/Players';
import AdminSettings from './pages/admin/Settings';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

const ForceChange = ({ children }) => {
  const { user } = useAuth();
  if (user?.must_change_password) return <Navigate to="/change-password" />;
  return children;
};

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster position="top-center" toastOptions={{ style: { fontFamily: 'DM Sans' } }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
          <Route path="/" element={<PrivateRoute><ForceChange><Home /></ForceChange></PrivateRoute>} />
          <Route path="/meetup/:id" element={<PrivateRoute><ForceChange><MeetupDetail /></ForceChange></PrivateRoute>} />
          <Route path="/my-spots" element={<PrivateRoute><ForceChange><MySpots /></ForceChange></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ForceChange><Profile /></ForceChange></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/meetups" element={<AdminRoute><AdminMeetups /></AdminRoute>} />
          <Route path="/admin/meetups/new" element={<AdminRoute><AdminMeetupForm /></AdminRoute>} />
          <Route path="/admin/meetups/:id/edit" element={<AdminRoute><AdminMeetupForm /></AdminRoute>} />
          <Route path="/admin/meetups/:id/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
          <Route path="/admin/players" element={<AdminRoute><AdminPlayers /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
