import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Swal from 'sweetalert2';
import { LogIn, UserPlus, KeyRound, QrCode, Upload, XCircle, ShieldCheck } from 'lucide-react';

import AdminPendingReset from './pages/AdminPendingReset';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import History from './pages/History';
import AdminDashboard from './pages/AdminDashboard';

import qrImg from './assets/my-qr.jpg'; 

// Component สำหรับป้องกันสิทธิ์ Admin
const AdminRoute = ({ user, children }) => {
  // ถ้ายังไม่ล็อกอิน หรือไม่ได้เป็น admin ให้ดีดกลับหน้าหลักทันที
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

const API_URL = "https://deuxmoon-api.onrender.com";

function App() {
  const [user, setUser] = useState(null);
  
  const [showAuth, setShowAuth] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [slipFile, setSlipFile] = useState(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      setUser(JSON.parse(userStr));
      try {
        const response = await fetch(`${API_URL}/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.status === 'success') {
          setUser(result.data);
          localStorage.setItem('user', JSON.stringify(result.data));
        } else if (result.message === 'เซสชันหมดอายุ กรุณาล็อกอินใหม่') {
          handleLogout();
        }
      } catch (e) { console.log("ใช้งานออฟไลน์ หรือเซิร์ฟเวอร์ช้า"); }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    Swal.fire({
      icon: 'success', title: 'ออกจากระบบแล้ว', toast: true,
      position: 'top-end', showConfirmButton: false, timer: 1500,
      background: '#1a1a2e', color: '#fff'
    });
  };

  const handleAuthSubmit = async () => {
    if (!email || !password) return Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ครบ', background: '#1a1a2e', color: '#fff' });
    if ((authMode === 'register' || authMode === 'reset') && !pin) return Swal.fire({ icon: 'warning', title: 'กรุณากรอก PIN', background: '#1a1a2e', color: '#fff' });

    try {
      Swal.fire({ title: 'กำลังโหลด...', allowOutsideClick: false, background: '#1a1a2e', color: '#fff', didOpen: () => Swal.showLoading() });
      
      let endpoint = authMode === 'login' ? '/login' : (authMode === 'register' ? '/register' : '/reset-password');
      let body = {};
      
      if (authMode === 'login') body = { email, password };
      if (authMode === 'register') body = { email, password, recovery_pin: pin };
      if (authMode === 'reset') body = { email, new_password: password, recovery_pin: pin };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await res.json();

      if (result.status === 'success') {
        if (authMode === 'login') {
          localStorage.setItem('token', result.token);
          localStorage.setItem('user', JSON.stringify(result.data));
          checkLoginStatus();
          setShowAuth(false);
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'เข้าสู่ระบบสำเร็จ!', showConfirmButton: false, timer: 2000, background: '#1a1a2e', color: '#fff' });
        } else {
          Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: result.message, background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' });
          setAuthMode('login'); setPassword(''); setPin('');
        }
      } else {
        Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: result.message, background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' });
    }
  };

  const handleTopup = async () => {
    if (!slipFile) return Swal.fire({ icon: 'warning', title: 'ไม่พบไฟล์', text: 'กรุณาเลือกไฟล์ภาพสลิปโอนเงินก่อนครับ', background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' });
    
    const formData = new FormData();
    formData.append('slip', slipFile); 

    try {
      Swal.fire({ title: 'กำลังตรวจสอบสลิป...', text: 'กรุณารอสักครู่', allowOutsideClick: false, background: '#1a1a2e', color: '#fff', didOpen: () => Swal.showLoading() });
      const res = await fetch(`${API_URL}/topup`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData 
      });
      const result = await res.json();

      if (result.status === 'success') {
        Swal.fire({ icon: 'success', title: 'เติมเงินสำเร็จ!', text: result.message, background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' });
        const updatedUser = { ...user, credit_balance: result.new_balance };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setShowTopup(false); setSlipFile(null);
      } else {
        Swal.fire({ icon: 'error', title: 'ตรวจสลิปไม่ผ่าน', text: result.message, background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'การตรวจสอบล้มเหลว', background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' });
    }
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar user={user} onLogout={handleLogout} onOpenAuth={() => setShowAuth(true)} onOpenTopup={() => setShowTopup(true)} />

        <Routes>
          <Route path="/" element={<Home user={user} setUser={setUser} openAuth={() => setShowAuth(true)} />} />
          <Route path="/history" element={<History user={user} />} />
          <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
          <Route path="/admin/pending-reset" element={<AdminRoute user={user}><AdminPendingReset /></AdminRoute>}/>
          <Route path="/admin/dashboard" element={<AdminRoute user={user}><AdminDashboard /></AdminRoute>} /></Routes>

        {showAuth && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ textAlign: 'center' }}>
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {authMode === 'login' ? <><LogIn size={24}/> เข้าสู่ระบบ</> : (authMode === 'register' ? <><UserPlus size={24}/> สมัครสมาชิก</> : <><KeyRound size={24}/> รีเซ็ตรหัสผ่าน</>)}
              </h3>
              
              <input type="email" placeholder="username" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder={authMode === 'login' ? 'รหัสผ่าน' : (authMode === 'register' ? 'ตั้งรหัสผ่าน' : 'ตั้งรหัสผ่านใหม่')} value={password} onChange={(e) => setPassword(e.target.value)} />
              
              {authMode !== 'login' && (
                <input type="text" placeholder={authMode === 'register' ? 'ตั้งรหัส PIN 4 หลัก' : 'กรอกรหัส PIN เพื่อยืนยัน'} maxLength="4" value={pin} onChange={(e) => setPin(e.target.value)} />
              )}
              
              <button className={`btn-buy ${authMode === 'register' ? 'btn-netflix' : 'btn-disney'}`} style={authMode === 'reset' ? { background: '#e67e22'} : {}} onClick={handleAuthSubmit}>
                {authMode === 'login' ? <><LogIn size={18}/> เข้าสู่ระบบ</> : (authMode === 'register' ? <><ShieldCheck size={18}/> ยืนยันสมัครสมาชิก</> : <><KeyRound size={18}/> รีเซ็ตรหัสผ่านใหม่</>)}
              </button>
              
              <div style={{ marginTop: '15px', fontSize: '14px', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setPassword(''); setPin(''); }}>
                {authMode === 'login' ? 'ยังไม่มีบัญชี? กดที่นี่เพื่อสมัครสมาชิก' : (authMode === 'register' ? 'มีบัญชีแล้ว? กดที่นี่เพื่อเข้าสู่ระบบ' : 'กลับไปหน้าเข้าสู่ระบบ')}
              </div>
              
              {authMode === 'login' && (
                <div style={{ marginTop: '10px', fontSize: '14px', color: '#ffb74d', cursor: 'pointer' }} onClick={() => { setAuthMode('reset'); setPassword(''); setPin(''); }}>
                  ลืมรหัสผ่าน?
                </div>
              )}
              
              <button className="btn-buy" style={{ background: 'transparent', border: '1px solid #555', marginTop: '15px', color: '#ccc' }} onClick={() => setShowAuth(false)}>
                <XCircle size={18}/> ยกเลิก
              </button>
            </div>
          </div>
        )}

        {showTopup && (
          <div className="modal-overlay">
            <div className="topup-modal" style={{ display: 'block' }}>
              <h2 style={{color: 'var(--theme-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                <QrCode size={24}/> ระบบเติมเงิน
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>สแกน QR Code เพื่อเติมเครดิต</p>
              <img src={qrImg} alt="QR Code รับเงิน" style={{ width: '200px', height: '200px', margin: '0 auto 20px', borderRadius: '10px', display: 'block', objectFit: 'cover' }} />
              <input type="file" onChange={(e) => setSlipFile(e.target.files[0])} style={{ marginBottom: '15px', width: '100%' }} />
              <button className="btn-buy btn-disney" style={{ width: '100%' }} onClick={handleTopup}>
                <Upload size={18}/> ตรวจสอบสลิป
              </button>
              <button className="btn-buy" style={{ background: 'transparent', border: '1px solid #555', marginTop: '10px', width: '100%', color: '#ccc' }} onClick={() => setShowTopup(false)}>
                <XCircle size={18}/> ยกเลิก
              </button>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;