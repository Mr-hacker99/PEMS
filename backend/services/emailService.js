const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`📧 Email skipped (no config): To=${to}, Subject=${subject}`);
      return true;
    }
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"PEMS System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Email error: ${error.message}`);
    return false;
  }
};

// Email templates
exports.sendVerificationEmail = async (user, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify Your PEMS Account',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9f9f9;border-radius:8px;">
        <h2 style="color:#4F46E5;">Welcome to PEMS!</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Please verify your email address to activate your account:</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">Verify Email</a>
        <p style="color:#666;font-size:12px;">This link expires in 24 hours.</p>
        <p style="color:#666;font-size:12px;">If you didn't create an account, please ignore this email.</p>
      </div>
    `,
  });
};

exports.sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset Your PEMS Password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9f9f9;border-radius:8px;">
        <h2 style="color:#4F46E5;">Password Reset Request</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>You requested to reset your password. Click the button below:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#EF4444;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">Reset Password</a>
        <p style="color:#666;font-size:12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

exports.sendPaymentSuccessEmail = async (user, subscription) => {
  await sendEmail({
    to: user.email,
    subject: '🎉 Premium Subscription Activated - PEMS',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9f9f9;border-radius:8px;">
        <h2 style="color:#10B981;">Payment Successful!</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Your Premium subscription has been activated successfully.</p>
        <div style="background:#fff;padding:16px;border-radius:6px;margin:16px 0;">
          <p><strong>Plan:</strong> Premium Annual</p>
          <p><strong>Amount:</strong> NPR ${subscription.amount}</p>
          <p><strong>Transaction ID:</strong> ${subscription.transactionId}</p>
          <p><strong>Expires:</strong> ${new Date(subscription.expiryDate).toLocaleDateString()}</p>
        </div>
        <p>Enjoy unlimited expenses, AI analytics, OCR scanning, and more!</p>
      </div>
    `,
  });
};

exports.sendKYCApprovedEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: '✅ KYC Approved - PEMS',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9f9f9;border-radius:8px;">
        <h2 style="color:#10B981;">KYC Verification Approved!</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Your KYC verification has been approved. You now have a verified badge on your account.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard" style="display:inline-block;padding:12px 24px;background:#10B981;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">Go to Dashboard</a>
      </div>
    `,
  });
};

exports.sendKYCRejectedEmail = async (user, reason) => {
  await sendEmail({
    to: user.email,
    subject: '❌ KYC Rejected - PEMS',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9f9f9;border-radius:8px;">
        <h2 style="color:#EF4444;">KYC Verification Rejected</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Unfortunately, your KYC verification was rejected.</p>
        <div style="background:#FEF2F2;padding:16px;border-radius:6px;margin:16px 0;border-left:4px solid #EF4444;">
          <strong>Reason:</strong> ${reason}
        </div>
        <p>Please resubmit your KYC with the correct information.</p>
        <a href="${process.env.FRONTEND_URL}/kyc" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">Resubmit KYC</a>
      </div>
    `,
  });
};

exports.sendTempPasswordEmail = async (user, tempPassword) => {
  await sendEmail({
    to: user.email,
    subject: 'Temporary Password - PEMS',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9f9f9;border-radius:8px;">
        <h2 style="color:#4F46E5;">Password Reset by Admin</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Your password has been reset by the administrator. Use the temporary password below to login:</p>
        <div style="background:#fff;padding:16px;border-radius:6px;margin:16px 0;text-align:center;font-size:24px;font-weight:bold;letter-spacing:4px;color:#4F46E5;">
          ${tempPassword}
        </div>
        <p>Please change your password immediately after logging in.</p>
      </div>
    `,
  });
};
