import nodemailer from 'nodemailer';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import DailyLog from '../../../models/Log';

export default async function handler(req, res) {
  await dbConnect();

  try {
    // 1. Get all registered users
    const users = await User.find({});
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    // 2. Loop through each user to send a personalized mail
    for (const user of users) {
      // Calculate XP for this specific user
      const userLogs = await DailyLog.find({ userId: user._id });
      const totalXp = userLogs.reduce((sum, item) => sum + (item.xpGained || 0), 0);

      const mailOptions = {
        from: `"Mission 2026" <${process.env.EMAIL_USER}>`,
        to: user.email, // Sends to the user's registered email
        subject: `🌅 MISSION 2026: Wake Up, ${user.username}!`,
        html: `
          <div style="font-family: sans-serif; background: #0a0a0c; color: white; padding: 40px; border-radius: 20px;">
            <h1 style="color: #eab308;">COMMAND BRIEFING</h1>
            <p style="font-size: 18px;">Good Morning, <strong>${user.username}</strong>. Your legacy is waiting.</p>
            <div style="background: #16161a; padding: 20px; border-radius: 10px; border: 1px solid #333;">
                <p><strong>Your Status:</strong> ${totalXp} XP Collected</p>
                <p><strong>Today's Mission:</strong> Log in and crush your goals!</p>
            </div>
            <br />
            <a href="https://mission-2026.vercel.app" style="background: #eab308; color: black; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px;">OPEN COMMAND CENTER</a>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    res.status(200).json({ message: `Morning emails sent to ${users.length} soldiers.` });
  } catch (error) {
    console.error("CRON ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
}