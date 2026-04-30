# Audit Risk Detection System

A comprehensive web application for detecting financial anomalies and audit risks using machine learning. The system uses Isolation Forest algorithms to identify suspicious patterns in audit data and provides real-time risk analysis with detailed historical tracking.

## 🎯 Project Overview

**Audit Risk Detection** is an intelligent system designed to help auditors and compliance teams identify anomalies in financial data through automated machine learning. By analyzing large datasets of financial transactions, account balances, and indicators, the system can flag potential risks, fraud, and irregularities before they become critical issues.

### Key Objectives

- **Automated Anomaly Detection**: Use ML models (Isolation Forest) to identify unusual patterns in audit data
- **Real-Time Risk Scoring**: Calculate anomaly scores for each transaction/record for immediate risk assessment
- **Historical Tracking**: Maintain a complete audit trail of all detections for compliance and review
- **User-Friendly Dashboard**: Provide intuitive visualizations and filtering of detected anomalies
- **Secure Access**: Implement role-based authentication to control access to sensitive data

---

## 🏗️ Architecture

### System Components

```
audit-risk-detection/
├── backend/                    # Flask REST API
│   ├── main.py                # Main application server
│   ├── auth.py                # Authentication utilities
│   ├── models/                # Pre-trained ML models
│   │   ├── isolation_forest_model_ndap.pkl
│   │   ├── feature_scaler_ndap.pkl
│   │   ├── sector_encoder.pkl
│   │   ├── indicator_encoder.pkl
│   │   └── features.pkl
│   ├── requirements.txt       # Python dependencies
│   └── firebase-key.json      # Firebase credentials
│
└── frontend/                   # React Web Application
    └── frontend/
        ├── src/
        │   ├── App.js         # Main component with auth flow
        │   ├── api.js         # API client & endpoints
        │   ├── index.js       # React entry point
        │   ├── pages/
        │   │   ├── Login.js   # Authentication page
        │   │   └── Dashboard.js # Main dashboard
        │   └── components/
        │       ├── Navbar.js
        │       ├── PredictionForm.js
        │       └── Sidebar.js
        ├── package.json
        └── public/
            └── index.html
```

### Technology Stack

**Backend:**
- **Framework**: Flask with CORS support
- **Database**: Google Firebase/Firestore
- **ML Library**: scikit-learn (Isolation Forest)
- **Authentication**: Custom token-based system
- **Data Processing**: pandas, numpy

**Frontend:**
- **UI Framework**: React
- **Styling**: Bootstrap
- **HTTP Client**: Fetch API
- **Visualization**: Recharts
- **State Management**: React Hooks

---

## 🚀 Features

### 1. User Authentication & Security
- ✅ User registration with email and password
- ✅ Secure login with token generation
- ✅ Session validation on app load
- ✅ Automatic logout on invalid tokens
- ✅ Encrypted password storage (SHA-256)

### 2. Anomaly Detection
- ✅ CSV file upload for batch processing
- ✅ Isolation Forest ML model for anomaly scoring
- ✅ Real-time anomaly classification
- ✅ Feature scaling and normalization
- ✅ Sector and Indicator encoding

### 3. Dashboard & Visualization
- ✅ Detection results with detailed data tables
- ✅ Anomaly score visualization (scatter plots, bar charts)
- ✅ Severity filtering (Normal/Anomaly)
- ✅ Data sorting by multiple fields
- ✅ Historical detection tracking

### 4. Data Management
- ✅ Persistent storage in Firestore
- ✅ Detection history with timestamps
- ✅ Detailed detection retrieval
- ✅ User-specific data isolation
- ✅ Export detected anomalies as CSV

### 5. ML Model Integration
- ✅ Pre-trained Isolation Forest model
- ✅ Feature preprocessing and scaling
- ✅ Categorical encoding (Sector, Indicator)
- ✅ Anomaly score calculation
- ✅ Model performance optimization

---

## 🔌 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user account |
| POST | `/login` | User login, returns auth token |
| POST | `/verify` | Verify token validity |

### Detection Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/detect` | Upload CSV and run anomaly detection |
| GET | `/history` | Get all detections for current user |
| GET | `/detection/{id}` | Get detailed results for specific detection |

### System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API health check and info |
| GET | `/health` | System status |
| GET | `/test-firestore` | Firestore connection test |

---

## 🔐 Authentication Flow

```
1. User registers/logs in
   └─ Credentials validated against Firestore
   └─ Unique token generated and stored
   
2. Token stored in browser localStorage
   
3. On app load, token automatically verified
   ├─ Valid token → Dashboard displayed
   └─ Invalid/expired token → Login page shown
   
4. All API requests include Authorization header
   └─ Format: "Bearer {token}"
   
5. User logout
   └─ Token cleared from localStorage
   └─ Redirect to login page
```

---

## 📊 Data Model

### User Collection (Firestore)
```javascript
{
  name: "string",
  email: "string",
  password: "hash",
  token: "string",
  created_at: "timestamp",
  updated_at: "timestamp",
  last_login: "timestamp"
}
```

### Detection Collection (Firestore)
```javascript
{
  user_id: "string",
  detection_timestamp: "timestamp",
  file_name: "string",
  total_records: "number",
  anomalies_detected: "number",
  anomaly_score: "number",
  data: [
    {
      year: "number",
      month: "number",
      sector: "string",
      indicator: "string",
      obs_value: "number",
      anomaly: "number (-1=anomaly, 1=normal)",
      anomaly_score: "number"
    }
  ]
}
```

