from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import requests
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
import random
import string

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def generate_reward_code():
    return 'DM-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS': return '', 200
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
    recovery_pin = data.get('recovery_pin')

    if not email or not password or not recovery_pin:
        return jsonify({'error': 'กรุณากรอกข้อมูลให้ครบถ้วน'}), 400

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"}

    try:
        check_res = requests.get(f"{supabase_url}/rest/v1/users?email=eq.{email}", headers=headers)
        if check_res.json(): return jsonify({'status': 'error', 'message': 'อีเมลนี้ถูกใช้งานแล้ว'}), 409
        hashed_password = generate_password_hash(password)
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
            secret = os.environ.get("JWT_SECRET", "deuxmoon2026")
            token = jwt.encode({'user_id': user['id'], 'email': user['email'], 'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)}, secret, algorithm="HS256")
            
            user_data = {"id": user['id'], "email": user['email'], "credit_balance": user['credit_balance'], "role": user.get('role', 'normal'), "total_spent": user.get('total_spent', 0)}
            return jsonify({'status': 'success', 'token': token, 'data': user_data})
        else:
            return jsonify({'status': 'error', 'message': 'รหัสผ่านไม่ถูกต้อง'}), 401
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/buy', methods=['POST', 'OPTIONS'])
@token_required
def buy_product(current_user_id):
    if request.method == 'OPTIONS': return '', 200
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"}
    
    try:
        data = request.json
        platform = data.get('platform')
        duration_days = int(data.get('duration_days'))
        warranty = data.get('warranty', False)
        promo_code_input = data.get('promo_code', '').strip()

        # 1. ตรวจสอบสินค้าคงเหลือ
        query = f"platform=eq.{platform}&duration_days=eq.{duration_days}&status=eq.available"
        res = requests.get(f"{supabase_url}/rest/v1/products?{query}&limit=1", headers=headers)
        available_products = res.json()
        
        if not available_products:
            return jsonify({'status': 'error', 'message': 'สินค้าหมด'}), 400
            
        product = available_products[0]
        
        # 2. ดึงข้อมูลผู้ใช้
        user_res = requests.get(f"{supabase_url}/rest/v1/users?id=eq.{current_user_id}", headers=headers)
        user = user_res.json()[0]
        current_credit = float(user.get('credit_balance', 0))
        user_role = user.get('role', 'customer')

        # 3. กำหนดราคาพื้นฐาน
        normal_price = float(product.get('price'))
        wholesale_price = product.get('wholesale_price')
        if user_role == 'reseller' and wholesale_price is not None:
            base_price = float(wholesale_price)
        else:
            base_price = normal_price

        # คำนวณราคาประกัน
        warranty_addon = 0
        if warranty:
            if user_role == 'reseller':
                warranty_addon = 5 if duration_days == 7 else (23 if platform == 'netflix_mobile' else 25)
            else:
                warranty_addon = 10 if duration_days == 7 else 25

        finalPrice = base_price + warranty_addon

        # --- ส่วนสำคัญ: ตรวจสอบและหักลบโค้ดส่วนลด ---
        discount_amount = 0
        applied_promo_id = None

        if promo_code_input:
            promo_res = requests.get(f"{supabase_url}/rest/v1/promo_codes?code=eq.{promo_code_input}&is_used=eq.false", headers=headers)
            promo_data = promo_res.json()

            if not promo_data:
                return jsonify({'status': 'error', 'message': 'โค้ดส่วนลดไม่ถูกต้อง หรือถูกใช้งานไปแล้ว'}), 400

            promo = promo_data[0]
            promo_owner = promo.get('user_id')
            
            # โค้ดนี้ต้องเป็นของผู้ใช้คนนี้ หรือเป็นโค้ดส่วนกลาง (null)
            if promo_owner and promo_owner != current_user_id:
                return jsonify({'status': 'error', 'message': 'โค้ดส่วนลดนี้เป็นของบัญชีอื่น'}), 400

            applied_promo_id = promo.get('id')
            discount_percent = int(promo.get('discount_percent') or 0)
            flat_amount = float(promo.get('amount') or 0)

            # คำนวณว่าลดไปกี่บาท
            if discount_percent > 0:
                discount_amount = finalPrice * (discount_percent / 100.0)
            elif flat_amount > 0:
                discount_amount = flat_amount

        # ราคาหลังหักส่วนลด (บังคับไม่ให้ราคาติดลบ)
        price_to_deduct = max(0, finalPrice - discount_amount)

        # 4. ตรวจสอบว่าเงินพอไหม (เช็คตรงนี้แทนหน้าบ้าน)
        if current_credit < price_to_deduct:
            return jsonify({'status': 'error', 'message': f'ยอดเงินในระบบไม่เพียงพอ (ขาดอีก {price_to_deduct - current_credit:g} บาท)'}), 400

        # 5. เปลี่ยนสถานะสินค้าและบันทึกออเดอร์ (แก้ไขใหม่)
        # 5.1 อัปเดตสต็อก (ลบ sold_to ออกเพื่อป้องกัน Error)
        patch_payload = {"status": "sold"}
        patch_res = requests.patch(f"{supabase_url}/rest/v1/products?id=eq.{product['id']}", headers=headers, json=patch_payload)
        
        # ดักจับ Error ถ้าเปลี่ยนสถานะไม่สำเร็จให้หยุดการทำงานทันที ป้องกันการหักเงินฟรี
        if patch_res.status_code >= 400:
            return jsonify({'status': 'error', 'message': 'เกิดข้อผิดพลาดในการดึงสินค้าจากสต็อก กรุณาลองใหม่'}), 500

        # 5.2 บันทึกข้อมูลใบเสร็จลงตาราง purchases ให้ครบถ้วน (หน้าประวัติจะได้แสดงผลได้)
        purchase_payload = {
            "user_id": current_user_id,
            "product_id": product['id'],
            "platform": platform,
            "has_warranty": warranty,
            "price": price_to_deduct,
            "account_login": product.get('account_login'),
            "account_password": product.get('account_password'),
            "profile_name": product.get('profile_name'),
            "pin_code": product.get('pin_code'),
            "expire_date": product.get('expire_date')
        }
        post_res = requests.post(f"{supabase_url}/rest/v1/purchases", headers=headers, json=purchase_payload)

        # ถ้าระบบบันทึกประวัติล้มเหลว ให้คืนสถานะสินค้ากลับไปเป็นพร้อมขาย
        if post_res.status_code >= 400:
            requests.patch(f"{supabase_url}/rest/v1/products?id=eq.{product['id']}", headers=headers, json={"status": "available"})
            return jsonify({'status': 'error', 'message': 'เกิดข้อผิดพลาดในการสร้างใบเสร็จ'}), 500

        # 6. หักเครดิตและอัปเดตยอดใช้จ่ายสะสม (total_spent)
        new_credit = current_credit - price_to_deduct
        total_spent = float(user.get('total_spent', 0)) + price_to_deduct

        requests.patch(f"{supabase_url}/rest/v1/users?id=eq.{current_user_id}", headers=headers, json={
            "credit_balance": new_credit,
            "total_spent": total_spent
        })

        # 7. อัปเดตสถานะโค้ดส่วนลดว่า "ถูกใช้แล้ว"
        if applied_promo_id:
            requests.patch(f"{supabase_url}/rest/v1/promo_codes?id=eq.{applied_promo_id}", headers=headers, json={'is_used': True, 'used_by': current_user_id})

        # 8. แจกโค้ดส่วนลด 10% เมื่อยอดสะสมข้ามหลัก 200 บาท
        reward_code_generated = None
        if user_role != 'reseller':
            if int(total_spent // 200) > int(float(user.get('total_spent', 0)) // 200):
                reward_code_generated = generate_reward_code()
                promo_payload = {
                    'code': reward_code_generated, 
                    'amount': 0, # ไม่ต้องระบุจำนวนเงิน เพราะเราใช้เปอร์เซ็นต์
                    'discount_percent': 10, 
                    'is_used': False, 
                    'user_id': current_user_id
                }
                requests.post(f"{supabase_url}/rest/v1/promo_codes", headers=headers, json=promo_payload)

        return jsonify({
            'status': 'success', 
            'data': product, 
            'remaining_credit': new_credit,
            'total_spent': total_spent,
            'reward_code': reward_code_generated
        }), 200
        
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
        
        payload = {'log': 'true'}
        slipok_res = requests.post(slipok_url, headers=headers_slipok, files=files, data=payload)
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
        current_credit = float(user_res.json()[0]['credit_balance'])

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
    if not email or not recovery_pin or not new_password: return jsonify({'error': 'ข้อมูลไม่ครบถ้วน'}), 400
    
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"}

    try:
        res = requests.get(f"{supabase_url}/rest/v1/users?email=eq.{email}", headers=headers)
        users = res.json()
        if not users: return jsonify({'status': 'error', 'message': 'ไม่พบอีเมลนี้ในระบบ'}), 404
        user = users[0]
        if str(user.get('recovery_pin')) != str(recovery_pin): return jsonify({'status': 'error', 'message': 'รหัส PIN กู้คืนไม่ถูกต้อง!'}), 401
        
        new_hash = generate_password_hash(new_password)
        requests.patch(f"{supabase_url}/rest/v1/users?email=eq.{email}", headers=headers, json={"password_hash": new_hash})
        return jsonify({'status': 'success', 'message': 'รีเซ็ตรหัสผ่านสำเร็จ! สามารถเข้าสู่ระบบด้วยรหัสใหม่ได้เลย'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/cron/check-expire', methods=['GET'])
def check_expire():
    import time
    cron_key = request.args.get('key')
    expected_key = os.environ.get("CRON_SECRET", "")
    if not cron_key or cron_key != expected_key: return jsonify({'error': 'Unauthorized'}), 401

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    line_token = os.environ.get("LINE_NOTIFY_TOKEN")
    discord_webhook = os.environ.get("DISCORD_WEBHOOK_URL_EXPIRE") 
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"}

    try:
        tz = datetime.timezone(datetime.timedelta(hours=7))
        today = datetime.datetime.now(tz).strftime('%Y-%m-%d')
        get_url = f"{supabase_url}/rest/v1/products?status=eq.sold&expire_date=lte.{today}"
        res = requests.get(get_url, headers=headers)
        res.raise_for_status()
        expired_products = res.json()

        if not expired_products: return jsonify({'status': 'success', 'message': 'ไม่มีบัญชีหมดอายุในวันนี้'})

        line_messages = ["แจ้งเตือนบัญชีหมดอายุ! ถึงเวลารีเซ็ตแล้ว:"]
        discord_messages = ["**[แจ้งเตือน] บัญชีหมดอายุ! ถึงเวลารีเซ็ตแล้ว:**"]
        
        for p in expired_products:
            platform_name = p.get('platform', '').upper()
            login = p.get('account_login', '-')
            password = p.get('account_password', '-')
            profile = p.get('profile_name', '-')
            expire = p.get('expire_date', '-')

            line_msg = f"\nแพลตฟอร์ม: {platform_name}\nอีเมล: {login}\nรหัสผ่าน: {password}\nจอ: {profile}\nหมดอายุ: {expire}"
            line_messages.append(line_msg)
            
            discord_msg = f"**{platform_name}**\n> **อีเมล:** `{login}`\n> **รหัสผ่าน:** `{password}`\n> **จอที่ใช้งาน:** `{profile}`\n> **หมดอายุ:** `{expire}`\n"
            discord_messages.append(discord_msg)

            update_url = f"{supabase_url}/rest/v1/products?id=eq.{p['id']}"
            requests.patch(update_url, headers=headers, json={"status": "pending_reset"})

        if line_token:
            try:
                line_notify_api = 'https://notify-api.line.me/api/notify'
                line_headers = {'Authorization': f'Bearer {line_token}'}
                requests.post(line_notify_api, headers=line_headers, data={'message': "\n".join(line_messages)})
            except:
                pass
        
        if discord_webhook:
            current_msg = ""
            for msg in discord_messages:
                if len(current_msg) + len(msg) > 1900:
                    try:
                        requests.post(discord_webhook, json={'content': current_msg})
                    except:
                        pass
                    current_msg = msg + "\n"
                    time.sleep(1)
                else:
                    current_msg += msg + "\n"
            
            if current_msg:
                try:
                    requests.post(discord_webhook, json={'content': current_msg})
                except:
                    pass
                
        return jsonify({'status': 'success', 'message': f'แจ้งเตือนและอัปเดตไป {len(expired_products)} บัญชี'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/admin/products', methods=['GET', 'OPTIONS'])
@token_required
def get_all_products(current_user_id):
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"}
    try:
        url = f"{supabase_url}/rest/v1/products?order=id.asc"
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return jsonify({'status': 'success', 'data': response.json()})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/admin/update-product', methods=['POST', 'OPTIONS'])
@token_required
def update_product(current_user_id):
    if request.method == 'OPTIONS': return '', 200
    data = request.json
    product_id = data.get('id')
    new_password = data.get('account_password')
    new_expire = data.get('expire_date')
    new_status = data.get('status') 

    if not product_id: return jsonify({'error': 'ไม่พบ ID สินค้า'}), 400
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"}
    
    try:
        update_url = f"{supabase_url}/rest/v1/products?id=eq.{product_id}"
        payload = {"account_password": new_password, "expire_date": new_expire, "status": new_status}
        requests.patch(update_url, headers=headers, json=payload).raise_for_status()
        return jsonify({'status': 'success', 'message': 'อัปเดตบัญชีสำเร็จ! สินค้าพร้อมขายแล้ว'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
@app.route('/me', methods=['GET', 'OPTIONS'])
@token_required
def get_user_info(current_user_id):
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}
    try:
        res = requests.get(f"{supabase_url}/rest/v1/users?id=eq.{current_user_id}", headers=headers)
        users = res.json()
        if not users: return jsonify({'status': 'error', 'message': 'ไม่พบบัญชีผู้ใช้'}), 404
        user = users[0]
        user_data = {"id": user['id'], "email": user['email'], "credit_balance": user['credit_balance'], "role": user.get('role', 'normal'), "total_spent": user.get('total_spent', 0)}
        return jsonify({'status': 'success', 'data': user_data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
# --- ฟีเจอร์ข้อ 3: เปลี่ยนรหัสผ่านด้วยตัวเอง ---
@app.route('/change-password', methods=['POST', 'OPTIONS'])
@token_required
def change_password(current_user_id):
    if request.method == 'OPTIONS': return '', 200
    data = request.json
    new_password = data.get('new_password')
    
    if not new_password or len(new_password) < 6:
        return jsonify({'status': 'error', 'message': 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร'}), 400

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"}

    try:
        hashed_password = generate_password_hash(new_password)
        requests.patch(f"{supabase_url}/rest/v1/users?id=eq.{current_user_id}", headers=headers, json={"password_hash": hashed_password}).raise_for_status()
        return jsonify({'status': 'success', 'message': 'เปลี่ยนรหัสผ่านสำเร็จแล้ว'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# --- ฟีเจอร์ข้อ 6: ระบบเคลมโค้ดเพิ่มเครดิต (ยกเว้น reseller) ---
@app.route('/claim-promo', methods=['POST', 'OPTIONS'])
@token_required
def claim_promo(current_user_id):
    if request.method == 'OPTIONS': return '', 200
    data = request.json
    input_code = data.get('code', '').strip()
    
    if not input_code:
        return jsonify({'status': 'error', 'message': 'กรุณากรอกโค้ดเติมเงิน'}), 400
        
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"}

    try:
        user_res = requests.get(f"{supabase_url}/rest/v1/users?id=eq.{current_user_id}", headers=headers)
        users = user_res.json()
        if not users: return jsonify({'status': 'error', 'message': 'ไม่พบข้อมูลผู้ใช้งาน'}), 404
        user = users[0]
        
        if user.get('role') == 'reseller':
            return jsonify({'status': 'error', 'message': 'กลุ่มผู้ใช้งานราคาส่ง (Reseller) ไม่สามารถใช้โค้ดกิจกรรมนี้ได้'}), 403
            
        code_res = requests.get(f"{supabase_url}/rest/v1/promo_codes?code=eq.{input_code}", headers=headers)
        promos = code_res.json()
        if not promos: return jsonify({'status': 'error', 'message': 'โค้ดนี้ไม่ถูกต้องหรือไม่มีอยู่ในระบบ'}), 400
        promo = promos[0]
        
        if promo.get('is_used'): return jsonify({'status': 'error', 'message': 'โค้ดนี้ถูกใช้งานไปแล้ว'}), 400

        # -------------------------------------------------------------
        # 1. ดักจับโค้ดส่วนลด: ห้ามนำมาเติมเป็นเครดิตเงินสด
        # -------------------------------------------------------------
        if promo.get('discount_percent') and float(promo['discount_percent']) > 0:
            return jsonify({'status': 'error', 'message': 'นี่คือโค้ดส่วนลด 10% กรุณานำไปกรอกในหน้าต่าง "ยืนยันการซื้อสินค้า" ครับ'}), 400
            
        # -------------------------------------------------------------
        # 2. ป้องกันการขโมยโค้ด: เช็คว่าโค้ดเป็นของคนนี้ไหม (ถ้ามีการผูกชื่อไว้)
        # -------------------------------------------------------------
        promo_owner = promo.get('user_id')
        if promo_owner and promo_owner != current_user_id:
            return jsonify({'status': 'error', 'message': 'โค้ดนี้ถูกระบุให้เป็นของบัญชีผู้ใช้งานอื่น ไม่สามารถใช้งานได้ครับ'}), 400

        # เซฟตี้ดักจับกรณีโค้ดไม่มีราคา (ป้องกันบัคค่า null)
        added_amount = float(promo.get('amount') or 0)
        if added_amount <= 0:
            return jsonify({'status': 'error', 'message': 'โค้ดนี้ไม่มีมูลค่าเงินสดสำหรับเติมเข้าระบบ'}), 400
            
        new_balance = float(user.get('credit_balance', 0)) + added_amount
        
        requests.patch(f"{supabase_url}/rest/v1/promo_codes?id=eq.{promo['id']}", headers=headers, json={
            'is_used': True, 'used_by': user['email']
        }).raise_for_status()
        
        requests.patch(f"{supabase_url}/rest/v1/users?id=eq.{current_user_id}", headers=headers, json={
            'credit_balance': new_balance
        }).raise_for_status()
        
        return jsonify({'status': 'success', 'message': f'เติมเครดิตสำเร็จ ได้รับเพิ่ม {added_amount} บาท', 'new_balance': new_balance}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# --- ดึงรายการสต็อกที่มีสถานะ pending_reset โดยเรียงตามอีเมล และ จอ ---
@app.route('/admin/pending-resets', methods=['GET', 'OPTIONS'])
@token_required
def get_pending_resets(current_user_id):
    if request.method == 'OPTIONS': return '', 200
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"}
    
    try:
        user_res = requests.get(f"{supabase_url}/rest/v1/users?id=eq.{current_user_id}", headers=headers)
        users = user_res.json()
        if not users or users[0].get('role') != 'admin':
            return jsonify({'status': 'error', 'message': 'ไม่มีสิทธิ์เข้าถึง ข้อมูลนี้สำหรับแอดมินเท่านั้น'}), 403
        
        # เพิ่มการเรียงลำดับ profile_name.asc เพื่อให้จอ 1-5 เรียงกันอย่างถูกต้อง
        url = f"{supabase_url}/rest/v1/products?status=eq.pending_reset&order=account_login.asc,profile_name.asc,id.asc"
        response = requests.get(url, headers=headers)
        return jsonify({'status': 'success', 'data': response.json()}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# --- อัปเดตข้อมูลบัญชี (รวมถึง PIN) และเปลี่ยนสถานะสินค้า ---
@app.route('/admin/update-stock/<int:stock_id>', methods=['PUT', 'OPTIONS'])
@token_required
def update_stock_item(current_user_id, stock_id):
    if request.method == 'OPTIONS': return '', 200
    data = request.json
    new_email = data.get('email')
    new_password = data.get('password')
    new_status = data.get('status')
    new_pin_code = data.get('pin_code') # รับค่า PIN Code
    
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"}
    
    try:
        user_res = requests.get(f"{supabase_url}/rest/v1/users?id=eq.{current_user_id}", headers=headers)
        users = user_res.json()
        if not users or users[0].get('role') != 'admin':
            return jsonify({'status': 'error', 'message': 'ไม่มีสิทธิ์ดำเนินการ'}), 403
        
        update_data = {}
        if new_email: update_data['account_login'] = new_email
        if new_password: update_data['account_password'] = new_password
        if new_status: update_data['status'] = new_status
        if new_pin_code is not None: update_data['pin_code'] = new_pin_code # อัปเดต PIN Code
        
        update_url = f"{supabase_url}/rest/v1/products?id=eq.{stock_id}"
        requests.patch(update_url, headers=headers, json=update_data).raise_for_status()
        
        return jsonify({'status': 'success', 'message': 'อัปเดตข้อมูลและสถานะสินค้าสำเร็จ'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


# --- ดึงข้อมูลสถิติภาพรวมร้านค้าสำหรับแอดมิน ---
@app.route('/admin/stats', methods=['GET', 'OPTIONS'])
@token_required
def get_admin_stats(current_user_id):
    if request.method == 'OPTIONS': return '', 200
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"}
    
    time_range = request.args.get('range', 'all')

    try:
        user_res = requests.get(f"{supabase_url}/rest/v1/users?id=eq.{current_user_id}&select=role", headers=headers)
        if not user_res.json() or user_res.json()[0].get('role') != 'admin':
            return jsonify({'status': 'error', 'message': 'ไม่มีสิทธิ์เข้าถึง'}), 403

        date_filter = ""
        if time_range != 'all':
            tz = datetime.timezone(datetime.timedelta(hours=7)) 
            now = datetime.datetime.now(tz)
            if time_range == 'today':
                start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            elif time_range == '7days':
                start_date = now - datetime.timedelta(days=7)
            elif time_range == '30days':
                start_date = now - datetime.timedelta(days=30)
            
            start_date_str = start_date.strftime('%Y-%m-%dT%H:%M:%S')
            date_filter = f"&created_at=gte.{start_date_str}"

        # 1. นับจำนวนสมาชิก
        users_url = f"{supabase_url}/rest/v1/users?select=id" + date_filter
        users_res = requests.get(users_url, headers=headers)
        total_users = len(users_res.json())

        # 2. คำนวณยอดเติมเงินรวม
        topup_url = f"{supabase_url}/rest/v1/topup_transactions?select=amount" + date_filter
        topup_res = requests.get(topup_url, headers=headers)
        total_revenue = sum(float(tx['amount']) for tx in topup_res.json())

        # 3. นับจำนวนออเดอร์ และ **คำนวณยอดขายรวม**
        purchases_url = f"{supabase_url}/rest/v1/purchases?select=id,price" + date_filter
        purchases_res = requests.get(purchases_url, headers=headers)
        purchases_data = purchases_res.json()
        total_purchases = len(purchases_data)
        # นำ price ของทุกออเดอร์มาบวกกัน
        total_sales = sum(float(p.get('price', 0)) for p in purchases_data if p.get('price'))

        # 4. สรุปสถานะสต็อกสินค้า
        products_res = requests.get(f"{supabase_url}/rest/v1/products?select=status", headers=headers)
        products = products_res.json()
        stock_available = len([p for p in products if p.get('status') == 'available'])
        stock_sold = len([p for p in products if p.get('status') == 'sold'])
        stock_pending = len([p for p in products if p.get('status') == 'pending_reset'])

        return jsonify({
            'status': 'success',
            'data': {
                'total_users': total_users,
                'total_revenue': total_revenue,
                'total_sales': total_sales, # ส่งค่ายอดขายกลับไปด้วย
                'total_purchases': total_purchases,
                'stock': {
                    'available': stock_available,
                    'sold': stock_sold,
                    'pending': stock_pending,
                    'total': len(products)
                }
            }
        }), 200

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
# --- ดึงกระเป๋าโค้ดรางวัลส่วนตัว (ที่ยังไม่ได้ใช้) ---
@app.route('/my-codes', methods=['GET', 'OPTIONS'])
@token_required
def get_my_codes(current_user_id):
    if request.method == 'OPTIONS': return '', 200
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"}
    
    try:
        # ดึงเฉพาะโค้ดของตัวเอง ที่ยังไม่ได้ใช้ (is_used = false)
        res = requests.get(f"{supabase_url}/rest/v1/promo_codes?user_id=eq.{current_user_id}&is_used=eq.false", headers=headers)
        return jsonify({'status': 'success', 'data': res.json()}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)