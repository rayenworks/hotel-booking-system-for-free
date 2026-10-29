link :https://hotel-booking-system-for-free.onrender.com/



<img width="598" height="384" alt="{27133BBA-109D-4A8D-9DB1-EF875CDAB326}" src="https://github.com/user-attachments/assets/6ac512ab-6901-410e-aa67-7216cb15d4df" />

# 🛡️ Hotel Booking System — Security & Bot Protection Update

This update introduces robust security measures, rate limiting, and automated bot mitigation to protect the hotel booking pipeline against automated abuse, brute-force attacks, credential stuffing, and Distributed Denial of Service (DDoS) attempts.

---

## 🚀 Key Improvements

- **Adaptive Rate Limiting:** Dynamic request throttling based on client IP, session behavior, and route sensitivity.
- **Bot Attack Mitigation:** Automated detection and blocking of malicious scrapers, automated booking bots, and carding attempts.
- **API & Route Hardening:** Strict request validation, headers sanitization, and CORS enforcement.
- **DDoS & Scraping Resilience:** Protects inventory visibility and checkout flows from high-frequency automated requests without affecting real guests.

---

## 🔒 Security Architecture

```text
[ Incoming Request ]
         │
         ▼
 🛡️  WAF / Reverse Proxy (Cloudflare / Nginx / Render)
         │  ├── IP Reputation & GEO Fencing
         │  └── Web Application Firewall
         ▼
 ⏱️  Rate Limiter Layer (Redis Token Bucket / Leaky Bucket)
         │  ├── Public Routes (Room Listing, Search)
         │  ├── Sensitive Routes (Auth, OTP)
         │  └── Critical Routes (Checkout, Reservation)
         ▼
 🤖  Bot Detection Engine
         │  ├── User-Agent & Fingerprinting Check
         │  ├── Behavioral Scoring (Honeypots, CAPTCHA trigger)
         │  └── Attack Signature Filters
         ▼
 🏨  Hotel Booking Application Core


## Desktop mode

The Hotel Booking System can now run as a Windows desktop app, with no browser or Node.js needed.

### Install
1. Download **Hotel Booking System Setup 1.0.0.exe** below.
2. Run it. If Windows shows "Windows protected your PC", click **More info** → **Run anyway** (the app is not code-signed yet).
3. On first launch, a settings file opens in Notepad. Paste your MongoDB Atlas connection string into the `MONGO_URI` line, save, and open the app again.

### Requirements
- Windows 10 or 11 (64-bit)
- Internet connection and a MongoDB Atlas database
- An admin account, created once with `npm run seed` from the source code

### Other changes
- Replaced `bcrypt` with `bcryptjs`, so no C++ build tools are needed (existing admin passwords still work)
- Security updates: rate limiting, input validation and security headers
