import nodemailer from 'nodemailer';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
  await dbConnect();

  const cookies = parse(req.headers.cookie || '');
  const token = cookies.auth_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || adminUser.role !== 'admin') return res.status(403).json({ error: "Access Denied" });

    const { targetEmail, targetUsername, subject, message } = req.body;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const personalHtml = `
      <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Segoe UI', sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #3b82f6;">
          <div style="background-color: #3b82f6; padding: 30px; text-align: center; color: #fff;">
            <h2 style="margin:0; text-transform: uppercase; letter-spacing: 2px;">Direct Dispatch</h2>
          </div>
          <div style="padding: 40px; color: #1e293b; line-height: 1.8;">
            <p>Attention <strong>Soldier ${targetUsername}</strong>,</p>
            <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; font-style: italic;">
              ${message.replace(/{username}/g, targetUsername)}
            </div>
            <p style="margin-top: 30px; font-size: 12px; color: #94a3b8;">This is a private message from Command HQ.</p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Command HQ" <${process.env.EMAIL_USER}>`,
      to: targetEmail,
      subject: subject,
      html: personalHtml,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}