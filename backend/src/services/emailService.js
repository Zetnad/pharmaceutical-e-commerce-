const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const send = async (to, subject, html) => {
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
};

const baseStyle = `font-family:'DM Sans',Arial,sans-serif;background:#f5f0e8;padding:40px 20px;`;
const card = (content) => `<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">${content}</div>`;
const header = `<div style="background:#0b1120;padding:24px 32px;display:flex;align-items:center;gap:12px;"><span style="font-size:1.5rem;font-weight:900;color:white;font-family:Georgia,serif;">Medi<span style="color:#a7f3d0">Hub</span></span></div>`;
const body = (content) => `<div style="padding:32px;">${content}</div>`;
const footer = `<div style="background:#f5f0e8;padding:16px 32px;font-size:12px;color:#94a3b8;text-align:center;">© 2026 MediHub Technologies Ltd. Nairobi, Kenya<br>Not a substitute for professional medical advice.</div>`;
const btn = (url, text) => `<a href="${url}" style="display:inline-block;background:#0d9e6e;color:white;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:600;margin-top:16px;">${text}</a>`;
const wrap = (content) => `<div style="${baseStyle}">${card(header + body(content) + footer)}</div>`;

exports.sendWelcome = (email, name) => send(email, 'Welcome to MediHub! 💊', wrap(`
  <h2 style="color:#0b1120;margin-bottom:8px;">Welcome, ${name}! 🎉</h2>
  <p style="color:#64748b;line-height:1.7;">Your MediHub account is ready. You now have access to:</p>
  <ul style="color:#64748b;line-height:2;">
    <li>🧠 AI-powered symptom checker (5 free checks/month)</li>
    <li>🏪 Marketplace of 500+ verified pharmacies</li>
    <li>💬 Chat with licensed pharmacists</li>
    <li>📋 Secure prescription management</li>
  </ul>
  ${btn(process.env.CLIENT_URL, 'Start Exploring MediHub')}
`));

exports.sendPasswordReset = (email, name, url) => send(email, 'Reset your MediHub password', wrap(`
  <h2 style="color:#0b1120;margin-bottom:8px;">Password Reset Request</h2>
  <p style="color:#64748b;line-height:1.7;">Hi ${name}, click the button below to reset your password. This link expires in 30 minutes.</p>
  ${btn(url, 'Reset Password')}
  <p style="color:#94a3b8;font-size:12px;margin-top:16px;">If you didn't request this, please ignore this email.</p>
`));

exports.sendOrderConfirmation = (email, name, order) => send(email, `Order Confirmed — #${order._id.toString().slice(-6).toUpperCase()}`, wrap(`
  <h2 style="color:#0b1120;margin-bottom:8px;">Order Confirmed ✅</h2>
  <p style="color:#64748b;line-height:1.7;">Hi ${name}, your order has been placed successfully.</p>
  <div style="background:#f0fdf4;border:1px solid #a7f3d0;border-radius:12px;padding:16px;margin:16px 0;">
    <p style="margin:0;color:#0b1120;font-weight:600;">Order #${order._id.toString().slice(-6).toUpperCase()}</p>
    <p style="margin:4px 0 0;color:#64748b;">Total: KSh ${order.totalAmount.toLocaleString()}</p>
    <p style="margin:4px 0 0;color:#64748b;">Est. Delivery: ${order.estimatedDelivery?.toDateString()}</p>
  </div>
  ${btn(`${process.env.CLIENT_URL}/orders/${order._id}`, 'Track Your Order')}
`));

exports.sendOrderStatusUpdate = (email, name, order) => send(email, `Order Update — ${order.orderStatus}`, wrap(`
  <h2 style="color:#0b1120;margin-bottom:8px;">Order Status Updated</h2>
  <p style="color:#64748b;line-height:1.7;">Hi ${name}, your order status has been updated to <strong style="color:#0d9e6e;">${order.orderStatus.toUpperCase()}</strong>.</p>
  ${btn(`${process.env.CLIENT_URL}/orders/${order._id}`, 'View Order')}
`));

exports.sendPharmacistApplicationReceived = (email, name) => send(email, 'MediHub Pharmacist Application Received', wrap(`
  <h2 style="color:#0b1120;margin-bottom:8px;">Application Received 📋</h2>
  <p style="color:#64748b;line-height:1.7;">Hi ${name}, we've received your pharmacist application. Our compliance team will verify your license within 24–48 hours.</p>
  <p style="color:#64748b;">You'll receive an email once verified.</p>
`));

exports.sendPharmacistApproved = (email, name, pharmacyName) => send(email, '🎉 Your Pharmacy is Now Live on MediHub!', wrap(`
  <h2 style="color:#0b1120;margin-bottom:8px;">Congratulations, ${name}! 🚀</h2>
  <p style="color:#64748b;line-height:1.7;"><strong>${pharmacyName}</strong> has been verified and is now live on MediHub. Start listing your products!</p>
  ${btn(`${process.env.CLIENT_URL}/pharmacist/dashboard`, 'Go to Dashboard')}
`));

exports.sendPharmacistRejected = (email, name, reason) => send(email, 'MediHub Pharmacist Application Update', wrap(`
  <h2 style="color:#0b1120;margin-bottom:8px;">Application Status Update</h2>
  <p style="color:#64748b;line-height:1.7;">Hi ${name}, unfortunately we were unable to verify your pharmacist application.</p>
  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin:16px 0;">
    <p style="margin:0;color:#dc2626;font-weight:600;">Reason: ${reason || 'Documents could not be verified.'}</p>
  </div>
  <p style="color:#64748b;">Please re-apply with correct documents or contact our support team.</p>
`));
