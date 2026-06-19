import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { BarChart3, Users, CreditCard, ShoppingBag, Package, CheckCircle, XCircle, AlertTriangle, RefreshCw, Filter, TrendingUp } from 'lucide-react';

const API_URL = "https://deuxmoon-api.onrender.com"; 

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('all');

    const fetchStats = async () => {
        setLoading(true);
        try {
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

    useEffect(() => {
        fetchStats();
    }, [timeRange]);

    // ปรับการ์ดให้ทึบขึ้น เข้มขึ้น ขอบชัดขึ้น เพื่อให้อ่านง่ายบนพื้นหลังอวกาศ
    const cardStyle = {
        background: 'rgba(20, 20, 35, 0.85)', // ปรับให้ทึบขึ้นมาก
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)', // เพิ่มเงาให้ลอยเด่นขึ้นมา
        flex: '1 1 200px'
    };

    const getRangeLabel = () => {
        if (timeRange === 'today') return 'วันนี้';
        if (timeRange === '7days') return '7 วัน';
        if (timeRange === '30days') return '30 วัน';
        return 'ทั้งหมด';
    };

    return (
        <div className="container" style={{ maxWidth: '1200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                    <BarChart3 size={28} color="var(--theme-orange)"/> สถิติภาพรวมร้านค้า
                </h2>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <Filter size={16} color="#aaa" />
                        <select 
                            value={timeRange} 
                            onChange={(e) => setTimeRange(e.target.value)}
                            style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 'bold' }}
                        >
                            <option value="today" style={{ color: '#000' }}>วันนี้</option>
                            <option value="7days" style={{ color: '#000' }}>7 วันล่าสุด</option>
                            <option value="30days" style={{ color: '#000' }}>30 วันล่าสุด</option>
                            <option value="all" style={{ color: '#000' }}>ทั้งหมด (All Time)</option>
                        </select>
                    </div>

                    <button className="btn-buy" onClick={fetchStats} style={{ width: 'auto', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.5)' }}>
                        <RefreshCw size={16} className={loading ? "spin" : ""} color="#60a5fa" /> <span style={{ color: '#60a5fa' }}>อัปเดต</span>
                    </button>
                </div>
            </div>

            {loading || !stats ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#fff', background: 'rgba(0,0,0,0.5)', borderRadius: '16px' }}>กำลังโหลดข้อมูลสถิติ...</div>
            ) : (
                <>
                    {/* แถวบน: 4 กล่อง เพื่อให้บาลานซ์ซ้ายขวาพอดี */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                        <div style={cardStyle}>
                            <div style={{ color: '#aaa', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><CreditCard size={18} color="#00dc5a"/> ยอดลูกค้าเติมเงิน ({getRangeLabel()})</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#00dc5a' }}>{stats.total_revenue.toLocaleString(undefined, {minimumFractionDigits: 2})} <span style={{ fontSize: '16px', color: '#888' }}>THB</span></div>
                        </div>
                        <div style={cardStyle}>
                            <div style={{ color: '#aaa', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={18} color="#ffb74d"/> ยอดขายที่ทำได้ ({getRangeLabel()})</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffb74d' }}>{stats.total_sales?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'} <span style={{ fontSize: '16px', color: '#888' }}>THB</span></div>
                        </div>
                        <div style={cardStyle}>
                            <div style={{ color: '#aaa', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><ShoppingBag size={18} color="#fff"/> ออเดอร์ที่ขายได้ ({getRangeLabel()})</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff' }}>{stats.total_purchases.toLocaleString()} <span style={{ fontSize: '16px', color: '#888' }}>รายการ</span></div>
                        </div>
                        <div style={cardStyle}>
                            <div style={{ color: '#aaa', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={18} color="#3b82f6"/> สมาชิกใหม่ ({getRangeLabel()})</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.total_users.toLocaleString()} <span style={{ fontSize: '16px', color: '#888' }}>บัญชี</span></div>
                        </div>
                    </div>

                    <div style={{ ...cardStyle, flex: '1 1 100%' }}>
                        <div style={{ color: '#aaa', fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                            <Package size={20}/> สถานะสต็อกสินค้าทั้งหมด (อัปเดตเรียลไทม์)
                        </div>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-around' }}>
                            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(0, 220, 90, 0.1)', border: '1px solid rgba(0, 220, 90, 0.3)', borderRadius: '12px', flex: '1 1 30%', minWidth: '150px' }}>
                                <CheckCircle size={32} color="#00dc5a" style={{ margin: '0 auto 10px' }}/>
                                <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '5px' }}>พร้อมขาย (Available)</div>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00dc5a' }}>{stats.stock.available}</div>
                            </div>
                            
                            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', flex: '1 1 30%', minWidth: '150px' }}>
                                <XCircle size={32} color="#888" style={{ margin: '0 auto 10px' }}/>
                                <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '5px' }}>ขายแล้ว (Sold)</div>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>{stats.stock.sold}</div>
                            </div>

                            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255, 158, 44, 0.1)', border: '1px solid rgba(255, 158, 44, 0.3)', borderRadius: '12px', flex: '1 1 30%', minWidth: '150px' }}>
                                <AlertTriangle size={32} color="var(--theme-orange)" style={{ margin: '0 auto 10px' }}/>
                                <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '5px' }}>รอรีเซ็ต (Pending)</div>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--theme-orange)' }}>{stats.stock.pending}</div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}