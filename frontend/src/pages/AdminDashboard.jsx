import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { BarChart3, Users, CreditCard, ShoppingBag, Package, CheckCircle, XCircle, AlertTriangle, RefreshCw, Filter } from 'lucide-react';

const API_URL = "https://deuxmoon-api.onrender.com";

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('all'); // ตัวแปรเก็บค่าเวลา

    const fetchStats = async () => {
        setLoading(true);
        try {
            // ส่ง parameter range ไปหาหลังบ้าน
            const res = await fetch(`${API_URL}/admin/stats?range=${timeRange}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!res.ok) throw new Error("เกิดข้อผิดพลาดในการดึงข้อมูล");
            
            const result = await res.json();
            if (result.status === 'success') {
                setStats(result.data);
            } else {
                Swal.fire({ icon: 'error', title: 'ดึงข้อมูลล้มเหลว', text: result.message, background: '#1a1a2e', color: '#fff' });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: err.message, background: '#1a1a2e', color: '#fff' });
        } finally {
            setLoading(false);
        }
    };

    // โหลดข้อมูลใหม่ทุกครั้งที่ค่า timeRange เปลี่ยนไป
    useEffect(() => {
        fetchStats();
    }, [timeRange]);

    const cardStyle = {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        flex: '1 1 200px'
    };

    const getRangeLabel = () => {
        if (timeRange === 'today') return 'วันนี้';
        if (timeRange === '7days') return '7 วันล่าสุด';
        if (timeRange === '30days') return '30 วันล่าสุด';
        return 'ทั้งหมด';
    };

    return (
        <div className="container" style={{ maxWidth: '1200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    <BarChart3 size={28} color="var(--theme-orange)"/> สถิติภาพรวมร้านค้า
                </h2>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Filter size={16} color="#888" />
                        <select 
                            value={timeRange} 
                            onChange={(e) => setTimeRange(e.target.value)}
                            style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px' }}
                        >
                            <option value="today" style={{ color: '#000' }}>วันนี้</option>
                            <option value="7days" style={{ color: '#000' }}>7 วันล่าสุด</option>
                            <option value="30days" style={{ color: '#000' }}>30 วันล่าสุด</option>
                            <option value="all" style={{ color: '#000' }}>ทั้งหมด (All Time)</option>
                        </select>
                    </div>

                    <button className="btn-buy" onClick={fetchStats} style={{ width: 'auto', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)' }}>
                        <RefreshCw size={16} className={loading ? "spin" : ""} /> อัปเดต
                    </button>
                </div>
            </div>

            {loading || !stats ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>กำลังโหลดข้อมูลสถิติ...</div>
            ) : (
                <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                        <div style={cardStyle}>
                            <div style={{ color: '#888', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><CreditCard size={18}/> ยอดเติมเงินสะสม ({getRangeLabel()})</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#00dc5a' }}>{stats.total_revenue.toLocaleString(undefined, {minimumFractionDigits: 2})} <span style={{ fontSize: '16px', color: '#666' }}>THB</span></div>
                        </div>
                        <div style={cardStyle}>
                            <div style={{ color: '#888', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><ShoppingBag size={18}/> ออเดอร์ที่ขายได้ ({getRangeLabel()})</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff' }}>{stats.total_purchases.toLocaleString()} <span style={{ fontSize: '16px', color: '#666' }}>รายการ</span></div>
                        </div>
                        <div style={cardStyle}>
                            <div style={{ color: '#888', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={18}/> สมาชิกใหม่ ({getRangeLabel()})</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.total_users.toLocaleString()} <span style={{ fontSize: '16px', color: '#666' }}>บัญชี</span></div>
                        </div>
                    </div>

                    <div style={{ ...cardStyle, flex: '1 1 100%' }}>
                        <div style={{ color: '#888', fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                            <Package size={20}/> สถานะสต็อกสินค้าทั้งหมด (อัปเดตเรียลไทม์)
                        </div>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-around' }}>
                            <div style={{ textAlign: 'center', padding: '15px', background: 'rgba(0, 220, 90, 0.05)', borderRadius: '12px', flex: '1 1 30%', minWidth: '150px' }}>
                                <CheckCircle size={32} color="#00dc5a" style={{ margin: '0 auto 10px' }}/>
                                <div style={{ color: '#888', fontSize: '14px' }}>พร้อมขาย (Available)</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00dc5a' }}>{stats.stock.available}</div>
                            </div>
                            
                            <div style={{ textAlign: 'center', padding: '15px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', flex: '1 1 30%', minWidth: '150px' }}>
                                <XCircle size={32} color="#666" style={{ margin: '0 auto 10px' }}/>
                                <div style={{ color: '#888', fontSize: '14px' }}>ขายแล้ว (Sold)</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{stats.stock.sold}</div>
                            </div>

                            <div style={{ textAlign: 'center', padding: '15px', background: 'rgba(255, 158, 44, 0.05)', borderRadius: '12px', flex: '1 1 30%', minWidth: '150px' }}>
                                <AlertTriangle size={32} color="var(--theme-orange)" style={{ margin: '0 auto 10px' }}/>
                                <div style={{ color: '#888', fontSize: '14px' }}>รอรีเซ็ต (Pending)</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--theme-orange)' }}>{stats.stock.pending}</div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}