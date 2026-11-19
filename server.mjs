import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3001;

let NodeQRCode = null;
try {
  NodeQRCode = require('qrcode');
} catch (e) {
  try {
    NodeQRCode = require('D:/2nd November/node_modules/qrcode');
  } catch (err) {
    console.warn('QRCode module not loaded:', err.message);
  }
}

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  try {
    nodemailer = require('D:/2nd November/node_modules/nodemailer');
  } catch (err) {
    console.warn('Nodemailer module not loaded:', err.message);
  }
}

// SMTP Configuration (it1@marinersgroup.com.bd via Titan Email / Hostinger)
const SMTP_CONFIG = {
  host: 'smtp.titan.email',
  port: 465,
  secure: true,
  auth: {
    user: 'it1@marinersgroup.com.bd',
    pass: 'ITmgMAIL@!1'
  },
  tls: { rejectUnauthorized: false }
};

let mailTransporter = null;
if (nodemailer) {
  try {
    mailTransporter = nodemailer.createTransport(SMTP_CONFIG);
    console.log('[Email] Nodemailer configured for it1@marinersgroup.com.bd');
  } catch (err) {
    console.warn('[Email] Transporter error:', err.message);
  }
}

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'gift_bookings.json');

// Ensure data folder and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf8');
}

function getBookings() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveBookings(bookings) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(bookings, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save bookings:', e);
  }
}

// Firebase Firestore Cloud Sync
const FIREBASE_API_KEY = "AIzaSyB1oGyyF-ZQyC5MiIV1VkMq3iFTTr4UTuk";
const FIREBASE_PROJECT_ID = "november-cu";

