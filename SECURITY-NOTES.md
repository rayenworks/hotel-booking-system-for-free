# Security notes

## What was fixed
- **Rate limiting is now ON**: 5 failed admin logins / 15 min, 5 booking requests / hour, 300 API requests / 15 min (per IP).
- **Double booking fixed**: bookings now have `createdAt` (it was missing, so pending bookings never blocked a room). A second check after saving catches two guests booking at the same moment. Confirming a booking also refuses overlaps.
- **helmet** security headers + a strict Content-Security-Policy (no inline scripts). The login script moved to `public/js/admin-login.js` for this reason.
- **Input validation everywhere** (`utils/validate.js` is now used): ids, dates, stay length (max 30 nights, max 365 days ahead), names, phones, guests, rooms, amenities. Blocks operator injection such as `{"room": {"$ne": null}}`.
- Room updates accept only 4 fields. Price always comes from `config/pricing.js`.
- Public room endpoints no longer reveal admin block notes.
- Auth: HS256 only, tokens last 8h (was 24h), a token stops working if the admin is deleted, constant-time login answer.
- Errors never reveal stack traces or file paths. JSON body limit 10kb. API responses are `no-store`.
- Dependencies updated (`npm audit`: 0 vulnerabilities).
- Dead code removed; `seed.js` now uses `bcryptjs` (it required a missing package).

## Before you deploy
1. On your host set `NODE_ENV=production` and `TRUST_PROXY=1` (Render, Heroku...). Without TRUST_PROXY the rate limits would treat all visitors as one person.
2. Create a NEW `JWT_SECRET` (command is in `.env.example`). Everyone gets logged out once, which is fine.
3. Old dev secrets exist in your public GitHub history (early `.env.example` commit). Make sure your live JWT_SECRET and admin password are different from those.
4. `npm run seed` needs `ADMIN_PASSWORD` (12+ chars). Delete it from `.env` afterwards.
5. Never share or commit `.env`.
6. Bookings created before this update have no `createdAt`, so old *pending* ones don't hold a room. Review or cancel them in the admin page.

## Known limits
- If two guests press "book" in the same instant, both may be told "no longer available" and must retry. They are never both accepted. A stronger guarantee needs a database transaction or per-night lock records.
- The admin token is kept in `localStorage`. The CSP and safe rendering protect it, but any future XSS bug would expose it.
