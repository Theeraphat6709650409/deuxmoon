const API_URL = "https://deuxmoon-api.onrender.com";
let isLoginMode = true;

// --- ควบคุมการสลับหน้าต่าง (UI Toggles) ---
function toggleTopup() {
    const store = document.getElementById('store-section');
    const topup = document.getElementById('topup-section');
    
    if (store.style.display === 'none') {
        store.style.display = 'block';
        topup.style.display = 'none';
    } else {
        store.style.display = 'none';
        topup.style.display = 'block';
    }
}

function openAuthModal() { document.getElementById('auth-modal').style.display = 'flex'; }
function closeAuthModal() { document.getElementById('auth-modal').style.display = 'none'; }
function closeReceiptModal() { document.getElementById('receipt-modal').style.display = 'none'; }

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก';
    document.getElementById('btn-login').style.display = isLoginMode ? 'block' : 'none';
    document.getElementById('btn-register').style.display = isLoginMode ? 'none' : 'block';
    document.getElementById('auth-switch-text').innerText = isLoginMode ? 'ยังไม่มีบัญชี? กดที่นี่เพื่อสมัครสมาชิก' : 'มีบัญชีแล้ว? กดที่นี่เพื่อเข้าสู่ระบบ';
}

// --- ฟังก์ชันดึงและแสดงข้อมูลสินค้า ---
async function fetchProducts() {
    const container = document.getElementById('product-container');
    try {
        const response = await fetch(`${API_URL}/check-products`);
        const result = await response.json();

        if (result.status === 'success') {
            renderProducts(result.data);
        } else {
            container.innerHTML = `<p style="color: #ffb3b3;">เกิดข้อผิดพลาด: ${result.message}</p>`;
        }
    } catch (error) {
        container.innerHTML = `<p style="color: #ffb3b3;">ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้</p>`;
    }
}

function renderProducts(products) {
    const container = document.getElementById('product-container');
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = '<p style="text-align: center; width: 100%;">ขณะนี้สินค้าหมดชั่วคราว</p>';
        return;
    }

    // จัดกลุ่มสินค้า
    const groupedProducts = {};
    products.forEach(p => {
        const key = `${p.platform}_${p.duration_days}`;
        if (!groupedProducts[key]) {
            groupedProducts[key] = { 
                platform: p.platform, 
                duration_days: p.duration_days,
                price: p.price, 
                count: 1 
            };
        } else {
            groupedProducts[key].count++;
        }
    });

    Object.values(groupedProducts).forEach(product => {
        let logoSrc, btnClass;
        if (product.platform.toLowerCase() === 'netflix') {
            logoSrc = "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg";
            btnClass = "btn-netflix";
        } else {
            logoSrc = "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg";
            btnClass = "btn-disney";
        }

        const cardHtml = `
            <div class="product-card">
                <img src="${logoSrc}" alt="${product.platform}" class="product-logo">
                <div class="product-name">${product.platform.toUpperCase()} - ${product.duration_days} วัน</div>
                <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 10px;">
                    พร้อมส่ง: ${product.count} รายการ
                </div>
                <div class="product-price">${product.price} THB</div>
                <button class="btn-buy ${btnClass}" onclick="buyProduct('${product.platform}', ${product.duration_days}, ${product.price})">
                    ซื้อเลย
                </button>
            </div>
        `;
        container.innerHTML += cardHtml;
    });
}

