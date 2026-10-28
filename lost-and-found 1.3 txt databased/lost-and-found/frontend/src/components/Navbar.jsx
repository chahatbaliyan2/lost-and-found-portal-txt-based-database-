import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios';

export default function Navbar() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!auth || auth.role !== 'user') {
      setUnread(0);
      return;
    }
    function poll() {
      api.get('/chat/unread-count').then((res) => setUnread(res.data.count)).catch(() => {});
    }
    poll();
    const t = setInterval(poll, 10000);
    return () => clearInterval(t);
  }, [auth]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">🔎 FindIt</Link>
      <div className="nav-links">
        <Link to="/organizations">Browse Organizations</Link>
        <Link to="/help">Help</Link>

        {!auth && (
          <>
            <Link to="/login">User Login</Link>
            <Link to="/org/login">Organization Login</Link>
            <Link to="/admin/login" className="nav-admin">Admin</Link>
          </>
        )}

        {auth && auth.role === 'user' && (
          <>
            <Link to="/post-item">+ Post Item</Link>
            <Link to="/my-items">My Items</Link>
            <Link to="/chats" className="nav-messages">
              Messages {unread > 0 && <span className="unread-badge nav-unread-badge">{unread}</span>}
            </Link>
            <Link to="/profile">My Profile</Link>
            <span className="nav-user">Hi, {auth.profile.name}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        )}

        {auth && auth.role === 'org' && (
          <>
            <Link to="/org/dashboard">Dashboard</Link>
            <span className="nav-user nav-org-badge">
              {auth.profile.logo && <img className="nav-org-logo" src={`/uploads/${auth.profile.logo}`} alt="" />}
              {auth.profile.name}
            </span>
            <button onClick={handleLogout}>Logout</button>
          </>
        )}

        {auth && auth.role === 'admin' && (
          <>
            <Link to="/admin/dashboard">Admin Panel</Link>
            <button onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}
