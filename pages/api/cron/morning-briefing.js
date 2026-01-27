import nodemailer from 'nodemailer';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import GlobalSetting from '../../../models/GlobalSetting';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  await dbConnect();

  // 1. SECURITY: VERIFY ADMIN STATUS
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.auth_token;
  if (!token) return res.status(401).json({ error: "Unauthorized access" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: "Restricted to Admin Personnel only" });
    }

    // 2. FETCH INPUTS FROM DASHBOARD
    const { subject, message, color } = req.body;

    // 3. FETCH GLOBAL SETTINGS (Check if mailing is allowed)
    const globalConfig = await GlobalSetting.findOne({ configId: "master_config" }) || { isMailActive: true, mailTarget: "both" };

    if (!globalConfig.isMailActive) {
      return res.status(400).json({ error: "The Global Master Switch is currently OFF. Turn it on in Mail Control to broadcast." });
    }

    // 4. DEFINE TARGET AUDIENCE BASED ON GLOBAL CONFIG
    let userQuery = {};
    if (globalConfig.mailTarget === 'users') userQuery = { role: 'user' };
    else if (globalConfig.mailTarget === 'admins') userQuery = { role: 'admin' };

    const users = await User.find(userQuery);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    // 5. BROADCAST LOOP
    for (const user of users) {
      const htmlContent = getProfessionalTemplate(subject, message, color || "#eab308", user.username);

      await transporter.sendMail({
        from: `"Mission HQ" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: subject,
        html: htmlContent,
      });
    }

    res.status(200).json({ message: `Broadcast success! Sent to ${users.length} recipients.` });

  } catch (error) {
    console.error("BROADCAST ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
}

/**
 * THE PROFESSIONAL INTELLIGENCE TEMPLATE
 * Designed for high-end look and feel
 */
function getProfessionalTemplate(subject, message, color, username) {
  const safeMessage = message.replace(/{username}/g, username);
  
  return `
    <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
        
        <!-- Intelligence Header -->
        <div style="background-color: ${color}; padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; text-transform: uppercase; letter-spacing: 4px; font-style: italic; font-size: 24px;">${subject}</h1>
        </div>

        <!-- Mission Content -->
        <div style="padding: 40px 30px; line-height: 1.8;">
          <p style="font-size: 16px; margin-bottom: 20px;">Greetings, <strong>Soldier ${username}</strong>.</p>
          
          <div style="color: #475569; font-size: 16px; white-space: pre-wrap; background-color: #f1f5f9; border-left: 5px solid ${color}; padding: 25px; border-radius: 8px; margin: 20px 0; font-style: italic;">
            ${safeMessage}
          </div>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="https://mission-2026.vercel.app" 
               style="display: inline-block; background-color: ${color}; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 14px; font-weight: 900; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
               Open Command Center
            </a>
          </div>
        </div>

        <!-- System Footer -->
        <div style="background-color: #f1f5f9; padding: 25px; text-align: center; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;">
            Neural System Protocol 2026 • Global Mission HQ
        </div>
      </div>
    </div>
  `;
}