async function buyProduct(platform, duration_days, price) {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        alert('กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อครับ');
        openAuthModal();
        return;
    }

    const user = JSON.parse(userStr);

    if (parseFloat(user.credit_balance) < price) {
        alert('ยอดเงินของคุณไม่เพียงพอ กรุณาเติมเงินก่อนครับ');
        toggleTopup();
        return;
    }

    const confirmBuy = confirm(`ยืนยันการสั่งซื้อแพ็กเกจ ${platform.toUpperCase()} แบบ ${duration_days} วัน\nราคา ${price} บาท หรือไม่?`);
    if (!confirmBuy) return;

    try {
        const response = await fetch(`${API_URL}/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                platform: platform,
                duration_days: duration_days,
                user_id: user.id 
            })
        });
        const result = await response.json();

        if (result.status === 'success') {
            user.credit_balance = result.remaining_credit;
            localStorage.setItem('user', JSON.stringify(user));
            checkLoginStatus();
            
            const data = result.data;
            
            let receiptHtml = `
                <div>แพลตฟอร์ม: <span>${data.platform.toUpperCase()} (${duration_days} วัน)</span></div>
                <div>บัญชี (ล็อกอิน): <span>${data.login}</span></div>
            `;
            if (data.password) receiptHtml += `<div>รหัสผ่าน: <span>${data.password}</span></div>`;
            receiptHtml += `<div>เข้าใช้งานจอ: <span>${data.profile}</span></div>`;
            if (data.pin) receiptHtml += `<div>รหัสเข้าจอ (PIN): <span>${data.pin}</span></div>`;
            receiptHtml += `<div>วันหมดอายุ: <span>${data.expire_date}</span></div>
                
                <div style="margin-top: 15px; padding: 15px; background: rgba(255, 99, 71, 0.1); border-left: 4px solid #ff4d4d; border-radius: 4px; font-size: 13px; line-height: 1.6; text-align: left; color: #ffd6d6;">
                    <strong style="color: #ff8080;">กฎการใช้งานร่วมกัน ลูกค้าที่น่ารักทำตามกฎกันด้วยนะคะ ผิดกฎปรับ 500.-</strong><br><br>
                    - ทำการ Log in เข้าสู่ระบบหลังจากได้รับรหัสทันที<br>
                    - ไม่มั่ว/ ไม่เอาไปหาร / ไม่เปลี่ยนรหัสบัญชีโดยเด็ดขาด<br>
                    - ไม่เข้าหรือแก้ไขโปรไฟล์คนอื่น<br>
                    - 1 จอ = รับชมทีละ 1 อุปกรณ์<br>
                    - ถ้าไม่ได้ซื้อแบบทีวี ห้ามรับชมบนทีวี<br>
                    - หากพบเจอว่ามีการนำไปแชร์รหัสกับผู้อื่นหากพบเจอขออนุญาตทำการยึดจอ ไม่คืนเงิน<br><br>
                    <span style="color: #ffb74d;">=- ทางร้านขายจอส่วนตัวเท่านั้น ห้ามนำไปหารหรือแชร์ต่อโดยเด็ดขาด</span>
                </div>
                
                <hr style="border-color: rgba(255,255,255,0.1); margin: 15px 0;">
                <div style="text-align: center; font-size: 14px; color: var(--text-muted);">กรุณาก๊อปปี้หรือแคปหน้าจอนี้เก็บไว้ครับ</div>
            `;
            
            document.getElementById('receipt-details').innerHTML = receiptHtml;
            document.getElementById('receipt-modal').style.display = 'flex';
            
            fetchProducts(); 
        } else {
            alert(`ไม่สามารถซื้อได้: ${result.message}`);
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    }
}

// --- ระบบสมาชิก (Auth) ---
async function register() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    const res = await fetch(`${API_URL}/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const result = await res.json();
    alert(result.message);
    if (result.status === 'success') toggleAuthMode(); 
}

async function login() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    const res = await fetch(`${API_URL}/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const result = await res.json();
    
    if (result.status === 'success') {
        localStorage.setItem('user', JSON.stringify(result.data));
        closeAuthModal();
        checkLoginStatus();
        alert('เข้าสู่ระบบสำเร็จ!');
    } else {
        alert(result.message);
    }
}

function logout() {
    localStorage.removeItem('user');
    checkLoginStatus();
    alert('ออกจากระบบแล้ว');
}

function checkLoginStatus() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        document.getElementById('menu-guest').style.display = 'none';
        document.getElementById('menu-logged-in').style.display = 'flex';
        document.getElementById('display-email').innerText = user.email;
        document.getElementById('credit-display').innerText = user.credit_balance;
    } else {
        document.getElementById('menu-guest').style.display = 'flex';
        document.getElementById('menu-logged-in').style.display = 'none';
    }
}

window.onload = () => {
    checkLoginStatus();
    fetchProducts();
};

async function uploadSlip() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        alert('กรุณาเข้าสู่ระบบก่อนทำการเติมเงินครับ');
        return;
    }
    const user = JSON.parse(userStr);
    const fileInput = document.getElementById('slip-upload');
    
    if (fileInput.files.length === 0) {
        alert('กรุณาเลือกไฟล์ภาพสลิปโอนเงินก่อนครับ');
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('slip', file);
    formData.append('user_id', user.id);

    alert('ระบบกำลังตรวจสอบสลิปโอนเงิน กรุณารอสักครู่ครับ...');

    try {
        const response = await fetch(`${API_URL}/topup`, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.status === 'success') {
            alert(result.message);
            user.credit_balance = result.new_balance;
            localStorage.setItem('user', JSON.stringify(user));
            checkLoginStatus();
            fileInput.value = '';
            toggleTopup();
        } else {
            alert(`เติมเงินไม่สำเร็จ: ${result.message}`);
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
}