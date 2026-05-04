import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const AuthContext = createContext(null);
const LangContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const toggleLang = () => {
    const next = lang === 'en' ? 'am' : 'en';
    setLang(next);
    localStorage.setItem('lang', next);
  };

  const t = (key) => translations[lang][key] || key;

  return (
    <AuthContext.Provider value={{ user, login, logout, setUser }}>
      <LangContext.Provider value={{ lang, toggleLang, t }}>
        {children}
      </LangContext.Provider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export const useLang = () => useContext(LangContext);
