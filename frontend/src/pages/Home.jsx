import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { ShoppingCart, CheckCircle, XCircle, AlertCircle, Info, Star, Flame } from 'lucide-react';

import lineBanner from '../assets/6A5A65BE-E36B-4AA2-B2FD-6818D84945F3.png';
import otpBanner from '../assets/CEB0E771-BCD5-4D0B-B5B3-E37287F4562E.png';

const API_URL = "https://deuxmoon-api.onrender.com";

const appList = [
    { id: 'netflix', name: 'NETFLIX', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Netflix_2015_N_logo.svg' },
    { id: 'youtube', name: 'YouTube Premium', img: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg' },
    { id: 'disney', name: 'DISNEY+', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Disney%2B_logo.svg' },
    { id: 'prime', name: 'Prime Video', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Amazon_Prime_Video_logo.svg' },
    { id: 'iqiyi', name: 'iQIYI', img: 'https://play-lh.googleusercontent.com/L40FnQ8nF8zRtUdALz9b23JirsxYA5-0_fkRUlFBMymud09ctBCFrNui4l-ES_V6Uw=w1024' },
    { id: 'wetv', name: 'WeTV', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/WeTV_logo.svg' },
    { id: 'viu', name: 'Viu', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Viu_logo.svg' },
    { id: 'monomax', name: 'Mono Max', img: 'https://img.monomax.me/9RN09HpT5JJlM0gDpIB3EUYJFgg=/www.monomax.me/assets/monomax/images/maxplay/logo-monomax-sm.png' },
    { id: 'hbo', name: 'HBO Max', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Max_logo.svg' },
    { id: 'trueid', name: 'TrueID+', img: 'https://cms.dmpcdn.com/misc/2022/02/09/af7de880-89ab-11ec-8c0c-590a22d85d91_webp_original.webp' },
    { id: 'bilibili', name: 'Bilibili', img: 'https://img.icons8.com/color/1200/bilibili.jpg' },
    { id: 'oned', name: 'OneD', img: 'https://www.ais.th/content/ais/th/th_th/consumers/entertainment/streaming-app/one-d/_jcr_content/root/container_1816311984/aiscontainer/columncontrol_copy_c/content1/image.coreimg.png/1742182598629/logo-oned-b.png' },
    { id: 'ch3', name: 'Ch3 Plus', img: 'https://assets.ch3plus.com/ch3plus_logo.png' },
    { id: 'spotify', name: 'Spotify', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Spotify_icon.svg/1280px-Spotify_icon.svg.png' },
    { id: 'canva', name: 'Canva', img: 'https://www.edigitalagency.com.au/wp-content/uploads/Canva-logo-PNG-large-size.png' },
    { id: 'chatgpt', name: 'ChatGPT+', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/ChatGPT_logo.svg' }
];

const packagesConfig = {
    'netflix_mobile': [{ p: 'netflix_mobile', d: 1, label: 'มือถือ - 1 วัน' }, { p: 'netflix_mobile', d: 7, label: 'มือถือ - 7 วัน' }, { p: 'netflix_mobile', d: 30, label: 'มือถือ - 30 วัน' }],
    'netflix_tv': [{ p: 'netflix_tv', d: 1, label: 'ทีวี - 1 วัน' }, { p: 'netflix_tv', d: 7, label: 'ทีวี - 7 วัน' }, { p: 'netflix_tv', d: 30, label: 'ทีวี - 30 วัน' }],
    'disney': [{ p: 'disney', d: 1, label: '1 วัน' }, { p: 'disney', d: 7, label: '7 วัน' }, { p: 'disney', d: 30, label: '30 วัน' }],
    'iqiyi_standard': [{ p: 'iqiyi_private', d: 30, label: 'บัญชีส่วนตัว' }, { p: 'iqiyi_share2', d: 30, label: '30 วัน (หาร 2)' }, { p: 'iqiyi_share3', d: 30, label: '30 วัน (หาร 3)' }, { p: 'iqiyi_share4', d: 30, label: '30 วัน (หาร 4)' }],
    'iqiyi_premium': [{ p: 'iqiyi_premprivate', d: 20, label: 'Premium 20 วัน (ส่วนตัว)' }, { p: 'iqiyi_premprivate', d: 30, label: 'Premium 30 วัน (ส่วนตัว)' }, { p: 'iqiyi_premshare4', d: 30, label: 'Premium 30 วัน (หาร 4)' }],
    'wetv': [{ p: 'wetv_private', d: 30, label: 'บัญชีส่วนตัว' }, { p: 'wetv_share2', d: 30, label: '30 วัน (หาร 2)' }, { p: 'wetv_share3', d: 30, label: '30 วัน (หาร 3)' }, { p: 'wetv_share4', d: 30, label: '30 วัน (หาร 4)' }],
    'viu': [{ p: 'viu_private', d: 30, label: 'บัญชีส่วนตัว' }, { p: 'viu_share3', d: 30, label: '30 วัน (หาร 3)' }, { p: 'viu_share4', d: 30, label: '30 วัน (หาร 4)' }],
    'prime': [{ p: 'prime_share3', d: 7, label: '7 วัน (หาร 3)' }, { p: 'prime_share5', d: 7, label: '7 วัน (หาร 5)' }, { p: 'prime_share3', d: 30, label: '30 วัน (หาร 3)' }, { p: 'prime_share5', d: 30, label: '30 วัน (หาร 5)' }],
    'hbo': [{ p: 'hbo', d: 7, label: '7 วัน' }, { p: 'hbo', d: 30, label: '30 วัน' }],
    'oned': [{ p: 'oned_share2', d: 30, label: '30 วัน (หาร 2)' }, { p: 'oned_private', d: 30, label: '30 วัน (ส่วนตัว)' }],
    'ch3': [{ p: 'ch3_share2', d: 30, label: '30 วัน (หาร 2)' }, { p: 'ch3_private', d: 30, label: '30 วัน (ส่วนตัว)' }],
    'bilibili': [{ p: 'bilibili_share3', d: 30, label: '30 วัน (หาร 3)' }, { p: 'bilibili_private', d: 30, label: '30 วัน (ส่วนตัว)' }],
    'spotify': [{ p: 'spotify_renew', d: 30, label: '30 วัน (ต่อเมล)' }, { p: 'spotify_store', d: 60, label: '60 วัน (เมลร้านไม่ต่ออายุ)' }],
    'canva': [{ p: 'canva', d: 7, label: '7 วัน' }, { p: 'canva', d: 30, label: '30 วัน' }],
    'monomax_standard': [{ p: 'monomax', d: 7, label: '7 วัน' }, { p: 'monomax', d: 30, label: '30 วัน' }],
    'monomax_sport': [{ p: 'monomax_sport', d: 7, label: 'ดูบอล 7 วัน' }, { p: 'monomax_sport', d: 30, label: 'ดูบอล 30 วัน' }],
    'trueid': [{ p: 'trueid', d: 30, label: '30 วัน' }],
    'chatgpt': [{ p: 'chatgpt_private', d: 30, label: '30 วัน (ส่วนตัว)' }, { p: 'chatgpt_share4', d: 30, label: '30 วัน (หาร 4)' }],
    'youtube': [{ p: 'youtube_customer', d: 30, label: '30 วัน (เมลลูกค้า)' }, { p: 'youtube_store', d: 30, label: '30 วัน (เมลร้าน)' }]
};

export default function Home({ user, setUser, openAuth }) {
    const [globalStock, setGlobalStock] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewState, setViewState] = useState({ step: 'apps', appId: null, title: 'เลือกแอปที่ต้องการ', subcats: [], packKey: null });
    const [receiptData, setReceiptData] = useState(null);
    
    // ตั้งค่า Slider
    const banners = [
        { id: 1, src: lineBanner, link: "https://lin.ee/9DAHkG0" },
        { id: 2, src: otpBanner, link: "https://script.google.com/macros/s/AKfycbwuCoU1EvLlxuAZxWQeqg4gh5Ut2_130j-yHRL3TjPEr7v4kkAyIc-IyFIrJYHaxQiL/exec?authuser=0" }
    ];

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_URL}/check-products`);
            const result = await res.json();
            if (result.status === 'success') {
                setGlobalStock(result.data);
            }
        } catch (e) { console.error("Error fetching products", e); } finally {
            setIsLoading(false);
        }
    };

    const handleAppClick = (appId, appName) => {
        const appObj = appList.find(a => a.id === appId);
        const appImg = appObj ? appObj.img : '';

        if (appId === 'netflix') {
            setViewState({ step: 'subcats', appId, title: appName, subcats: [
                { key: 'netflix_mobile', name: 'เลือกแพ็กเกจ มือถือ', img: appImg, title: 'NETFLIX (มือถือ)' },
                { key: 'netflix_tv', name: 'เลือกแพ็กเกจ ทีวี', img: appImg, title: 'NETFLIX (ทีวี)' }
            ]});
        } else if (appId === 'iqiyi') {
            setViewState({ step: 'subcats', appId, title: appName, subcats: [
                { key: 'iqiyi_standard', name: 'แพ็กเกจ มาตรฐาน', img: appImg, title: 'iQIYI (มาตรฐาน)' },
                { key: 'iqiyi_premium', name: 'แพ็กเกจ Premium', img: appImg, title: 'iQIYI (Premium)' }
            ]});
        } else if (appId === 'monomax') {
            setViewState({ step: 'subcats', appId, title: appName, subcats: [
                { key: 'monomax_standard', name: 'แพ็กเกจ ปกติ', img: appImg, title: 'Mono Max (ปกติ)' },
                { key: 'monomax_sport', name: 'แพ็กเกจ ดูบอล', img: appImg, title: 'Mono Max (ดูบอล)' }
            ]});
        } else {
            setViewState({ step: 'packages', appId, title: appName, packKey: appId });
        }
    };

    const handleBuy = async (platform, duration_days, finalPrice, displayName, isWarrantySelected) => {
        if (!user) {
            Swal.fire({ icon: 'warning', title: 'แจ้งเตือน', text: 'กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อครับ', background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' });
            return openAuth();
        }

        if (parseFloat(user.credit_balance) < finalPrice) {
            return Swal.fire({ icon: 'error', title: 'ยอดเงินไม่เพียงพอ', text: 'กรุณาเติมเงินก่อนทำรายการสั่งซื้อครับ', background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' });
        }

        const confirm = await Swal.fire({
            title: 'ยืนยันการสั่งซื้อ',
            html: `แพ็กเกจ <b>${displayName}</b>${isWarrantySelected ? '<br><span style="color: #00dc5a; font-size: 14px;">สินค้านี้มีประกันเคลมบัญชี</span>' : ''}<br>ยอดชำระ <b>${finalPrice}</b> บาท`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#00dc5a', cancelButtonColor: '#ff4d4d',
            confirmButtonText: 'ยืนยันการซื้อ', cancelButtonText: 'ยกเลิก',
            background: '#1a1a2e', color: '#fff'
        });

        if (confirm.isConfirmed) {
            Swal.fire({ title: 'กำลังทำรายการ...', allowOutsideClick: false, background: '#1a1a2e', color: '#fff', didOpen: () => Swal.showLoading() });
            try {
                const res = await fetch(`${API_URL}/buy`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                    body: JSON.stringify({ platform: platform, duration_days: duration_days, warranty: isWarrantySelected })
                });
                const result = await res.json();

                if (result.status === 'success') {
                    Swal.close();
    
                    // ดึงค่า purchase_count ที่หลังบ้านส่งกลับมาอัปเดตลง State หน้าบ้านด้วย
                    const updatedUser = { 
                        ...user, 
                        credit_balance: result.remaining_credit,
                        purchase_count: result.purchase_count // เพิ่มบรรทัดนี้
                    };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
    
                    // หากแต้มครบ 10 และระบบสุ่มโค้ดเงินสดให้สำเร็จ ให้ขึ้นหน้าต่างเตือนลูกค้าเป็นพิเศษ
                    if (result.reward_code) {
                        Swal.fire({
                            icon: 'success',
                            title: 'ยินดีด้วยคุณได้รับรางวัล!',
                            html: `คุณซื้อสินค้าครบ 10 ครั้ง ได้รับโค้ดเติมเงิน 10 บาทฟรี:<br><br><b style="font-size: 20px; color: #ff9e2c;">${result.reward_code}</b><br><br>สามารถนำโค้ดนี้ไปกรอกใช้งานได้ที่หน้าโปรไฟล์ของคุณครับ`,
                            background: '#1a1a2e',
                            color: '#fff',
                            confirmButtonColor: '#00dc5a'
                        });
                    }
    
                    setReceiptData({ data: result.data, platform, displayName });
                    fetchProducts();
                } else {
                    Swal.fire({ icon: 'error', title: 'ทำรายการไม่สำเร็จ', text: result.message, background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' });
                }
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์', background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a' });
            }
        }
    };

    const isReseller = user?.role === 'reseller';

    return (
        <div id="store-section" style={{ marginTop: '30px' }}>
            
            {/* Banner Section (วางคู่ซ้าย-ขวา) */}
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
                {banners.map((banner) => (
                    <a 
                        key={banner.id} 
                        href={banner.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ 
                            flex: '1 1 45%', // แบ่งครึ่งจอ แต่ถ้าย่อจอเล็กกว่าที่กำหนดจะตกลงมาเรียงแนวตั้ง
                            minWidth: '320px', 
                            display: 'block',
                            textDecoration: 'none'
                        }}
                    >
                        <img 
                            src={banner.src} 
                            alt={`Promotional Banner ${banner.id}`} 
                            style={{ 
                                width: '100%', 
                                height: 'auto', 
                                borderRadius: '16px', 
                                boxShadow: '0 6px 15px rgba(0,0,0,0.3)',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                cursor: 'pointer'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.5)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.3)';
                            }}
                        />
                    </a>
                ))}
            </div>

            <h2 className="section-title">{viewState.title}</h2>

            {viewState.step === 'apps' && (
                <div className="app-grid">
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton skeleton-app-card" />)
                    ) : (
                        appList.map(app => {
                            const count = globalStock.filter(item => item.platform.trim().startsWith(app.id)).length;
                            return (
                                <div key={app.id} className="app-card" onClick={() => handleAppClick(app.id, app.name)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '15px' }}>
                                    <div className="app-icon"><img src={app.img} alt={app.name} /></div>
                                    <div className="app-title">{app.name}</div>
                                    {count > 3 ? (
                                        <div style={{ fontSize: '11px', marginTop: '8px', color: '#00dc5a', background: 'rgba(0, 220, 90, 0.1)', border: '1px solid rgba(0, 220, 90, 0.3)', padding: '3px 10px', borderRadius: '12px' }}>พร้อมส่ง {count} รายการ</div>
                                    ) : count > 0 ? (
                                        /* เปลี่ยนเป็นสีส้ม/ทอง เพื่อให้ดูเป็นของร้อนแรง */
                                        <div style={{ fontSize: '11px', marginTop: '8px', color: '#ffb74d', background: 'rgba(255, 152, 0, 0.15)', border: '1px solid rgba(255, 152, 0, 0.5)', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', animation: 'pulseWarning 1.5s infinite', boxShadow: '0 0 8px rgba(255, 152, 0, 0.2)' }}>
                                            <Flame size={14}/> เหลือเพียง {count} ชิ้น!
                                        </div>
                                    ) : (
                                        /* สินค้าหมด ทำให้สีดรอปลง กลืนไปกับพื้นหลัง */
                                        <div style={{ fontSize: '11px', marginTop: '8px', color: '#ff4d4d', background: 'rgba(255, 77, 77, 0.05)', border: '1px solid rgba(255, 77, 77, 0.2)', padding: '3px 10px', borderRadius: '12px', opacity: 0.8 }}>สินค้าหมด</div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            {viewState.step === 'subcats' && (
                <div>
                    <button className="btn-back" onClick={() => setViewState({ step: 'apps', title: 'เลือกแอปที่ต้องการ' })}>กลับไปหน้าเลือกแอป</button>
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
                        {viewState.subcats.map(sub => (
                            <div key={sub.key} className="product-card" style={{ cursor: 'pointer' }} onClick={() => setViewState({ step: 'packages', packKey: sub.key, title: sub.title })}>
                                <div className="app-icon" style={{ margin: '0 auto 15px' }}><img src={sub.img} alt={sub.name} /></div>
                                <div className="product-name">{sub.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {viewState.step === 'packages' && (
                <div>
                    <button className="btn-back" onClick={() => setViewState({ step: 'apps', title: 'เลือกแอปที่ต้องการ' })}>กลับไปหน้าเลือกแอป</button>
                    <div className="product-container" style={{ marginTop: '20px' }}>
                        {packagesConfig[viewState.packKey]?.map(pack => (
                            <PackageCard 
                                key={`${pack.p}-${pack.d}`} 
                                pack={pack} 
                                globalStock={globalStock} 
                                isReseller={isReseller} 
                                title={viewState.title} 
                                onBuy={handleBuy} 
                            />
                        ))}
                    </div>
                </div>
            )}

            {receiptData && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <CheckCircle size={24} color="var(--theme-orange)" /> สั่งซื้อสำเร็จ!
                        </h3>
                        <div className="receipt-details">
                            <div>แพลตฟอร์ม: <span>{receiptData.displayName}</span></div>
                            {receiptData.data.has_warranty && <div style={{ color: '#00dc5a', fontWeight: 'bold', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={16} /> สั่งซื้อแบบรวมประกันเคลมบัญชี</div>}
                            <div>บัญชี (ล็อกอิน): <span>{receiptData.data.account_login || receiptData.data.login}</span></div>
                            {(receiptData.data.account_password || receiptData.data.password) && <div>รหัสผ่าน: <span>{receiptData.data.account_password || receiptData.data.password}</span></div>}
                            <div>เข้าใช้งานจอ: <span>{receiptData.data.profile_name || receiptData.data.profile || '-'}</span></div>
                            {(receiptData.data.pin_code || receiptData.data.pin) && <div>รหัสเข้าจอ (PIN): <span>{receiptData.data.pin_code || receiptData.data.pin}</span></div>}
                            <div>วันหมดอายุ: <span style={{color:'#ff4d4d'}}>{formatExpireDate(receiptData.data.expire_date)}</span></div>
                            
                            {receiptData.platform.includes('disney') && (
                                <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(0, 168, 225, 0.1)', borderLeft: '4px solid #00a8e1', borderRadius: '4px', fontSize: '13px', lineHeight: 1.6, textAlign: 'left', color: '#d6ebff' }}>
                                    <strong style={{ color: '#00a8e1', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Info size={16}/> วิธีเข้าสู่ระบบ DISNEY+ (ดึง OTP ด้วยตัวเอง)</strong><br/><br/>
                                    <b>ขั้นตอนที่ 1:</b> นำ <b>เบอร์โทรศัพท์</b> (จากช่องล็อกอินด้านบน) ไปกรอกในแอปหรือเว็บ Disney+ เพื่อส่งคำขอรับรหัส OTP<br/><br/>
                                    <b>ขั้นตอนที่ 2:</b> เข้าไปที่ <a href="https://script.google.com/macros/s/AKfycbwuCoU1EvLlxuAZxWQeqg4gh5Ut2_130j-yHRL3TjPEr7v4kkAyIc-IyFIrJYHaxQiL/exec?authuser=0" target="_blank" rel="noreferrer" style={{ color: '#ffb74d', textDecoration: 'underline', fontWeight: 'bold' }}>เว็บดึงรหัส OTP (คลิกลิงก์นี้)</a> 
                                    แล้วนำ <b>อีเมล</b> (ในช่องรหัสผ่าน) และ <b>รหัส PIN</b> ไปกรอกเพื่อดึงรหัส<br/><br/>
                                    <b>ขั้นตอนที่ 3:</b> นำรหัส OTP 4 หลัก กลับไปกรอกในแอป Disney+ เพื่อเริ่มรับชมได้เลยครับ
                                </div>
                            )}
                            
                            <AppRulesJSX platform={receiptData.platform} />
                        </div>
                        <button className="btn-buy btn-disney" onClick={() => setReceiptData(null)} style={{ marginTop: '20px' }}>ปิดหน้าต่าง</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function PackageCard({ pack, globalStock, isReseller, title, onBuy }) {
    const [isWarranty, setIsWarranty] = useState(false);

    const availableItems = globalStock.filter(item => item.platform.trim() === pack.p && parseInt(item.duration_days) === pack.d);
    const count = availableItems.length;

    let basePrice = 0, originalPrice = 0;
    if (count > 0) {
        const sampleItem = availableItems[0];
        const normalPrice = parseFloat(sampleItem.price);
        const wholesalePrice = sampleItem.wholesale_price ? parseFloat(sampleItem.wholesale_price) : null;
        if (isReseller && wholesalePrice) { basePrice = wholesalePrice; originalPrice = normalPrice; }
        else { basePrice = normalPrice; }
    }

    const isNetflix = pack.p.startsWith('netflix');
    const hasWarrantyOption = isNetflix && (pack.d === 7 || pack.d === 30);
    
    let warrantyAddon = 0;
    if (hasWarrantyOption) {
        if (isReseller) {
            warrantyAddon = (pack.d === 7) ? 5 : ((pack.p === 'netflix_mobile') ? 23 : 25);
        } else {
            warrantyAddon = (pack.d === 7) ? 10 : 25;
        }
    }

    const finalPrice = isWarranty ? (basePrice + warrantyAddon) : basePrice;

    return (
        <div className="product-card">
            <div className="product-name" style={{ fontSize: '16px', marginBottom: '5px' }}>{pack.label}</div>
            
            {/* อัปเดตสีในหน้าเลือกแพ็กเกจด้วยเช่นกัน */}
            <div style={{ marginBottom: '8px' }}>
                {count > 3 ? (
                    <div className="badge-stock badge-available">
                        <CheckCircle size={12} /> พร้อมส่ง {count}
                    </div>
                ) : count > 0 ? (
                    <div className="badge-stock badge-low-stock">
                        <Flame size={12} /> เหลือเพียง {count} ชิ้น!
                    </div>
                ) : (
                    <div className="badge-stock badge-out-of-stock">
                        <XCircle size={12} /> สินค้าหมด
                    </div>
                )}
            </div>
            
            {isNetflix ? (
                hasWarrantyOption ? (
                    <div style={{ marginTop: '10px', marginBottom: '10px', fontSize: '13px', textAlign: 'left', background: 'rgba(0, 220, 90, 0.1)', border: '1px solid rgba(0, 220, 90, 0.3)', padding: '8px', borderRadius: '6px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px', margin: 0 }}>
                            <input type="checkbox" checked={isWarranty} onChange={(e) => setIsWarranty(e.target.checked)} style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#00dc5a' }} />
                            <span style={{ color: '#00dc5a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>รับประกันเคลมบัญชี ({warrantyAddon > 0 ? `+${warrantyAddon} ฿` : 'ฟรี'})</span>
                        </label>
                    </div>
                ) : (
                    <div style={{ marginTop: '10px', marginBottom: '10px', fontSize: '12px', textAlign: 'left', background: 'rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: '6px', color: '#888', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <XCircle size={14} /> แพ็กเกจ 1 วัน ไม่มีตัวเลือกประกันเคลม
                    </div>
                )
            ) : null}

            <div className="product-price" style={{ fontSize: '20px' }}>
                {(isReseller && originalPrice > basePrice) ? (
                    <><span style={{ textDecoration: 'line-through', color: '#888', fontSize: '15px', marginRight: '8px' }}>{originalPrice}</span><span style={{ color: '#ff4d4d', fontWeight: 'bold' }}>{finalPrice} THB <span style={{ fontSize: '12px', border: '1px solid #ff4d4d', padding: '2px 4px', borderRadius: '4px' }}>ราคาส่ง</span></span></>
                ) : (
                    `${finalPrice} THB`
                )}
            </div>

            {count > 0 ? (
                <button className="btn-buy" style={{ background: '#007bff', border: 'none' }} onClick={() => onBuy(pack.p, pack.d, finalPrice, `${title} - ${pack.label}`, isWarranty)}>
                    <ShoppingCart size={18}/> ซื้อเลย
                </button>
            ) : (
                <button className="btn-buy" style={{ background: '#444', color: '#888', border: '1px solid #555', cursor: 'not-allowed' }} disabled>สินค้าหมด</button>
            )}
        </div>
    );
}

function formatExpireDate(expireStr) {
    if (!expireStr) return '-';
    let dateParts = expireStr.split(' ');
    let d = dateParts[0].split('-'); 
    if (d.length === 3) {
        let timeStr = dateParts[1] ? ' ' + dateParts[1] : '';
        return `EXP ${d[2]}-${d[1]}-${d[0]}${timeStr}`;
    }
    return expireStr;
}

export function AppRulesJSX({ platform }) {
    let rulesHtml = null;
    const ruleContainerStyle = { marginTop: '15px', padding: '15px', background: 'rgba(255, 99, 71, 0.1)', borderLeft: '4px solid #ff4d4d', borderRadius: '4px', fontSize: '13px', lineHeight: 1.6, textAlign: 'left', color: '#ffd6d6' };
    const titleStyle = { color: '#ff8080', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' };
    
    if (platform.includes('youtube')) {
        rulesHtml = (
            <div style={ruleContainerStyle}>
                <div style={titleStyle}><Star size={16}/> YouTube Premium</div>
                <div style={{ textAlign: 'center', marginBottom: '8px', color: '#ffd6d6' }}>กฎการใช้งาน</div>
                - ห้ามเปลี่ยนแปลง แก้ไขรหัสหรือข้อมูลใดๆทั้งสิ้น ปรับ 1000฿<br/>
                - เมลร้านไม่อนุญาตให้เอาไปเชื่อมต่อแอพอื่นนอกจาก youtube นะคะ<br/>
                - พบเจอขออนุญาตยึดคืนโดยไม่จำเป็นต้องแจ้งให้ทราบ ขอบคุณค่ะ
            </div>
        );
    } else if (platform.includes('iqiyi')) {
        rulesHtml = (
            <div style={ruleContainerStyle}>
                <div style={titleStyle}><Star size={16}/> iQIYI</div>
                <div style={{ textAlign: 'center', marginBottom: '8px', color: '#ffd6d6' }}>กฎการใช้งาน</div>
                - ลบช่องอีเมลก่อนกดเข้าระบบนะคะ<br/>
                - ห้ามกดอัพแพคเกจจะทำให้วันลด ทางร้านไม่รับเคลมค่า<br/>
                - ล็อกอิน 1 เครื่องเท่านั้น<br/>
                - จอหารจะมีประวัติการดูทับกันเป็นปกติน้า<br/>
                - เข้าไม่ได้ รหัสผิดให้แจ้งทางร้านทันที<br/>
                - ห้ามเปลี่ยนแปลงหรือเผยแพร่รหัสให้ผู้อื่น พบเจอปรับ 1000฿
            </div>
        );
    } else if (platform.includes('wetv')) {
        rulesHtml = (
            <div style={ruleContainerStyle}>
                <div style={titleStyle}><Star size={16}/> WeTV</div>
                <div style={{ textAlign: 'center', marginBottom: '8px', color: '#ffd6d6' }}>กฎการใช้งาน</div>
                - ล็อกอิน 1 เครื่องเท่านั้น<br/>
                - จอหารจะมีประวัติการดูทับกันเป็นปกติน้า<br/>
                - เข้าไม่ได้ รหัสผิดให้แจ้งทางร้านทันที<br/>
                - ไม่เคลมกรณีระบบระงับการใช้งาน ต้องรอระบบปลดเท่านั้นน้า ไม่มีการชดเชยวันให้ค่ะ<br/>
                - ห้ามเปลี่ยนแปลงหรือเผยแพร่รหัสให้ผู้อื่น พบเจอปรับ 1000฿
            </div>
        );
    } else if (platform.includes('trueid') || platform.includes('viu') || platform.includes('bilibili') || platform.includes('oned')) {
        rulesHtml = (
            <div style={ruleContainerStyle}>
                <div style={titleStyle}><AlertCircle size={16}/> กฎการใช้งาน</div>
                <div style={{ textAlign: 'center', marginBottom: '8px', color: '#ffd6d6' }}>(TrueID / Viu / Bilibili / OneD)</div>
                - ล็อกอิน 1 เครื่องเท่านั้น<br/>
                - อาจมีประวัติการดูทับกันเป็นปกติน้า<br/>
                - เข้าไม่ได้ รหัสผิดให้แจ้งทางร้านทันที<br/>
                - ห้ามเปลี่ยนแปลงหรือเผยแพร่รหัสให้ผู้อื่น พบเจอปรับ 1000฿
            </div>
        );
    } else if (platform.includes('ch3')) {
        rulesHtml = (
            <div style={ruleContainerStyle}>
                <div style={titleStyle}><Star size={16}/> Ch3 Plus</div>
                <div style={{ textAlign: 'center', marginBottom: '8px', color: '#ffd6d6' }}>กฎการใช้งาน</div>
                - ห้ามกดระงับตอนอีกท่าน "กำลังดูอยู่" หากทางร้านทราบจะระงับทั้งคู่ทันที<br/>
                - รับชมพร้อมกัน 1 เครื่อง แบบหาร2 (จอชนรบกวนรอเท่านั้นน้า)<br/>
                - จอหารจะมีประวัติการดูทับกันเป็นปกติค่ะ<br/>
                - เข้าไม่ได้แจ้งทางร้านทันที<br/>
                - ห้ามเปลี่ยนแปลงหรือเผยแพร่รหัสให้ผู้อื่น พบเจอปรับ 1000฿
            </div>
        );
    } else if (platform.includes('disney') || platform.includes('hbo') || platform.includes('monomax') || platform.includes('chatgpt') || platform.includes('prime')) {
        rulesHtml = (
            <div style={ruleContainerStyle}>
                <div style={titleStyle}><AlertCircle size={16}/> กฎการใช้งาน</div>
                <div style={{ textAlign: 'center', marginBottom: '8px', color: '#ffd6d6' }}>(Disney / HBO / Monomax / ChatGPT / Prime)</div>
                1. ถ้าเข้าไม่ได้ให้รีบแจ้งร้านทันทีน้า<br/>
                2. เข้าใช้งานได้ 1 เครื่องเท่านั้น<br/>
                3. ห้ามเปลี่ยนแปลงหรือเผยแพร่รหัสให้ผู้อื่น พบเจอปรับ 1000฿
            </div>
        );
    } else {
        rulesHtml = (
            <div style={ruleContainerStyle}>
                <div style={titleStyle}><AlertCircle size={16}/> กฎการใช้งานร่วมกัน</div>
                <div style={{ textAlign: 'center', marginBottom: '8px', color: '#ffd6d6' }}>ลูกค้าที่น่ารักทำตามกฎกันด้วยนะคะ (ผิดกฎปรับ 500.-)</div>
                - ทำการ Log in เข้าสู่ระบบหลังจากได้รับรหัสทันที<br/>
                - ไม่มั่ว/ ไม่เอาไปหาร / ไม่เปลี่ยนรหัสบัญชีโดยเด็ดขาด<br/>
                - ไม่เข้าหรือแก้ไขโปรไฟล์คนอื่น<br/>
                - 1 จอ = รับชมทีละ 1 อุปกรณ์<br/>
                - ถ้าไม่ได้ซื้อแบบทีวี ห้ามรับชมบนทีวี<br/>
                - หากพบเจอว่ามีการนำไปแชร์รหัสกับผู้อื่น ขออนุญาตทำการยึดจอ ไม่คืนเงิน<br/><br/>
                <span style={{ color: '#ffb74d', fontWeight: 'bold' }}>ทางร้านขายจอส่วนตัวเท่านั้น ห้ามนำไปหารหรือแชร์ต่อโดยเด็ดขาด</span>
            </div>
        );
    }
    return rulesHtml;
}

export function getAppRulesText(platform) {
    let rulesText = "";
    if (platform.includes('youtube')) {
        rulesText = "[ YouTube Premium ]\n\n- กฎการใช้งาน\n- ห้ามเปลี่ยนแปลง แก้ไขรหัสหรือข้อมูลใดๆทั้งสิ้น ปรับ 1000฿\n- เมลร้านไม่อนุญาตให้เอาไปเชื่อมต่อแอพอื่นนอกจาก youtube นะคะ\n- พบเจอขออนุญาตยึดคืนโดยไม่จำเป็นต้องแจ้งให้ทราบ ขอบคุณค่ะ";
    } else if (platform.includes('iqiyi')) {
        rulesText = "[ iQIYI ]\n\n- กฎการใช้งาน\n- ห้ามกดอัพแพคเกจจะทำให้วันลด ทางร้านไม่รับเคลมค่า\n- ล็อกอิน 1 เครื่องเท่านั้น\n- จอหารจะมีประวัติการดูทับกันเป็นปกติน้า\n- เข้าไม่ได้ รหัสผิดให้แจ้งทางร้านทันที\n- ห้ามเปลี่ยนแปลงหรือเผยแพร่รหัสให้ผู้อื่น พบเจอปรับ 1000฿";
    } else if (platform.includes('wetv')) {
        rulesText = "[ WeTV ]\n\n- กฎการใช้งาน\n- ล็อกอิน 1 เครื่องเท่านั้น\n- จอหารจะมีประวัติการดูทับกันเป็นปกติน้า\n- เข้าไม่ได้ รหัสผิดให้แจ้งทางร้านทันที\n- ไม่เคลมกรณีระบบระงับการใช้งาน ต้องรอระบบปลดเท่านั้นน้า ไม่มีการชดเชยวันให้ค่ะ\n- ห้ามเปลี่ยนแปลงหรือเผยแพร่รหัสให้ผู้อื่น พบเจอปรับ 1000฿";
    } else if (platform.includes('trueid') || platform.includes('viu') || platform.includes('bilibili') || platform.includes('oned')) {
        rulesText = "[ กฎการใช้งาน ]\n\n- ล็อกอิน 1 เครื่องเท่านั้น\n- อาจมีประวัติการดูทับกันเป็นปกติน้า\n- เข้าไม่ได้ รหัสผิดให้แจ้งทางร้านทันที\n- ห้ามเปลี่ยนแปลงหรือเผยแพร่รหัสให้ผู้อื่น พบเจอปรับ 1000฿";
    } else if (platform.includes('ch3')) {
        rulesText = "[ Ch3 Plus ]\n\n- กฎการใช้งาน\n- ห้ามกดระงับตอนอีกท่าน กำลังดูอยู่ หากทางร้านทราบจะระงับทั้งคู่ทันที\n- รับชมพร้อมกัน 1 เครื่อง แบบหาร2 (จอชนรบกวนรอเท่านั้นน้า)\n- จอหารจะมีประวัติการดูทับกันเป็นปกติค่ะ\n- เข้าไม่ได้แจ้งทางร้านทันที\n- ห้ามเปลี่ยนแปลงหรือเผยแพร่รหัสให้ผู้อื่น พบเจอปรับ 1000฿";
    } else if (platform.includes('disney') || platform.includes('hbo') || platform.includes('monomax') || platform.includes('chatgpt') || platform.includes('prime')) {
        rulesText = "[ กฎการใช้งาน ]\n\n1. ถ้าเข้าไม่ได้ให้รีบแจ้งร้านทันทีน้า\n2. เข้าใช้งานได้ 1 เครื่องเท่านั้น\n3. ห้ามเปลี่ยนแปลงหรือเผยแพร่รหัสให้ผู้อื่น พบเจอปรับ 1000฿";
    } else {
        rulesText = "[ กฎการใช้งานร่วมกัน ]\n\n- ลูกค้าที่น่ารักทำตามกฎกันด้วยนะคะ ผิดกฎปรับ 500.-\n\n- ทำการ Log in เข้าสู่ระบบหลังจากได้รับรหัสทันที\n- ไม่มั่ว/ ไม่เอาไปหาร / ไม่เปลี่ยนรหัสบัญชีโดยเด็ดขาด\n- ไม่เข้าหรือแก้ไขโปรไฟล์คนอื่น\n- 1 จอ = รับชมทีละ 1 อุปกรณ์\n- ถ้าไม่ได้ซื้อแบบทีวี ห้ามรับชมบนทีวี\n- หากพบเจอว่ามีการนำไปแชร์รหัสกับผู้อื่น ขออนุญาตทำการยึดจอ ไม่คืนเงิน\n\n- ทางร้านขายจอส่วนตัวเท่านั้น ห้ามนำไปหารหรือแชร์ต่อโดยเด็ดขาด";
    }
    return rulesText;
}