import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/Header.css'
export default function Header({ username, onLogout }) {
  return (
    <header className="header p-4 d-flex  align-items-center" dir="rtl">
      <div className="name fw-bold fs-2 w-50">גמ"ח חסד יחיאל</div>
      <div className="part2 w-50 d-flex align-items-center">
        <NavLink to="/Notification" style={{ fontSize: '1.3rem', cursor: 'pointer' }}>🔔</NavLink>
        <NavLink to="/Explaination">הסבר שימוש</NavLink>
        <button className="btn  btn-sm" onClick={onLogout}>התנתק</button>
      </div>
    </header>

  );
}
