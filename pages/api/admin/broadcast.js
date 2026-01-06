import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('POST only');
  await dbConnect();

  const cookies = parse(req.headers.cookie || '');
  const token = cookies.auth_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || adminUser.role !== 'admin') return res.status(403).json({ error: "Access Denied" });

    const { subject, message, color, templateType } = req.body;
    const users = await User.find({});
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    for (const user of users) {
      // Replace {username} with actual user name
      const personalizedMessage = message.replace(/{username}/g, user.username);

      const htmlContent = generateEmailTemplate(subject, personalizedMessage, color, templateType);

      await transporter.sendMail({
        from: `"Mission 2026 HQ" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: subject,
        html: htmlContent
      });
    }

    return res.status(200).json({ success: true, count: users.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// THE TEMPLATE ENGINE
function generateEmailTemplate(subject, message, color, type) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #ddd; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        <div style="background-color: ${color}; padding: 40px 20px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; text-transform: uppercase; letter-spacing: 2px; font-style: italic;">${subject}</h1>
        </div>
        <div style="padding: 40px; line-height: 1.6; font-size: 16px;">
          <p style="white-space: pre-wrap;">${message}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <div style="text-align: center;">
            <a href="https://mission-2026.vercel.app" style="display: inline-block; padding: 15px 30px; background-color: ${color}; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: bold; text-transform: uppercase;">Launch Mission Control</a>
          </div>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999;">
          You are receiving this because you are an active soldier in the 2026 Protocol.
        </div>
      </div>
    </div>
  `;
}