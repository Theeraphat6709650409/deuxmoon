from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import requests

app = Flask(__name__)
# บังคับเปิด CORS ให้ครอบคลุมทุกเส้นทางและทุก Method อย่างเด็ดขาด
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
    # 1. จัดการกับคำขอ Preflight ของระบบ CORS
    if request.method == 'OPTIONS':
        return '', 200

    # 2. เริ่มขั้นตอนรับคำสั่งซื้อ
    data = request.json
    platform = data.get('platform')

    if not platform:
        return jsonify({'error': 'กรุณาระบุแพลตฟอร์ม'}), 400

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation" 
    }

    try:
        get_url = f"{supabase_url}/rest/v1/products?platform=eq.{platform}&status=eq.available&limit=1"
        res = requests.get(get_url, headers=headers)
        res.raise_for_status()
        products = res.json()
        
        if not products:
            return jsonify({'status': 'error', 'message': 'สินค้าหมดชั่วคราว'}), 404
            
        target_product = products[0]
        product_id = target_product['id']
        
        update_url = f"{supabase_url}/rest/v1/products?id=eq.{product_id}&status=eq.available"
        update_data = {"status": "sold"}
        
        update_res = requests.patch(update_url, headers=headers, json=update_data)
        update_res.raise_for_status()
        updated_rows = update_res.json()
        
        if not updated_rows:
            return jsonify({'status': 'error', 'message': 'เกิดข้อผิดพลาด สินค้าถูกซื้อไปแล้ว กรุณาลองใหม่'}), 409
            
        purchased_account = updated_rows[0]
        
        receipt = {
            "platform": purchased_account['platform'],
            "login": purchased_account['account_login'],
            "password": purchased_account['account_password'],
            "profile": purchased_account['profile_name'],
            "pin": purchased_account['pin_code'],
            "expire_date": purchased_account['expire_date']
        }
        
        return jsonify({'status': 'success', 'data': receipt})
        
    except requests.exceptions.RequestException as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)