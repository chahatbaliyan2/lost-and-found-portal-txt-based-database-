import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const profile = localStorage.getItem('profile');
    if (token && role && profile) {
      return { token, role, profile: JSON.parse(profile) };
    }
    return null;
  });

  function login(token, role, profile) {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('profile', JSON.stringify(profile));
    setAuth({ token, role, profile });
  }

  // Used after a profile edit: refreshes the stored token/profile without
  // changing the role or forcing the user to log in again.
  function updateProfile(newProfile, newToken) {
    setAuth((prev) => {
      if (!prev) return prev;
      const token = newToken || prev.token;
      localStorage.setItem('token', token);
      localStorage.setItem('profile', JSON.stringify(newProfile));
      return { ...prev, token, profile: newProfile };
    });
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('profile');
    setAuth(null);
  }

  return <AuthContext.Provider value={{ auth, login, logout, updateProfile }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
