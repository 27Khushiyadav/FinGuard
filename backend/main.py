from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, auth, firestore
from datetime import datetime
import pandas as pd
import joblib
import json
import traceback
import os
import requests
import hashlib

app = Flask(__name__)
CORS(app, supports_credentials=True)

# ==============================
# FIREBASE INITIALIZATION
# ==============================
print("=" * 60)
print("INITIALIZING FIREBASE")
print("=" * 60)

try:
    import os
    import json

    firebase_key = os.environ.get("FIREBASE_KEY")

    if firebase_key:
        # Load from environment variable (Production / Docker / Render)
        cred = credentials.Certificate(json.loads(firebase_key))
        print("🔐 Using Firebase key from ENV")
    else:
        # Fallback for local development
        cred = credentials.Certificate("firebase-key.json")
        print("📁 Using local firebase-key.json")

    # Initialize Firebase only once
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
        print("✅ Firebase initialized successfully")

    db = firestore.client()
    print("✅ Firestore connected")

except Exception as e:
    print(f"❌ Firebase initialization error: {e}")
    traceback.print_exc()

# ==============================
# LOAD MODELS
# ==============================
print("=" * 60)
print("LOADING MODELS")
print("=" * 60)

# NDAP MODEL (MAIN)
ndap_model = None
ndap_scaler = None
ndap_features = None
sector_encoder = None
indicator_encoder = None

try:
    ndap_model = joblib.load("models/isolation_forest_model_ndap.pkl")
    ndap_scaler = joblib.load("models/feature_scaler_ndap.pkl")
    ndap_features = joblib.load("models/features.pkl")
    sector_encoder = joblib.load("models/sector_encoder.pkl")
    indicator_encoder = joblib.load("models/indicator_encoder.pkl")

    print("✅ NDAP model fully loaded")
except Exception as e:
    print(f"❌ NDAP loading error: {e}")
    traceback.print_exc()

print("=" * 60)

# ==============================
# AUTHENTICATION HELPER (Firebase)
# ==============================
def verify_token(auth_header):
    """Extract and verify auth token from Firestore"""
    if not auth_header:
        print(f"🔍 verify_token: No auth header provided")
        return None
    
    # Handle both "Bearer token" and just "token" formats
    if auth_header.startswith('Bearer '):
        token = auth_header.split('Bearer ')[1]
    else:
        token = auth_header
    
    try:
        # Find user with this token in Firestore
        users_ref = db.collection('users')
        docs = list(users_ref.where('token', '==', token).stream())
        
        if docs:
            user_id = docs[0].id
            print(f"✅ verify_token: Found user_id={user_id} for token")
            return user_id
        
        print(f"⚠️ verify_token: Token not found in database")
        return None  # Token not found
    except Exception as e:
        print(f"❌ Token verification failed: {e}")
        traceback.print_exc()
        return None

# ==============================
# NDAP PREPROCESSING (YOUR EXISTING CODE)
# ==============================
def preprocess_ndap(df):
    df = df.copy()
    df.columns = df.columns.str.strip()

    # Safe column detection
    obs_cols = [c for c in df.columns if "Obs Value" in c]
    if not obs_cols:
        raise ValueError("Obs Value column not found")

    df.rename(columns={obs_cols[0]: "Obs Value"}, inplace=True)

    required = ['Year', 'Month', 'Sector', 'Indicator', 'Obs Value']
    df = df[required]

    # Year
    df['Year'] = df['Year'].astype(str).str.extract(r'(\d{4})')[0]
    df['Year'] = pd.to_numeric(df['Year'], errors='coerce')

    # Month
    df['Month'] = df['Month'].astype(str).str.extract(r'([A-Za-z]+)')[0]

    month_map = {
        'January':1,'February':2,'March':3,'April':4,
        'May':5,'June':6,'July':7,'August':8,
        'September':9,'October':10,'November':11,'December':12
    }

    df['Month'] = df['Month'].replace(month_map)
    df['Month'] = pd.to_numeric(df['Month'], errors='coerce').fillna(1)

    # Obs Value
    df['Obs Value'] = df['Obs Value'].astype(str).str.replace(',', '')
    df['Obs Value'] = pd.to_numeric(df['Obs Value'], errors='coerce')

    df = df.dropna()

    if df.empty:
        raise ValueError("No valid data after preprocessing")

    # Encoding
    df['Sector'] = df['Sector'].apply(
        lambda x: sector_encoder.transform([x])[0] if x in sector_encoder.classes_ else -1
    )

    df['Indicator'] = df['Indicator'].apply(
        lambda x: indicator_encoder.transform([x])[0] if x in indicator_encoder.classes_ else -1
    )

    return df

