const API_URL = "https://deuxmoon-api.onrender.com";
let authMode = 'login'; 
let globalStock = []; // ตัวแปรเก็บสต็อกสินค้าทั้งหมดที่ดึงมาจากฐานข้อมูล

// แทนที่ตัวแปร appList เดิมด้วยชุดข้อมูลที่มีลิงก์โลโก้จริง
const appList = [
    { id: 'netflix', name: 'NETFLIX', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Netflix_2015_N_logo.svg' },
    { id: 'disney', name: 'DISNEY+', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Disney%2B_logo.svg' },
    { id: 'iqiyi', name: 'iQIYI', img: 'https://play-lh.googleusercontent.com/L40FnQ8nF8zRtUdALz9b23JirsxYA5-0_fkRUlFBMymud09ctBCFrNui4l-ES_V6Uw=w1024' },
    { id: 'wetv', name: 'WeTV', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/WeTV_logo.svg' },
    { id: 'viu', name: 'Viu', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Viu_logo.svg' },
    { id: 'prime', name: 'Prime Video', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Amazon_Prime_Video_logo.svg' },
    { id: 'hbo', name: 'HBO Max', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Max_logo.svg' },
    { id: 'oned', name: 'OneD', img: 'https://www.ais.th/content/ais/th/th_th/consumers/entertainment/streaming-app/one-d/_jcr_content/root/container_1816311984/aiscontainer/columncontrol_copy_c/content1/image.coreimg.png/1742182598629/logo-oned-b.png' },
    { id: 'ch3', name: 'Ch3 Plus', img: 'https://assets.ch3plus.com/ch3plus_logo.png' },
    { id: 'bilibili', name: 'Bilibili', img: 'https://img.icons8.com/color/1200/bilibili.jpg' },
    { id: 'spotify', name: 'Spotify', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Spotify_icon.svg/1280px-Spotify_icon.svg.png' },
    { id: 'canva', name: 'Canva', img: 'https://www.edigitalagency.com.au/wp-content/uploads/Canva-logo-PNG-large-size.png' },
    { id: 'monomax', name: 'Mono Max', img: 'https://img.monomax.me/9RN09HpT5JJlM0gDpIB3EUYJFgg=/www.monomax.me/assets/monomax/images/maxplay/logo-monomax-sm.png' },
    { id: 'trueid', name: 'TrueID+', img: 'https://cms.dmpcdn.com/misc/2022/02/09/af7de880-89ab-11ec-8c0c-590a22d85d91_webp_original.webp' },
    { id: 'chatgpt', name: 'ChatGPT+', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/ChatGPT_logo.svg' }
];

// --- การตั้งค่าแพ็กเกจ (จับคู่ platform ในฐานข้อมูล และ duration) ---
const packages = {
    'netflix_mobile': [
        { p: 'netflix_mobile', d: 1, label: 'มือถือ - 1 วัน' },
        { p: 'netflix_mobile', d: 7, label: 'มือถือ - 7 วัน' },
        { p: 'netflix_mobile', d: 30, label: 'มือถือ - 30 วัน' }
    ],
    'netflix_tv': [
        { p: 'netflix_tv', d: 1, label: 'ทีวี - 1 วัน' },
        { p: 'netflix_tv', d: 7, label: 'ทีวี - 7 วัน' },
        { p: 'netflix_tv', d: 30, label: 'ทีวี - 30 วัน' }
    ],
    'disney': [
        { p: 'disney', d: 1, label: '1 วัน' },
        { p: 'disney', d: 7, label: '7 วัน' },
        { p: 'disney', d: 30, label: '30 วัน' }
    ],
    'iqiyi': [
        { p: 'iqiyi_private', d: 30, label: 'บัญชีส่วนตัว' },
        { p: 'iqiyi_share2', d: 30, label: '30 วัน (หาร 2)' },
        { p: 'iqiyi_share3', d: 30, label: '30 วัน (หาร 3)' },
        { p: 'iqiyi_share4', d: 30, label: '30 วัน (หาร 4)' }
    ],
    'wetv': [
        { p: 'wetv_private', d: 30, label: 'บัญชีส่วนตัว' },
        { p: 'wetv_share2', d: 30, label: '30 วัน (หาร 2)' },
        { p: 'wetv_share3', d: 30, label: '30 วัน (หาร 3)' },
        { p: 'wetv_share4', d: 30, label: '30 วัน (หาร 4)' }
    ],
    'viu': [
        { p: 'viu_private', d: 30, label: 'บัญชีส่วนตัว' },
        { p: 'viu_share3', d: 30, label: '30 วัน (หาร 3)' },
        { p: 'viu_share4', d: 30, label: '30 วัน (หาร 4)' }
    ],
    'prime': [
        { p: 'prime_share3', d: 7, label: '7 วัน (หาร 3)' },
        { p: 'prime_share5', d: 7, label: '7 วัน (หาร 5)' },
        { p: 'prime_share3', d: 30, label: '30 วัน (หาร 3)' },
        { p: 'prime_share5', d: 30, label: '30 วัน (หาร 5)' }
    ],
    'hbo': [
        { p: 'hbo', d: 7, label: '7 วัน' },
        { p: 'hbo', d: 30, label: '30 วัน' }
    ],
    'oned': [
        { p: 'oned_share2', d: 30, label: '30 วัน (หาร 2)' },
        { p: 'oned_private', d: 30, label: '30 วัน (ส่วนตัว)' }
    ],
    'ch3': [
        { p: 'ch3_share2', d: 30, label: '30 วัน (หาร 2)' },
        { p: 'ch3_private', d: 30, label: '30 วัน (ส่วนตัว)' }
    ],
    'bilibili': [
        { p: 'bilibili_share3', d: 30, label: '30 วัน (หาร 3)' },
        { p: 'bilibili_private', d: 30, label: '30 วัน (ส่วนตัว)' }
    ],
    'spotify': [
        { p: 'spotify_renew', d: 30, label: '30 วัน (ต่อเมล)' },
        { p: 'spotify_store', d: 60, label: '60 วัน (เมลร้านไม่ต่ออายุ)' }
    ],
    'canva': [
        { p: 'canva', d: 7, label: '7 วัน' },
        { p: 'canva', d: 30, label: '30 วัน' }
    ],
    'monomax': [
        { p: 'monomax', d: 7, label: '7 วัน' },
        { p: 'monomax', d: 30, label: '30 วัน' }
    ],
    'trueid': [
        { p: 'trueid', d: 30, label: '30 วัน' }
    ],
    'chatgpt': [
        { p: 'chatgpt_private', d: 30, label: '30 วัน (ส่วนตัว)' },
        { p: 'chatgpt_share4', d: 30, label: '30 วัน (หาร 4)' }
    ]
};

// --- ควบคุมการแสดงผล UI พื้นฐาน ---
function toggleTopup() {
    const store = document.getElementById('store-section');
    const topup = document.getElementById('topup-section');
    if (store.style.display === 'none') {
        store.style.display = 'block'; topup.style.display = 'none';
        backToMainMenu();
    } else {
        store.style.display = 'none'; topup.style.display = 'block';
    }
}

function openAuthModal() { authMode = 'login'; updateAuthUI(); document.getElementById('auth-modal').style.display = 'flex'; }
function closeAuthModal() { document.getElementById('auth-modal').style.display = 'none'; }
function closeReceiptModal() { document.getElementById('receipt-modal').style.display = 'none'; }
function toggleAuthMode() { authMode = (authMode === 'login') ? 'register' : 'login'; updateAuthUI(); }
function toggleResetMode() { authMode = 'reset'; updateAuthUI(); }

function updateAuthUI() {
    const title = document.getElementById('auth-title');
    const btnLogin = document.getElementById('btn-login');
    const btnRegister = document.getElementById('btn-register');
    const btnReset = document.getElementById('btn-reset');
    const switchText = document.getElementById('auth-switch-text');
    const forgotText = document.getElementById('forgot-password-text');
    const passInput = document.getElementById('auth-password');
    const pinInput = document.getElementById('auth-pin'); 

    if (authMode === 'login') {
        title.innerText = 'เข้าสู่ระบบ';
        btnLogin.style.display = 'block'; btnRegister.style.display = 'none'; btnReset.style.display = 'none';
        switchText.innerText = 'ยังไม่มีบัญชี? กดที่นี่เพื่อสมัครสมาชิก';
        forgotText.style.display = 'block'; passInput.placeholder = 'รหัสผ่าน'; pinInput.style.display = 'none'; 
    } else if (authMode === 'register') {
        title.innerText = 'สมัครสมาชิก';
        btnLogin.style.display = 'none'; btnRegister.style.display = 'block'; btnReset.style.display = 'none';
        switchText.innerText = 'มีบัญชีแล้ว? กดที่นี่เพื่อเข้าสู่ระบบ';
        forgotText.style.display = 'none'; passInput.placeholder = 'ตั้งรหัสผ่าน'; pinInput.style.display = 'block'; 
        pinInput.placeholder = 'ตั้งรหัส PIN 4 หลัก (ใช้ตอนลืมรหัสผ่าน)';
    } else if (authMode === 'reset') {
        title.innerText = 'รีเซ็ตรหัสผ่าน';
        btnLogin.style.display = 'none'; btnRegister.style.display = 'none'; btnReset.style.display = 'block';
        switchText.innerText = 'กลับไปหน้าเข้าสู่ระบบ';
        forgotText.style.display = 'none'; passInput.placeholder = 'ตั้งรหัสผ่านใหม่'; pinInput.style.display = 'block'; 
        pinInput.placeholder = 'กรอกรหัส PIN 4 หลักเพื่อยืนยัน';
    }
}

// --- โหลดข้อมูลสต็อกสินค้า ---
async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/check-products`);
        const result = await response.json();
        if (result.status === 'success') {
            globalStock = result.data;
            initStore(); // เริ่มสร้างหน้าต่างเลือกแอป
        } else {
            document.getElementById('app-grid').innerHTML = `<p style="color: #ffb3b3;">เกิดข้อผิดพลาด: ${result.message}</p>`;
        }
    } catch (error) {
        document.getElementById('app-grid').innerHTML = `<p style="color: #ffb3b3;">ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้</p>`;
    }
}

// นำฟังก์ชันนี้ไปแทนที่ initStore เดิม เพื่อให้ระบบอ่านแท็ก <img> แทนตัวอักษร
function initStore() {
    const grid = document.getElementById('app-grid');
    grid.innerHTML = '';
    
    appList.forEach(app => {
        grid.innerHTML += `
            <div class="app-card" onclick="handleAppClick('${app.id}', '${app.name}')">
                <div class="app-icon"><img src="${app.img}" alt="${app.name} logo"></div>
                <div class="app-title">${app.name}</div>
            </div>
        `;
    });
}

function backToMainMenu() {
    document.getElementById('app-grid').style.display = 'grid';
    document.getElementById('package-section').style.display = 'none';
    document.getElementById('store-title').innerText = 'เลือกแอปที่ต้องการ';
}

// นำฟังก์ชันนี้ไปแทนที่ handleAppClick เดิม เพื่ออัปเดตโลโก้ Netflix ในเมนูย่อย
function handleAppClick(appId, appName) {
    document.getElementById('app-grid').style.display = 'none';
    document.getElementById('package-section').style.display = 'block';
    document.getElementById('store-title').innerText = appName;
    const container = document.getElementById('package-container');
    container.innerHTML = '';

    // กรณีพิเศษสำหรับ Netflix (บังคับเลือกอุปกรณ์ก่อน)
    if (appId === 'netflix') {
        container.innerHTML = `
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <div class="product-card" style="cursor:pointer;" onclick="renderPackages('netflix_mobile', 'NETFLIX (มือถือ)')">
                    <div class="app-icon" style="margin: 0 auto 15px;"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Netflix_2015_N_logo.svg" alt="Netflix Mobile"></div>
                    <div class="product-name">เลือกแพ็กเกจ มือถือ</div>
                </div>
                <div class="product-card" style="cursor:pointer;" onclick="renderPackages('netflix_tv', 'NETFLIX (ทีวี)')">
                    <div class="app-icon" style="margin: 0 auto 15px;"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Netflix_2015_N_logo.svg" alt="Netflix TV"></div>
                    <div class="product-name">เลือกแพ็กเกจ ทีวี</div>
                </div>
            </div>
        `;
        return;
    }

    renderPackages(appId, appName);
}

// แสดงรายการย่อยตาม Config
function renderPackages(configId, title) {
    if (title) document.getElementById('store-title').innerText = title;
    const container = document.getElementById('package-container');
    container.innerHTML = '';

    const packList = packages[configId];
    if (!packList) return;

    packList.forEach(pack => {
        // ค้นหาสินค้าในสต็อกที่ข้อมูลตรงกับฐานข้อมูล
        const availableItems = globalStock.filter(item => item.platform === pack.p && parseInt(item.duration_days) === pack.d);
        const count = availableItems.length;
        const price = count > 0 ? parseFloat(availableItems[0].price) : '-';

        let btnHtml = '';
        if (count > 0) {
            btnHtml = `<button class="btn-buy" style="background: #007bff; border: none;" onclick="buyProduct('${pack.p}', ${pack.d}, ${price}, '${title} - ${pack.label}')">ซื้อเลย</button>`;
        } else {
            btnHtml = `<button class="btn-buy" style="background: #444; color: #888; border: 1px solid #555; cursor: not-allowed;" disabled>สินค้าหมด</button>`;
        }

        const cardHtml = `
            <div class="product-card">
                <div class="product-name" style="font-size: 16px; margin-bottom: 5px;">${pack.label}</div>
                <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 10px;">พร้อมส่ง: ${count} รายการ</div>
                <div class="product-price" style="font-size: 20px;">${price !== '-' ? price + ' THB' : ''}</div>
                ${btnHtml}
            </div>
        `;
        container.innerHTML += cardHtml;
    });
}

// --- ฟังก์ชันการซื้อสินค้า ---
async function buyProduct(platform, duration_days, price, displayName) {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
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

    const confirmBuy = confirm(`ยืนยันการสั่งซื้อแพ็กเกจ ${displayName}\nราคา ${price} บาท หรือไม่?`);
    if (!confirmBuy) return;

    try {
        const response = await fetch(`${API_URL}/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ platform: platform, duration_days: duration_days })
        });
        const result = await response.json();

        if (result.status === 'success') {
            user.credit_balance = result.remaining_credit;
            localStorage.setItem('user', JSON.stringify(user));
            checkLoginStatus();
            
            const data = result.data;
            // แปลงรูปแบบวันที่จากสากล (YYYY-MM-DD) เป็นรูปแบบ EXP DD-MM-YYYY 
            let displayExpire = data.expire_date || '-';
            if (displayExpire !== '-') {
                let dateParts = displayExpire.split(' '); // แยกวันที่กับเวลาออกจากกัน
                let d = dateParts[0].split('-'); // แยก ปี-เดือน-วัน
                if (d.length === 3) {
                    let timeStr = dateParts[1] ? ' ' + dateParts[1] : '';
                    // นำมาประกอบใหม่ตามสูตร Excel
                    displayExpire = `EXP ${d[2]}-${d[1]}-${d[0]}${timeStr}`;
                }
            }

            let receiptHtml = `
                <div>แพลตฟอร์ม: <span>${displayName}</span></div>
                <div>บัญชี (ล็อกอิน): <span>${data.account_login || data.login}</span></div>
            `;
            if (data.account_password || data.password) receiptHtml += `<div>รหัสผ่าน: <span>${data.account_password || data.password}</span></div>`;
            receiptHtml += `<div>เข้าใช้งานจอ: <span>${data.profile_name || data.profile || '-'}</span></div>`;
            if (data.pin_code || data.pin) receiptHtml += `<div>รหัสเข้าจอ (PIN): <span>${data.pin_code || data.pin}</span></div>`;
            receiptHtml += `<div>วันหมดอายุ: <span>${displayExpire}</span></div>
                
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
            
            fetchProducts(); // โหลดข้อมูลสต็อกใหม่เพื่ออัปเดตจำนวนคงเหลือ
        } else {
            alert(`ไม่สามารถซื้อได้: ${result.message}`);
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    }
}

// --- ฟังก์ชัน Auth พื้นฐาน ---
async function register() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const pin = document.getElementById('auth-pin').value;
    
    if (!email || !password || !pin) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    if (pin.length !== 4 || isNaN(pin)) return alert('กรุณาตั้งรหัส PIN เป็นตัวเลข 4 หลักเท่านั้น');
    
    const res = await fetch(`${API_URL}/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, recovery_pin: pin })
    });
    const result = await res.json();
    alert(result.message);
    if (result.status === 'success') { authMode = 'login'; updateAuthUI(); document.getElementById('auth-pin').value = ''; }
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
        localStorage.setItem('token', result.token); 
        closeAuthModal(); checkLoginStatus(); alert('เข้าสู่ระบบสำเร็จ!');
    } else { alert(result.message); }
}

