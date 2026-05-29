import os
from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory
from flask_pymongo import PyMongo
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_bcrypt import Bcrypt
from bson.objectid import ObjectId
from werkzeug.utils import secure_filename
from datetime import datetime, timezone
from dotenv import load_dotenv
import string
import traceback
import logging
from authlib.integrations.flask_client import OAuth
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import secrets

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Load environment variables from .env file
# Load environment variables from .env file, overriding system vars
load_dotenv(override=True)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key_here'
app.secret_key = app.config['SECRET_KEY']  # Authlib requires secret_key to easily be accessible

# Email Configuration (for 2FA)
# app.config['MAIL_SERVER'] = 'smtp.gmail.com'
# app.config['MAIL_PORT'] = 587
# app.config['MAIL_USE_TLS'] = True
# app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
# app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
# app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')

# mail = Mail(app)

# Use config from env, fallback to localhost if not set
uri = os.getenv('MONGO_URI') or 'mongodb://127.0.0.1:27017/unlost'
print(f" * DEBUG: Connection URI: {uri}")
app.config['MONGO_URI'] = uri

app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}

mongo = PyMongo(app)
bcrypt = Bcrypt(app)

# --- JWT Configuration ---
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'default_jwt_secret_key_change_in_production')
jwt = JWTManager(app)

# --- Google OAuth Configuration ---
app.config['GOOGLE_CLIENT_ID'] = os.getenv('GOOGLE_CLIENT_ID')
app.config['GOOGLE_CLIENT_SECRET'] = os.getenv('GOOGLE_CLIENT_SECRET')

oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=app.config['GOOGLE_CLIENT_ID'],
    client_secret=app.config['GOOGLE_CLIENT_SECRET'],
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

login_manager = LoginManager(app)
login_manager.login_view = 'login'

@app.errorhandler(Exception)
def handle_exception(error):
    logger.error(f"Exception occurred: {str(error)}")
    logger.error(traceback.format_exc())
    return f"Error: {str(error)}", 500

class User(UserMixin):
    def __init__(self, user_data):
        self.id = str(user_data['_id'])
        self.username = user_data['username']
        self.email = user_data['email']
        self.is_admin = user_data.get('is_admin', False)
        self.date_created = user_data.get('date_created')
        self.auth_provider = user_data.get('auth_provider', 'local')


@login_manager.user_loader
def load_user(user_id):
    user_data = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if user_data:
        return User(user_data)
    return None

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
@login_required
def home():
    # Fetch 10 latest items for the home page
    latest_items = list(mongo.db.items.find({"status": {"$ne": "Archived"}}).sort("date", -1).limit(10))
    return render_template('home.html', latest_items=latest_items)

def build_items_filter(args):
    query = args.get('q')
    category_filter = args.get('category')
    status_filter = args.get('status')
    date_filter = args.get('date')

    filter_criteria = {}

    if query:
        # Simple regex search for query in title or description
        regex = {"$regex": query, "$options": "i"}
        filter_criteria["$or"] = [{"title": regex}, {"description": regex}]

    if category_filter:
        filter_criteria["category"] = category_filter

    if status_filter:
        filter_criteria["status"] = status_filter

    if date_filter:
        try:
            start_of_day = datetime.strptime(date_filter, '%Y-%m-%d')
            from datetime import timedelta
            end_of_day = start_of_day + timedelta(days=1)

            filter_criteria["date"] = {
                "$gte": start_of_day,
                "$lt": end_of_day
            }
        except ValueError:
            pass  # Ignore invalid date format

    # Exclude archived items unless explicitly requested
    if not status_filter:
        filter_criteria["status"] = {"$ne": "Archived"}

    return filter_criteria

@app.route('/items')
@login_required
def items():
    filter_criteria = build_items_filter(request.args)
    items_cursor = mongo.db.items.find(filter_criteria).sort("date", -1)
    items = list(items_cursor)

    return render_template('items.html', items=items)

@app.route('/items/partial')
@login_required
def items_partial():
    filter_criteria = build_items_filter(request.args)
    items = list(mongo.db.items.find(filter_criteria).sort("date", -1))

    return render_template('partials/items_list.html', items=items)

