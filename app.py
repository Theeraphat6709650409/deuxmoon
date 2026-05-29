from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import requests
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
# เปิด CORS ให้รองรับทุกคำขอ
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
    user_id = data.get('user_id')

    if not platform or not user_id:
        return jsonify({'error': 'ข้อมูลไม่ครบถ้วน กรุณาเข้าสู่ระบบก่อน'}), 400

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation" 
    }

    try:
        # 1. เช็คยอดเงินผู้ใช้ในฐานข้อมูล
        user_res = requests.get(f"{supabase_url}/rest/v1/users?id=eq.{user_id}", headers=headers)
        users = user_res.json()
        if not users:
            return jsonify({'status': 'error', 'message': 'ไม่พบข้อมูลผู้ใช้ในระบบ'}), 404
        
        user = users[0]
        current_credit = float(user['credit_balance'])

        # 2. ค้นหาสินค้า
        get_url = f"{supabase_url}/rest/v1/products?platform=eq.{platform}&status=eq.available&limit=1"
        res = requests.get(get_url, headers=headers)
        res.raise_for_status()
        products = res.json()
        
        if not products:
            return jsonify({'status': 'error', 'message': 'สินค้าหมดชั่วคราว'}), 404
            
        target_product = products[0]
        product_id = target_product['id']
        price = float(target_product['price'])

        # 3. ตรวจสอบว่าเงินพอซื้อหรือไม่
        if current_credit < price:
            return jsonify({'status': 'error', 'message': 'ยอดเงินไม่เพียงพอ กรุณาเติมเงิน'}), 400
        
        # 4. พยายามจองรหัสนี้ (ป้องกันคนแย่งกัน)
        update_url = f"{supabase_url}/rest/v1/products?id=eq.{product_id}&status=eq.available"
        update_data = {"status": "sold"}
        
        update_res = requests.patch(update_url, headers=headers, json=update_data)
        update_res.raise_for_status()
        updated_rows = update_res.json()
        
        if not updated_rows:
            return jsonify({'status': 'error', 'message': 'ซื้อไม่ทัน สินค้าถูกซื้อไปแล้ว กรุณาลองใหม่'}), 409
            
        purchased_account = updated_rows[0]

        # 5. หักเครดิตผู้ใช้เมื่อดึงรหัสสินค้าสำเร็จ
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
        
    except requests.exceptions.RequestException as e:
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)