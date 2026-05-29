from flask import Flask, jsonify
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
    app.run(host='0.0.0.0', port=5000)