import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Home from './pages/Home.jsx';
import OrgSelect from './pages/OrgSelect.jsx';
import OrgItems from './pages/OrgItems.jsx';
import ItemDetail from './pages/ItemDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PostItem from './pages/PostItem.jsx';
import MyItems from './pages/MyItems.jsx';
import EditItem from './pages/EditItem.jsx';
import Profile from './pages/Profile.jsx';
import Help from './pages/Help.jsx';
import ChatInbox from './pages/ChatInbox.jsx';
import ChatWindow from './pages/ChatWindow.jsx';

import OrgRegister from './pages/OrgRegister.jsx';
import OrgLogin from './pages/OrgLogin.jsx';
import OrgDashboard from './pages/OrgDashboard.jsx';

import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/help" element={<Help />} />
          <Route path="/organizations" element={<OrgSelect />} />
          <Route path="/organizations/:orgId" element={<OrgItems />} />
          <Route path="/items/:id" element={<ItemDetail />} />

          {/* User (member) auth + actions */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/post-item"
            element={
              <ProtectedRoute role="user">
                <PostItem />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-items"
            element={
              <ProtectedRoute role="user">
                <MyItems />
              </ProtectedRoute>
            }
          />
          <Route
            path="/items/:id/edit"
            element={
              <ProtectedRoute role="user">
                <EditItem />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute role="user">
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chats"
            element={
              <ProtectedRoute role="user">
                <ChatInbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chats/:id"
            element={
              <ProtectedRoute role="user">
                <ChatWindow />
              </ProtectedRoute>
            }
          />

          {/* Organization auth + dashboard */}
          <Route path="/org/register" element={<OrgRegister />} />
          <Route path="/org/login" element={<OrgLogin />} />
          <Route
            path="/org/dashboard"
            element={
              <ProtectedRoute role="org">
                <OrgDashboard />
              </ProtectedRoute>
            }
          />

          {/* Super admin auth + dashboard */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </>
  );
}