# ==============================
# HOME ROUTE
# ==============================
@app.route("/")
def home():
    return jsonify({
        "message": "FinGuard API Running with Firebase",
        "endpoints": ["/health", "/detect", "/verify", "/history", "/test-firestore"],
        "firebase_status": "connected" if firebase_admin._apps else "disconnected"
    })

# ==============================
# REGISTER ROUTE (Firestore)
# ==============================
@app.route("/register", methods=["POST", "OPTIONS"])
def register():
    """Register new user - stores in Firestore"""
    if request.method == "OPTIONS":
        return "", 204
    
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not name or not email or not password:
            return jsonify({'error': 'Name, email, and password required'}), 400
        
        # Check if user already exists
        users_ref = db.collection('users')
        existing = users_ref.where('email', '==', email).stream()
        
        if len(list(existing)) > 0:
            return jsonify({'error': 'Email already registered'}), 409
        
        # Hash password
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Create user in Firestore
        user_doc = users_ref.add({
            'name': name,
            'email': email,
            'password': password_hash,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        })
        
        return jsonify({
            'message': 'Registration successful',
            'user_id': user_doc[1].id,
            'email': email
        }), 201
        
    except Exception as e:
        print(f"❌ Registration error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==============================
# LOGIN ROUTE (Firestore)
# ==============================
@app.route("/login", methods=["POST", "OPTIONS"])
def login():
    """Login user - validates against Firestore"""
    if request.method == "OPTIONS":
        return "", 204
    
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        # Find user in Firestore
        users_ref = db.collection('users')
        docs = users_ref.where('email', '==', email).stream()
        
        user = None
        user_id = None
        for doc in docs:
            user = doc.to_dict()
            user_id = doc.id
            break
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Verify password
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        if user.get('password') != password_hash:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Generate a simple token (you could use JWT for better security)
        token = hashlib.sha256(f"{email}{datetime.utcnow().isoformat()}".encode()).hexdigest()
        
        # Update last login
        users_ref.document(user_id).update({
            'last_login': datetime.utcnow(),
            'token': token
        })
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user_id': user_id,
            'email': email,
            'name': user.get('name')
        }), 200
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==============================
# VERIFY TOKEN ROUTE
# ==============================
@app.route("/verify", methods=["POST"])
def verify_session():
    """Verify token and return user info"""
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        return jsonify({"error": "No token provided"}), 401
    
    uid = verify_token(auth_header)
    
    if not uid:
        return jsonify({"error": "Invalid token"}), 401
    
    try:
        # Get user from Firestore
        user_doc = db.collection('users').document(uid).get()
        if not user_doc.exists:
            return jsonify({"error": "User not found"}), 404
        
        user_data = user_doc.to_dict()
        return jsonify({
            "uid": uid,
            "email": user_data.get('email'),
            "name": user_data.get('name'),
            "verified": True,
            "message": "Token verified successfully"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==============================
# DETECT ROUTE (UPDATED for Firebase)
# ==============================
@app.route("/detect", methods=["POST"])
def detect():
    # Verify token
    auth_header = request.headers.get("Authorization", "")
    uid = verify_token(auth_header)

    if not uid:
        return jsonify({"error": "Unauthorized - Please login again"}), 401

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    
    try:
        df = pd.read_csv(file)
        df_clean = preprocess_ndap(df)

        X = df_clean[ndap_features]
        X_scaled = ndap_scaler.transform(X)

        df_clean["anomaly"] = ndap_model.predict(X_scaled)
        # Calculate anomaly scores using decision_function
        df_clean["anomaly_score"] = ndap_model.decision_function(X_scaled)

    except Exception as e:
        print(f"❌ Detection error: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400

    anomalies = df_clean[df_clean["anomaly"] == -1]
    
    # Get user email for storage from Firestore
    try:
        user_doc = db.collection('users').document(uid).get()
        user_email = user_doc.to_dict().get('email', 'unknown') if user_doc.exists else 'unknown'
    except:
        user_email = 'unknown'

    result = {
        "total_records": len(df_clean),
        "anomalies_found": len(anomalies),
        "anomaly_percentage": round((len(anomalies)/len(df_clean))*100, 2),
        "data": df_clean.to_dict(orient="records"),
        "filename": file.filename,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # ==============================
    # SAVE TO FIRESTORE (Instead of SQLite)
    # ==============================
    try:
        doc_ref = db.collection('detection_history').add({
            'user_id': uid,
            'user_email': user_email,
            'filename': file.filename,
            'timestamp': datetime.utcnow(),
            'total_records': result['total_records'],
            'anomalies_found': result['anomalies_found'],
            'anomaly_percentage': result['anomaly_percentage'],
            'model_used': 'ndap',
            # Store a preview of the data (first 100 rows to avoid Firestore limits)
            'data_preview': df_clean.head(100).to_dict(orient="records") if len(df_clean) > 0 else []
        })
        doc_id = doc_ref[1].id
        print(f"✅ Saved to Firestore: {doc_ref[1].id}")
    except Exception as firestore_error:
        print(f"⚠️ Firestore save error: {firestore_error}")
        # Don't fail the request if Firestore save fails
        # The detection result is still returned to user

    return jsonify(result)

# ==============================
# GET HISTORY (Firestore)
# ==============================
@app.route("/history", methods=["GET"])
def get_history():
    auth_header = request.headers.get("Authorization", "")
    uid = verify_token(auth_header)

    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        docs = db.collection("detection_history") \
                 .where("user_id", "==", uid) \
                 .order_by("timestamp", direction=firestore.Query.DESCENDING) \
                 .stream()

        history = []

        for doc in docs:
            data = doc.to_dict()

            history.append({
                "id": doc.id,
                "filename": data.get("filename"),
                "timestamp": data.get("timestamp").isoformat() if data.get("timestamp") else None,
                "total_records": data.get("total_records"),
                "anomalies_found": data.get("anomalies_found")
            })

        return jsonify({"history": history})

    except Exception as e:
        print(f"❌ History fetch error: {e}")
        return jsonify({"error": str(e)}), 500
# ==============================
# HEALTH CHECK
# ==============================
@app.route("/health")
def health():
    return jsonify({
        "ndap_model_loaded": ndap_model is not None,
        "firebase_connected": firebase_admin._apps is not None,
        "status": "healthy"
    })

# ==============================
# TEST FIRESTORE CONNECTION
# ==============================
@app.route("/test-firestore", methods=["GET"])
def test_firestore():
    """Test Firestore connection"""
    try:
        # Try to write a test document
        test_ref = db.collection('test').add({
            'message': 'Connection test',
            'timestamp': datetime.utcnow()
        })
        return jsonify({'status': 'success', 'message': 'Firestore is working!'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ==============================
# RUN
# ==============================
if __name__ == "__main__":
    print("=" * 60)
    print("🚀 STARTING FINGUARD BACKEND WITH FIREBASE")
    print("📍 Running on: http://localhost:5000")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)