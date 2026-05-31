const API_URL = "https://deuxmoon-api.onrender.com";
let authMode = 'login'; 
let globalStock = []; 

function showToast(icon, title) {
    Swal.fire({
        toast: true, position: 'top-end', icon: icon, title: title,
        showConfirmButton: false, timer: 2000, timerProgressBar: true,
        background: '#1a1a2e', color: '#fff'
    });
}

function showAlert(icon, title, text) {
    return Swal.fire({
        icon: icon, title: title, text: text,
        background: '#1a1a2e', color: '#fff', confirmButtonColor: '#00dc5a'
    });
}

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
        pinInput.placeholder = 'ตั้งรหัส PIN 4 หลัก';
    } else if (authMode === 'reset') {
        title.innerText = 'รีเซ็ตรหัสผ่าน';
        btnLogin.style.display = 'none'; btnRegister.style.display = 'none'; btnReset.style.display = 'block';
        switchText.innerText = 'กลับไปหน้าเข้าสู่ระบบ';
        forgotText.style.display = 'none'; passInput.placeholder = 'ตั้งรหัสผ่านใหม่'; pinInput.style.display = 'block'; 
        pinInput.placeholder = 'กรอกรหัส PIN เพื่อยืนยัน';
    }
}

async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/check-products`);
        const result = await response.json();
        if (result.status === 'success') {
            globalStock = result.data; initStore();
        } else {
            document.getElementById('app-grid').innerHTML = `<p style="color: #ffb3b3;">ข้อผิดพลาด: ${result.message}</p>`;
        }
    } catch (error) {
        document.getElementById('app-grid').innerHTML = `<p style="color: #ffb3b3;">ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้</p>`;
    }
}

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

function handleAppClick(appId, appName) {
    document.getElementById('app-grid').style.display = 'none';
    document.getElementById('package-section').style.display = 'block';
    document.getElementById('store-title').innerText = appName;
    const container = document.getElementById('package-container');
    container.innerHTML = '';

    if (appId === 'netflix') {
        container.innerHTML = `
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <div class="product-card" style="cursor:pointer;" onclick="renderPackages('netflix_mobile', 'NETFLIX (มือถือ)')">
                    <div class="app-icon" style="margin: 0 auto 15px;"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Netflix_2015_N_logo.svg" alt="Netflix"></div>
                    <div class="product-name">เลือกแพ็กเกจ มือถือ</div>
                </div>
                <div class="product-card" style="cursor:pointer;" onclick="renderPackages('netflix_tv', 'NETFLIX (ทีวี)')">
                    <div class="app-icon" style="margin: 0 auto 15px;"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Netflix_2015_N_logo.svg" alt="Netflix"></div>
                    <div class="product-name">เลือกแพ็กเกจ ทีวี</div>
                </div>
            </div>
        `;
        return;
    }
    renderPackages(appId, appName);
}

function updatePriceDisplay(platform, duration) {
    const checkbox = document.getElementById(`warranty-${platform}-${duration}`);
    const priceContainer = document.getElementById(`price-display-${platform}-${duration}`);
    if (!checkbox || !priceContainer) return;
    
    const basePrice = parseFloat(checkbox.getAttribute('data-baseprice'));
    const originalPrice = parseFloat(checkbox.getAttribute('data-originalprice'));
    const isReseller = checkbox.getAttribute('data-isreseller') === 'true';
    const addon = parseFloat(checkbox.getAttribute('data-addon'));
    
    let finalPrice = checkbox.checked ? (basePrice + addon) : basePrice;
    
    if (isReseller && originalPrice > basePrice) {
        priceContainer.innerHTML = `<span style="text-decoration: line-through; color: #888; font-size: 15px; margin-right: 8px;">${originalPrice}</span><span style="color: #ff4d4d; font-weight: bold;">${finalPrice} THB <span style="font-size:12px; border: 1px solid #ff4d4d; padding: 2px 4px; border-radius: 4px;">ราคาส่ง</span></span>`;
    } else {
        priceContainer.innerHTML = `${finalPrice} THB`;
    }
}

function renderPackages(configId, title) {
    if (title) document.getElementById('store-title').innerText = title;
    const container = document.getElementById('package-container');
    container.innerHTML = '';
    const packList = packages[configId];
    if (!packList) return;

    const userStr = localStorage.getItem('user');
    let isReseller = false;
    if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'reseller') isReseller = true;
    }

    packList.forEach(pack => {
        const availableItems = globalStock.filter(item => item.platform === pack.p && parseInt(item.duration_days) === pack.d);
        const count = availableItems.length;
        
        let basePrice = 0;
        let originalPrice = 0;

        if (count > 0) {
            const sampleItem = availableItems[0];
            const normalPrice = parseFloat(sampleItem.price);
            const wholesalePrice = sampleItem.wholesale_price ? parseFloat(sampleItem.wholesale_price) : null;
            
            if (isReseller && wholesalePrice) {
                basePrice = wholesalePrice;
                originalPrice = normalPrice;
            } else {
                basePrice = normalPrice;
            }
        }

        // --- ระบบสร้างกล่องประกันเคลมแยกเรทแม่ค้า ---
        let isNetflix = pack.p.startsWith('netflix');
        let warrantyHtml = '';
        let warrantyAddon = 0;
        let hasWarrantyOption = false;

        if (isNetflix) {
            if (pack.d === 7 || pack.d === 30) {
                hasWarrantyOption = true;
                
                if (isReseller) {
                    if (pack.d === 7) {
                        warrantyAddon = 5;
                    } else if (pack.d === 30) {
                        warrantyAddon = (pack.p === 'netflix_mobile') ? 23 : 25;
                    }
                } else {
                    warrantyAddon = (pack.d === 7) ? 10 : 25;
                }
                
                let addonText = warrantyAddon > 0 ? `+${warrantyAddon} ฿` : `ฟรี`;
                
                warrantyHtml = `
                    <div style="margin-top: 10px; margin-bottom: 10px; font-size: 13px; text-align: left; background: rgba(0, 220, 90, 0.1); border: 1px solid rgba(0, 220, 90, 0.3); padding: 8px; border-radius: 6px;">
                        <label style="display: flex; align-items: center; cursor: pointer; gap: 8px; margin: 0;">
                            <input type="checkbox" id="warranty-${pack.p}-${pack.d}" 
                                   data-baseprice="${basePrice}"
                                   data-originalprice="${originalPrice}"
                                   data-isreseller="${isReseller}"
                                   data-addon="${warrantyAddon}"
                                   onchange="updatePriceDisplay('${pack.p}', ${pack.d})" 
                                   style="cursor: pointer; width: 16px; height: 16px; accent-color: #00dc5a;">
                            <span style="color: #00dc5a; font-weight: 500;">รับประกันเคลมบัญชี (${addonText})</span>
                        </label>
                    </div>
                `;
            } else {
                warrantyHtml = `
                    <div style="margin-top: 10px; margin-bottom: 10px; font-size: 12px; text-align: left; background: rgba(255, 255, 255, 0.05); padding: 8px; border-radius: 6px; color: #888;">
                        ❌ แพ็กเกจ 1 วัน ไม่มีตัวเลือกประกันเคลม
                    </div>
                `;
            }
        }
        // ------------------------------------

        let priceHtml = '';
        if (isReseller && originalPrice > basePrice) {
             priceHtml = `<span style="text-decoration: line-through; color: #888; font-size: 15px; margin-right: 8px;">${originalPrice}</span><span style="color: #ff4d4d; font-weight: bold;">${basePrice} THB <span style="font-size:12px; border: 1px solid #ff4d4d; padding: 2px 4px; border-radius: 4px;">ราคาส่ง</span></span>`;
        } else {
             priceHtml = `${basePrice} THB`;
        }

        let btnHtml = count > 0 
            ? `<button class="btn-buy" style="background: #007bff; border: none;" onclick="buyProduct('${pack.p}', ${pack.d}, ${basePrice}, '${title} - ${pack.label}', ${hasWarrantyOption})">ซื้อเลย</button>`
            : `<button class="btn-buy" style="background: #444; color: #888; border: 1px solid #555; cursor: not-allowed;" disabled>สินค้าหมด</button>`;

        container.innerHTML += `
            <div class="product-card">
                <div class="product-name" style="font-size: 16px; margin-bottom: 5px;">${pack.label}</div>
                <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 5px;">พร้อมส่ง: ${count} รายการ</div>
                ${warrantyHtml}
                <div class="product-price" id="price-display-${pack.p}-${pack.d}" style="font-size: 20px;">${priceHtml}</div>
                ${btnHtml}
            </div>
        `;
    });
}

async function buyProduct(platform, duration_days, basePrice, displayName, hasWarrantyOption) {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
        await showAlert('warning', 'แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อครับ');
        openAuthModal();
        return;
    }

    const user = JSON.parse(userStr);
    
    let isWarrantySelected = false;
    let finalPrice = basePrice;
    let warrantyText = '';

    if (hasWarrantyOption) {
        const checkbox = document.getElementById(`warranty-${platform}-${duration_days}`);
        if (checkbox && checkbox.checked) {
            isWarrantySelected = true;
            let addon = parseFloat(checkbox.getAttribute('data-addon'));
            finalPrice += addon;
            let addonDisplay = addon > 0 ? `(+${addon} บาท)` : `(ฟรี)`;
            warrantyText = `<br><span style="color: #00dc5a; font-size: 14px;">✅ บวกประกันเคลมบัญชี ${addonDisplay}</span>`;
        }
    }

    if (parseFloat(user.credit_balance) < finalPrice) {
        await showAlert('error', 'ยอดเงินไม่เพียงพอ', 'กรุณาเติมเงินก่อนทำรายการสั่งซื้อครับ');
        toggleTopup();
        return;
    }

    const confirmBuy = await Swal.fire({
        title: 'ยืนยันการสั่งซื้อ',
        html: `แพ็กเกจ <b>${displayName}</b>${warrantyText}<br>ยอดชำระ <b>${finalPrice}</b> บาท`,
        icon: 'question',
        background: '#1a1a2e', color: '#fff',
        showCancelButton: true,
        confirmButtonColor: '#00dc5a', cancelButtonColor: '#ff4d4d',
        confirmButtonText: 'ยืนยันการซื้อ', cancelButtonText: 'ยกเลิก'
    });

    if (!confirmBuy.isConfirmed) return;

    Swal.fire({
        title: 'กำลังทำรายการ...', background: '#1a1a2e', color: '#fff',
        allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }
    });

    try {
        const response = await fetch(`${API_URL}/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ platform: platform, duration_days: duration_days, warranty: isWarrantySelected })
        });
        const result = await response.json();

        if (result.status === 'success') {
            Swal.close();
            user.credit_balance = result.remaining_credit;
            localStorage.setItem('user', JSON.stringify(user));
            checkLoginStatus();
            
            const data = result.data;
            let displayExpire = data.expire_date || '-';
            if (displayExpire !== '-') {
                let dateParts = displayExpire.split(' ');
                let d = dateParts[0].split('-'); 
                if (d.length === 3) {
                    let timeStr = dateParts[1] ? ' ' + dateParts[1] : '';
                    displayExpire = `EXP ${d[2]}-${d[1]}-${d[0]}${timeStr}`;
                }
            }

            let receiptHtml = `
                <div>แพลตฟอร์ม: <span>${displayName}</span></div>
                ${data.has_warranty ? `<div style="color: #00dc5a; font-weight: bold; margin-bottom: 5px;">✅ สั่งซื้อแบบรวมประกันเคลมบัญชี</div>` : ''}
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
            `;
            document.getElementById('receipt-details').innerHTML = receiptHtml;
            document.getElementById('receipt-modal').style.display = 'flex';
            
            fetchProducts(); 
        } else {
            showAlert('error', 'ทำรายการไม่สำเร็จ', result.message);
        }
    } catch (error) {
        showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    }
}

