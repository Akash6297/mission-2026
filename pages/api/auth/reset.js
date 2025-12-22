import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('POST only');
  await dbConnect();

  try {
    const { token, password } = req.body;

    // 1. Find user with valid token and check if it's not expired
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Token is invalid or has expired" });
    }

    // 2. Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;

    // 3. Clear the reset token fields
    user.resetToken = null;
    user.resetTokenExpiry = null;
    
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}