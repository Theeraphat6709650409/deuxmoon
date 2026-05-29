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

    const groupedProducts = {};
    products.forEach(p => {
        if (!groupedProducts[p.platform]) {
            groupedProducts[p.platform] = { platform: p.platform, price: p.price, count: 1 };
        } else {
            groupedProducts[p.platform].count++;
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
                <div class="product-name">รหัสเข้าใช้งาน ${product.platform.toUpperCase()}</div>
                <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 10px;">
                    มีสินค้าพร้อมส่ง: ${product.count} รายการ
                </div>
                <div class="product-price">${product.price} THB</div>
                <button class="btn-buy ${btnClass}" onclick="buyProduct('${product.platform}', ${product.price})">
                    ซื้อเลย
                </button>
            </div>
        `;
        container.innerHTML += cardHtml;
    });
}

// --- ฟังก์ชันสั่งซื้อสินค้า ---
async function buyProduct(platform, price) {
    const confirmBuy = confirm(`ยืนยันการสั่งซื้อแพ็กเกจ ${platform.toUpperCase()} ในราคา ${price} บาท หรือไม่?`);
    if (!confirmBuy) return;

    try {
        const response = await fetch(`${API_URL}/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform: platform })
        });
        const result = await response.json();

        if (result.status === 'success') {
            const data = result.data;
            
            let receiptHtml = `
                <div>แพลตฟอร์ม: <span>${data.platform.toUpperCase()}</span></div>
                <div>บัญชี (ล็อกอิน): <span>${data.login}</span></div>
            `;
            if (data.password) receiptHtml += `<div>รหัสผ่าน: <span>${data.password}</span></div>`;
            receiptHtml += `<div>เข้าใช้งานจอ: <span>${data.profile}</span></div>`;
            if (data.pin) receiptHtml += `<div>รหัสเข้าจอ (PIN): <span>${data.pin}</span></div>`;
            receiptHtml += `<div>วันหมดอายุ: <span>${data.expire_date}</span></div>
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

// เริ่มต้นทำงานเมื่อเปิดหน้าเว็บ
window.onload = () => {
    checkLoginStatus();
    fetchProducts();
};