import { serialize } from 'cookie';

export default async function handler(req, res) {
  // Clear the cookie by setting the expiration to the past
  res.setHeader('Set-Cookie', serialize('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
    path: '/'
  }));

  res.status(200).json({ success: true });
}