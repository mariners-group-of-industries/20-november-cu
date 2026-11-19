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
  NodeQRCode = require('D:/2nd November/node_modules/qrcode');
} catch (e) {
  console.warn('QRCode module not loaded:', e.message);
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
          const { fullName, mobileNumber, department, batch, shortAddress, visitDate, visitTimeSlot, customTime } = data;

          if (!fullName || fullName.trim().length < 2) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Please enter your full legal name.' }));
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

  // Static File Serving
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
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