@app.route('/report', methods=['GET', 'POST'])
@login_required
def report():
    if request.method == 'POST':
        title = request.form['title']
        description = request.form['description']
        category = request.form['category']
        location = request.form['location']
        status = request.form['status']
        contact_info = request.form['contact_info']
        date_str = request.form['date']
        
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            date_obj = datetime.now(timezone.utc)

        image_filename = None
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                # Ensure unique filename
                timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
                filename = f"{timestamp}_{filename}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                image_filename = filename

        new_item = {
            "title": title,
            "description": description,
            "category": category,
            "location": location,
            "status": status,
            "contact_info": contact_info,
            "date": date_obj,
            "image_file": image_filename,
            "security_question": request.form.get('security_question'),
            "security_answer": request.form.get('security_answer'),
            "reporter_email": current_user.email if current_user.is_authenticated else "Anonymous"
        }

        mongo.db.items.insert_one(new_item)
        
        # Log the action
        mongo.db.logs.insert_one({
            "action": "Item Reported",
            "item_title": title,
            "timestamp": datetime.now(timezone.utc),
            "user": current_user.email if current_user.is_authenticated else "Anonymous"
        })

        return redirect(url_for('items'))

    return render_template('report.html')

@app.route('/contact')
@login_required
def contact():
    return render_template('contact.html')

@app.route('/verify_claim', methods=['POST'])
@login_required
def verify_claim():
    data = request.json
    item_id = data.get('item_id')
    user_answer = data.get('answer', '').strip().lower()
    
    item = mongo.db.items.find_one({"_id": ObjectId(item_id)})
    
    if not item:
        return {"success": False, "message": "Item not found."}
        
    correct_answer = item.get('security_answer', '').strip().lower()
    
    # Reject empty answers immediately
    if not user_answer:
        return {"success": False, "message": "Please enter an answer."}

    # If no security answer is stored, deny access
    if not correct_answer:
        return {"success": False, "message": "This item has no security answer configured."}

    # Function to normalize and check for match
    def check_match(user, correct):
        if user == correct:
            return True

        # Remove punctuation
        translator = str.maketrans('', '', string.punctuation)
        u_clean = user.translate(translator)
        c_clean = correct.translate(translator)

        if u_clean == c_clean:
            return True

        # Check if one is substring of another (only if both are non-empty)
        if u_clean and c_clean and (u_clean in c_clean or c_clean in u_clean):
            return True

        # Check keyword intersection (flexible matching)
        stop_words = {'the', 'a', 'an', 'and', 'or', 'is', 'in', 'at', 'of', 'for', 'with', 'on', 'it', 'its', 'my'}
        u_tokens = set(u_clean.split()) - stop_words
        c_tokens = set(c_clean.split()) - stop_words

        # If we have meaningful tokens and there is ANY intersection
        if c_tokens and u_tokens and u_tokens.intersection(c_tokens):
            return True

        return False

    if check_match(user_answer, correct_answer):
        return {"success": True, "contact_info": item.get('contact_info')}
    else:
        # Log suspected fraud / failed claim
        mongo.db.logs.insert_one({
            "action": "Security Alert: Failed Claim",
            "item_id": str(item_id),
            "item_title": item.get('title', 'Unknown'),
            "input_provided": user_answer,
            "timestamp": datetime.now(timezone.utc),
            "user": current_user.email if current_user.is_authenticated else "Anonymous"
        })
        return {"success": False, "message": "Incorrect answer. Please try again."}

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
        
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        existing_user = mongo.db.users.find_one({"$or": [{"username": username}, {"email": email}]})
        
        if existing_user:
            flash('Username or email already exists. Please choose a different one.', 'danger')
            return redirect(url_for('register'))
            
        new_user = {
            "username": username,
            "email": email,
            "password": hashed_password,
            "is_admin": False, # Default to regular user
            "date_created": datetime.now(timezone.utc)
        }
        
        mongo.db.users.insert_one(new_user)
        flash('Account created successfully! You can now log in.', 'success')
        return redirect(url_for('login'))
        
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
        
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        user_data = mongo.db.users.find_one({"email": email})
        
        if user_data and bcrypt.check_password_hash(user_data['password'], password):
            user = User(user_data)
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('home'))
        else:
            flash('Login Unsuccessful. Please check email and password', 'danger')
            
    return render_template('login.html')



