import nodemailer from 'nodemailer';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

export default async function handler(req, res) {
  await dbConnect();

  try {
    const users = await User.find({});
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    for (const user of users) {
      const mailOptions = {
        from: `"Mission 2026" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `🌙 EOD CHECK-IN: ${user.username}`,
        html: `
          <div style="font-family: sans-serif; background: #050505; color: white; padding: 40px; border-radius: 20px; border: 2px solid #eab308;">
            <h1 style="color: #eab308;">MISSION CHECK-IN</h1>
            <p style="font-size: 16px;">The day is ending, <strong>${user.username}</strong>. Did you conquer your goals today?</p>
            <p>Log your mission update now to increase your <strong>XP Balance</strong> and keep your streak alive.</p>
            <br />
            <a href="https://mission-2026.vercel.app" style="background: #eab308; color: black; padding: 15px 25px; text-decoration: none; font-weight: bold; border-radius: 10px; display: inline-block;">LOG MISSION NOW</a>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    res.status(200).json({ message: `Evening reminders sent to ${users.length} soldiers.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}