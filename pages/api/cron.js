import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Only allow Vercel or manual test to trigger this
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Your Google App Password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.MY_EMAIL,
    subject: "🚀 Wake up! Your 2025 goals are waiting!",
    html: `<h1>Time to Shine!</h1><p>Check your dashboard and complete your tasks today.</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email Sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}