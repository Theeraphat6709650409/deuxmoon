const API_URL = "https://deuxmoon-api.onrender.com";
let isLoginMode = true;

function getToken() {
  return localStorage.getItem("token") || "";
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch (_) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return null;
  }
}

function saveSession(user, token) {
  localStorage.setItem("user", JSON.stringify(user));
  if (token) localStorage.setItem("token", token);
}

function clearSession() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
}

function formatMoney(value) {
  const n = Number(value || 0);
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function requestJSON(url, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { ...options, headers });
  const result = await response.json().catch(() => ({ status: "error", message: "เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง" }));

  if (response.status === 401) {
    clearSession();
    checkLoginStatus();
  }
  return result;
}

function toggleTopup() {
  const store = document.getElementById("store-section");
  const topup = document.getElementById("topup-section");
  const isTopupOpen = store.style.display === "none";
  store.style.display = isTopupOpen ? "block" : "none";
  topup.style.display = isTopupOpen ? "none" : "block";
}

function openAuthModal() {
  document.getElementById("auth-modal").style.display = "flex";
}

function closeAuthModal() {
  document.getElementById("auth-modal").style.display = "none";
}

function closeReceiptModal() {
  document.getElementById("receipt-modal").style.display = "none";
}

function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  document.getElementById("auth-title").innerText = isLoginMode ? "เข้าสู่ระบบ" : "สมัครสมาชิก";
  document.getElementById("btn-login").style.display = isLoginMode ? "block" : "none";
  document.getElementById("btn-register").style.display = isLoginMode ? "none" : "block";
  document.getElementById("auth-switch-text").innerText = isLoginMode
    ? "ยังไม่มีบัญชี? กดที่นี่เพื่อสมัครสมาชิก"
    : "มีบัญชีแล้ว? กดที่นี่เพื่อเข้าสู่ระบบ";
}

function setContainerMessage(container, message) {
  container.textContent = message;
}

