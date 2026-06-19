import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AppRulesJSX, getAppRulesText } from './Home';
import { Eye, Copy, User, Key, Wrench, CheckCircle, Info, AlertCircle } from 'lucide-react';

const API_URL = "https://deuxmoon-api.onrender.com";

function getAppInfo(platform, created_at, expire_date) {
    platform = platform || 'unknown'; 
    const apps = {
        'netflix': { name: 'NETFLIX', logo: 'https://commons.wikimedia.org/wiki/Special:FilePath/Netflix_2015_N_logo.svg' },
        'disney': { name: 'DISNEY+', logo: 'https://commons.wikimedia.org/wiki/Special:FilePath/Disney%2B_logo.svg' },
        'iqiyi': { name: 'iQIYI', logo: 'https://play-lh.googleusercontent.com/L40FnQ8nF8zRtUdALz9b23JirsxYA5-0_fkRUlFBMymud09ctBCFrNui4l-ES_V6Uw=w1024' },
        'wetv': { name: 'WeTV', logo: 'https://commons.wikimedia.org/wiki/Special:FilePath/WeTV_logo.svg' },
        'viu': { name: 'Viu', logo: 'https://commons.wikimedia.org/wiki/Special:FilePath/Viu_logo.svg' },
        'prime': { name: 'Prime Video', logo: 'https://commons.wikimedia.org/wiki/Special:FilePath/Amazon_Prime_Video_logo.svg' },
        'hbo': { name: 'HBO Max', logo: 'https://commons.wikimedia.org/wiki/Special:FilePath/Max_logo.svg' },
        'oned': { name: 'OneD', logo: 'https://www.ais.th/content/ais/th/th_th/consumers/entertainment/streaming-app/one-d/_jcr_content/root/container_1816311984/aiscontainer/columncontrol_copy_c/content1/image.coreimg.png/1742182598629/logo-oned-b.png' },
        'ch3': { name: 'Ch3 Plus', logo: 'https://assets.ch3plus.com/ch3plus_logo.png' },
        'bilibili': { name: 'Bilibili', logo: 'https://img.icons8.com/color/1200/bilibili.jpg' },
        'spotify': { name: 'Spotify', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Spotify_icon.svg/1280px-Spotify_icon.svg.png' },
        'canva': { name: 'Canva', logo: 'https://www.edigitalagency.com.au/wp-content/uploads/Canva-logo-PNG-large-size.png' },
        'monomax': { name: 'Mono Max', logo: 'https://img.monomax.me/9RN09HpT5JJlM0gDpIB3EUYJFgg=/www.monomax.me/assets/monomax/images/maxplay/logo-monomax-sm.png' },
        'trueid': { name: 'TrueID+', logo: 'https://img.monomax.me/9RN09HpT5JJlM0gDpIB3EUYJFgg=/www.monomax.me/assets/monomax/images/maxplay/logo-monomax-sm.png' },
        'chatgpt': { name: 'ChatGPT+', logo: 'https://commons.wikimedia.org/wiki/Special:FilePath/ChatGPT_logo.svg' },
        'youtube': { name: 'YouTube Premium', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg' }
    };

    let baseApp = platform; let subText = "แพ็กเกจมาตรฐาน";
    if (baseApp === 'hbo') subText = 'Ultimate';

    if (platform.includes('_')) {
        const parts = platform.split('_'); baseApp = parts[0]; const type = parts[1];
        if (type === 'mobile') subText = 'จอส่วนตัว (มือถือ)';
        else if (type === 'tv') subText = 'จอส่วนตัว (ทีวี)';
        else if (type === 'private') subText = 'บัญชีส่วนตัว';
        else if (type === 'share2') subText = 'หาร 2 ไม่ชน';
        else if (type === 'share3') subText = 'หาร 3';
        else if (type === 'share4') subText = 'หาร 4';
        else if (type === 'share5') subText = 'หาร 5';
        else if (type === 'renew') subText = 'ต่อเมลเดิม';
        else if (type === 'store') subText = 'เมลร้าน (ไม่ต่ออายุ)';
        else if (type === 'customer') subText = 'เมลลูกค้า (ไม่ต่ออายุ)';
        else if (type === 'premprivate') subText = 'Premium (บัญชีส่วนตัว)';
        else if (type === 'premshare4') subText = 'Premium (หาร 4)';
        else if (type === 'sport') subText = 'แพ็กเกจดูบอล';
    }

    let durationText = "";
    if (created_at && expire_date) {
        let days = Math.ceil((new Date(expire_date) - new Date(created_at)) / (1000 * 60 * 60 * 24));
        if (days >= 25) durationText = " 30 วัน";
        else if (days >= 4 && days <= 10) durationText = " 7 วัน";
        else if (days >= 1 && days <= 3) durationText = " 1 วัน";
        else durationText = ` ${days} วัน`;
    }

    return {
        name: (apps[baseApp] ? apps[baseApp].name : platform.toUpperCase()) + durationText,
        logo: apps[baseApp] ? apps[baseApp].logo : 'https://ui-avatars.com/api/?name=' + platform,
        subText: subText
    };
}

function formatThaiDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const d = date.getDate(); const m = months[date.getMonth()]; const y = date.getFullYear() + 543;
    const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    return `${d} ${m} ${y} เวลา ${time} น.`;
}

// เช็คสถานะวันหมดอายุ (แก้ไขปัญหา Timezone บั๊กวันเกิน)
function getExpiryStatus(expireStr) {
    if (!expireStr) return { isExpiring: false, diffDays: 0, isExpired: false };
    
    // 1. ดึงแค่วันที่ (ตัดเวลาทิ้ง) แล้วจับแยก ปี-เดือน-วัน ออกจากกัน
    const dateString = expireStr.split(' ')[0];
    const [year, month, day] = dateString.split('-');
    
    // 2. บังคับสร้าง Date Object ให้เป็นเวลา Local (ไทย) เที่ยงคืนตรง
    const expDate = new Date(year, parseInt(month) - 1, day);
    
    // 3. ดึงวันที่ปัจจุบัน และเซ็ตเป็นเที่ยงคืนตรง
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // 4. นำมาลบกัน แล้วใช้ Math.round (ปัดเศษตามจริง) ป้องกันเศษเวลาเกิน
    const diffTime = expDate - now;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    return {
        isExpiring: diffDays >= 0 && diffDays <= 3,
        diffDays: diffDays,
        isExpired: diffDays < 0
    };
}

export default function History({ user }) {
    const navigate = useNavigate();
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [currentFilter, setCurrentFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire({ icon: 'warning', title: 'กรุณาเข้าสู่ระบบ', text: 'คุณต้องเข้าสู่ระบบก่อนดูประวัติการสั่งซื้อ', background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' }).then(() => navigate('/'));
            return;
        }
        loadHistory(token);
    }, [navigate]);

    const loadHistory = async (token) => {
        try {
            const res = await fetch(`${API_URL}/history`, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await res.json();
            if (result.status === 'success') setHistoryData(result.data);
        } catch (error) { console.error("Error", error); } finally { setLoading(false); }
    };

    const handleFilter = (platform) => { setCurrentFilter(platform); setCurrentPage(1); };

    const filteredData = currentFilter === 'all' ? historyData : historyData.filter(item => item.platform.startsWith(currentFilter));
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const initial = user ? user.email.charAt(0).toUpperCase() : 'U';
    const username = user ? user.email.split('@')[0] : 'User';

    const getDisplayExpire = (expire_date) => {
        if (!expire_date) return '-';
        let dateParts = expire_date.split(' ');
        let d = dateParts[0].split('-'); 
        return (d.length === 3) ? `EXP ${d[2]}-${d[1]}-${d[0]}${dateParts[1] ? ' ' + dateParts[1] : ''}` : expire_date;
    };

    const showToast = (icon, title) => Swal.fire({ toast: true, position: 'top-end', icon, title, showConfirmButton: false, timer: 2000, background: '#1a1a2e', color: '#fff' });

    const fallbackCopy = (text) => {
        const textArea = document.createElement("textarea"); textArea.value = text; textArea.style.position = "fixed"; document.body.appendChild(textArea);
        textArea.focus(); textArea.select();
        try { document.execCommand('copy'); showToast('success', 'คัดลอกข้อมูลสำเร็จ!'); } catch (err) { showToast('error', 'คัดลอกล้มเหลว'); }
        document.body.removeChild(textArea);
    };

    const executeCopy = (text) => {
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => showToast('success', 'คัดลอกข้อมูลสำเร็จ!')).catch(() => fallbackCopy(text));
        else fallbackCopy(text);
    };

    const copyAll = () => {
        if (!selectedItem) return;
        const appInfo = getAppInfo(selectedItem.platform, selectedItem.created_at, selectedItem.expire_date);
        
        let textOutput = `Platform: ${appInfo.name}\n`;
        if (selectedItem.has_warranty) textOutput += `[ สินค้านี้มีประกันเคลมบัญชี ]\n`;
        textOutput += `Account (ล็อกอิน): ${selectedItem.account_login || '-'}\n`;
        if (selectedItem.account_password) textOutput += `รหัสผ่าน: ${selectedItem.account_password}\n`;
        textOutput += `Profile: ${selectedItem.profile_name || '-'}\n`;
        if (selectedItem.pin_code) textOutput += `รหัสเข้าจอ (PIN): ${selectedItem.pin_code}\n`;
        textOutput += `Expire: ${getDisplayExpire(selectedItem.expire_date)}\n\n`;
        
        if (selectedItem.platform.includes('disney')) {
            textOutput += `[ วิธีเข้าสู่ระบบ DISNEY+ (ดึง OTP ด้วยตัวเอง) ]\n1. นำเบอร์โทรศัพท์ไปกรอกในแอปเพื่อขอรับ OTP\n2. เข้าเว็บดึงรหัส (https://script.google.com/macros/s/AKfycbwuCoU1EvLlxuAZxWQeqg4gh5Ut2_130j-yHRL3TjPEr7v4kkAyIc-IyFIrJYHaxQiL/exec?authuser=0)\n   (นำอีเมลและรหัส PIN ไปกรอกเพื่อดึงรหัส)\n3. นำรหัส OTP 4 หลัก กลับไปกรอกเพื่อเริ่มรับชมได้เลยครับ\n\n`;
        }
        textOutput += getAppRulesText(selectedItem.platform);
        executeCopy(textOutput);
    };

    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, currentPage + 1);

    return (
        <div className="history-container">
            <button className="btn-back" onClick={() => navigate('/')} style={{ marginBottom: '20px' }}>กลับหน้าหลัก</button>
            <h2 className="section-title">ประวัติการสั่งซื้อของคุณ</h2>

            <div className="filter-container">
                {['all', 'netflix', 'disney', 'iqiyi', 'wetv', 'viu', 'prime', 'hbo', 'oned', 'ch3', 'bilibili', 'spotify', 'canva', 'monomax', 'trueid', 'chatgpt', 'youtube'].map(app => (
                    <button key={app} className={`filter-btn ${currentFilter === app ? 'active' : ''}`} onClick={() => handleFilter(app)}>
                        {app === 'all' ? 'ทั้งหมด' : (app === 'disney' ? 'Disney+' : (app === 'prime' ? 'Prime Video' : (app === 'youtube' ? 'YouTube Premium' : app.toUpperCase())))}
                    </button>
                ))}
            </div>

            <div id="history-list">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton skeleton-history-card" />)
                ) : currentData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#888', background: 'rgba(28, 12, 50, 0.55)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>ไม่พบประวัติการสั่งซื้อในหมวดหมู่นี้ครับ</div>
                ) : currentData.map((item, i) => {
                    const appInfo = getAppInfo(item.platform, item.created_at, item.expire_date);
                    const expiry = getExpiryStatus(item.expire_date);
                    
                    return (
                        <div className="history-card" key={item.id || i}>
                            <div className="history-header">
                                <div className="user-badge">
                                    <div className="avatar">{initial}</div>
                                    <span style={{ color: '#e0e0e0', fontWeight: 500 }}>{username}</span>
                                </div>
                                <div style={{ color: '#666', fontSize: '11px' }}>Ref: {item.id ? String(item.id).substring(0, 8) : '000'+i}</div>
                            </div>
                            <div className="history-body">
                                <img src={appInfo.logo} className="history-logo" alt="logo" />
                                <div className="history-info">
                                    <div className="history-title">{appInfo.name} {item.has_warranty && <span style={{ color: '#111', background: '#00dc5a', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', fontWeight: 'bold', verticalAlign: 'middle', display: 'inline-flex', alignItems: 'center', gap: '2px' }}><CheckCircle size={10}/> มีประกัน</span>}</div>
                                    <div className="history-sub">{appInfo.subText}</div>
                                    
                                    {/* แจ้งเตือนหมดอายุ */}
                                    {expiry.isExpired ? (
                                        <div style={{ background: 'rgba(100, 100, 100, 0.1)', color: '#888', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '5px' }}><AlertCircle size={12}/> บัญชีหมดอายุแล้ว</div>
                                    ) : expiry.isExpiring ? (
                                        <div style={{ background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '5px' }}><AlertCircle size={12}/> ใกล้หมดอายุ (เหลือ {expiry.diffDays} วัน)</div>
                                    ) : null}

                                </div>
                                <button className="btn-view-details" onClick={() => setSelectedItem(item)}><Eye size={14} /> ดูข้อมูล</button>
                            </div>
                            <div className="history-footer"><span>{formatThaiDate(item.created_at)}</span></div>
                        </div>
                    )
                 })}
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button className="page-btn" disabled={currentPage === 1} onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>«</button>
                    {startPage > 1 && <><button className="page-btn" onClick={() => setCurrentPage(1)}>1</button>{startPage > 2 && <span style={{color:'#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.9)', fontWeight: 'bold', display:'flex', alignItems:'center'}}>...</span>}</>}
                    
                    {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page => (
                        <button key={page} className={`page-btn ${currentPage === page ? 'active' : ''}`} onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{page}</button>
                    ))}
                    
                    {endPage < totalPages && <>{endPage < totalPages - 1 && <span style={{color:'#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.9)', fontWeight: 'bold', display:'flex', alignItems:'center'}}>...</span>}<button className="page-btn" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button></>}
                    <button className="page-btn" disabled={currentPage === totalPages} onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>»</button>
                </div>
            )}

            {selectedItem && (
                <div className="modal-overlay" style={{ display: 'flex' }}>
                    <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto', border: '1px solid #00dc5a' }}>
                        <h2 style={{ color: '#00dc5a', marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}><Info size={20}/> รายละเอียดบัญชี</h2>
                        <div style={{ textAlign: 'left', fontSize: '15px', lineHeight: 1.8, marginTop: '15px', color: 'white' }}>
                            <div style={{ marginBottom: '8px' }}><span style={{ color: '#888' }}>แพลตฟอร์ม:</span> <strong style={{ color: '#fff' }}>{getAppInfo(selectedItem.platform, selectedItem.created_at, selectedItem.expire_date).name}</strong></div>
                            {selectedItem.has_warranty && <div style={{ color: '#00dc5a', fontWeight: 'bold', marginBottom: '8px', padding: '5px', background: 'rgba(0, 220, 90, 0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={16}/> สินค้านี้มีประกันเคลมบัญชี</div>}
                            <div style={{ marginBottom: '8px' }}><span style={{ color: '#888' }}>บัญชี (ล็อกอิน):</span> <strong style={{ color: '#fff' }}>{selectedItem.account_login || '-'}</strong></div>
                            {selectedItem.account_password && <div style={{ marginBottom: '8px' }}><span style={{ color: '#888' }}>รหัสผ่าน:</span> <strong style={{ color: '#00dc5a' }}>{selectedItem.account_password}</strong></div>}
                            <div style={{ marginBottom: '8px' }}><span style={{ color: '#888' }}>เข้าใช้งานจอ:</span> <strong style={{ color: '#fff' }}>{selectedItem.profile_name || '-'}</strong></div>
                            {selectedItem.pin_code && <div style={{ marginBottom: '8px' }}><span style={{ color: '#888' }}>รหัสเข้าจอ (PIN):</span> <strong style={{ color: '#ffb74d' }}>{selectedItem.pin_code}</strong></div>}
                            <div style={{ marginBottom: '8px' }}><span style={{ color: '#888' }}>วันหมดอายุ:</span> <strong style={{ color: '#ff4d4d' }}>{getDisplayExpire(selectedItem.expire_date)}</strong></div>
                            
                            {selectedItem.platform.includes('disney') && (
                                <div style={{ marginTop: '15px', marginBottom: '15px', padding: '15px', background: 'rgba(0, 168, 225, 0.1)', borderLeft: '4px solid #00a8e1', borderRadius: '4px', fontSize: '13px', lineHeight: 1.6, textAlign: 'left', color: '#d6ebff' }}>
                                    <strong style={{ color: '#00a8e1', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Info size={16}/> วิธีเข้าสู่ระบบ DISNEY+ (ดึง OTP ด้วยตัวเอง)</strong><br/><br/>
                                    <b>ขั้นตอนที่ 1:</b> นำ <b>เบอร์โทรศัพท์</b> (จากช่องล็อกอินด้านบน) ไปกรอกในแอปหรือเว็บ Disney+ เพื่อส่งคำขอรับรหัส OTP<br/><br/>
                                    <b>ขั้นตอนที่ 2:</b> เข้าไปที่ <a href="https://script.google.com/macros/s/AKfycbwuCoU1EvLlxuAZxWQeqg4gh5Ut2_130j-yHRL3TjPEr7v4kkAyIc-IyFIrJYHaxQiL/exec?authuser=0" target="_blank" rel="noreferrer" style={{ color: '#ffb74d', textDecoration: 'underline', fontWeight: 'bold' }}>เว็บดึงรหัส OTP (คลิกลิงก์นี้)</a> 
                                    แล้วนำ <b>อีเมล</b> (ในช่องรหัสผ่าน) และ <b>รหัส PIN</b> ไปกรอกเพื่อดึงรหัส<br/><br/>
                                    <b>ขั้นตอนที่ 3:</b> นำรหัส OTP 4 หลัก กลับไปกรอกในแอป Disney+ เพื่อเริ่มรับชมได้เลยครับ
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '20px', textAlign: 'center' }}>
                            {selectedItem.has_warranty && <button onClick={() => window.open('https://lin.ee/9DAHkG0', '_blank')} className="btn-buy" style={{ background: '#ff4d4d', border: 'none', padding: '11px', width: '100%', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', marginBottom: '10px' }}><Wrench size={16}/> แจ้งเคลมบัญชี (ติดต่อADMIN)</button>}
                            <button onClick={copyAll} className="btn-buy" style={{ background: '#00dc5a', border: 'none', padding: '11px', width: '100%', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', marginBottom: '10px' }}><Copy size={16}/> คัดลอกข้อมูลทั้งหมด</button>
                            <div style={{ display: 'table', width: '100%', borderCollapse: 'separate', borderSpacing: '6px 0' }}>
                                <div style={{ display: 'table-cell', width: '50%' }}><button className="btn-buy" onClick={() => executeCopy(selectedItem.account_login || '-')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid #555', padding: '10px', width: '100%', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}><User size={16}/> คัดลอกบัญชี</button></div>
                                <div style={{ display: 'table-cell', width: '50%' }}><button className="btn-buy" onClick={() => executeCopy(selectedItem.account_password || '')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid #555', padding: '10px', width: '100%', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}><Key size={16}/> คัดลอกรหัสผ่าน</button></div>
                            </div>
                        </div>

                        <button onClick={() => setSelectedItem(null)} style={{ marginTop: '20px', background: '#333', color: 'white', border: '1px solid #555', padding: '12px', width: '100%', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' }}>ปิดหน้าต่าง</button>
                    </div>
                </div>
            )}
        </div>
    );
}