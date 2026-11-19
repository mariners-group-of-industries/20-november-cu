import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

// Supabase Cloud DB Config (Mariners Group Production DB)
const SUPABASE_URL = 'https://avbqkacuvowqkmxknicu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2YnFrYWN1dm93cWtteGtuaWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzA3MDUzNCwiZXhwIjoyMTA4NjQ2NTM0fQ.Lplfj0I9rP3K88zYCbRG80Ot1ntb19VLnixWN5S2tTs';

// Titan Email Fresh Transporter Factory (No persistent pool in serverless)
function getFreshTransporter(port = 465) {
  return nodemailer.createTransport({
    host: 'smtp.titan.email',
    port,
    secure: port === 465,
    auth: {
      user: 'it1@marinersgroup.com.bd',
      pass: 'ITmgMAIL@!1'
    },
    tls: { rejectUnauthorized: false },
    pool: false, // CRITICAL: Disable pool in serverless to prevent stale socket reuse
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000
  });
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

async function sendNotificationEmail(booking) {
  const verbalDate = formatVerbalDate(booking.visitDate);
  const subject = `🎁 New CU Alumni Gift Registration: ${booking.fullName} (${booking.referenceNo})`;

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

  // Attempt 1: Port 465 (SSL) with fresh connection
  let t465 = null;
  try {
    t465 = getFreshTransporter(465);
    const info = await t465.sendMail({
      from: '"CU Alumni Gift Notification" <it1@marinersgroup.com.bd>',
      to: 'it1@marinersgroup.com.bd',
      replyTo: 'it1@marinersgroup.com.bd',
      subject,
      text: `New CU Alumni Gift Pass: ${booking.fullName} (${booking.referenceNo})\nMobile: ${booking.mobileNumber}\nOccupation: ${booking.occupation || 'N/A'}\nVisit Date: ${booking.visitDate} (${verbalDate})\nTime Slot: ${booking.visitTimeSlot}\nDept: ${booking.department || 'N/A'}\nBatch: ${booking.batch || 'N/A'}\nLocation: 10th Floor, MG SAM Center, Mohakhali`,
      html
    });
    console.log(`[Email] Notification delivered via port 465 (ID: ${info.messageId})`);
    try { t465.close(); } catch (e) {}
    await markSupabaseEmailSent(booking.referenceNo);
    return { sent: true, port: 465, messageId: info.messageId };
  } catch (err465) {
    if (t465) { try { t465.close(); } catch (e) {} }
    console.warn('[Email] Port 465 failed, trying port 587 STARTTLS...', err465.message);

    // Attempt 2: Port 587 (STARTTLS) with fresh connection
    let t587 = null;
    try {
      t587 = getFreshTransporter(587);
      const info2 = await t587.sendMail({
        from: '"CU Alumni Gift Notification" <it1@marinersgroup.com.bd>',
        to: 'it1@marinersgroup.com.bd',
        replyTo: 'it1@marinersgroup.com.bd',
        subject,
        text: `New CU Alumni Gift Pass: ${booking.fullName} (${booking.referenceNo})\nMobile: ${booking.mobileNumber}\nOccupation: ${booking.occupation || 'N/A'}\nVisit Date: ${booking.visitDate} (${verbalDate})\nTime Slot: ${booking.visitTimeSlot}\nDept: ${booking.department || 'N/A'}\nBatch: ${booking.batch || 'N/A'}\nLocation: 10th Floor, MG SAM Center, Mohakhali`,
        html
      });
      console.log(`[Email] Notification delivered via port 587 (ID: ${info2.messageId})`);
      try { t587.close(); } catch (e) {}
      await markSupabaseEmailSent(booking.referenceNo);
      return { sent: true, port: 587, messageId: info2.messageId };
    } catch (err587) {
      if (t587) { try { t587.close(); } catch (e) {} }
      console.error('[Email] Port 587 also failed:', err587.message);
      return { sent: false, error465: err465.message, error587: err587.message };
    }
  }
}

async function markSupabaseEmailSent(refNo) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/registrations?reference_no=eq.${encodeURIComponent(refNo)}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ email_sent: true })
    });
  } catch (e) {}
}

