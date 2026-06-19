import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { User, Key, Gift, Award, Wallet, ShieldAlert } from 'lucide-react';

const API_URL = "https://deuxmoon-api.onrender.com";

export default function Profile({ user, setUser }) {
    const navigate = useNavigate();
    const [promoCode, setPromoCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loadingPromo, setLoadingPromo] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);

    if (!user) {
        return (
            <div className="profile-container" style={{ textAlign: 'center', marginTop: '50px' }}>
                <p>กรุณาเข้าสู่ระบบก่อนใช้งานหน้านี้ครับ</p>
                <button className="btn-back" onClick={() => navigate('/')}>กลับหน้าหลัก</button>
            </div>
        );
    }

    const handleClaimPromo = async (e) => {
        e.preventDefault();
        if (!promoCode.strip) {
            if (!promoCode.trim()) return;
        }
        
        setLoadingPromo(true);
        try {
            const res = await fetch(`${API_URL}/claim-promo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ code: promoCode.trim() })
            });
            const result = await res.json();

            if (result.status === 'success') {
                Swal.fire({ icon: 'success', title: 'สำเร็จ', text: result.message, background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' });
                const updatedUser = { ...user, credit_balance: result.new_balance };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setPromoCode('');
            } else {
                Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: result.message, background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' });
        } finally {
            setLoadingPromo(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน', background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' });
        }
        if (newPassword.length < 6) {
            return Swal.fire({ icon: 'warning', title: 'รหัสผ่านสั้นเกินไป', text: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' });
        }

        setLoadingPassword(true);
        try {
            const res = await fetch(`${API_URL}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ new_password: newPassword })
            });
            const result = await res.json();

            if (result.status === 'success') {
                Swal.fire({ icon: 'success', title: 'สำเร็จ', text: result.message, background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' });
                setNewPassword('');
                setConfirmPassword('');
            } else {
                Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: result.message, background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' });
        } finally {
            setLoadingPassword(false);
        }
    };

    const openMyCodes = async () => {
        Swal.fire({ title: 'กำลังโหลด...', background: '#1a1a2e', color: '#fff', didOpen: () => Swal.showLoading() });
        try {
            const res = await fetch("https://deuxmoon-api.onrender.com/my-codes", { // อย่าลืมแก้ URL ถ้าเทสในเครื่อง
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const result = await res.json();
            
            if (result.status === 'success') {
                if (result.data.length === 0) {
                    return Swal.fire({ icon: 'info', title: 'กระเป๋าว่างเปล่า', text: 'คุณยังไม่มีโค้ดรางวัลที่ยังไม่ได้ใช้งานครับ', background: '#1a1a2e', color: '#fff' });
                }
                
                let htmlList = '<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">';
                result.data.forEach((c) => {
                    htmlList += `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="text-align: left;">
                            <div style="color: #ff9e2c; font-weight: bold; font-size: 16px; letter-spacing: 1px;">${c.code}</div>
                            <div style="color: #00dc5a; font-size: 13px;">
                                ${c.discount_percent ? 'ส่วนลด ' + c.discount_percent + '% (ซื้อครั้งถัดไป)' : 'มูลค่า ' + c.amount + ' บาท'}
                            </div>
                        </div>
                        <button onclick="navigator.clipboard.writeText('${c.code}'); this.innerText='คัดลอกแล้ว!'; this.style.background='#00dc5a'; this.style.color='#111';" style="background: rgba(255,255,255,0.1); border: 1px solid #555; color: #fff; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: 0.3s;">คัดลอก</button>
                    </div>`;
                });
                htmlList += '</div>';
                
                Swal.fire({
                    title: '🎁 กระเป๋าโค้ดของคุณ',
                    html: htmlList,
                    background: '#1a1a2e',
                    color: '#fff',
                    showConfirmButton: false,
                    showCloseButton: true
                });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'ดึงข้อมูลล้มเหลว', background: '#1a1a2e', color: '#fff' });
        }
    };

    const totalSpent = parseFloat(user.total_spent || 0);
    const currentProgress = totalSpent % 200; // หาเศษที่ต้องสะสมในรอบปัจจุบัน
    const progressPercent = (currentProgress / 200) * 100;
    const isReseller = user.role === 'reseller';

    return (
        <div className="profile-container">
            <button className="btn-back" onClick={() => navigate('/')}>กลับหน้าหลัก</button>
        
            <h2 className="section-title">ข้อมูลบัญชีผู้ใช้</h2>

            {/* ส่วนข้อมูลทั่วไป */}
            <div className="profile-card">
                <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-orange)' }}><User size={18}/> ข้อมูลส่วนตัว</h3>
                <div className="profile-info-row">
                    <span style={{ color: '#888' }}>อีเมลใช้งาน:</span>
                    <span>{user.email}</span>
                </div>
                <div className="profile-info-row">
                    <span style={{ color: '#888' }}>ประเภทบัญชี:</span>
                    <span style={{ 
                        color: user.role === 'admin' ? '#ff9e2c' : (isReseller ? '#ff4d4d' : '#00dc5a'), 
                        fontWeight: 'bold' 
                }}>
                        {user.role === 'admin' ? 'Admin (ผู้ดูแลระบบ)' : (isReseller ? 'Reseller (ราคาส่ง)' : 'Member (ทั่วไป)')}
                    </span>
                </div>
                <div className="profile-info-row" style={{ borderBottom: 'none' }}>
                    <span style={{ color: '#888' }}>เครดิตคงเหลือ:</span>
                    <span style={{ color: 'var(--theme-orange)', fontWeight: 'bold' }}>{parseFloat(user.credit_balance).toFixed(2)} THB</span>
                </div>
            </div>

            {/* ส่วนระบบสะสมแต้ม */}
            {!isReseller && (
                <div className="profile-card">
                    <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-orange)' }}><Award size={18}/> ระบบสะสมยอดการซื้อสำเร็จ</h3>
                    <p style={{ fontSize: '14px', color: '#bbb' }}>ซื้อสินค้าครบทุกๆ 200 บาท รับฟรีทันทีโค้ดส่วนลด 10%</p>
                    
                    <div className="progress-text">
                        {currentProgress.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})} / 200 บาท
                    </div>
                </div>
            )}

            <button 
                onClick={openMyCodes} 
                className="btn-profile" 
                style={{ 
                    width: '100%', 
                    padding: '12px', 
                    marginBottom: '10px', 
                    background: 'rgba(255, 158, 44, 0.1)', 
                    border: '1px dashed #ff9e2c', 
                    color: '#ff9e2c', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: 'bold'
                }}
