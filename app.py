import os
import re
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # 8MB slip upload limit

# Set this in Render, for example:
# CORS_ALLOWED_ORIGINS=https://theeraphat6709650409.github.io,http://localhost:5500,http://127.0.0.1:5500
_allowed_origins = os.environ.get("CORS_ALLOWED_ORIGINS", "*").strip()
if _allowed_origins != "*":
    _allowed_origins = [origin.strip() for origin in _allowed_origins.split(",") if origin.strip()]
CORS(app, resources={r"/*": {"origins": _allowed_origins}})

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
REQUEST_TIMEOUT = 25


def env_required(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing environment variable: {name}")
    return value


def get_supabase_config():
    return env_required("SUPABASE_URL").rstrip("/"), env_required("SUPABASE_SERVICE_KEY")


def supabase_headers(prefer: str | None = None):
    _, supabase_key = get_supabase_config()
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    return headers


def make_token(user: dict) -> str:
    secret = env_required("JWT_SECRET")
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user["id"]),
        "email": user["email"],
        "iat": now,
        "exp": now + timedelta(days=7),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def decode_token(token: str) -> dict:
    secret = env_required("JWT_SECRET")
    return jwt.decode(token, secret, algorithms=["HS256"])


def auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"status": "error", "message": "กรุณาเข้าสู่ระบบใหม่"}), 401

        token = auth_header.split(" ", 1)[1].strip()
        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"status": "error", "message": "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่"}), 401
        except Exception:
            return jsonify({"status": "error", "message": "Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่"}), 401

        request.user_id = str(payload["sub"])
        request.user_email = payload.get("email", "")
        return fn(*args, **kwargs)

    return wrapper


