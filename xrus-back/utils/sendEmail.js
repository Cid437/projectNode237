const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
        port: process.env.SMTP_PORT || 2525,
        auth: {
            user: process.env.SMTP_EMAIL || '908fahf1010dsfj67',
            pass: process.env.SMTP_PASSWORD || 'easdf77a486casdh67'
        }
    });

    const message = {
        from: `${process.env.SMTP_FROM_NAME || 'Xrus Shop'} <${process.env.SMTP_FROM_EMAIL || 'no-reply@xrus.test'}>`,
        to: options.email,
        subject: options.subject,
        html: `<p>${options.message}</p>`,
        attachments: options.attachment ? [{
            filename: options.attachment.filename || 'receipt.pdf',
            content: options.attachment.content,
            contentType: 'application/pdf'
        }] : []
    };

    await transporter.sendMail(message);
};

module.exports = sendEmail;
