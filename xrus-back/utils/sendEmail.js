const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
        port: parseInt(process.env.SMTP_PORT || '2525', 10),
        auth: {
            user: process.env.SMTP_EMAIL || '8335af10108a29',
            pass: process.env.SMTP_PASSWORD || 'e856a486cbc70d'
        }
    });

    try {
        await transporter.verify();
        console.log('sendEmail: SMTP transporter verified');
    } catch (verifyErr) {
        console.error('sendEmail: transporter.verify failed', verifyErr);
        throw verifyErr;
    }

    const htmlBody = options.html || `<p>${options.message || 'Please review the attached receipt.'}</p>`;

    const message = {
        from: `${process.env.SMTP_FROM_NAME || 'Xrus Shop'} <${process.env.SMTP_FROM_EMAIL || 'no-reply@xrus.test'}>`,
        to: options.email,
        subject: options.subject,
        html: htmlBody,
        attachments: options.attachment ? [{
            filename: options.attachment.filename || 'receipt.pdf',
            content: options.attachment.content,
            contentType: 'application/pdf'
        }] : []
    };

    try {
        const info = await transporter.sendMail(message);
        console.log('sendEmail: message sent', info && info.messageId ? info.messageId : info);
        return info;
    } catch (sendErr) {
        console.error('sendEmail: sendMail failed', sendErr);
        throw sendErr;
    }
};

module.exports = sendEmail;
