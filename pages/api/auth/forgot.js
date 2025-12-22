import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('POST only');
  await dbConnect();

  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Create a random token
    const token = crypto.randomBytes(20).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const resetUrl = `http://${req.headers.host}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Mission 2026: Password Reset Request",
      html: `<h1>Reset Your Password</h1><p>Click here to reset: <a href="${resetUrl}">${resetUrl}</a></p>`
    });

    res.status(200).json({ message: "Reset link sent to your email" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}