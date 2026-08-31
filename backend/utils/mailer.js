import User from '../models/User.js';

// Try importing nodemailer dynamically if installed
let nodemailer = null;
try {
  const mod = await import('nodemailer');
  nodemailer = mod.default || mod;
} catch (e) {
  // nodemailer not installed yet, mailer will log simulation
}

const ADMIN_FALLBACK_EMAILS = [
  'shlokapatel20@gmail.com',
  'rudraprajapati1819@gmail.com',
  'admin@unlost.com'
];

/**
 * Initializes nodemailer transporter for Gmail / SMTP
 */
function getTransporter() {
  if (!nodemailer) {
    console.warn('[MAILER] Nodemailer module is not loaded.');
    return null;
  }

  const user = (process.env.GMAIL_USER || process.env.SMTP_USER || process.env.EMAIL_USER || process.env.ADMIN_EMAIL || '').trim();
  const rawPass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim();
  const pass = rawPass.replace(/\s+/g, ''); // Google App Passwords often contain spaces (e.g. "abcd efgh ijkl mnop")

  if (!user || !pass) {
    console.warn('[MAILER] Missing GMAIL_USER or GMAIL_APP_PASSWORD in backend/.env.');
    return null;
  }

  // Standard Gmail Transport
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass
    }
  });
}

/**
 * Sends an email notification to ALL Admins when a Lost or Found item is reported.
 * 
 * @param {Object} item The newly created Item document
 * @param {Object} reporter The User who submitted the report
 */
