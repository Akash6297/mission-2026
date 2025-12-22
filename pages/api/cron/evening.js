import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.MY_EMAIL,
    subject: "🌙 EOD REMINDER: Log Your Mission",
    html: `
      <div style="font-family: sans-serif; background: #050505; color: white; padding: 40px; border-radius: 20px; border: 2px solid #eab308;">
        <h1 style="color: #eab308;">MISSION CHECK-IN</h1>
        <p style="font-size: 16px;">The day is ending. Did you conquer your goals today?</p>
        <p>Don't let your <strong>Streak</strong> break. Log your mission update now to earn your XP.</p>
        <br />
        <a href="https://your-website.vercel.app" style="background: #eab308; color: black; padding: 15px 25px; text-decoration: none; font-weight: bold; border-radius: 10px; display: inline-block;">LOG EOD UPDATE</a>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Evening Reminder Sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}