async function fetchProducts() {
  const container = document.getElementById("product-container");
  setContainerMessage(container, "กำลังโหลดข้อมูลสินค้า...");

  try {
    const response = await fetch(`${API_URL}/check-products`);
    const result = await response.json();
    if (result.status === "success") {
      renderProducts(result.data || []);
    } else {
      setContainerMessage(container, `เกิดข้อผิดพลาด: ${result.message || "ไม่ทราบสาเหตุ"}`);
    }
  } catch (_) {
    setContainerMessage(container, "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
  }
}

function productLogo(platform) {
  const name = String(platform || "").toLowerCase();
  if (name === "netflix") {
    return {
      src: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
      btnClass: "btn-netflix",
    };
  }
  return {
    src: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg",
    btnClass: "btn-disney",
  };
}

function renderProducts(products) {
  const container = document.getElementById("product-container");
  container.replaceChildren();

  if (!products.length) {
    setContainerMessage(container, "ขณะนี้สินค้าหมดชั่วคราว");
    return;
  }

  const groupedProducts = {};
  products.forEach((p) => {
    const key = `${p.platform}_${p.duration_days}_${p.price}`;
    if (!groupedProducts[key]) {
      groupedProducts[key] = {
        platform: p.platform,
        duration_days: Number(p.duration_days),
        price: Number(p.price),
        count: 1,
      };
    } else {
      groupedProducts[key].count += 1;
    }
  });

  Object.values(groupedProducts).forEach((product) => {
    const { src, btnClass } = productLogo(product.platform);

    const card = document.createElement("div");
    card.className = "product-card";

    const img = document.createElement("img");
    img.className = "product-logo";
    img.src = src;
    img.alt = `${product.platform} logo`;

    const name = document.createElement("div");
    name.className = "product-name";
    name.textContent = `${String(product.platform).toUpperCase()} - ${product.duration_days} วัน`;

    const stock = document.createElement("div");
    stock.className = "product-stock";
    stock.textContent = `พร้อมส่ง: ${product.count} รายการ`;

    const price = document.createElement("div");
    price.className = "product-price";
    price.textContent = `${formatMoney(product.price)} THB`;

    const btn = document.createElement("button");
    btn.className = `btn-buy ${btnClass}`;
    btn.type = "button";
    btn.textContent = "ซื้อเลย";
    btn.addEventListener("click", () => buyProduct(product.platform, product.duration_days, product.price));

    card.append(img, name, stock, price, btn);
    container.appendChild(card);
  });
}

async function buyProduct(platform, duration_days, price) {
  const user = getStoredUser();
  if (!user || !getToken()) {
    alert("กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อครับ");
    openAuthModal();
    return;
  }

  if (Number(user.credit_balance || 0) < Number(price || 0)) {
    alert("ยอดเงินของคุณไม่เพียงพอ กรุณาเติมเงินก่อนครับ");
    toggleTopup();
    return;
  }

  const confirmBuy = confirm(
    `ยืนยันการสั่งซื้อแพ็กเกจ ${String(platform).toUpperCase()} แบบ ${duration_days} วัน\nราคา ${formatMoney(price)} บาท หรือไม่?`
  );
  if (!confirmBuy) return;

  try {
    const result = await requestJSON(`${API_URL}/buy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, duration_days }),
    });

    if (result.status === "success") {
      user.credit_balance = result.remaining_credit;
      saveSession(user);
      checkLoginStatus();
      showReceipt(result.data, duration_days);
      fetchProducts();
    } else {
      alert(`ไม่สามารถซื้อได้: ${result.message || "ไม่ทราบสาเหตุ"}`);
    }
  } catch (_) {
    alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
  }
}

function addReceiptRow(parent, label, value) {
  if (value === undefined || value === null || value === "") return;
  const row = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;
  const span = document.createElement("span");
  span.textContent = String(value);
  row.append(strong, span);
  parent.appendChild(row);
}

function showReceipt(data, duration_days) {
  const receipt = document.getElementById("receipt-details");
  receipt.replaceChildren();

  addReceiptRow(receipt, "แพลตฟอร์ม", `${String(data.platform).toUpperCase()} (${duration_days} วัน)`);
  addReceiptRow(receipt, "บัญชี (ล็อกอิน)", data.login);
  addReceiptRow(receipt, "รหัสผ่าน", data.password);
  addReceiptRow(receipt, "เข้าใช้งานจอ", data.profile);
  addReceiptRow(receipt, "รหัสเข้าจอ (PIN)", data.pin);
  addReceiptRow(receipt, "วันหมดอายุ", data.expire_date);

  const note = document.createElement("p");
  note.textContent = "*** กรุณาก๊อปปี้หรือแคปหน้าจอนี้เก็บไว้ครับ";
  receipt.appendChild(note);

  document.getElementById("receipt-modal").style.display = "flex";
}

async function register() {
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;

  const result = await requestJSON(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  alert(result.message || "สมัครสมาชิกไม่สำเร็จ");
  if (result.status === "success") toggleAuthMode();
}

async function login() {
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;

  const result = await requestJSON(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (result.status === "success") {
    saveSession(result.data, result.token);
    closeAuthModal();
    checkLoginStatus();
    alert("เข้าสู่ระบบสำเร็จ!");
  } else {
    alert(result.message || "เข้าสู่ระบบไม่สำเร็จ");
  }
}

function logout() {
  clearSession();
  checkLoginStatus();
  alert("ออกจากระบบแล้ว");
}

function checkLoginStatus() {
  const user = getStoredUser();
  const hasSession = Boolean(user && getToken());

  document.getElementById("menu-guest").style.display = hasSession ? "none" : "flex";
  document.getElementById("menu-logged-in").style.display = hasSession ? "flex" : "none";

  if (hasSession) {
    document.getElementById("display-email").innerText = user.email || "";
    document.getElementById("credit-display").innerText = formatMoney(user.credit_balance);
  }
}

async function refreshMe() {
  if (!getToken()) return;
  const result = await requestJSON(`${API_URL}/me`);
  if (result.status === "success") {
    saveSession(result.data);
    checkLoginStatus();
  }
}

async function uploadSlip() {
  const user = getStoredUser();
  if (!user || !getToken()) {
    alert("กรุณาเข้าสู่ระบบก่อนทำการเติมเงินครับ");
    openAuthModal();
    return;
  }

  const fileInput = document.getElementById("slip-upload");
  if (!fileInput.files.length) {
    alert("กรุณาเลือกไฟล์ภาพสลิปโอนเงินก่อนครับ");
    return;
  }

  const formData = new FormData();
  formData.append("slip", fileInput.files[0]);

  alert("ระบบกำลังตรวจสอบสลิปโอนเงิน กรุณารอสักครู่ครับ...");

  try {
    const result = await requestJSON(`${API_URL}/topup`, {
      method: "POST",
      body: formData,
    });

    if (result.status === "success") {
      alert(result.message || "เติมเงินสำเร็จ");
      user.credit_balance = result.new_balance;
      saveSession(user);
      checkLoginStatus();
      fileInput.value = "";
      toggleTopup();
    } else {
      alert(`เติมเงินไม่สำเร็จ: ${result.message || "ไม่ทราบสาเหตุ"}`);
    }
  } catch (_) {
    alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
  }
}

window.onload = () => {
  checkLoginStatus();
  refreshMe();
  fetchProducts();
};