async function syncToFirebaseFirestore(booking) {
  try {
    const docId = booking.referenceNo;
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/gift_bookings?documentId=${docId}&key=${FIREBASE_API_KEY}`;
    
    const fields = {};
    for (const [key, val] of Object.entries(booking)) {
      if (val === undefined || val === null || key === 'qrCodeDataUrl') continue;
      if (typeof val === 'string') fields[key] = { stringValue: val };
      else if (typeof val === 'number') fields[key] = { integerValue: String(val) };
      else if (typeof val === 'boolean') fields[key] = { booleanValue: val };
    }
    fields.serverSyncedAt = { timestampValue: new Date().toISOString() };

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    }).then(r => {
      if (r.ok) {
        console.log(`[Firebase Firestore] Synced booking ${docId} successfully.`);
      } else if (r.status === 403) {
        console.log(`[Firebase Firestore] Note: Firestore API/Database pending creation in Firebase Console.`);
      }
    }).catch(() => {});
  } catch (e) {}
}

function formatVerbalDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const mIdx = parseInt(parts[1], 10) - 1;
    return `${parts[2]} ${monthNames[mIdx] || parts[1]} ${parts[0]}`;
  }
  return dateStr;
}

// Send Instant Email Notification to it1@marinersgroup.com.bd
async function sendBookingNotificationEmail(booking) {
  if (!mailTransporter) {
    console.warn('[Email] Transporter not ready, skipping email notification.');
    return;
  }

  const verbalDate = formatVerbalDate(booking.visitDate);
  const subject = `🎁 New CU Alumni Gift Pass: ${booking.fullName} (${booking.referenceNo})`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%); color: #ffffff; padding: 24px; text-align: center; }
        .badge { display: inline-block; background: #38bdf8; color: #082f49; font-weight: bold; font-size: 11px; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
        .title { margin: 0; font-size: 20px; font-weight: 800; }
        .subtitle { margin: 4px 0 0; font-size: 12px; opacity: 0.9; }
        .content { padding: 24px; }
        .ref-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .ref-label { font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; }
        .ref-val { font-size: 20px; font-weight: 800; color: #15803d; font-family: monospace; }
        .table-data { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table-data td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .table-data td.lbl { width: 38%; font-weight: 600; color: #64748b; background: #f8fafc; }
        .table-data td.val { font-weight: 700; color: #0f172a; }
        .highlight-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 14px; margin-bottom: 20px; }
        .highlight-title { font-size: 11px; font-weight: 700; color: #0369a1; text-transform: uppercase; margin-bottom: 6px; }
        .highlight-text { font-size: 13px; font-weight: 700; color: #0c4a6e; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <span class="badge">Official Registration Alert</span>
          <h1 class="title">CU Alumni Day 2026 Gift Pass</h1>
          <p class="subtitle">Chittagong University Alumni Society Uttara &amp; Biniyog Club</p>
        </div>
        <div class="content">
          <div class="ref-box">
            <div>
              <div class="ref-label">Pass Reference ID</div>
              <div class="ref-val">${booking.referenceNo}</div>
            </div>
            <div style="text-align: right;">
              <span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold;">Confirmed</span>
            </div>
          </div>

          <table class="table-data">
            <tr>
              <td class="lbl">Alumnus Name</td>
              <td class="val">${booking.fullName}</td>
            </tr>
            <tr>
              <td class="lbl">Mobile Number</td>
              <td class="val"><a href="tel:${booking.mobileNumber}" style="color: #0284c7; text-decoration: none;">${booking.mobileNumber}</a></td>
            </tr>
            <tr>
              <td class="lbl">Occupation / Profession</td>
              <td class="val">${booking.occupation || 'Not specified'}</td>
            </tr>
            <tr>
              <td class="lbl">Department / Faculty</td>
              <td class="val">${booking.department || 'Not specified'}</td>
            </tr>
            <tr>
              <td class="lbl">Batch</td>
              <td class="val">${booking.batch ? 'Batch ' + booking.batch : 'Not specified'}</td>
            </tr>
            <tr>
              <td class="lbl">Address / Workplace</td>
              <td class="val">${booking.shortAddress || 'Not specified'}</td>
            </tr>
            <tr>
              <td class="lbl">Confirmed Visit Date</td>
              <td class="val" style="color: #0284c7; font-weight: 800;">${booking.visitDate} (${verbalDate})</td>
            </tr>
            <tr>
              <td class="lbl">Preferred Time Slot</td>
              <td class="val">${booking.visitTimeSlot}</td>
            </tr>
            <tr>
              <td class="lbl">Registered At</td>
              <td class="val" style="font-size: 11px; font-family: monospace;">${booking.createdAt}</td>
            </tr>
          </table>

          <div class="highlight-box">
            <div class="highlight-title">🎁 Gift Collection Point (At Event)</div>
            <div class="highlight-text">Friends Club Field, Sector 3, Uttara, Dhaka</div>
            <div class="highlight-title" style="margin-top: 10px;">🏢 Committed Head Office Visit Destination</div>
            <div class="highlight-text">10th Floor, MG SAM Center, 12 Bir Uttam AK Khandakar Rd, Mohakhali, Dhaka 1212</div>
          </div>
        </div>
        <div class="footer">
          This notification was automatically dispatched to <strong>it1@marinersgroup.com.bd</strong> upon registration.<br>
          © 2026 Biniyog Club &amp; Mariners Group Ecosystem
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await mailTransporter.sendMail({
      from: '"CU Alumni Gift Notification" <it1@marinersgroup.com.bd>',
      to: 'it1@marinersgroup.com.bd',
      replyTo: 'it1@marinersgroup.com.bd',
      subject,
      text: `New CU Alumni Gift Pass: ${booking.fullName} (${booking.referenceNo})\nMobile: ${booking.mobileNumber}\nOccupation: ${booking.occupation || 'N/A'}\nVisit Date: ${booking.visitDate} (${verbalDate})\nTime Slot: ${booking.visitTimeSlot}\nDept: ${booking.department || 'N/A'}\nBatch: ${booking.batch || 'N/A'}\nLocation: 10th Floor, MG SAM Center, Mohakhali`,
      html
    });
    console.log(`[Email] Notification delivered to it1@marinersgroup.com.bd (Message ID: ${info.messageId})`);
  } catch (err) {
    console.error(`[Email] Failed to send notification email:`, err.message);
  }
}

// Permanent Supabase Email Queue Listener & Dispatched Fail-Safe
const SUPABASE_URL = 'https://avbqkacuvowqkmxknicu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2YnFrYWN1dm93cWtteGtuaWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzA3MDUzNCwiZXhwIjoyMTA4NjQ2NTM0fQ.Lplfj0I9rP3K88zYCbRG80Ot1ntb19VLnixWN5S2tTs';

let isProcessing = false;
async function processUnsentSupabaseEmails() {
  if (isProcessing) return;
  isProcessing = true;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/registrations?guest_category=eq.CU%20Alumni%20Day%202026&email_sent=eq.false&select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!res.ok) return;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return;

    for (const r of rows) {
      console.log(`[Fail-Safe Daemon] Found unsent registration: ${r.reference_no} (${r.full_name})`);
      let parsedNotes = {};
      try { parsedNotes = JSON.parse(r.notes || '{}'); } catch (e) {}

      const parts = (r.additional_requirements || '').split('|').map(s => s.trim());
      const booking = {
        referenceNo: r.reference_no,
        fullName: r.full_name,
        mobileNumber: r.mobile_number,
        occupation: parsedNotes.occupation || '',
        department: parsedNotes.department || '',
        batch: parsedNotes.batch || '',
        shortAddress: r.organization || '',
        visitDate: parsedNotes.visitDate || parts[0] || '2026-11-22',
        visitTimeSlot: parsedNotes.visitTimeSlot || parts[1] || '09:30 AM – 11:30 AM',
        createdAt: r.created_at
      };

      await sendBookingNotificationEmail(booking);

      // Mark email_sent = true in Supabase immediately
      await fetch(`${SUPABASE_URL}/rest/v1/registrations?id=eq.${r.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ email_sent: true, email_error: null })
      });
      console.log(`[Fail-Safe Daemon] Marked ${r.reference_no} email_sent = true in Supabase.`);
    }
  } catch (err) {
    console.warn('[Fail-Safe Daemon] Poll error:', err.message);
  } finally {
    isProcessing = false;
  }
}