export async function sendAdminItemReportEmail(item, reporter) {
  try {
    // 1. Gather all admin emails from config, env, and database
    const adminSet = new Set(ADMIN_FALLBACK_EMAILS.map(e => e.toLowerCase().trim()));
    if (process.env.ADMIN_EMAIL) {
      adminSet.add(process.env.ADMIN_EMAIL.toLowerCase().trim());
    }

    try {
      const dbAdmins = await User.find({
        $or: [{ role: 'admin' }, { is_admin: true }]
      }).lean();
      dbAdmins.forEach(u => {
        if (u.email) adminSet.add(u.email.toLowerCase().trim());
      });
    } catch (dbErr) {
      console.warn('[MAILER] Could not fetch DB admins, using static list:', dbErr.message);
    }

    const recipientEmails = Array.from(adminSet);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const isLost = item.status === 'Lost';
    const statusColor = isLost ? '#ef4444' : '#10b981';
    const statusBg = isLost ? '#fee2e2' : '#d1fae5';
    const statusText = isLost ? 'LOST ITEM REPORT' : 'FOUND ITEM REPORT';
    const formattedDate = new Date(item.date || Date.now()).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const subject = `[UNLOST Admin Alert] New ${item.status} Item: "${item.title}" Reported on Campus`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0f172a; color: #e2e8f0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 14px; }
    .content { padding: 28px 24px; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 700; background-color: ${statusBg}; color: ${statusColor}; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    .item-title { font-size: 22px; font-weight: 700; color: #f8fafc; margin-top: 0; margin-bottom: 12px; }
    .details-table { width: 100%; border-collapse: collapse; margin: 18px 0; background-color: #0f172a; border-radius: 12px; overflow: hidden; }
    .details-table td { padding: 12px 16px; border-bottom: 1px solid #1e293b; font-size: 14px; }
    .details-table td.label { font-weight: 600; color: #94a3b8; width: 35%; }
    .details-table td.value { color: #f1f5f9; }
    .details-table tr:last-child td { border-bottom: none; }
    .description-box { background-color: #0f172a; border-left: 4px solid #6366f1; padding: 14px 16px; border-radius: 4px; margin: 16px 0; font-size: 14px; line-height: 1.5; color: #cbd5e1; }
    .image-preview { margin: 16px 0; text-align: center; background-color: #0f172a; border-radius: 12px; padding: 12px; border: 1px solid #334155; }
    .image-preview img { max-width: 100%; max-height: 250px; border-radius: 8px; object-fit: contain; }
    .btn-container { text-align: center; margin: 28px 0 16px; }
    .btn { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 10px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); }
    .footer { padding: 18px 24px; text-align: center; background-color: #0f172a; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>UNLOST Administrative Alert</h1>
      <p>Parul University Smart Lost & Found System</p>
    </div>
    <div class="content">
      <span class="badge">${statusText}</span>
      <h2 class="item-title">${escapeHtml(item.title)}</h2>
      
      <div class="description-box">
        <strong>Description:</strong><br/>
        ${escapeHtml(item.description)}
      </div>

      ${item.image_file ? `
      <div class="image-preview">
        <p style="margin: 0 0 8px; font-size: 12px; color: #94a3b8;">Item Attachment:</p>
        <img src="${item.image_file.startsWith('data:') ? item.image_file : `${clientUrl}/static/uploads/${item.image_file}`}" alt="Reported Item" />
      </div>
      ` : ''}

      <table class="details-table">
        <tr>
          <td class="label">Category:</td>
          <td class="value">${escapeHtml(item.category)}</td>
        </tr>
        <tr>
          <td class="label">Campus Location:</td>
          <td class="value">${escapeHtml(item.location)}</td>
        </tr>
        <tr>
          <td class="label">Date Reported:</td>
          <td class="value">${formattedDate}</td>
        </tr>
        <tr>
          <td class="label">Reported By:</td>
          <td class="value">${escapeHtml(reporter?.email || item.reporter_email || 'Anonymous User')}</td>
        </tr>
        <tr>
          <td class="label">Contact Info:</td>
          <td class="value">${escapeHtml(item.contact_info || 'N/A')}</td>
        </tr>
      </table>

      <div class="btn-container">
        <a href="${clientUrl}/admin" class="btn" target="_blank">Open in Admin Dashboard</a>
      </div>
    </div>
    <div class="footer">
      <p>This automated alert was dispatched to all administrators (${recipientEmails.length} active admins).</p>
      <p>&copy; ${new Date().getFullYear()} UNLOST - Parul University</p>
    </div>
  </div>
</body>
</html>
`;

    const transporter = getTransporter();
    if (transporter) {
      const info = await transporter.sendMail({
        from: `"UNLOST Alert System" <${process.env.SMTP_USER || process.env.GMAIL_USER || 'no-reply@unlost.com'}>`,
        to: recipientEmails.join(', '),
        subject,
        html: htmlContent
      });
      console.log(`[MAILER] Admin notification email sent to ${recipientEmails.join(', ')}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId, recipients: recipientEmails };
    } else {
      // SMTP not configured - log simulation cleanly with all recipients
      console.log(`\n========================================`);
      console.log(`[MAILER] Dispatched to ALL Admins (${recipientEmails.length} recipients):`);
      console.log(`Recipients: ${recipientEmails.join(', ')}`);
      console.log(`Subject: ${subject}`);
      console.log(`Item: [${item.status}] ${item.title} (${item.category}) at ${item.location}`);
      console.log(`Reporter: ${reporter?.email || item.reporter_email}`);
      console.log(`Note: Configure SMTP_USER and SMTP_PASS in backend/.env for live SMTP delivery.`);
      console.log(`========================================\n`);
      return { success: true, simulated: true, recipients: recipientEmails };
    }
  } catch (error) {
    console.error('[MAILER ERROR] Failed to send admin email notification:', error.message);
    return { success: false, error: error.message };
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendTestAdminEmail() {
  const dummyItem = {
    title: 'Test Notification - Blue Lenovo Laptop',
    description: 'This is a test notification to verify that all administrators receive email notifications correctly via Gmail.',
    category: 'Electronics',
    location: 'Central Library, 2nd Floor',
    status: 'Found',
    date: new Date(),
    reporter_email: 'test.student@paruluniversity.ac.in',
    contact_info: '+91 9876543210'
  };
  const dummyReporter = {
    email: 'test.student@paruluniversity.ac.in',
    username: 'Test Student'
  };
  return await sendAdminItemReportEmail(dummyItem, dummyReporter);
}

export default {
  sendAdminItemReportEmail,
  sendTestAdminEmail
};


