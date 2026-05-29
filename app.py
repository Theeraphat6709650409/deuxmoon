from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import requests
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/', methods=['GET'])
def home():
    return "Deuxmoon API is running!"

@app.route('/check-products', methods=['GET'])
def check_products():
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        return jsonify({'error': 'Server configuration missing'}), 500

    endpoint = f"{supabase_url}/rest/v1/products?status=eq.available&select=*"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(endpoint, headers=headers)
        response.raise_for_status()
        return jsonify({'status': 'success', 'data': response.json()})
    except requests.exceptions.RequestException as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/buy', methods=['POST', 'OPTIONS'])
def buy_product():
    if request.method == 'OPTIONS':
        return '', 200

    data = request.json
    platform = data.get('platform')
    duration_days = data.get('duration_days')
    user_id = data.get('user_id')

    if not platform or not duration_days or not user_id:
        return jsonify({'error': 'ข้อมูลไม่ครบถ้วน'}), 400

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation" 
    }

    try:
        user_res = requests.get(f"{supabase_url}/rest/v1/users?id=eq.{user_id}", headers=headers)
        users = user_res.json()
        if not users:
            return jsonify({'status': 'error', 'message': 'ไม่พบข้อมูลผู้ใช้ในระบบ'}), 404
        
        user = users[0]
        current_credit = float(user['credit_balance'])

        get_url = f"{supabase_url}/rest/v1/products?platform=eq.{platform}&duration_days=eq.{duration_days}&status=eq.available&limit=1"
        res = requests.get(get_url, headers=headers)
        res.raise_for_status()
        products = res.json()
        
        if not products:
            return jsonify({'status': 'error', 'message': 'สินค้าหมดชั่วคราว'}), 404
            
        target_product = products[0]
        product_id = target_product['id']
        price = float(target_product['price'])

        if current_credit < price:
            return jsonify({'status': 'error', 'message': 'ยอดเงินไม่เพียงพอ กรุณาเติมเงิน'}), 400
        
        update_url = f"{supabase_url}/rest/v1/products?id=eq.{product_id}&status=eq.available"
        update_data = {"status": "sold"}
        
        update_res = requests.patch(update_url, headers=headers, json=update_data)
        update_res.raise_for_status()
        updated_rows = update_res.json()
        
        if not updated_rows:
            return jsonify({'status': 'error', 'message': 'ซื้อไม่ทัน สินค้าถูกซื้อไปแล้ว กรุณาลองใหม่'}), 409
            
        purchased_account = updated_rows[0]

        new_credit = current_credit - price
        update_user_url = f"{supabase_url}/rest/v1/users?id=eq.{user_id}"
        requests.patch(update_user_url, headers=headers, json={"credit_balance": new_credit})
        
        receipt = {
            "platform": purchased_account['platform'],
            "login": purchased_account['account_login'],
            "password": purchased_account['account_password'],
            "profile": purchased_account['profile_name'],
            "pin": purchased_account['pin_code'],
            "expire_date": purchased_account['expire_date']
        }
        
        return jsonify({
            'status': 'success', 
            'data': receipt,
            'remaining_credit': new_credit
        })
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS': 
        return '', 200
    
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'กรุณากรอกอีเมลและรหัสผ่าน'}), 400

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {
        "apikey": supabase_key, "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json", "Prefer": "return=representation"
    }

    try:
        check_res = requests.get(f"{supabase_url}/rest/v1/users?email=eq.{email}", headers=headers)
        if check_res.json():
            return jsonify({'status': 'error', 'message': 'อีเมลนี้ถูกใช้งานแล้ว'}), 409

        hashed_password = generate_password_hash(password)
        payload = {"email": email, "password_hash": hashed_password}
        
        insert_res = requests.post(f"{supabase_url}/rest/v1/users", headers=headers, json=payload)
        insert_res.raise_for_status()
        
        return jsonify({'status': 'success', 'message': 'สมัครสมาชิกสำเร็จ'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS': 
        return '', 200
    
    data = request.json
    email = data.get('email')
    password = data.get('password')

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {
        "apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"
    }

    try:
        res = requests.get(f"{supabase_url}/rest/v1/users?email=eq.{email}", headers=headers)
        users = res.json()
        
        if not users:
            return jsonify({'status': 'error', 'message': 'ไม่พบอีเมลนี้ในระบบ'}), 404
            
        user = users[0]
        
        if check_password_hash(user['password_hash'], password):
            user_data = {
                "id": user['id'],
                "email": user['email'],
                "credit_balance": user['credit_balance']
            }
            return jsonify({'status': 'success', 'data': user_data})
        else:
            return jsonify({'status': 'error', 'message': 'รหัสผ่านไม่ถูกต้อง'}), 401
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/topup', methods=['POST', 'OPTIONS'])
def topup_credit():
    if request.method == 'OPTIONS':
        return '', 200

    user_id = request.form.get('user_id')
    if 'slip' not in request.files or not user_id:
        return jsonify({'status': 'error', 'message': 'ข้อมูลไม่ครบถ้วน'}), 400

    slip_file = request.files['slip']
    file_bytes = slip_file.read()
    
    if len(file_bytes) == 0:
        return jsonify({'status': 'error', 'message': 'ไม่สามารถอ่านไฟล์รูปภาพได้'}), 400

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    slip2go_secret = os.environ.get("SLIP2GO_API_SECRET", "").strip()

    if not slip2go_secret:
        return jsonify({'status': 'error', 'message': 'ระบบหลังบ้านยังไม่ได้ตั้งค่า SLIP2GO_API_SECRET'}), 500

    headers_supabase = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }

    try:
        slip2go_url = "https://slip2go.com/api/verify-slip/qr-image/info"
        headers_slip2go = {'Authorization': f'Bearer {slip2go_secret}'}
        
        # แนบเฉพาะไฟล์รูปภาพตามมาตรฐาน Form-data
        files = {'file': (slip_file.filename, file_bytes, slip_file.mimetype or 'image/jpeg')}
        
        slip2go_res = requests.post(slip2go_url, headers=headers_slip2go, files=files)

        # พิมพ์ Log เข้า Render Console เพื่อใช้ Debug
        print(f"--- Slip2Go Status: {slip2go_res.status_code} ---")
        print(f"--- Slip2Go Response: {slip2go_res.text[:500]} ---")

        if slip2go_res.status_code == 500:
            return jsonify({'status': 'error', 'message': 'เซิร์ฟเวอร์ Slip2Go ล่ม (500) อาจเกิดจากขนาดไฟล์ใหญ่เกินไป กรุณาลองลดขนาดภาพ'}), 400

        try:
            slip2go_data = slip2go_res.json()
        except ValueError:
            return jsonify({'status': 'error', 'message': f'ระบบ Slip2Go ขัดข้อง โค้ด {slip2go_res.status_code}' }), 400

        if slip2go_res.status_code != 200 or not slip2go_data.get('success'):
            err_msg = slip2go_data.get('message', 'สลิปไม่ถูกต้อง หรือไม่สามารถอ่าน QR Code ได้')
            return jsonify({'status': 'error', 'message': f'ตรวจสลิปไม่ผ่าน: {err_msg}'}), 400

        result_data = slip2go_data.get('data', {})
        trans_ref = result_data.get('transRef')      
        amount = float(result_data.get('amount', 0))     
        sending_bank = result_data.get('sender', {}).get('bankId', 'Unknown') 

        if not trans_ref or amount <= 0:
            return jsonify({'status': 'error', 'message': 'ข้อมูลในสลิปไม่ครบถ้วน'}), 400

        check_url = f"{supabase_url}/rest/v1/topup_transactions?trans_ref=eq.{trans_ref}"
        check_res = requests.get(check_url, headers=headers_supabase)
        if check_res.json():
            return jsonify({'status': 'error', 'message': 'สลิปนี้เคยใช้งานไปแล้ว'}), 409

        user_url = f"{supabase_url}/rest/v1/users?id=eq.{user_id}"
        user_res = requests.get(user_url, headers=headers_supabase)
        users = user_res.json()
        if not users:
            return jsonify({'status': 'error', 'message': 'ไม่พบผู้ใช้นี้ในระบบ'}), 404
            
        current_credit = float(users[0]['credit_balance'])

        tx_payload = {"user_id": user_id, "amount": amount, "sending_bank": sending_bank, "trans_ref": trans_ref}
        requests.post(f"{supabase_url}/rest/v1/topup_transactions", headers=headers_supabase, json=tx_payload).raise_for_status()

        new_credit = current_credit + amount
        requests.patch(user_url, headers=headers_supabase, json={"credit_balance": new_credit}).raise_for_status()

        return jsonify({'status': 'success', 'message': f'เติมเงินสำเร็จ {amount} บาท', 'new_balance': new_credit})

    except Exception as e:
        return jsonify({'status': 'error', 'message': f'เกิดข้อผิดพลาด: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)