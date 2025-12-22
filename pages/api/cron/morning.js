import nodemailer from 'nodemailer';
import dbConnect from '../../../lib/mongodb';
import DailyLog from '../../../models/Log';

export default async function handler(req, res) {
  await dbConnect();
  
  // Calculate current XP for the email
  const logs = await DailyLog.find();
  const totalXp = logs.reduce((sum, item) => sum + (item.xpGained || 0), 0);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.MY_EMAIL,
    subject: "🌅 MISSION 2026: Wake Up, Soldier!",
    html: `
      <div style="font-family: sans-serif; background: #0a0a0c; color: white; padding: 40px; border-radius: 20px;">
        <h1 style="color: #eab308; italic">COMMAND BRIEFING</h1>
        <p style="font-size: 18px;">Good Morning, Akash. Your legacy is waiting.</p>
        <div style="background: #16161a; padding: 20px; border-radius: 10px; border: 1px solid #333;">
            <p><strong>Current Wallet:</strong> ${totalXp} XP</p>
            <p><strong>Daily Objectives:</strong></p>
            <ul>
                <li>Practice New Language</li>
                <li>Work on Small Business</li>
                <li>Networking / Connections</li>
            </ul>
        </div>
        <p style="margin-top: 20px; color: #666;">"Don't stop until you're proud."</p>
        <a href="https://mission-2026.vercel.app/" style="background: #eab308; color: black; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 5px;">OPEN COMMAND CENTER</a>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Morning Motivation Sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}