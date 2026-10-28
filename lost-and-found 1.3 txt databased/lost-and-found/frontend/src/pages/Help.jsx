import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const FAQS = [
  {
    q: 'How do I find my college / university / hospital / company on FindIt?',
    a: 'Go to "Browse Organizations" from the top menu. You can search by name, or use the filters for type (college, university, hospital, company), state, district and city to narrow it down quickly.',
  },
  {
    q: "My organization isn't listed. What do I do?",
    a: 'Anyone can register a new organization from "Register Your Organization" on the home page. Fill in a good description and full address so people can find and recognise it later — a new organization needs approval from the super admin before it appears in search and before members can join it.',
  },
  {
    q: 'How do I create an account?',
    a: 'Click "User Login" → "Register here". Select your organization from the dropdown (it must already be approved), fill in your details, and you\'re in. You can add your address, city and a short bio too — this is optional.',
  },
  {
    q: 'How do I post a lost or found item?',
    a: 'Once logged in, click "+ Post Item" in the top menu. Choose whether you lost or found something, add a clear title, description, a photo if you have one, and your contact info. Your post will show up under your organization\'s item list.',
  },
  {
    q: 'Who can see my contact info on a post?',
    a: 'Your contact info is hidden from visitors who are not logged in. Once someone logs in with any account, they can see it on the item page and reach out to you — either using that contact info, or by messaging you directly through the built-in chat.',
  },
  {
    q: 'How do I edit or delete something I posted?',
    a: 'Go to "My Items" in the top menu. Every item you\'ve posted is listed there with Edit, Mark Resolved and Delete buttons. You can also do this from the item\'s own detail page if you\'re the one who posted it.',
  },
  {
    q: 'How does the chat work?',
    a: 'On any item\'s detail page, click "Chat with poster" to start a conversation with whoever posted it. All your conversations live under "Messages" in the top menu, with an unread badge so you never miss a reply. Messages refresh automatically every few seconds.',
  },
  {
    q: 'How do I edit my profile?',
    a: 'Click "My Profile" in the top menu to update your name, phone, bio, address, profile photo, or change your password.',
  },
  {
    q: "I run an organization — how do I edit our organization's page?",
    a: 'Log in from "Organization Login", then go to Dashboard → "Organization Profile". You can update your description, full address, phone, website and logo there — this is exactly what people see when they search for you.',
  },
  {
    q: 'What does the super admin do?',
    a: 'The super admin approves or rejects new organizations, and can moderate any organization, member or item on the platform if something goes wrong. If you think content should be reviewed, contact us using the email below.',
  },
];

export default function Help() {
  const [openIndex, setOpenIndex] = useState(0);
  const [supportEmail, setSupportEmail] = useState('');

  useEffect(() => {
    api.get('/meta').then((res) => setSupportEmail(res.data.supportEmail)).catch(() => {});
  }, []);

  return (
    <div className="page help-page">
      <h2>Help & Tutorials</h2>
      <p className="hint">Answers to the most common questions about using FindIt.</p>

      <div className="faq-list">
        {FAQS.map((item, idx) => (
          <div key={idx} className={`faq-item ${openIndex === idx ? 'open' : ''}`}>
            <button className="faq-question" onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}>
              <span>{item.q}</span>
              <span className="faq-caret">{openIndex === idx ? '−' : '+'}</span>
            </button>
            {openIndex === idx && <div className="faq-answer">{item.a}</div>}
          </div>
        ))}
      </div>

      <div className="contact-footer-box">
        <h3>Still need help?</h3>
        <p>
          For anything not covered above — account issues, reporting misuse, or general questions —
          reach out to us directly and our team will get back to you.
        </p>
        <p className="contact-email">
          📧 <a href={`mailto:${supportEmail || 'support@findit.example'}`}>{supportEmail || 'support@findit.example'}</a>
        </p>
        <p className="hint">
          Looking to browse or post instead? Head back to <Link to="/organizations">Browse Organizations</Link>.
        </p>
      </div>
    </div>
  );
}
