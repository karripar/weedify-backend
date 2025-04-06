import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'outlook',
  host: 'smtp-mail.outlook.com',
  port: 587,
  authMethod: 'LOGIN',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  }
})

const sendResetEmail = async (
  email: string,
  token: string,
) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await transporter.sendMail({
      to: email,
      subject: 'Password Reset - Weedify',
      html: `
        <h1>Password Reset</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>If you did not request this, someone else may be trying to access your account. If you did not request this, please ignore this email or change your password.</p>
        </p>`
    })
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Error sending email');
  }
}

export {
  sendResetEmail,
}
