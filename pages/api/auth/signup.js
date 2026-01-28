import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('POST only');
  await dbConnect();

  try {
    const { username, email, password } = req.body;
    
    // 1. Check existing
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ error: "Username or Email already exists" });

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // 3. Create User
    await User.create({ username, email, password: hashedPassword });

    // 4. SEND WELCOME MAIL (Welcome Protocol)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const welcomeHtml = `
      <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Segoe UI', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          <div style="background-color: #eab308; padding: 40px 20px; text-align: center;">
            <h1 style="color: #000; margin: 0; text-transform: uppercase; letter-spacing: 3px; font-style: italic;">Welcome Soldier</h1>
          </div>
          <div style="padding: 40px 30px; line-height: 1.8; color: #1e293b;">
            <p style="font-size: 18px;">Welcome to the Protocol, <strong>${username}</strong>.</p>
            <p style="font-style: italic; color: #64748b; border-left: 4px solid #eab308; padding-left: 15px;">
              "The journey of a thousand miles begins with a single step. Your 2026 legacy starts right now."
            </p>
            <p>Your profile has been initialized. Use your dashboard to track resolutions, earn XP, and spend rewards in the market.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://mission-2026.vercel.app" style="background-color: #000; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: 900; text-transform: uppercase; font-size: 12px;">Access Command Center</a>
            </div>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Mission 2026 HQ" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🚀 MISSION INITIALIZED: Welcome to the Fleet",
      html: welcomeHtml,
    });

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}