async function register() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const pin = document.getElementById('auth-pin').value;
    
    if (!email || !password || !pin) return showAlert('warning', 'ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลให้ครบถ้วน');
    if (pin.length !== 4 || isNaN(pin)) return showAlert('warning', 'รูปแบบไม่ถูกต้อง', 'กรุณาตั้งรหัส PIN เป็นตัวเลข 4 หลักเท่านั้น');
    
    Swal.fire({ title: 'กำลังโหลด...', background: '#1a1a2e', color: '#fff', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, recovery_pin: pin })
        });
        const result = await res.json();
        if (result.status === 'success') {
            await showAlert('success', 'สำเร็จ!', result.message);
            authMode = 'login'; updateAuthUI(); document.getElementById('auth-pin').value = '';
        } else { showAlert('error', 'ผิดพลาด', result.message); }
    } catch (e) { showAlert('error', 'ข้อผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว'); }
}

async function login() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    Swal.fire({ title: 'กำลังโหลด...', background: '#1a1a2e', color: '#fff', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const result = await res.json();
        if (result.status === 'success') {
            localStorage.setItem('user', JSON.stringify(result.data));
            localStorage.setItem('token', result.token); 
            closeAuthModal(); checkLoginStatus(); 
            showToast('success', 'เข้าสู่ระบบสำเร็จ!');
        } else { showAlert('error', 'เข้าสู่ระบบไม่สำเร็จ', result.message); }
    } catch (e) { showAlert('error', 'ข้อผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว'); }
}