---

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn
- Google Firebase account with Firestore enabled

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Firebase**
   - Place your `firebase-key.json` in the backend directory
   - Ensure Firestore is initialized in your Firebase project

4. **Prepare ML Models**
   - Place pre-trained models in `models/` directory:
     - `isolation_forest_model_ndap.pkl`
     - `feature_scaler_ndap.pkl`
     - `sector_encoder.pkl`
     - `indicator_encoder.pkl`
     - `features.pkl`

5. **Start the backend server**
   ```bash
   python main.py
   ```
   Server runs on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```
   Application opens at `http://localhost:3000`

---

## 📝 Usage Guide

### 1. User Registration
1. Click "Register here" on the login page
2. Enter name, email, and password
3. Submit to create account
4. Login with credentials

### 2. Upload Data for Detection
1. Login to dashboard
2. Select CSV file (must contain: Year, Month, Sector, Indicator, Obs Value)
3. Click "Upload" button
4. View detection results in real-time

### 3. Analyze Results
1. Review detected anomalies in the results table
2. Sort by anomaly_score for risk prioritization
3. Filter by severity (Normal/Anomaly)
4. Click history items to view detailed analysis

### 4. Export Anomalies
1. After detection, click "Export Anomalies as CSV"
2. File downloads with all flagged records
3. Use for further investigation or reporting

### 5. View History
1. All past detections shown in sidebar
2. Click any detection to reload its results
3. Timestamps and anomaly counts visible

---

## 🔍 CSV File Format

Expected input CSV structure:

| Year | Month | Sector | Indicator | Obs Value |
|------|-------|--------|-----------|-----------|
| 2024 | January | Finance | Revenue | 1,000,000 |
| 2024 | January | IT | Expense | 50,000 |

**Required Columns:**
- Year (numeric, e.g., 2024)
- Month (text name or number)
- Sector (categorical)
- Indicator (categorical)
- Obs Value (numeric)

---

## 🎓 ML Model Details

### Isolation Forest Algorithm
- **Purpose**: Unsupervised anomaly detection
- **Method**: Random forest of isolation trees
- **Advantage**: Efficient for high-dimensional data, no distance calculations
- **Output**: Anomaly score (-1 for anomalies, 1 for normal points)

### Feature Engineering
1. **Normalization**: StandardScaler for numerical features
2. **Encoding**: Label encoding for Sector and Indicator
3. **Features Used**: Year, Month, Sector, Indicator, Obs Value
4. **Score Range**: -1 to 1 (lower = more anomalous)

---

## 🐛 Troubleshooting

### Backend Issues

**Firebase Connection Error**
```
❌ Firebase initialization error
```
- Check firebase-key.json exists and is valid
- Verify Firestore database is enabled
- Check internet connection

**Model Loading Error**
```
❌ NDAP loading error
```
- Ensure all .pkl files exist in models/
- Verify file integrity (no corruption)
- Check Python version compatibility

### Frontend Issues

**Token Verification Failed**
```
⚠️ Token validation failed
```
- Clear browser localStorage: `localStorage.clear()`
- Login again with valid credentials
- Check backend server is running

**Anomaly Detection Error**
```
Error: HTTP 401
```
- Token may be expired, logout and login again
- Verify CSV format matches requirements
- Check backend server logs for details

---

## 🚀 Future Enhancements

### Planned Features
- [ ] Multi-model ensemble (Random Forest, LOF, Autoencoder)
- [ ] Real-time streaming data detection
- [ ] Advanced analytics dashboard with drill-down capabilities
- [ ] Role-based access control (Admin, Auditor, Viewer)
- [ ] Automated report generation (PDF export)
- [ ] Email alerts for critical anomalies
- [ ] Model retraining pipeline
- [ ] Data quality metrics
- [ ] Compliance audit logs
- [ ] Two-factor authentication (2FA)
- [ ] API rate limiting
- [ ] Batch processing optimization

### Performance Improvements
- [ ] Database indexing optimization
- [ ] Caching layer (Redis)
- [ ] API response compression
- [ ] Frontend code splitting
- [ ] Lazy loading for large datasets

### Security Enhancements
- [ ] JWT token implementation
- [ ] HTTPS enforcement
- [ ] SQL injection prevention
- [ ] CSRF protection
- [ ] Input validation hardening
- [ ] Rate limiting
- [ ] DDoS protection

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying or distribution is prohibited.

---

## 👥 Team & Support

**Developed by**: Audit Risk Detection Team  
**Last Updated**: April 27, 2026

For support or questions, contact the development team through your organization's internal channels.

---

## 📋 Project Status

✅ **Current Phase**: Active Development
- Core features implemented and tested
- Authentication system operational
- ML model integration complete
- Dashboard visualization working
- Firestore integration stable

🔄 **Next Milestones**
- Performance optimization
- Additional model integration
- Advanced analytics features
- Production deployment preparation

---

## 📚 Documentation Index

- [API Documentation](./docs/API.md) - Detailed endpoint documentation
- [ML Model Guide](./docs/ML_MODELS.md) - Model details and training
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production setup
- [Contributing Guidelines](./CONTRIBUTING.md) - Development standards
