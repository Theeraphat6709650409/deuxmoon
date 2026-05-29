from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import requests
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ตัวดักจับความปลอดภัย (JWT Middleware)
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return '', 200
        
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(" ")[1]
            
        if not token:
            return jsonify({'status': 'error', 'message': 'กรุณาล็อกอินก่อนทำรายการ'}), 401
            
        try:
            secret = os.environ.get("JWT_SECRET", "deuxmoon2026")
            data = jwt.decode(token, secret, algorithms=["HS256"])
            current_user_id = data['user_id']
        except:
            return jsonify({'status': 'error', 'message': 'เซสชันหมดอายุ กรุณาล็อกอินใหม่'}), 401
            
        return f(current_user_id, *args, **kwargs)
    return decorated

@app.route('/', methods=['GET'])
def home():
    return "Deuxmoon API is running securely with JWT!"

@app.route('/check-products', methods=['GET'])
def check_products():
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    endpoint = f"{supabase_url}/rest/v1/products?status=eq.available&select=*"
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}
    try:
        response = requests.get(endpoint, headers=headers)
        response.raise_for_status()
        return jsonify({'status': 'success', 'data': response.json()})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS': return '', 200
    data = request.json
    email = data.get('email')
    password = data.get('password')
    recovery_pin = data.get('recovery_pin') # รับค่า PIN มาด้วย

    if not email or not password or not recovery_pin:
        return jsonify({'error': 'กรุณากรอกข้อมูลให้ครบถ้วน'}), 400

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"}

    try:
        check_res = requests.get(f"{supabase_url}/rest/v1/users?email=eq.{email}", headers=headers)
        if check_res.json():
            return jsonify({'status': 'error', 'message': 'อีเมลนี้ถูกใช้งานแล้ว'}), 409

        hashed_password = generate_password_hash(password)
        # บันทึก PIN ลงตารางด้วย
        payload = {"email": email, "password_hash": hashed_password, "recovery_pin": recovery_pin}
        requests.post(f"{supabase_url}/rest/v1/users", headers=headers, json=payload).raise_for_status()
        return jsonify({'status': 'success', 'message': 'สมัครสมาชิกสำเร็จ'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS': return '', 200
    data = request.json
    email = data.get('email')
    password = data.get('password')

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}

    try:
        res = requests.get(f"{supabase_url}/rest/v1/users?email=eq.{email}", headers=headers)
        users = res.json()
        if not users: return jsonify({'status': 'error', 'message': 'ไม่พบอีเมลนี้ในระบบ'}), 404
            
        user = users[0]
        if check_password_hash(user['password_hash'], password):
            # สร้างตั๋ว JWT
            secret = os.environ.get("JWT_SECRET", "deuxmoon2026")
            token = jwt.encode({
                'user_id': user['id'],
                'email': user['email'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
            }, secret, algorithm="HS256")
            
            user_data = {"id": user['id'], "email": user['email'], "credit_balance": user['credit_balance']}
            return jsonify({'status': 'success', 'token': token, 'data': user_data})
        else:
            return jsonify({'status': 'error', 'message': 'รหัสผ่านไม่ถูกต้อง'}), 401
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/buy', methods=['POST', 'OPTIONS'])
@token_required
def buy_product(current_user_id):
    data = request.json
    platform = data.get('platform')
    duration_days = data.get('duration_days')

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json", "Prefer": "return=representation"}

    try:
        user_res = requests.get(f"{supabase_url}/rest/v1/users?id=eq.{current_user_id}", headers=headers)
        user = user_res.json()[0]
        current_credit = float(user['credit_balance'])

        get_url = f"{supabase_url}/rest/v1/products?platform=eq.{platform}&duration_days=eq.{duration_days}&status=eq.available&limit=1"
        res = requests.get(get_url, headers=headers)
        products = res.json()
        
        if not products: return jsonify({'status': 'error', 'message': 'สินค้าหมดชั่วคราว'}), 404
            
        target_product = products[0]
        price = float(target_product['price'])

        if current_credit < price: return jsonify({'status': 'error', 'message': 'ยอดเงินไม่เพียงพอ กรุณาเติมเงิน'}), 400
        
        update_url = f"{supabase_url}/rest/v1/products?id=eq.{target_product['id']}&status=eq.available"
        update_res = requests.patch(update_url, headers=headers, json={"status": "sold"})
        updated_rows = update_res.json()
        
        if not updated_rows: return jsonify({'status': 'error', 'message': 'ซื้อไม่ทัน สินค้าถูกซื้อไปแล้ว'}), 409
            
        purchased_account = updated_rows[0]
        new_credit = current_credit - price
        requests.patch(f"{supabase_url}/rest/v1/users?id=eq.{current_user_id}", headers=headers, json={"credit_balance": new_credit})
        
        purchase_payload = {
            "user_id": current_user_id, "product_id": target_product['id'],
            "platform": purchased_account.get('platform', ''), "account_login": purchased_account.get('account_login', ''),
            "account_password": purchased_account.get('account_password', ''), "profile_name": purchased_account.get('profile_name', ''),
            "pin_code": purchased_account.get('pin_code', ''), "expire_date": purchased_account.get('expire_date', ''), "price": price
        }
        requests.post(f"{supabase_url}/rest/v1/purchases", headers=headers, json=purchase_payload)
        
        return jsonify({'status': 'success', 'data': purchased_account, 'remaining_credit': new_credit})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/topup', methods=['POST', 'OPTIONS'])
@token_required
def topup_credit(current_user_id):
    if 'slip' not in request.files: return jsonify({'status': 'error', 'message': 'ข้อมูลไม่ครบถ้วน'}), 400

    slip_file = request.files['slip']
    file_bytes = slip_file.read()
    
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    slipok_branch_id = os.environ.get("SLIPOK_BRANCH_ID", "").strip()
    slipok_api_key = os.environ.get("SLIPOK_API_KEY", "").strip()
    headers_supabase = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"}

    try:
        slipok_url = f"https://api.slipok.com/api/line/apikey/{slipok_branch_id}"
        headers_slipok = {'x-authorization': slipok_api_key}
        files = {'files': (slip_file.filename, file_bytes, slip_file.mimetype or 'image/jpeg')}
        
        slipok_res = requests.post(slipok_url, headers=headers_slipok, files=files)
        slipok_data = slipok_res.json()

        if slipok_res.status_code != 200 or not slipok_data.get('success'):
            return jsonify({'status': 'error', 'message': f"ตรวจสลิปไม่ผ่าน: {slipok_data.get('message', '')}"}), 400

        result_data = slipok_data.get('data', {})
        trans_ref = result_data.get('transRef')      
        amount = float(result_data.get('amount', 0))     

        if not trans_ref or amount <= 0: return jsonify({'status': 'error', 'message': 'ข้อมูลในสลิปไม่ครบ'}), 400

        check_res = requests.get(f"{supabase_url}/rest/v1/topup_transactions?trans_ref=eq.{trans_ref}", headers=headers_supabase)
        if check_res.json(): return jsonify({'status': 'error', 'message': 'สลิปนี้เคยใช้งานไปแล้ว'}), 409

        user_res = requests.get(f"{supabase_url}/rest/v1/users?id=eq.{current_user_id}", headers=headers_supabase)
        users = user_res.json()
        current_credit = float(users[0]['credit_balance'])

        tx_payload = {"user_id": current_user_id, "amount": amount, "sending_bank": result_data.get('sendingBank', ''), "trans_ref": trans_ref}
        requests.post(f"{supabase_url}/rest/v1/topup_transactions", headers=headers_supabase, json=tx_payload).raise_for_status()

        new_credit = current_credit + amount
        requests.patch(f"{supabase_url}/rest/v1/users?id=eq.{current_user_id}", headers=headers_supabase, json={"credit_balance": new_credit}).raise_for_status()

        return jsonify({'status': 'success', 'message': f'เติมเงินสำเร็จ {amount} บาท', 'new_balance': new_credit})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/history', methods=['GET', 'OPTIONS'])
@token_required
def get_history(current_user_id):
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"}
    try:
        url = f"{supabase_url}/rest/v1/purchases?user_id=eq.{current_user_id}&select=*&order=created_at.desc"
        response = requests.get(url, headers=headers)
        return jsonify({'status': 'success', 'data': response.json()})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/reset-password', methods=['POST', 'OPTIONS'])
def reset_password():
    if request.method == 'OPTIONS': return '', 200
        
    data = request.json
    email = data.get('email')
    recovery_pin = data.get('recovery_pin')
    new_password = data.get('new_password')

    if not email or not recovery_pin or not new_password:
        return jsonify({'error': 'ข้อมูลไม่ครบถ้วน'}), 400

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"}

    try:
        res = requests.get(f"{supabase_url}/rest/v1/users?email=eq.{email}", headers=headers)
        users = res.json()
        
        if not users:
            return jsonify({'status': 'error', 'message': 'ไม่พบอีเมลนี้ในระบบ'}), 404
            
        user = users[0]
        # ดักแฮกเกอร์: ถ้า PIN ไม่ตรงกัน ให้ดีดออกทันที!
        if str(user.get('recovery_pin')) != str(recovery_pin):
            return jsonify({'status': 'error', 'message': 'รหัส PIN กู้คืนไม่ถูกต้อง!'}), 401
            
        new_hash = generate_password_hash(new_password)
        requests.patch(f"{supabase_url}/rest/v1/users?email=eq.{email}", headers=headers, json={"password_hash": new_hash})
        
        return jsonify({'status': 'success', 'message': 'รีเซ็ตรหัสผ่านสำเร็จ! สามารถเข้าสู่ระบบด้วยรหัสใหม่ได้เลย'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)