# 20-november-cu

> **Chittagong University Day 2026 • Official Alumni Gift Pass & Head Office Visit Reservation Platform**  
> Sponsored by **Biniyog Club** & **Mariners Group Ecosystem**

[![Firebase Hosting](https://img.shields.io/badge/Firebase_Hosting-Live-0284c7?logo=firebase)](https://november-cu.web.app)
[![Admin Portal](https://img.shields.io/badge/Admin_Portal-Protected-10b981)](https://november-cu.web.app/admin)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js)](https://nodejs.org)

---

## 🌐 Live URLs

* **Public Registration Portal**: [https://november-cu.web.app](https://november-cu.web.app)  
  *(Alternative domain: [https://november-cu.firebaseapp.com](https://november-cu.firebaseapp.com))*
* **Admin Management Dashboard**: [https://november-cu.web.app/admin](https://november-cu.web.app/admin)  
  *(Credentials: Username `admin` / Password `amdin2244`)*

---

## 📌 Key Capabilities

1. **Digital VIP Gift Pass Generation**:
   * Collect Gift at Event: **Friends Club Field, Sector 3, Uttara, Dhaka**.
   * Committed Head Office Visit: **10th Floor, MG SAM Center, 12 Bir Uttam AK Khandakar Rd, Mohakhali C/A, Dhaka 1212**.
2. **Valid Schedule**:
   * **14 Selectable Working Days**: From Saturday, 21 November 2026 to Sunday, 06 December 2026.
   * **Fridays Strictly Excluded**: Head Office closed on 27 Nov and 04 Dec 2026.
   * **2-Hour Slot Intervals**: Between 9:30 AM and 6:00 PM (plus Custom Time input).
3. **Dynamic QR Code**:
   * Instant QR code generated on the pass with reference ID, guest details, and office Google Maps navigation link.
   * Downloadable as high-res branded PNG pass.
4. **Automated Instant Email Notifications**:
   * Dispatched automatically via Titan Email SMTP (`smtp.titan.email:465`) using `it1@marinersgroup.com.bd`.
   * Complete guest profile and visit schedule delivered directly to administration upon form submission.
5. **Administrative Portal (`/admin`)**:
   * Protected login with secure session storage.
   * Live statistics cards: Total Bookings, Today's Bookings, Top Visit Date.
   * Real-time search by Name, Phone, Reference ID, Department, or Batch.
   * Date & time slot filtering.
   * **One-Click Export to Excel (CSV)** formatted with UTF-8 BOM.
   * Individual digital voucher & QR code inspection.

---

## 🚀 Local Development

```bash
# Clone the repository
git clone https://github.com/mariners-group-of-industries/20-november-cu.git
cd 20-november-cu

# Install dependencies
npm install

# Start local server (Runs at http://localhost:3001)
npm start
```

---

## ☁️ Firebase Deployment

```bash
# Deploy latest web app and admin rewrites to Firebase Hosting
firebase deploy --only hosting
```

---

## 📄 License & Attribution

© 2026 **Biniyog Club** & **Mariners Group**. All rights reserved.
Corporate Brochure: [https://brochure.marinersgroupbd.com/](https://brochure.marinersgroupbd.com/)
