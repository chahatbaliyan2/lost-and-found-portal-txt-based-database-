import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function ChatInbox() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api.get('/chat/conversations').then((res) => setConversations(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 8000); // poll for new messages every 8s
    return () => clearInterval(t);
  }, []);

  return (
    <div className="page">
      <h2>Messages</h2>
      {loading && <p>Loading...</p>}
      {!loading && conversations.length === 0 && (
        <p className="empty-state">
          No conversations yet. Open an item and click <strong>Chat with poster</strong> to start one.
        </p>
      )}

      <div className="chat-list">
        {conversations.map((c) => (
          <Link key={c.id} to={`/chats/${c.id}`} className="chat-list-row">
            <div className="chat-list-photo">
              {c.itemPhoto ? <img src={`/uploads/${c.itemPhoto}`} alt="" /> : <div className="no-photo">📦</div>}
            </div>
            <div className="chat-list-info">
              <h3>{c.otherName}</h3>
              <p className="meta">Re: {c.itemTitle}</p>
              <p className="chat-preview">
                {c.lastMessageIsMine && c.lastMessage && <span>You: </span>}
                {c.lastMessage || 'No messages yet — say hello!'}
              </p>
            </div>
            <div className="chat-list-meta">
              {c.updatedAt && <span className="meta">{new Date(c.updatedAt).toLocaleDateString()}</span>}
              {c.unread > 0 && <span className="unread-badge">{c.unread}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
