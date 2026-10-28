import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="hero">
      <h1>Lost something? Found something?</h1>
      <p>
        FindIt connects people within the same college, university, hospital or company —
        so lost items find their way back home.
      </p>
      <div className="hero-actions">
        <Link to="/organizations" className="btn btn-primary">Browse Organizations</Link>
        <Link to="/org/register" className="btn btn-outline">Register Your Organization</Link>
      </div>

      <div className="hero-steps">
        <div className="step">
          <h3>1. Pick your organization</h3>
          <p>Select your college, university, hospital or company from the list.</p>
        </div>
        <div className="step">
          <h3>2. Create a free account</h3>
          <p>Sign up as a member of that organization in a few seconds.</p>
        </div>
        <div className="step">
          <h3>3. Post or find items</h3>
          <p>Report a lost item, or post something you found — and connect directly.</p>
        </div>
      </div>
    </div>
  );
}
