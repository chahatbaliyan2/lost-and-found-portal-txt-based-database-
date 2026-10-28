import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext.jsx';

export default function ItemDetail() {
  const { id } = useParams();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const [chatError, setChatError] = useState('');
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    api
      .get(`/items/${id}`)
      .then((res) => setItem(res.data))
      .catch(() => setError('Item not found.'));
  }, [id]);

  if (error) return <p className="error page">{error}</p>;
  if (!item) return <p className="page">Loading...</p>;

  const isOwner = auth && auth.role === 'user' && auth.profile.id === item.userId;
  const canChat = auth && auth.role === 'user' && !isOwner;

  async function handleResolve() {
    await api.put(`/items/${id}/resolve`);
    setItem({ ...item, status: 'resolved' });
  }

  async function handleDelete() {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    await api.delete(`/items/${id}`);
    navigate('/my-items');
  }

  async function handleChat() {
    setChatError('');
    setStartingChat(true);
    try {
      const res = await api.post('/chat/start', { itemId: id });
      navigate(`/chats/${res.data.id}`);
    } catch (err) {
      setChatError(err.response?.data?.message || 'Could not start chat.');
    } finally {
      setStartingChat(false);
    }
  }

  return (
    <div className="page item-detail">
      <Link to={`/organizations/${item.orgId}`}>&larr; Back to items</Link>

      <div className="item-detail-grid">
        <div className="item-photo-large">
          {item.photo ? <img src={`/uploads/${item.photo}`} alt={item.title} /> : <div className="no-photo">No Photo</div>}
        </div>
        <div>
          <span className={`badge ${item.category}`}>{item.category === 'lost' ? 'Lost' : 'Found'}</span>
          <h2>{item.title}</h2>
          <p>{item.description}</p>
          <p className="meta">Posted by {item.postedBy} on {new Date(item.createdAt).toLocaleDateString()}</p>
          {item.orgName && <p className="meta">at <Link to={`/organizations/${item.orgId}`}>{item.orgName}</Link></p>}

          {item.status === 'resolved' && <p className="badge resolved">Already resolved</p>}

          {isOwner && (
            <div className="owner-actions">
              <Link to={`/items/${id}/edit`} className="btn-small btn-outline-small">Edit</Link>
              {item.status !== 'resolved' && (
                <button className="btn-small btn-success" onClick={handleResolve}>Mark Resolved</button>
              )}
              <button className="btn-small btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          )}

          <div className="contact-box">
            {item.contactVisible ? (
              <>
                <h4>Contact Info</h4>
                <p>{item.contactInfo || 'No contact info was provided by the poster.'}</p>
              </>
            ) : (
              <p>
                <Link to="/login">Login</Link> to view contact details and reach out to the poster.
              </p>
            )}
            {canChat && (
              <button className="btn btn-outline chat-cta" onClick={handleChat} disabled={startingChat}>
                💬 {startingChat ? 'Starting chat...' : 'Chat with poster'}
              </button>
            )}
            {chatError && <p className="error">{chatError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
