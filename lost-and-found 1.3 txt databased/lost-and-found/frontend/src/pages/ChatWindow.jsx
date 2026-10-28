import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext.jsx';

export default function ChatWindow() {
  const { id } = useParams();
  const { auth } = useAuth();
  const [data, setData] = useState(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const isFirstLoad = useRef(true);

  function load(scrollToBottom) {
    api
      .get(`/chat/conversations/${id}/messages`)
      .then((res) => {
        setData(res.data);
        if (scrollToBottom) {
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: isFirstLoad.current ? 'auto' : 'smooth' }), 50);
          isFirstLoad.current = false;
        }
      })
      .catch(() => setError('Could not load this conversation.'));
  }

  useEffect(() => {
    load(true);
    const t = setInterval(() => load(true), 4000); // poll for new messages every 4s
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post(`/chat/conversations/${id}/messages`, { text });
      setText('');
      load(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
  }

  if (error) return <p className="error page">{error}</p>;
  if (!data) return <p className="page">Loading...</p>;

  const myId = auth.profile.id;

  return (
    <div className="page chat-window-page">
      <Link to="/chats">&larr; All messages</Link>
      <div className="chat-window-header">
        <h2>{data.otherName}</h2>
        <p className="meta">
          About: <Link to={`/items/${data.itemId}`}>{data.itemTitle}</Link>
        </p>
      </div>

      <div className="chat-thread">
        {data.messages.length === 0 && <p className="empty-state">Say hello to start the conversation.</p>}
        {data.messages.map((m) => (
          <div key={m.id} className={`chat-bubble-row ${m.senderId === myId ? 'mine' : 'theirs'}`}>
            <div className="chat-bubble">
              <p>{m.text}</p>
              <span className="chat-bubble-time">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-bar" onSubmit={handleSend}>
        <input
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
        <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>Send</button>
      </form>
    </div>
  );
}
