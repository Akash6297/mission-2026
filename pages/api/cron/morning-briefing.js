import nodemailer from 'nodemailer';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import DailyLog from '../../../models/Log';
import Motivation from '../../../models/Motivation';
import GlobalSetting from '../../../models/GlobalSetting'; // Import Global Settings

export default async function handler(req, res) {
  await dbConnect();
  const today = new Date().getDay(); // 0-6

  try {
    // 1. FETCH GLOBAL SETTINGS
    const globalConfig = await GlobalSetting.findOne({ configId: "master_config" }) || { isMailActive: true, mailTarget: "both" };

    // 2. CHECK MASTER SWITCH
    if (!globalConfig.isMailActive) {
      return res.status(200).json({ message: "Morning mailing is currently disabled by Master Switch." });
    }

    // 3. DEFINE TARGET AUDIENCE
    let userQuery = {};
    if (globalConfig.mailTarget === 'users') userQuery = { role: 'user' };
    else if (globalConfig.mailTarget === 'admins') userQuery = { role: 'admin' };

    const users = await User.find(userQuery);
    const dailyStory = await Motivation.findOne({ dayOfWeek: today, active: true });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    for (const user of users) {
      const userLogs = await DailyLog.find({ userId: user._id });
      const totalXp = userLogs.reduce((sum, item) => sum + (item.xpGained || 0), 0);

      const storyContent = dailyStory 
        ? `<div style="background: #16161a; padding: 20px; border-radius: 15px; border: 1px solid #eab308; margin-bottom: 20px;">
             <h3 style="color: #eab308; margin-top: 0;">Today's Inspiration: ${dailyStory.subject}</h3>
             <p style="font-style: italic; color: #ccc;">"${dailyStory.story.replace(/{username}/g, user.username)}"</p>
           </div>`
        : '';

      const mailOptions = {
        from: `"Mission 2026" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `🌅 MISSION BRIEFING: ${user.username}`,
        html: `
          <div style="font-family: sans-serif; background: #0a0a0c; color: white; padding: 40px; border-radius: 20px;">
            <h1 style="color: #eab308; text-transform: uppercase;">Command Briefing</h1>
            <p>Good Morning, <strong>${user.username}</strong>.</p>
            ${storyContent}
            <div style="background: #111; padding: 20px; border-radius: 15px; border: 1px solid #333;">
                <p style="margin: 0; color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase;">Current Wallet</p>
                <p style="margin: 5px 0; font-size: 24px; font-weight: 900; color: #eab308;">${totalXp} XP</p>
            </div>
            <p style="margin-top: 25px;">Don't let the day pass without progress. Your 2026 legacy is built one log at a time.</p>
            <br />
            <a href="https://mission-2026.vercel.app" style="background: #eab308; color: black; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 10px; display: inline-block;">ENTER COMMAND CENTER</a>
          </div>
        `,
      };
      await transporter.sendMail(mailOptions);
    }

    res.status(200).json({ message: `Morning briefings sent to ${users.length} recipients (${globalConfig.mailTarget})` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}