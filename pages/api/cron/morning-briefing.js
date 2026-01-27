import nodemailer from 'nodemailer';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import DailyLog from '../../../models/Log';
import Motivation from '../../../models/Motivation';
import GlobalSetting from '../../../models/GlobalSetting';

export default async function handler(req, res) {
  // CRITICAL FIX: Allow GET for Browser testing and Vercel Crons
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Use GET to trigger this briefing" });
  }

  await dbConnect();
  const today = new Date().getDay(); // 0-6

  try {
    // 1. FETCH GLOBAL SETTINGS
    const globalConfig = await GlobalSetting.findOne({ configId: "master_config" }) || { isMorningActive: true, isEveningActive: true, mailTarget: "both" };

    if (!globalConfig.isMorningActive) {
        return res.status(200).json({ message: "Morning briefings are currently disabled." });
    }

    // 2. DEFINE TARGET AUDIENCE
    let userQuery = {};
    if (globalConfig.mailTarget === 'users') userQuery = { role: 'user' };
    else if (globalConfig.mailTarget === 'admins') userQuery = { role: 'admin' };

    const users = await User.find(userQuery);
    const dailyStory = await Motivation.findOne({ dayOfWeek: today, active: true });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    // 3. BROADCAST LOOP
    for (const user of users) {
      const userLogs = await DailyLog.find({ userId: user._id });
      const totalXp = userLogs.reduce((sum, item) => sum + (item.xpGained || 0), 0);

      // Create the content
      const storyTitle = dailyStory ? dailyStory.subject : "Daily Objective";
      const storyText = dailyStory 
        ? dailyStory.story 
        : "Another day to build your legacy. Log your mission and keep the streak alive!";

      // Generate HTML using the professional template
      const htmlContent = getProfessionalTemplate(
        storyTitle, 
        storyText, 
        "#eab308", // Professional Yellow
        user.username,
        totalXp
      );

      await transporter.sendMail({
        from: `"Mission 2026" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `🌅 MISSION BRIEFING: ${user.username}`,
        html: htmlContent,
      });
    }

    res.status(200).json({ message: `Morning briefings sent to ${users.length} recipients.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// THE PROFESSIONAL TEMPLATE ENGINE
function getProfessionalTemplate(subject, message, color, username, xp) {
  const safeMessage = message.replace(/{username}/g, username);
  
  return `
    <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
        <div style="background-color: ${color}; padding: 40px 20px; text-align: center;">
          <h1 style="color: #000; margin: 0; text-transform: uppercase; letter-spacing: 4px; font-style: italic; font-size: 24px;">${subject}</h1>
        </div>
        <div style="padding: 40px 30px; line-height: 1.8;">
          <p style="font-size: 16px; margin-bottom: 20px;">Good Morning, <strong>Soldier ${username}</strong>.</p>
          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #ddd;">
             <p style="margin:0; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold;">Wallet Balance</p>
             <p style="margin:0; font-size: 24px; font-weight: 900; color: ${color};">${xp} XP</p>
          </div>
          <div style="color: #475569; font-size: 16px; white-space: pre-wrap; font-style: italic; border-left: 5px solid ${color}; padding-left: 20px;">
            ${safeMessage}
          </div>
          <div style="text-align: center; margin-top: 40px;">
            <a href="https://mission-2026.vercel.app" style="display: inline-block; background-color: #000; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 14px; font-weight: 900; text-transform: uppercase; font-size: 13px;">Open Command Center</a>
          </div>
        </div>
        <div style="background-color: #f1f5f9; padding: 25px; text-align: center; font-size: 10px; color: #94a3b8; text-transform: uppercase;">
            Mission 2026 Protocol • Automated Briefing
        </div>
      </div>
    </div>
  `;
}