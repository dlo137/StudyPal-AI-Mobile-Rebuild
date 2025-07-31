// pages/api/contact.js
// Next.js API route for StudyPal contact form (Vercel compatible)
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
  try {
    await transporter.sendMail({
      from: `${name} <${email}>`,
      to: 'studypalhelpdesk@gmail.com',
      subject: `[StudyPal Contact] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send email.' });
  }
}