>
                🎁 กระเป๋าโค้ดรางวัลของฉัน
            </button>

            {/* ส่วนกรอกโค้ดเพิ่มเครดิต */}
            <div className="profile-card">
                <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-orange)' }}><Gift size={18}/> เปิดใช้งานโค้ดกิจกรรม / โค้ดรางวัล</h3>
                {isReseller ? (
                    <div style={{ background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.3)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#ff7373', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldAlert size={16} /> บัญชีประเภทราคาส่งไม่สามารถร่วมกิจกรรมกรอกโค้ดเพิ่มเครดิตได้
                    </div>
                ) : (
                    <form onSubmit={handleClaimPromo} style={{ marginTop: '10px' }}>
                        <input 
                            type="text" 
                            placeholder="กรอกรหัสโค้ด 10 หลัก เช่น DM-XXXXXXXX" 
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            disabled={loadingPromo}
                            required
                        />
                        <button type="submit" className="btn-buy" style={{ marginTop: '10px' }} disabled={loadingPromo}>
                            {loadingPromo ? 'กำลังตรวจสอบ...' : 'เปิดใช้งานโค้ด'}
                        </button>
                    </form>
                )}
            </div>

            {/* ส่วนฟอร์มเปลี่ยนรหัสผ่าน */}
            <div className="profile-card">
                <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-orange)' }}><Key size={18}/> เปลี่ยนรหัสผ่านเข้าสู่ระบบ</h3>
                <form onSubmit={handleChangePassword} style={{ marginTop: '10px' }}>
                    <input 
                        type="password" 
                        placeholder="กรอกรหัสผ่านใหม่" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={loadingPassword}
                        required
                    />
                    <input 
                        type="password" 
                        placeholder="ยืนยันรหัสผ่านใหม่" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loadingPassword}
                        required
                    />
                    <button type="submit" className="btn-buy" style={{ marginTop: '10px', background: '#333', border: '1px solid #555' }} disabled={loadingPassword}>
                        {loadingPassword ? 'กำลังบันทึก...' : 'อัปเดตรหัสผ่านใหม่'}
                    </button>
                </form>
            </div>
        </div>
    );
}