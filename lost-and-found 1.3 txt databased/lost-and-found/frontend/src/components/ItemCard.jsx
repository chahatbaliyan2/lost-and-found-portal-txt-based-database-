import React from 'react';
import { Link } from 'react-router-dom';

export default function ItemCard({ item }) {
  return (
    <Link to={`/items/${item.id}`} className="item-card">
      <div className="item-photo">
        {item.photo ? (
          <img src={`/uploads/${item.photo}`} alt={item.title} />
        ) : (
          <div className="no-photo">No Photo</div>
        )}
      </div>
      <div className="item-body">
        <span className={`badge ${item.category}`}>{item.category === 'lost' ? 'Lost' : 'Found'}</span>
        <h3>{item.title}</h3>
        <p>{item.description.slice(0, 80)}{item.description.length > 80 ? '…' : ''}</p>
        {item.status === 'resolved' && <span className="badge resolved">Resolved</span>}
      </div>
    </Link>
  );
}
