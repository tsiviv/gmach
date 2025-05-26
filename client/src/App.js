import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import People from './components/People';
import Loans from './components/Loans';
import Repayments from './components/Repayments';
import FundMovments from './components/FundMovments';
import Header from './components/Header';
import Sidebar from './components/Siderbar';
import { Explaination } from './components/Explaination';
import './App.css'; // אם שמת את הסגנון כאן
import './styles/colors.css';

function App() {
  return (
    <Router>
      <div className="layout" dir="rtl">
        <Header username="יוסי" onLogout={() => sessionStorage.setItem('token','')} />
        <div className="layout-body">
          <Sidebar />
          <main className="main">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/FundMovments" element={<FundMovments />} />
              <Route path="/people" element={<People />} />
              <Route path="/loans" element={<Loans />} />
              <Route path="/repayments" element={<Repayments />} />
              <Route path="/Explaination" element={<Explaination />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
