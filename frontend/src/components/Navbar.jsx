import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, LogOut, Wallet, History as HistoryIcon, User, ShieldAlert } from 'lucide-react';
import logoImg from '../assets/EAA8607F-0D59-4525-A5EE-4E9736CABD0A.png';

const API_URL = "https://deuxmoon-api.onrender.com";

export default function Navbar({ user, onLogout, onOpenAuth, onOpenTopup }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expiringCount, setExpiringCount] = useState(0);

  // ดึงข้อมูลประวัติมาเช็ควันหมดอายุ
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      fetch(`${API_URL}/history`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(result => {
          if (result.status === 'success') {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            
            const expiringItems = result.data.filter(item => {
              if (!item.expire_date) return false;
              const expDate = new Date(item.expire_date.split(' ')[0]);
              const diffTime = expDate - now;
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays >= 0 && diffDays <= 3;
            });
            setExpiringCount(expiringItems.length);
          }
        }).catch(() => {});
    } else {
      setExpiringCount(0);
    }
  }, [user]);

  return (
    <nav className={`navbar ${isMobileMenuOpen ? 'mobile-active' : ''}`} id="main-nav">
      <div className="brand">
        <Link to="/">
          <img src={logoImg} alt="Deuxmoon Logo" style={{ height: '95px', borderRadius: '8px' }} />
        </Link>
      </div>
      
      <div className="hamburger" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        <span></span><span></span><span></span>
      </div>

          {!user ? (
            <div className="user-menu" id="menu-guest">
              <button className="btn-buy btn-netflix" style={{ padding: '8px 16px', width: 'auto' }} onClick={onOpenAuth}>
                <LogIn size={18} /> เข้าสู่ระบบ
              </button>
            </div>
          ) : (
            <div className="user-menu" id="menu-logged-in">
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{user.email.split('@')[0]}</span>
              <div className="wallet-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wallet size={16} color="var(--theme-orange)" />
                <span>เครดิต: <span className="wallet-amount">{parseFloat(user.credit_balance).toFixed(2)}</span> THB</span>
              </div>
              
              <button className="btn-topup" onClick={onOpenTopup}>เติมเงิน</button>

              {/* ปุ่มโปรไฟล์ */}
              <Link to="/profile" style={{ textDecoration: 'none' }}>
                <button className="btn-topup" style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} /> โปรไฟล์
                </button>
              </Link>

              {/* ปุ่มเมนูสำหรับ Admin (ซ่อนจาก User ทั่วไป) */}
              {user.role === 'admin' && (
                <>
                  <Link to="/admin/dashboard" style={{ textDecoration: 'none' }}>
                    <button className="btn-topup" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.5)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BarChart3 size={16} /> สถิติร้าน
                    </button>
                  </Link>
                    <Link to="/admin/pending-reset" style={{ textDecoration: 'none' }}>
                    <button className="btn-topup" style={{ background: 'linear-gradient(135deg, #ff9e2c 0%, #ff6d00 100%)', color: '#111', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldAlert size={16} /> จัดการสต็อก
                    </button>
                  </Link>
                </>
              )}
              
              <Link to="/history" style={{ textDecoration: 'none' }}>
                <button className="btn-topup" style={{ background: 'var(--netflix-btn)', display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                  <HistoryIcon size={16} /> ประวัติ
                  {expiringCount > 0 && (
                    <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ff4d4d', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '2px solid #1a1a2e' }}>
                      {expiringCount}
                    </span>
                  )}
                </button>
              </Link>
              <button className="btn-buy" style={{ background: '#333', padding: '8px 16px', width: 'auto' }} onClick={onLogout}>
                <LogOut size={18} /> ออก
              </button>
            </div>
          )}
    </nav>
  );
}