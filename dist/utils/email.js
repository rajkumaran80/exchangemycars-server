import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use Gmail as the email service
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
    },
});
/**
 * Send an email notification.
 * @param to - Recipient email address.
 * @param subject - Email subject.
 * @param text - Email body (plain text).
 */
export const sendEmailNotification = async (to, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER, // Sender email address
        to, // Recipient email address
        subject, // Email subject
        text, // Email body (plain text)
    };
    try {
        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
    }
    catch (error) {
        console.error('Error sending email:', error);
    }
};