function logout() { 
    localStorage.removeItem('user'); localStorage.removeItem('token'); 
    checkLoginStatus(); showToast('success', 'ออกจากระบบแล้ว'); 
}

async function resetPassword() {
    const email = document.getElementById('auth-email').value;
    const newPassword = document.getElementById('auth-password').value;
    const pin = document.getElementById('auth-pin').value;
    if (!email || !newPassword || !pin) return showAlert('warning', 'ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลให้ครบถ้วน');

    Swal.fire({ title: 'กำลังโหลด...', background: '#1a1a2e', color: '#fff', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        const res = await fetch(`${API_URL}/reset-password`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, new_password: newPassword, recovery_pin: pin })
        });
        const result = await res.json();
        if (result.status === 'success') { 
            await showAlert('success', 'สำเร็จ!', result.message);
            authMode = 'login'; updateAuthUI(); 
            document.getElementById('auth-password').value = ''; document.getElementById('auth-pin').value = ''; 
        } else { showAlert('error', 'ผิดพลาด', result.message); }
    } catch (e) { showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'); }
}

function checkLoginStatus() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        document.getElementById('menu-guest').style.display = 'none';
        document.getElementById('menu-logged-in').style.display = 'flex';
        
        let roleBadge = user.role === 'reseller' ? ' <span style="color:#ffb74d; font-size:12px; border: 1px solid #ffb74d; padding: 2px 5px; border-radius: 4px; margin-left: 5px;">ตัวแทนจำหน่าย</span>' : '';
        document.getElementById('display-email').innerHTML = user.email + roleBadge;
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
    if (!userStr || !token) return showAlert('warning', 'แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อนทำการเติมเงินครับ');
    
    const user = JSON.parse(userStr);
    const fileInput = document.getElementById('slip-upload');
    if (fileInput.files.length === 0) return showAlert('warning', 'ไม่พบไฟล์', 'กรุณาเลือกไฟล์ภาพสลิปโอนเงินก่อนครับ');

    const file = fileInput.files[0];
    const formData = new FormData(); formData.append('slip', file);
    
    Swal.fire({
        title: 'กำลังตรวจสอบสลิป...', text: 'กรุณารอสักครู่',
        background: '#1a1a2e', color: '#fff',
        allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }
    });

    try {
        const response = await fetch(`${API_URL}/topup`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
        const result = await response.json();
        if (result.status === 'success') {
            await showAlert('success', 'เติมเงินสำเร็จ!', result.message);
            user.credit_balance = result.new_balance;
            localStorage.setItem('user', JSON.stringify(user));
            checkLoginStatus(); fileInput.value = ''; toggleTopup();
        } else { showAlert('error', 'ตรวจสลิปไม่ผ่าน', result.message); }
    } catch (error) { showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'); }
}