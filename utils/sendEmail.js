const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    if (!process.env.EMAIL_HOST && !process.env.SMTP_HOST) {
        console.log('Email skipped. Configure EMAIL_HOST or SMTP_HOST in .env');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
        port: process.env.EMAIL_PORT || process.env.SMTP_PORT,
        auth: {
            user: process.env.EMAIL_USER || process.env.SMTP_EMAIL,
            pass: process.env.EMAIL_PASS || process.env.SMTP_PASSWORD
        }
    });

    const message = {
        from: process.env.EMAIL_FROM || process.env.SMTP_FROM_EMAIL || process.env.EMAIL_USER,
        to: options.email,
        subject: options.subject,
        html: `<p>${options.message}</p>`,
        attachments: options.attachments || []
    };

    await transporter.sendMail(message);
};

module.exports = sendEmail;