@app.route('/login/google')
def login_google():
    redirect_uri = url_for('auth_google_callback', _external=True)
    return google.authorize_redirect(redirect_uri)

@app.route('/auth/google/callback')
def auth_google_callback():
    token = google.authorize_access_token()
    user_info = token.get('userinfo')
    
    if not user_info:
        flash('Failed to fetch user info from Google.', 'danger')
        return redirect(url_for('login'))
        
    email = user_info.get('email')
    username = user_info.get('name', email.split('@')[0])
    
    # Check if user exists
    user_data = mongo.db.users.find_one({"email": email})
    
    if not user_data:
        # Register new user with random password
        random_password = secrets.token_urlsafe(16)
        hashed_password = bcrypt.generate_password_hash(random_password).decode('utf-8')
        
        new_user = {
            "username": username,
            "email": email,
            "password": hashed_password,
            "is_admin": False,
            "date_created": datetime.now(timezone.utc),
            "auth_provider": "google"
        }
        result = mongo.db.users.insert_one(new_user)
        user_data = mongo.db.users.find_one({"_id": result.inserted_id})
        flash('Account created successfully via Google!', 'success')
        
    user = User(user_data)
    login_user(user)
    return redirect(url_for('home'))

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    if not data:
        return {"msg": "Missing JSON in request"}, 400
        
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return {"msg": "Missing email or password"}, 400
        
    user_data = mongo.db.users.find_one({"email": email})
    
    if user_data and bcrypt.check_password_hash(user_data['password'], password):
        # Create token that lasts for 1 day
        from datetime import timedelta
        access_token = create_access_token(identity=str(user_data['_id']), expires_delta=timedelta(days=1))
        return {"access_token": access_token}, 200
    else:
        return {"msg": "Bad email or password"}, 401

@app.route('/admin-login', methods=['GET', 'POST'])
def admin_login():
    if current_user.is_authenticated:
        if current_user.is_admin:
            return redirect(url_for('admin'))
        return redirect(url_for('home'))
        
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        user_data = mongo.db.users.find_one({"email": email})
        
        if user_data:
            if user_data.get('is_admin', False) and bcrypt.check_password_hash(user_data['password'], password):
                user = User(user_data)
                login_user(user)
                return redirect(url_for('admin'))
            else:
                 flash('Access Denied. Admin privileges required.', 'danger')
        else:
            flash('Login Unsuccessful. Please check email and password', 'danger')
            
    return render_template('admin_login.html')

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('home'))

@app.route('/admin')
@login_required
def admin():
    if not current_user.is_admin:
        flash('Access denied: Admin privileges required.', 'danger')
        return redirect(url_for('home'))

    total_items = mongo.db.items.count_documents({"status": {"$ne": "Archived"}})
    total_users = mongo.db.users.count_documents({})
    archived_items = mongo.db.items.count_documents({"status": "Archived"})

    # Items reported today (UTC)
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    new_today = mongo.db.items.count_documents({
        "date": {"$gte": today_start},
        "status": {"$ne": "Archived"}
    })

    # Fetch recent items (limit changed from 5 to 10 for Overview)
    recent_items = list(mongo.db.items.find({"status": {"$ne": "Archived"}}).sort("date", -1).limit(10))

    # Fetch archived items for recovery (Trash)
    trash_items_cursor = mongo.db.items.find({"status": "Archived"}).sort("deleted_at", -1)
    trash_items = []
    current_time = datetime.now(timezone.utc)
    for t_item in trash_items_cursor:
        deleted_at = t_item.get('deleted_at')
        if deleted_at:
            if deleted_at.tzinfo is None:
                deleted_at = deleted_at.replace(tzinfo=timezone.utc)
            t_item['days_deleted'] = (current_time - deleted_at).days
        else:
            t_item['days_deleted'] = None
        trash_items.append(t_item)

    logs = list(mongo.db.logs.find().sort("timestamp", -1).limit(20))
    security_alerts = mongo.db.logs.count_documents({"action": {"$regex": "Security Alert"}})

    return render_template('admin.html',
                         total_items=total_items,
                         total_users=total_users,
                         archived_items=archived_items,
                         new_today=new_today,
                         security_alerts=security_alerts,
                         recent_items=recent_items,
                         trash_items=trash_items,
                         logs=logs)

