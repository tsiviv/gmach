import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaSyncAlt } from 'react-icons/fa';
import TooltipWrapper from './TooltipWrapper'; // ודא נתיב נכון
import '../styles/Header.css';
import { updateLoanStatusApi } from '../servieces/Loans';

export default function Header() {
  const navigate = useNavigate();
  const [token, settoken] = useState();

  useEffect(() => {
    settoken(sessionStorage.getItem('token'));
  }, []);

  const logout = () => {
    sessionStorage.removeItem('token');
    settoken(null);
    navigate('/');
  };

  const refresh = async () => {
    try {
      console.log(await updateLoanStatusApi())
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <header className="header p-4 d-flex align-items-center" dir="rtl">
      <div className="name fw-bold fs-2 w-50">גמ"ח חסד יחיאל</div>
      <div className="part2 w-50 d-flex align-items-center gap-5">

        <TooltipWrapper text="התראות">
          <NavLink to="/Notification" style={{ fontSize: '1.3rem', cursor: 'pointer' }}>🔔</NavLink>
        </TooltipWrapper>

          <NavLink to="/Explaination">הסבר שימוש</NavLink>

          {token ? (
            <button className="btn btn-sm" onClick={logout}>התנתק</button>
          ) : (
            <button className="btn btn-sm" onClick={() => navigate('/')}>התחבר</button>
          )}

        <TooltipWrapper text="עדכון סטטוס הלוואות">
          <FaSyncAlt
            onClick={refresh}
            style={{
              cursor: 'pointer',
              fontSize: '24px',
              color: '#007bff',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(90deg)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(0deg)'}
          />
        </TooltipWrapper>

      </div>
    </header>
  );
}
