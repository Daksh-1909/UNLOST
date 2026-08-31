/**
 * UNLOST Automated Mailer Utility
 * Dispatches email notifications to Admin(s) when items are reported or updated.
 */

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
 * Initializes nodemailer transporter from environment variables
 */
function getTransporter() {
  if (!nodemailer) return null;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null; // SMTP credentials not configured
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Sends an email notification to Admin when a Lost or Found item is reported.
 * 
 * @param {Object} item The newly created Item document
 * @param {Object} reporter The User who submitted the report
 */
export async function sendAdminItemReportEmail(item, reporter) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || ADMIN_FALLBACK_EMAILS[0];
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const isLost = item.status === 'Lost';
    const statusColor = isLost ? '#ef4444' : '#10b981';
    const statusBg = isLost ? '#fee2e2' : '#d1fae5';
    const statusText = isLost ? 'LOST ITEM REPORT' : 'FOUND ITEM REPORT';
    const formattedDate = new Date(item.date || Date.now()).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const subject = `[UNLOST Alert] New ${item.status} Item: "${item.title}" Reported on Campus`;

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
    .btn-container { text-align: center; margin: 28px 0 16px; }
    .btn { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 10px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); }
    .footer { padding: 18px 24px; text-align: center; background-color: #0f172a; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>UNLOST Management Alert</h1>
      <p>Parul University Smart Lost & Found System</p>
    </div>
    <div class="content">
      <span class="badge">${statusText}</span>
      <h2 class="item-title">${escapeHtml(item.title)}</h2>
      
      <div class="description-box">
        <strong>Description:</strong><br/>
        ${escapeHtml(item.description)}
      </div>

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
      <p>This is an automated administrative notification sent by UNLOST System.</p>
      <p>&copy; ${new Date().getFullYear()} UNLOST - Parul University</p>
    </div>
  </div>
</body>
</html>
`;

    const transporter = getTransporter();
    if (transporter) {
      const info = await transporter.sendMail({
        from: `"UNLOST Alert" <${process.env.SMTP_USER || process.env.GMAIL_USER || 'no-reply@unlost.com'}>`,
        to: adminEmail,
        subject,
        html: htmlContent
      });
      console.log(`[MAILER] Admin notification email sent successfully to ${adminEmail}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      // SMTP not configured - log cleanly to console for local dev/demo
      console.log(`\n========================================`);
      console.log(`[MAILER SIMULATION] Admin Email Triggered:`);
      console.log(`To: ${adminEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Item: [${item.status}] ${item.title} at ${item.location}`);
      console.log(`Reporter: ${reporter?.email || item.reporter_email}`);
      console.log(`Tip: Configure SMTP_USER and SMTP_PASS in backend/.env to enable live email delivery.`);
      console.log(`========================================\n`);
      return { success: true, simulated: true };
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

export default {
  sendAdminItemReportEmail
};