function logout() { localStorage.removeItem('user'); localStorage.removeItem('token'); checkLoginStatus(); alert('ออกจากระบบแล้ว'); }

async function resetPassword() {
    const email = document.getElementById('auth-email').value;
    const newPassword = document.getElementById('auth-password').value;
    const pin = document.getElementById('auth-pin').value;
    if (!email || !newPassword || !pin) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');

    try {
        const res = await fetch(`${API_URL}/reset-password`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, new_password: newPassword, recovery_pin: pin })
        });
        const result = await res.json();
        alert(result.message);
        if (result.status === 'success') { authMode = 'login'; updateAuthUI(); document.getElementById('auth-password').value = ''; document.getElementById('auth-pin').value = ''; }
    } catch (e) { alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'); }
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

window.onload = () => { checkLoginStatus(); fetchProducts(); };

async function uploadSlip() {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStr || !token) return alert('กรุณาเข้าสู่ระบบก่อนทำการเติมเงินครับ');
    
    const user = JSON.parse(userStr);
    const fileInput = document.getElementById('slip-upload');
    if (fileInput.files.length === 0) return alert('กรุณาเลือกไฟล์ภาพสลิปโอนเงินก่อนครับ');

    const file = fileInput.files[0];
    const formData = new FormData(); formData.append('slip', file);
    alert('ระบบกำลังตรวจสอบสลิปโอนเงิน กรุณารอสักครู่ครับ...');

    try {
        const response = await fetch(`${API_URL}/topup`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
        const result = await response.json();
        if (result.status === 'success') {
            alert(result.message);
            user.credit_balance = result.new_balance;
            localStorage.setItem('user', JSON.stringify(user));
            checkLoginStatus(); fileInput.value = ''; toggleTopup();
        } else { alert(`เติมเงินไม่สำเร็จ: ${result.message}`); }
    } catch (error) { alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'); }
}