async function saveToSupabase(booking) {
  try {
    const row = {
      reference_no: booking.referenceNo,
      full_name: booking.fullName,
      mobile_number: booking.mobileNumber,
      guest_category: 'CU Alumni Day 2026',
      organization: booking.shortAddress || 'Uttara, Dhaka',
      designation: booking.occupation
        ? `${booking.occupation} • CU Alumni (Batch ${booking.batch || 'N/A'}, Dept: ${booking.department || 'N/A'})`
        : `CU Alumni (Batch ${booking.batch || 'N/A'}, Dept: ${booking.department || 'N/A'})`,
      additional_requirements: `${booking.visitDate} | ${booking.visitTimeSlot}`,
      status: 'approved',
      email_sent: false,
      notes: JSON.stringify({
        event: 'cu_alumni_gift_2026',
        visitDate: booking.visitDate,
        visitTimeSlot: booking.visitTimeSlot,
        occupation: booking.occupation,
        department: booking.department,
        batch: booking.batch,
        shortAddress: booking.shortAddress,
        createdAt: booking.createdAt,
        qrCodeDataUrl: booking.qrCodeDataUrl
      })
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/registrations`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(row)
    });

    if (res.ok) {
      console.log(`[Supabase] Saved booking ${booking.referenceNo}`);
    } else {
      console.warn(`[Supabase] Save failed: ${res.status}`);
    }
  } catch (err) {
    console.warn('[Supabase] Save error:', err.message);
  }
}

async function fetchFromSupabase() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/registrations?guest_category=eq.CU%20Alumni%20Day%202026&order=created_at.desc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map(r => {
      let notes = {};
      try { notes = JSON.parse(r.notes || '{}'); } catch (e) {}
      return {
        id: r.id,
        referenceNo: r.reference_no,
        fullName: r.full_name,
        mobileNumber: r.mobile_number,
        occupation: notes.occupation || '',
        department: notes.department || '',
        batch: notes.batch || '',
        shortAddress: notes.shortAddress || r.organization || '',
        visitDate: notes.visitDate || '',
        visitTimeSlot: notes.visitTimeSlot || '',
        status: 'confirmed',
        createdAt: notes.createdAt || r.created_at,
        qrCodeDataUrl: notes.qrCodeDataUrl || ''
      };
    });
  } catch (err) {
    console.warn('[Supabase] Fetch error:', err.message);
    return [];
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const { fullName, mobileNumber, occupation, department, batch, shortAddress, visitDate, visitTimeSlot, customTime } = data;

      if (!fullName || fullName.trim().length < 2) {
        return res.status(400).json({ success: false, error: 'Please enter your full legal name.' });
      }

      const cleanMobile = (mobileNumber || '').replace(/[\s-]/g, '');
      if (!cleanMobile || cleanMobile.length < 11) {
        return res.status(400).json({ success: false, error: 'Please enter a valid 11-digit mobile number.' });
      }

      if (!visitDate) {
        return res.status(400).json({ success: false, error: 'Please select your preferred visit date.' });
      }

      if (visitDate < '2026-11-21' || visitDate > '2026-12-06') {
        return res.status(400).json({ success: false, error: 'Visit date must be between 21/11/2026 and 06/12/2026.' });
      }

      if (visitDate === '2026-11-27' || visitDate === '2026-12-04') {
        return res.status(400).json({ success: false, error: 'Head office is closed on Fridays. Please select Saturday to Thursday.' });
      }

      const timeSlot = (customTime && customTime.trim()) || (visitTimeSlot && visitTimeSlot.trim()) || '09:30 AM – 11:30 AM';
      const refNo = `GIFT-${Math.floor(1000 + Math.random() * 9000)}`;

      // Generate QR Code data URL
      let qrDataUrl = '';
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
        qrDataUrl = await QRCode.toDataURL(qrPayload, {
          width: 280,
          margin: 1,
          color: { dark: '#0c4a6e', light: '#ffffff' }
        });
      } catch (qrErr) {
        console.warn('QR generation error:', qrErr);
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

      // 1. Save to Supabase Cloud Database
      await saveToSupabase(booking);

      // 2. Dispatch Email Notification immediately to it1@marinersgroup.com.bd
      const emailStatus = await sendNotificationEmail(booking);

      return res.status(200).json({
        success: true,
        message: 'Head office visit booking confirmed! Show this pass to claim your gift.',
        booking,
        emailStatus
      });
    } catch (err) {
      console.error('API Error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Server error' });
    }
  } else if (req.method === 'GET') {
    try {
      const bookings = await fetchFromSupabase();
      return res.status(200).json({ success: true, count: bookings.length, bookings });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
