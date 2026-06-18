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
            
            user_data = {"id": user['id'], "email": user['email'], "credit_balance": user['credit_balance'], "role": user.get('role', 'normal'), "purchase_count": user.get('purchase_count', 0)}
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
    warranty = data.get('warranty', False)

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json", "Prefer": "return=representation"}

    try:
        user_res = requests.get(f"{supabase_url}/rest/v1/users?id=eq.{current_user_id}", headers=headers)
        user = user_res.json()[0]
        current_credit = float(user['credit_balance'])
        user_role = user.get('role', 'normal')

        get_url = f"{supabase_url}/rest/v1/products?platform=eq.{platform}&duration_days=eq.{duration_days}&status=eq.available&order=account_login.asc,profile_name.asc,id.asc&limit=1"
        res = requests.get(get_url, headers=headers)
        products = res.json()
        
        if not products: return jsonify({'status': 'error', 'message': 'สินค้าหมดชั่วคราว'}), 404
        target_product = products[0]
        
        normal_price = float(target_product['price'])
        wholesale_price = target_product.get('wholesale_price')
        
        if user_role == 'reseller' and wholesale_price is not None and str(wholesale_price).strip() != "":
            base_price = float(wholesale_price)
        else:
            base_price = normal_price
            
        warranty_addon = 0
        if warranty and platform.startswith('netflix'):
            if user_role == 'reseller':
                if int(duration_days) == 7:
                    warranty_addon = 5
                elif int(duration_days) == 30:
                    if platform == 'netflix_mobile':
                        warranty_addon = 23
                    else:
                        warranty_addon = 25
            else:
                if int(duration_days) == 7:
                    warranty_addon = 10
                elif int(duration_days) == 30:
                    warranty_addon = 25
                
        price = base_price + warranty_addon

        if current_credit < price: return jsonify({'status': 'error', 'message': 'ยอดเงินไม่เพียงพอ กรุณาเติมเงิน'}), 400
        
        tz = datetime.timezone(datetime.timedelta(hours=7)) 
        now = datetime.datetime.now(tz)
        duration = int(duration_days)

        if duration == 1:
            expire_time = now + datetime.timedelta(days=1)
            formatted_expire = expire_time.strftime('%Y-%m-%d %H:%M:%S')
        else:
            if 22 <= now.hour <= 23:
                days_to_add = duration
            else:
                days_to_add = duration - 1
            
            expire_time = now + datetime.timedelta(days=days_to_add)
            formatted_expire = expire_time.strftime('%Y-%m-%d')
        
        update_url = f"{supabase_url}/rest/v1/products?id=eq.{target_product['id']}&status=eq.available"
        update_payload = {"status": "sold", "expire_date": formatted_expire}
        update_res = requests.patch(update_url, headers=headers, json=update_payload)
        updated_rows = update_res.json()
        
        if not updated_rows: return jsonify({'status': 'error', 'message': 'ซื้อไม่ทัน สินค้าถูกซื้อไปแล้ว'}), 409
        purchased_account = updated_rows[0]
        
        new_credit = current_credit - price
        
        purchase_payload = {
            "user_id": current_user_id, "product_id": target_product['id'],
            "platform": purchased_account.get('platform', ''), "account_login": purchased_account.get('account_login', ''),
            "account_password": purchased_account.get('account_password', ''), "profile_name": purchased_account.get('profile_name', ''),
            "pin_code": purchased_account.get('pin_code', ''), "expire_date": formatted_expire, "price": price,
            "has_warranty": warranty 
        }
        requests.post(f"{supabase_url}/rest/v1/purchases", headers=headers, json=purchase_payload)
        
        purchased_account['expire_date'] = formatted_expire
        purchased_account['warranty_addon'] = warranty_addon
        purchased_account['has_warranty'] = warranty
        
        discord_webhook = os.environ.get("DISCORD_WEBHOOK_URL_BUY")
        if discord_webhook:
            try:
                warranty_text = "มีประกัน" if warranty else "ไม่มีประกัน"
                notify_msg = f"**[ รายการสั่งซื้อใหม่ ]**\n" \
                             f"> **ลูกค้า:** `{user['email']}`\n" \
                             f"> **สินค้า:** `{platform.upper()}` ({duration_days} วัน)\n" \
                             f"> **ยอดชำระ:** `{price} THB`\n" \
                             f"> **สถานะ:** `{warranty_text}`\n" \
                             f"> \n" \
                             f"> **[ ข้อมูลบัญชีที่จัดส่งให้ลูกค้า ]**\n" \
                             f"> **ล็อกอิน:** `{purchased_account.get('account_login', '-')}`\n" \
                             f"> **จอ:** `{purchased_account.get('profile_name', '-')}`\n" \
                             f"> **วันหมดอายุ:** `{formatted_expire}`"
                
                requests.post(discord_webhook, json={'content': notify_msg})
            except Exception:
                pass 
            
        # ระบบการตลาดสะสมแต้ม
        current_count = int(user.get('purchase_count', 0)) + 1
        reward_code_generated = None

        if current_count >= 10:
            current_count = 0
            reward_code_generated = generate_reward_code()
            promo_payload = {'code': reward_code_generated, 'amount': 10.00, 'is_used': False}
            requests.post(f"{supabase_url}/rest/v1/promo_codes", headers=headers, json=promo_payload)

        # อัปเดตข้อมูลเครดิตและจำนวนแต้มสะสมล่าสุด
        requests.patch(f"{supabase_url}/rest/v1/users?id=eq.{current_user_id}", headers=headers, json={
            "credit_balance": new_credit,
            "purchase_count": current_count
        })

        return jsonify({
            'status': 'success', 
            'data': purchased_account, 
            'remaining_credit': new_credit,
            'purchase_count': current_count,
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
        user_data = {"id": user['id'], "email": user['email'], "credit_balance": user['credit_balance'], "role": user.get('role', 'normal'), "purchase_count": user.get('purchase_count', 0)}
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

# --- ฟีเจอร์ข้อ 6: ระบบเคลมโค้ดเพิ่มเครดิต 10 บาท (ยกเว้น reseller) ---
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
            
        added_amount = float(promo.get('amount', 10.00))
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)