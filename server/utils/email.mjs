import nodemailer from "nodemailer";

const getSmtpConfig = () => ({
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASSWORD,
});

const ensureSmtpConfig = () => {
  const config = getSmtpConfig();
  if (!config.user || !config.pass) {
    throw new Error("SMTP is not configured. Set EMAIL_USER and EMAIL_PASSWORD in server/.env");
  }
  return config;
};

const createTransporter = () => {
  const config = ensureSmtpConfig();
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
};

export const sendOTPEmail = async (email, otp) => {
  try {
    const config = ensureSmtpConfig();
    const transporter = createTransporter();
    const mailOptions = {
      from: config.user,
      to: email,
      subject: "ExamRoot - Your OTP for Login",
      text: `Your ExamRoot OTP is ${otp}. It is valid for 10 minutes. Do not share it with anyone.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">ExamRoot</h2>
          </div>
          <div style="background: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">Welcome back to ExamRoot!</p>
            <p style="color: #1f2937; font-size: 16px; margin-bottom: 20px;">Your One-Time Password (OTP) is:</p>
            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px dashed #F59E0B;">
              <h1 style="color: #F59E0B; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            <p style="color: #6b7280; font-size: 12px; margin-bottom: 10px;">This OTP is valid for 10 minutes only.</p>
            <p style="color: #6b7280; font-size: 12px; margin-bottom: 20px;">Do not share this OTP with anyone.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px;">If you did not request this OTP, please ignore this email.</p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("OTP Email sent to:", email);
    return result;
  } catch (error) {
    console.error("Error sending OTP email:", error.message);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

export const sendWelcomeEmail = async (email, name) => {
  try {
    const config = ensureSmtpConfig();
    const transporter = createTransporter();
    const mailOptions = {
      from: config.user,
      to: email,
      subject: "Welcome to ExamRoot!",
      text: `Hello ${name}, welcome to ExamRoot!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">Welcome to ExamRoot</h2>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <p style="color: #1f2937; font-size: 16px;">Hello ${name},</p>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">Welcome to ExamRoot! We are excited to have you on board.</p>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">With ExamRoot, you can:</p>
            <ul style="color: #6b7280; font-size: 14px;">
              <li>Take unlimited mock tests</li>
              <li>Practice with subject-wise sets</li>
              <li>Watch video lectures</li>
              <li>Track your progress</li>
            </ul>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">Happy learning!</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px;">Best regards,<br>ExamRoot Team</p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent to:", email);
    return result;
  } catch (error) {
    console.error("Error sending welcome email:", error.message);
    throw new Error("Failed to send welcome email");
  }
};
