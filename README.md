# 📊 PEMS — Personal Expense Management System

A full-stack SaaS web application for managing personal finances with AI insights, OCR receipt scanning, and eSewa payment integration.

---

## 🚀 Tech Stack

| Layer       | Technology                                    |
|-------------|-----------------------------------------------|
| Frontend    | React.js, Tailwind CSS, Framer Motion, Recharts |
| Backend     | Node.js, Express.js, Socket.IO                |
| Database    | MongoDB + Mongoose                            |
| Auth        | JWT + bcryptjs                                |
| Payments    | eSewa Payment Gateway                         |
| AI/OCR      | Tesseract.js, OpenAI API (optional)           |
| Email       | Nodemailer (Gmail SMTP)                       |

---

## 📁 Project Structure

```
pems/
├── backend/
│   ├── config/           # DB connection
│   ├── controllers/      # Route handlers
│   ├── middleware/       # Auth, upload
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── services/         # Email service
│   ├── utils/            # Seeder
│   ├── uploads/          # Uploaded files (auto-created)
│   ├── server.js         # Entry point
│   └── .env.example
│
└── frontend/
    ├── public/
    └── src/
        ├── components/   # Reusable UI components
        ├── context/      # Auth, Theme, Socket contexts
        ├── pages/        # All pages (user + admin)
        ├── utils/        # API client, helpers
        ├── App.js
        └── index.js
```

---

## ⚡ Quick Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

---

### 1. Clone & Install

```bash
# Install backend dependencies
cd pems/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 2. Configure Backend Environment

```bash
cd pems/backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pems
JWT_SECRET=your_super_secret_key_here_min_32_chars
JWT_EXPIRE=7d

# OpenAI (optional — AI assistant falls back to rule-based if not set)
OPENAI_API_KEY=sk-your-openai-key

