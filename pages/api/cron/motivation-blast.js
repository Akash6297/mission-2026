import nodemailer from 'nodemailer';
import dbConnect from '../../../lib/mongodb';
import Motivation from '../../../models/Motivation';
import User from '../../../models/User';

export default async function handler(req, res) {
  await dbConnect();
  const today = new Date().getDay(); // 0-6

  try {
    const scheduledStory = await Motivation.findOne({ dayOfWeek: today, active: true });
    if (!scheduledStory) return res.status(200).json({ message: "No story for today" });

    const users = await User.find({});
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    for (const user of users) {
      await transporter.sendMail({
        from: `"Mission 2026 Motivation" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: scheduledStory.subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px; overflow: hidden;">
            <div style="background: #eab308; padding: 30px; text-align: center; color: black;">
              <h1 style="margin:0;">TODAY'S INSPIRATION</h1>
            </div>
            <div style="padding: 30px; line-height: 1.8; color: #333;">
              <p>Hello <strong>${user.username}</strong>,</p>
              <p style="font-size: 16px; italic">${scheduledStory.story.replace(/{username}/g, user.username)}</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
              <p style="text-align: center; font-weight: bold;">Ready to log your mission for today?</p>
              <div style="text-align: center;">
                <a href="https://mission-2026.vercel.app" style="background: black; color: white; padding: 12px 25px; text-decoration: none; border-radius: 10px; display: inline-block;">LOG MISSION</a>
              </div>
            </div>
          </div>
        `
      });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}