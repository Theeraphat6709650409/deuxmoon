import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { RefreshCw, Save, AlertTriangle } from 'lucide-react';

const API_URL = "https://deuxmoon-api.onrender.com";

export default function AdminPendingReset() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editData, setEditData] = useState({});

    const fetchPendingResets = async () => {
        setLoading(true);
        try {
            console.log("กำลังดึงข้อมูลจาก:", `${API_URL}/admin/pending-resets`);
            const res = await fetch(`${API_URL}/admin/pending-resets`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // เช็คว่าเซิร์ฟเวอร์ตอบกลับมาเป็นโค้ด 404 หรือ 500 หรือไม่
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`เซิร์ฟเวอร์ตอบกลับผิดพลาด (Status ${res.status}): ${errorText.substring(0, 100)}`);
            }

            const result = await res.json();
            if (result.status === 'success') {
                setItems(result.data);
            } else {
                Swal.fire({ icon: 'error', title: 'ดึงข้อมูลล้มเหลว', text: result.message, background: '#1a1a2e', color: '#fff' });
            }
        } catch (err) {
            console.error("Detailed Fetch Error:", err);
            // แสดง Error ของจริงออกมาบนหน้าจอ
            Swal.fire({ 
                icon: 'error', 
                title: 'ข้อผิดพลาดของระบบ', 
                text: err.message, 
                background: '#1a1a2e', 
                color: '#fff' 
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingResets();
    }, []);

    const handleInputChange = (id, field, value) => {
        setEditData(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleSave = async (id, originalItem) => {
        const updatedFields = editData[id] || {};
        
        const payload = {
            email: updatedFields.email !== undefined ? updatedFields.email : originalItem.account_login,
            password: updatedFields.password !== undefined ? updatedFields.password : originalItem.account_password,
            status: updatedFields.status !== undefined ? updatedFields.status : originalItem.status
        };

        try {
            const res = await fetch(`${API_URL}/admin/update-stock/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (result.status === 'success') {
                Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', text: result.message, timer: 1500, showConfirmButton: false, background: '#1a1a2e', color: '#fff' });
                fetchPendingResets(); 
            } else {
                Swal.fire({ icon: 'error', title: 'ล้มเหลว', text: result.message, background: '#1a1a2e', color: '#fff' });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: 'ไม่สามารถส่งข้อมูลได้', background: '#1a1a2e', color: '#fff' });
        }
    };

    return (
        <div className="container" style={{ maxWidth: '1100px' }}>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <RefreshCw size={28}/> จัดการรายการสินค้า รอรีเซ็ต (Pending Reset)
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', marginTop: '-15px' }}>
                ข้อมูลเรียงลำดับตามอีเมลอัตโนมัติ เพื่อให้ง่ายต่อการตรวจเช็คบัญชีชุดเดียวกัน
            </p>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>กำลังโหลดข้อมูลสต็อก...</div>
            ) : items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <AlertTriangle size={32} color="var(--theme-orange)" style={{ marginBottom: '10px' }}/>
                    <p>ไม่มีสินค้าที่อยู่ในสถานะรอรีเซ็ตในขณะนี้ครับ</p>
                </div>
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>แพลตฟอร์ม</th>
                                <th>จอที่ใช้งาน</th>
                                <th>อีเมลบัญชี (Email)</th>
                                <th>รหัสผ่าน (Password)</th>
                                <th>สถานะ (Status)</th>
                                <th style={{ textAlign: 'center' }}>การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => {
                                return (
                                    <tr key={item.id}>
                                        <td style={{ fontWeight: '600', color: 'var(--text-light)' }}>
                                            {item.platform ? item.platform.toUpperCase() : "ไม่ระบุประเภท"}
                                        </td>
                                        <td style={{ color: 'var(--theme-orange)', fontWeight: '500' }}>
                                            {item.profile_name || "-"}
                                        </td>
                                        <td>
                                            <input 
                                                type="text" 
                                                className="input-table"
                                                defaultValue={item.account_login}
                                                onChange={(e) => handleInputChange(item.id, 'email', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="text" 
                                                className="input-table"
                                                defaultValue={item.account_password}
                                                onChange={(e) => handleInputChange(item.id, 'password', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <select 
                                                className="select-table"
                                                defaultValue={item.status}
                                                onChange={(e) => handleInputChange(item.id, 'status', e.target.value)}
                                            >
                                                <option value="pending_reset">Pending Reset (รอรีเซ็ต)</option>
                                                <option value="available">Available (พร้อมส่ง)</option>
                                                <option value="sold">Sold (ขายแล้ว)</option>
                                            </select>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button 
                                                className="btn-buy" 
                                                style={{ padding: '6px 12px', fontSize: '13px', width: 'auto', display: 'inline-flex', background: 'linear-gradient(135deg, #00dc5a 0%, #00a03c 100%)', boxShadow: 'none' }}
                                                onClick={() => handleSave(item.id, item)}
                                            >
                                                <Save size={14} style={{ marginRight: '4px' }}/> บันทึก
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}