// Start continuous fail-safe polling every 3 seconds
setInterval(processUnsentSupabaseEmails, 3000);
setTimeout(processUnsentSupabaseEmails, 1000);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = reqUrl.pathname;

  // Handle API route: /api/gift
  if (pathname === '/api/gift') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const data = JSON.parse(body || '{}');
          const { fullName, mobileNumber, occupation, department, batch, shortAddress, visitDate, visitTimeSlot, customTime } = data;

          if (!fullName || fullName.trim().length < 2) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Please enter your full name.' }));
            return;
          }

          const cleanMobile = (mobileNumber || '').replace(/[\s-]/g, '');
          if (!cleanMobile || cleanMobile.length < 11) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Please enter a valid 11-digit mobile number.' }));
            return;
          }

          if (!visitDate) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Please select your preferred visit date.' }));
            return;
          }

          if (visitDate < '2026-11-21' || visitDate > '2026-12-06') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Visit date must be strictly between 21/11/2026 and 06/12/2026.' }));
            return;
          }

          if (visitDate === '2026-11-27' || visitDate === '2026-12-04') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Head office is closed on Fridays. Please choose a visit date from Saturday to Thursday.' }));
            return;
          }

          const timeSlot = (customTime && customTime.trim()) || (visitTimeSlot && visitTimeSlot.trim()) || '09:30 AM – 11:30 AM';
          const refNo = `GIFT-${Math.floor(1000 + Math.random() * 9000)}`;

          // Generate QR code data URL
          let qrDataUrl = '';
          if (NodeQRCode) {
            try {
              const qrPayload = JSON.stringify({
                ref: refNo,
                name: fullName.trim(),
                phone: cleanMobile,
                date: visitDate,
                time: timeSlot,
                event: 'CU Alumni Day 2026 Gift Pass',
                pickup: 'Friends Club Field, Sector 3, Uttara, Dhaka',
                office: '10th Floor, MG SAM Center, Mohakhali, Dhaka',
                map: 'https://maps.app.goo.gl/83ZSDuxA7xWiMV7b9'
              });
              qrDataUrl = await NodeQRCode.toDataURL(qrPayload, {
                width: 280,
                margin: 1,
                color: { dark: '#0c4a6e', light: '#ffffff' }
              });
            } catch (qrErr) {
              console.error('QR generation error in server:', qrErr);
            }
          }

          const booking = {
            id: 'bk_' + Date.now(),
            referenceNo: refNo,
            fullName: fullName.trim(),
            mobileNumber: cleanMobile,
            occupation: occupation ? occupation.trim() : undefined,
            department: department ? department.trim() : undefined,
            batch: batch ? batch.trim() : undefined,
            shortAddress: shortAddress ? shortAddress.trim() : undefined,
            visitDate,
            visitTimeSlot: timeSlot,
            customTime: customTime ? customTime.trim() : undefined,
            qrCodeDataUrl: qrDataUrl,
            status: 'confirmed',
            createdAt: new Date().toISOString()
          };

          const bookings = getBookings();
          bookings.unshift(booking);
          saveBookings(bookings);

          // Asynchronously sync to Firebase Firestore
          syncToFirebaseFirestore(booking);

          // Asynchronously dispatch Email Notification to it1@marinersgroup.com.bd
          sendBookingNotificationEmail(booking);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Head office visit booking confirmed! Show this pass to claim your gift.',
            booking
          }));
        } catch (err) {
          console.error('Server error handling /api/gift:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid request payload or server error: ' + (err.message || err) }));
        }
      });
      return;
    } else if (req.method === 'GET') {
      const bookings = getBookings();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: bookings.length, bookings }));
      return;
    }
  }

  // Handle Static File Serving & Admin Route Rewrites
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  } else if (pathname === '/admin') {
    pathname = '/admin.html';
  }

  const filePath = path.join(__dirname, pathname);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const indexPath = path.join(__dirname, 'index.html');
      fs.readFile(indexPath, (err2, data) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`CU Alumni Gift Booking Server running at http://localhost:${PORT}`);
});
