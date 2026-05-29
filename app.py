from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import requests

app = Flask(__name__)
# เปิด CORS ให้หน้าเว็บ Frontend ของคุณเรียกใช้ API นี้ได้
CORS(app)

@app.route('/', methods=['GET'])
def home():
    return "Deuxmoon API is running!"

@app.route('/check-products', methods=['GET'])
def check_products():
    # ดึงค่าคีย์ที่ตั้งไว้ใน Render
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        return jsonify({'error': 'Server configuration missing'}), 500

    # ยิงไปดึงข้อมูลสินค้าที่ว่างอยู่จาก Supabase
    endpoint = f"{supabase_url}/rest/v1/products?status=eq.available&select=*"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(endpoint, headers=headers)
        response.raise_for_status() # เช็คว่า Error ไหม
        return jsonify({'status': 'success', 'data': response.json()})
    except requests.exceptions.RequestException as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# คำสั่งสำหรับรันเซิร์ฟเวอร์
if __name__ == '__main__':
    @app.route('/buy', methods=['POST'])
    def buy_product():
        data = request.json
        platform = data.get('platform')

        if not platform:
            return jsonify({'error': 'กรุณาระบุแพลตฟอร์ม'}), 400

        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    
    # เพิ่ม "Prefer": "return=representation" เพื่อให้ Supabase ส่งข้อมูลที่ถูกแก้ไขกลับมาให้เรา
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation" 
        }

        try:
        # ขั้นตอนที่ 1: ค้นหาสินค้าที่สถานะว่างอยู่ (available) มา 1 รายการ
            get_url = f"{supabase_url}/rest/v1/products?platform=eq.{platform}&status=eq.available&limit=1"
            res = requests.get(get_url, headers=headers)
            res.raise_for_status()
            products = res.json()
        
            if not products:
                return jsonify({'status': 'error', 'message': 'สินค้าหมดชั่วคราว'}), 404
            
            target_product = products[0]
            product_id = target_product['id']
        
        # ขั้นตอนที่ 2: พยายามจองรหัสนี้ โดยสั่งเปลี่ยนสถานะเป็น 'sold' 
        # (ดักเงื่อนไขว่า status ต้องเป็น 'available' อยู่เท่านั้น ป้องกันคนอื่นแย่งไปในเสี้ยววินาที)
            update_url = f"{supabase_url}/rest/v1/products?id=eq.{product_id}&status=eq.available"
            update_data = {"status": "sold"}
        
            update_res = requests.patch(update_url, headers=headers, json=update_data)
            update_res.raise_for_status()
            updated_rows = update_res.json()
        
            if not updated_rows:
                return jsonify({'status': 'error', 'message': 'เกิดข้อผิดพลาด สินค้าถูกซื้อไปแล้ว กรุณาลองใหม่'}), 409
            
            purchased_account = updated_rows[0]
        
        # (พื้นที่สำหรับเพิ่มโค้ดตัดยอดเครดิตผู้ใช้ในอนาคต)
        
        # ขั้นตอนที่ 3: จัดเตรียมข้อมูลใบเสร็จส่งกลับไปให้หน้าเว็บ
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