# eSewa (test credentials — works for demo)
ESEWA_MERCHANT_ID=EPAYTEST
ESEWA_SECRET=8gBm/:&EnhH.1[LDh22rDTU

# URLs
ESEWA_SUCCESS_URL=http://localhost:3000/payment/success
ESEWA_FAILURE_URL=http://localhost:3000/payment/failure
FRONTEND_URL=http://localhost:3000

# Email (Gmail — enable App Password in Google Account)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password

NODE_ENV=development
```

---

### 3. Configure Frontend Environment

```bash
cd pems/frontend
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

### 4. Seed Demo Data

```bash
cd pems/backend
npm run seed
```

This creates 4 demo users:

| User | Email | Password | Plan |
|------|-------|----------|------|
| Ram Sharma | ram@gmail.com | Ram@123 | Free |
| Sita Karki | sita@gmail.com | Sita@123 | Premium |
| Hari Thapa | hari@gmail.com | Hari@123 | Expired Premium |
| Admin | admin@gmail.com | Admin@123 | Admin |

---

### 5. Start the Application

**Terminal 1 — Backend:**
```bash
cd pems/backend
npm run dev
```
Backend runs at: `http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd pems/frontend
npm start
```
Frontend runs at: `http://localhnpost:3000`

---

## 💳 eSewa Payment Setup

PEMS uses **eSewa test environment** by default.

**Test Credentials** (for demo):
- Merchant ID: `EPAYTEST`
- Secret Key: `8gBm/:&EnhH.1[LDh22rDTU`
- Test URL: `https://rc-epay.esewa.com.np/api/epay/main/v2/form`

**For production:**
1. Register at [esewa.com.np](https://esewa.com.np) as merchant
2. Get live Merchant ID and Secret Key
3. Change URL to `https://epay.esewa.com.np/api/epay/main/v2/form`

**Payment Flow:**
1. User clicks "Pay via eSewa"
2. Redirected to eSewa payment page
3. After payment, eSewa redirects to success URL
4. Backend verifies and activates premium

---

## 🤖 AI Assistant Setup

**Without OpenAI (default):** Uses smart rule-based analysis — fully functional for demos.

**With OpenAI:**
1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Set `OPENAI_API_KEY=sk-...` in backend `.env`
3. Restart backend

---

## 📷 OCR Receipt Scanner

OCR uses **Tesseract.js** (runs locally, no API key needed).

**Supported text detection:**
- `Rs`, `Rs.`, `NPR`, `रु` currency symbols
- Keywords: `Total`, `Grand Total`, `Amount Payable`
- Auto-detects: vendor name, date, category

**Tips for best results:**
- Use clear, well-lit photos
- Avoid blurry or crumpled receipts
- Works best with printed receipts

---

## 📧 Email Setup (Gmail)

1. Go to Google Account → Security → 2-Step Verification (enable)
2. Go to App Passwords → Generate for "Mail"
3. Use the 16-character password in `EMAIL_PASS`

> If email isn't configured, the app still works — emails are silently skipped.

---

## 🔐 Security Features

- JWT token authentication (7-day expiry)
- bcrypt password hashing (12 rounds)
- Rate limiting (200 req/15 min)
- Helmet.js HTTP security headers
- Role-based access (user/admin)
- File upload validation (images only, 5MB max)
- Subscription expiry auto-downgrade

---

## 📱 Subscription Plans

### Free Plan
- ✅ 20 expense entries
- ✅ Basic income tracking
- ✅ Dashboard & analytics
- ✅ Budget monitoring
- ❌ OCR scanner
- ❌ AI assistant
- ❌ PDF/CSV downloads

### Premium — रु 999/year
- ✅ Unlimited expenses & income
- ✅ AI Financial Assistant
- ✅ OCR Receipt Scanner
- ✅ Full analytics with charts
- ✅ PDF & CSV report downloads
- ✅ Financial forecasting
- ✅ Premium notifications

---

## 🛠️ API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password/:token

GET    /api/dashboard
GET/POST/PUT/DELETE /api/expenses
GET    /api/expenses/stats
GET/POST/PUT/DELETE /api/incomes
GET/POST/DELETE     /api/budgets

POST   /api/kyc
GET    /api/kyc/my

POST   /api/payment/initiate
GET    /api/payment/success
GET    /api/payment/history

POST   /api/ocr/scan          [Premium]
GET    /api/ai/analysis        [Premium]
GET    /api/ai/forecast        [Premium]
POST   /api/ai/chat            [Premium]

GET/PUT/DELETE /api/notifications

# Admin
GET    /api/admin/stats
GET    /api/admin/users
PUT    /api/admin/users/:id/block
POST   /api/admin/users/:id/reset-password
GET    /api/admin/kyc
PUT    /api/admin/kyc/:id/approve
PUT    /api/admin/kyc/:id/reject
GET    /api/admin/subscriptions
PUT    /api/admin/subscription/:userId/activate
PUT    /api/admin/subscription/:userId/deactivate
GET    /api/admin/anomalies
POST   /api/admin/notifications
```

---

## 🖥️ Key Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Login with demo credentials |
| `/register` | Create new account |
| `/dashboard` | Main financial dashboard |
| `/expenses` | Expense CRUD management |
| `/income` | Income tracking |
| `/budget` | Category budget monitoring |
| `/analytics` | Charts & insights (premium: full) |
| `/ocr` | AI receipt scanner (premium) |
| `/ai-assistant` | AI chat + analysis (premium) |
| `/reports` | Download PDF/CSV (premium) |
| `/subscription` | eSewa payment & plan management |
| `/kyc` | Identity verification |
| `/notifications` | Real-time alerts |
| `/admin` | Admin dashboard |
| `/admin/users` | User management |
| `/admin/kyc` | KYC review & approval |
| `/admin/subscriptions` | Revenue tracking |
| `/admin/anomalies` | Fraud detection |

---

## 🏗️ Build for Production

```bash
# Build frontend
cd pems/frontend
npm run build

# Start backend in production
cd pems/backend
NODE_ENV=production npm start
```

---

## 💡 Viva Tips

**Q: What is PEMS?**
A: A subscription-based SaaS personal finance management platform built with MERN stack.

**Q: What is OCR?**
A: Optical Character Recognition — Tesseract.js reads text from receipt images and our parser extracts amount, date, category automatically.

**Q: How does eSewa integration work?**
A: User initiates payment → Backend generates signed form → User completes payment on eSewa → eSewa redirects with transaction data → Backend verifies signature → Premium activated.

**Q: How is JWT authentication implemented?**
A: User logs in → Backend creates signed JWT with user ID → Frontend stores in localStorage → Each API request sends JWT in Authorization header → Backend middleware verifies token.

**Q: What is Socket.IO used for?**
A: Real-time notifications — when budget is exceeded, KYC approved, or payment completed, the server emits events directly to the user's browser without page refresh.

---

## 📄 License

MIT License — Built for Final Year College Project

---

*Built with ❤️ using React.js, Node.js, MongoDB, Socket.IO, Tesseract.js OCR & eSewa Payment Gateway*