def supabase_get(table: str, params: dict):
    supabase_url, _ = get_supabase_config()
    response = requests.get(
        f"{supabase_url}/rest/v1/{table}",
        headers=supabase_headers(),
        params=params,
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    return response.json()


def supabase_post(table: str, payload: dict, prefer: str | None = None):
    supabase_url, _ = get_supabase_config()
    response = requests.post(
        f"{supabase_url}/rest/v1/{table}",
        headers=supabase_headers(prefer),
        json=payload,
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    if response.text:
        return response.json()
    return None


def supabase_rpc(function_name: str, payload: dict):
    supabase_url, _ = get_supabase_config()
    response = requests.post(
        f"{supabase_url}/rest/v1/rpc/{function_name}",
        headers=supabase_headers(),
        json=payload,
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    return response.json()


@app.route("/", methods=["GET"])
def home():
    return "Deuxmoon API is running!"


@app.route("/check-products", methods=["GET"])
def check_products():
    """Return only public product fields. Do not expose account_login/account_password before purchase."""
    try:
        data = supabase_get(
            "products",
            {
                "status": "eq.available",
                "select": "platform,duration_days,price",
                "order": "platform.asc,duration_days.asc",
            },
        )
        return jsonify({"status": "success", "data": data})
    except RuntimeError as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    except requests.exceptions.RequestException:
        return jsonify({"status": "error", "message": "ไม่สามารถโหลดสินค้าได้"}), 500


@app.route("/me", methods=["GET", "OPTIONS"])
@auth_required
def me():
    if request.method == "OPTIONS":
        return "", 200
    try:
        users = supabase_get(
            "users",
            {
                "id": f"eq.{request.user_id}",
                "select": "id,email,credit_balance",
                "limit": "1",
            },
        )
        if not users:
            return jsonify({"status": "error", "message": "ไม่พบผู้ใช้"}), 404
        return jsonify({"status": "success", "data": users[0]})
    except Exception:
        return jsonify({"status": "error", "message": "ไม่สามารถโหลดข้อมูลผู้ใช้ได้"}), 500


@app.route("/register", methods=["POST", "OPTIONS"])
def register():
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not EMAIL_RE.match(email):
        return jsonify({"status": "error", "message": "รูปแบบอีเมลไม่ถูกต้อง"}), 400
    if len(password) < 8:
        return jsonify({"status": "error", "message": "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"}), 400

    try:
        existing = supabase_get("users", {"email": f"eq.{email}", "select": "id", "limit": "1"})
        if existing:
            return jsonify({"status": "error", "message": "อีเมลนี้ถูกใช้งานแล้ว"}), 409

        payload = {
            "email": email,
            "password_hash": generate_password_hash(password),
            "credit_balance": 0,
        }
        supabase_post("users", payload, prefer="return=minimal")
        return jsonify({"status": "success", "message": "สมัครสมาชิกสำเร็จ"})
    except RuntimeError as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    except requests.exceptions.RequestException:
        return jsonify({"status": "error", "message": "สมัครสมาชิกไม่สำเร็จ"}), 500


@app.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"status": "error", "message": "กรุณากรอกอีเมลและรหัสผ่าน"}), 400

    try:
        users = supabase_get(
            "users",
            {
                "email": f"eq.{email}",
                "select": "id,email,password_hash,credit_balance",
                "limit": "1",
            },
        )
        if not users:
            return jsonify({"status": "error", "message": "ไม่พบอีเมลนี้ในระบบ"}), 404

        user = users[0]
        if not check_password_hash(user["password_hash"], password):
            return jsonify({"status": "error", "message": "รหัสผ่านไม่ถูกต้อง"}), 401

        user_data = {
            "id": user["id"],
            "email": user["email"],
            "credit_balance": user.get("credit_balance", 0),
        }
        return jsonify({"status": "success", "data": user_data, "token": make_token(user_data)})
    except RuntimeError as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    except requests.exceptions.RequestException:
        return jsonify({"status": "error", "message": "เข้าสู่ระบบไม่สำเร็จ"}), 500


@app.route("/buy", methods=["POST", "OPTIONS"])
@auth_required
def buy_product():
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json(silent=True) or {}
    platform = (data.get("platform") or "").strip()
    duration_days = data.get("duration_days")

    if not platform or duration_days is None:
        return jsonify({"status": "error", "message": "ข้อมูลสินค้าไม่ครบถ้วน"}), 400

    try:
        duration_days = int(duration_days)
    except (TypeError, ValueError):
        return jsonify({"status": "error", "message": "ระยะเวลาแพ็กเกจไม่ถูกต้อง"}), 400

    try:
        # Requires supabase_rpc.sql to be run once in Supabase SQL Editor.
        result = supabase_rpc(
            "buy_product_secure",
            {
                "p_user_id": request.user_id,
                "p_platform": platform,
                "p_duration_days": duration_days,
            },
        )
        http_code = 200 if result.get("status") == "success" else 400
        if result.get("code") == "OUT_OF_STOCK":
            http_code = 404
        elif result.get("code") == "INSUFFICIENT_CREDIT":
            http_code = 400
        elif result.get("code") == "USER_NOT_FOUND":
            http_code = 404
        return jsonify(result), http_code
    except requests.exceptions.HTTPError:
        return jsonify({"status": "error", "message": "ยังไม่ได้ติดตั้ง Supabase RPC สำหรับระบบซื้อสินค้า"}), 500
    except requests.exceptions.RequestException:
        return jsonify({"status": "error", "message": "ไม่สามารถซื้อสินค้าได้ กรุณาลองใหม่"}), 500
    except RuntimeError as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/topup", methods=["POST", "OPTIONS"])
@auth_required
def topup_credit():
    if request.method == "OPTIONS":
        return "", 200

    if "slip" not in request.files:
        return jsonify({"status": "error", "message": "กรุณาแนบไฟล์สลิป"}), 400

    slip_file = request.files["slip"]
    file_bytes = slip_file.read()
    if not file_bytes:
        return jsonify({"status": "error", "message": "ไม่สามารถอ่านไฟล์รูปภาพได้"}), 400

    slipok_branch_id = os.environ.get("SLIPOK_BRANCH_ID", "").strip()
    slipok_api_key = os.environ.get("SLIPOK_API_KEY", "").strip()
    if not slipok_branch_id or not slipok_api_key:
        return jsonify({"status": "error", "message": "ระบบหลังบ้านยังไม่ได้ตั้งค่าคีย์ SLIPOK"}), 500

    try:
        slipok_url = f"https://api.slipok.com/api/line/apikey/{slipok_branch_id}"
        files = {"files": (slip_file.filename or "slip.jpg", file_bytes, slip_file.mimetype or "image/jpeg")}
        slipok_res = requests.post(
            slipok_url,
            headers={"x-authorization": slipok_api_key},
            files=files,
            timeout=REQUEST_TIMEOUT,
        )
        try:
            slipok_data = slipok_res.json()
        except ValueError:
            return jsonify({"status": "error", "message": f"ระบบ SlipOK ขัดข้อง ({slipok_res.status_code})"}), 400

        if slipok_res.status_code != 200 or not slipok_data.get("success"):
            err_msg = slipok_data.get("message", "สลิปไม่ถูกต้อง หรืออ่านภาพไม่ชัดเจน")
            return jsonify({"status": "error", "message": f"ตรวจสลิปไม่ผ่าน: {err_msg}"}), 400

        result_data = slipok_data.get("data") or {}
        trans_ref = result_data.get("transRef")
        amount = float(result_data.get("amount") or 0)
        sending_bank = result_data.get("sendingBank") or "Unknown"

        if not trans_ref or amount <= 0:
            return jsonify({"status": "error", "message": "ข้อมูลยอดเงินในสลิปไม่ครบถ้วน"}), 400

        # Requires supabase_rpc.sql to be run once in Supabase SQL Editor.
        result = supabase_rpc(
            "add_topup_secure",
            {
                "p_user_id": request.user_id,
                "p_amount": amount,
                "p_sending_bank": sending_bank,
                "p_trans_ref": trans_ref,
            },
        )
        http_code = 200 if result.get("status") == "success" else 400
        if result.get("code") == "DUPLICATE_SLIP":
            http_code = 409
        elif result.get("code") == "USER_NOT_FOUND":
            http_code = 404
        return jsonify(result), http_code
    except requests.exceptions.HTTPError:
        return jsonify({"status": "error", "message": "ยังไม่ได้ติดตั้ง Supabase RPC สำหรับระบบเติมเงิน"}), 500
    except requests.exceptions.RequestException:
        return jsonify({"status": "error", "message": "เกิดข้อผิดพลาดในการเชื่อมต่อ"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
