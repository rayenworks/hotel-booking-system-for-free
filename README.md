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
