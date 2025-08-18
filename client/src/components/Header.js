import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaSyncAlt, FaBell, FaClock, FaEdit } from 'react-icons/fa';
import TooltipWrapper from './TooltipWrapper';
import '../styles/Header.css';
import { updateLoanStatusApi } from '../servieces/Loans';
import { updateSiteTitle, uploadLogo, getSiteDetails } from '../servieces/Login'

export default function Header() {
  const navigate = useNavigate();
  const [token, settoken] = useState(sessionStorage.getItem('token') || null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [hoverLogo, setHoverLogo] = useState(false);
  const [hoverTitle, setHoverTitle] = useState(false);
  const [titleChange, setTitleChange] = useState(false);
  const fileInputRef = useRef(null);
  const [siteTitle, setSiteTitle] = useState(sessionStorage.getItem('siteTitle') || "hi");
  const [logoUrl, setLogoUrl] = useState(`http://localhost:4000/uploads/logo.png?token=${sessionStorage.getItem('token')}`);

  useEffect(() => {
    const siteTitle = sessionStorage.getItem("siteTitle") || "ניהול גמח";
    document.title = siteTitle;
  }, [titleChange]);

  useEffect(() => {
    const onStorageChange = () => {
      const tokenFromStorage = sessionStorage.getItem("token");
      settoken(tokenFromStorage);
    };

    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, []);


  useEffect(() => {
    if (!token) return;

    const fetchDetails = async () => {
      try {
        const data = await getSiteDetails();
        if (data.name) {
          setSiteTitle(data.name);
          sessionStorage.setItem('siteTitle', data.name);
        }
        if (data.logo) {
          setLogoUrl(`http://localhost:4000/uploads/logo.png?token=${token}`);
        }
      } catch (error) {
        console.error('שגיאה בקבלת פרטי האתר:', error);
      }
    };

    fetchDetails();
  }, [token]); // יפעל רק כשהtoken נטען


  const logout = () => {
    sessionStorage.removeItem('token');
    settoken(null);
    navigate('/');
  };

  const refresh = async () => {
    try {
      console.log(await updateLoanStatusApi());
    } catch (e) {
      console.log(e);
    }
  };

  const handleLogoClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await uploadLogo(file, siteTitle);
      const data = await getSiteDetails();
      setLogoUrl(`http://localhost:4000/uploads/logo.png?token=${token}&t=${Date.now()}`);
      sessionStorage.setItem('logoUrl', data.logo);
    } catch (error) {
      console.error('שגיאה בהעלאת לוגו:', error);
    }
  };

  const saveTitle = async () => {
    setEditingTitle(false);
    try {
      await updateSiteTitle(siteTitle);
      sessionStorage.setItem('siteTitle', siteTitle);
      setTitleChange(titleChange ? false : true)
    } catch (e) {
      console.error('שגיאה בעדכון השם:', e);
    }
  };


  return (
    <header className="header p-4 d-flex align-items-center" dir="rtl">
      <div className="name fw-bold fs-2 w-50 d-flex align-items-center gap-2">

        <div
          onMouseEnter={() => setHoverLogo(true)}
          onMouseLeave={() => setHoverLogo(false)}
          style={{ position: 'relative', cursor: 'pointer', marginLeft: "30px" }}
          onClick={handleLogoClick}
        >
          <img
            src={logoUrl}
            alt="logo"
            style={{ height: '70px', width: '70px', objectFit: 'contain' }}
          />
          {hoverLogo && (
            <FaEdit
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                color: '#007bff',
                background: '#fff',
                borderRadius: '50%',
                fontSize: '0.8rem',
              }}
            />
          )}
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>

        <div
          onMouseEnter={() => setHoverTitle(true)}
          onMouseLeave={() => setHoverTitle(false)}
          style={{ position: 'relative' }}
        >
          {editingTitle ? (
            <input
              type="text"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
              autoFocus
              className="form-control form-control-sm"
            />
          ) : (
            <span onClick={() => setEditingTitle(true)} style={{ cursor: 'pointer' }}>
              {siteTitle}
              {hoverTitle && (
                <FaEdit style={{ marginRight: 5, fontSize: '0.8rem', color: '#007bff' }} />
              )}
            </span>
          )}
        </div>
      </div>

      <div className="part2 w-50 d-flex align-items-center gap-5">

        <TooltipWrapper text="התראות">
          <NavLink to="/Notification" style={{ fontSize: '1.3rem', cursor: 'pointer' }}>
            <FaBell />
          </NavLink>
        </TooltipWrapper>

        <TooltipWrapper text="תזכורות">
          <NavLink to="/MonthlyChecksNotification" style={{ fontSize: '1.3rem', cursor: 'pointer' }}>
            <FaClock />
          </NavLink>
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
