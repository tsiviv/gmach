import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/sidebar.css';
import { FaUsers, FaMoneyBillWave, FaHandHoldingUsd, FaExchangeAlt } from 'react-icons/fa';

export default function Sidebar() {
  const linkClass = ({ isActive }) => "nav-link " + (isActive ? "active" : "");

  return (
    <div className="sidebar" dir="rtl">
      <div className="navside flex-column gap-5">
        <div className="nav-item">
          <NavLink to="/people" className={linkClass}>
             <p className='p-icon'>ניהול אנשים</p> <FaUsers />
          </NavLink>
        </div>
        <div className="nav-item">
          <NavLink to="/loans" className={linkClass}>
            <p className='p-icon'>ניהול הלוואות</p>  <FaMoneyBillWave />
          </NavLink>
        </div>
        <div className="nav-item">
          <NavLink to="/repayments" className={linkClass}>
            <p className='p-icon'>ניהול תשלומים</p>  <FaHandHoldingUsd />
          </NavLink>
        </div>
        <div className="nav-item">
          <NavLink to="/FundMovments" className={linkClass}>
            <p className='p-icon'>ניהול תנועות</p> <FaExchangeAlt /> 
          </NavLink>
        </div>
        <div className="nav-item">
          <NavLink to="/Deposit" className={linkClass}>
            <p className='p-icon'>ניהול פקדונות</p> <FaExchangeAlt /> 
          </NavLink>
        </div>
        <div className="nav-item">
          <NavLink to="/Turns" className={linkClass}>
            <p className='p-icon'>ניהול תורים</p> <FaExchangeAlt /> 
          </NavLink>
        </div>
      </div>
    </div>
  );
}