@app.route('/admin/logs')
@login_required
def all_logs():
    if not current_user.is_admin:
        flash('Access denied: Admin privileges required.', 'danger')
        return redirect(url_for('home'))
        
    # Fetch all logs, sorted by most recent
    logs = list(mongo.db.logs.find().sort("timestamp", -1))
    
    return render_template('admin_logs.html', logs=logs)

@app.route('/admin/delete_item/<item_id>', methods=['POST'])
@login_required
def delete_item(item_id):
    if not current_user.is_admin:
        flash('Access denied: Admin privileges required.', 'danger')
        return redirect(url_for('home'))
        
    item = mongo.db.items.find_one({"_id": ObjectId(item_id)})
    if item:
        # Soft Delete with Recovery Metadata
        mongo.db.items.update_one(
            {"_id": ObjectId(item_id)}, 
            {
                "$set": {
                    "status": "Archived",
                    "previous_status": item.get("status", "Lost"),
                    "deleted_at": datetime.now(timezone.utc)
                }
            }
        )
        
        # Log the action
        mongo.db.logs.insert_one({
            "action": "Item Removed (Archived)",
            "item_id": str(item_id),
            "item_title": item.get('title', 'Unknown'),
            "timestamp": datetime.now(timezone.utc),
            "admin": current_user.email
        })
        flash('Item moved to trash (recoverable for 10 days).', 'success')
    else:
        flash('Item not found.', 'danger')
        
    return redirect(url_for('admin'))

@app.route('/admin/recover_item/<item_id>', methods=['POST'])
@login_required
def recover_item(item_id):
    if not current_user.is_admin:
        flash('Access denied.', 'danger')
        return redirect(url_for('home'))
        
    item = mongo.db.items.find_one({"_id": ObjectId(item_id)})
    if item and item.get('status') == 'Archived':
        # Check 10-day buffer
        deleted_at = item.get('deleted_at')
        if deleted_at:
            # Ensure deleted_at is timezone-aware
            if deleted_at.tzinfo is None:
                deleted_at = deleted_at.replace(tzinfo=timezone.utc)
                
            time_diff = datetime.now(timezone.utc) - deleted_at
            if time_diff.days > 10:
                flash('Recovery period expired (10 days).', 'danger')
                return redirect(url_for('admin'))
        
        # Recover
        previous_status = item.get('previous_status', 'Lost')
        mongo.db.items.update_one(
            {"_id": ObjectId(item_id)},
            {
                "$set": {"status": previous_status},
                "$unset": {"previous_status": "", "deleted_at": ""}
            }
        )
        
        # Log recovery
        mongo.db.logs.insert_one({
            "action": "Item Recovered",
            "item_id": str(item_id),
            "item_title": item.get('title', 'Unknown'),
            "timestamp": datetime.now(timezone.utc),
            "admin": current_user.email
        })
        flash('Item recovered successfully.', 'success')
    else:
        flash('Item not found or not in trash.', 'danger')
        
    return redirect(url_for('admin'))

@app.route('/init_db')
def init_db():
    # MongoDB creates collections on the fly
    return "MongoDB is ready!"

@app.route('/profile')
@login_required
def profile():
    user_logs = list(mongo.db.logs.find({"user": current_user.email}).sort("timestamp", -1).limit(10))
    return render_template('profile.html', user=current_user, logs=user_logs)

if __name__ == "__main__":
    app.run(debug=True)
