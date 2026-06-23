const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendReceiptEmail = async (email, subject, text, attachmentPath) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    text,
    attachments: [{ path: attachmentPath }],
  });
};

exports.generateReceiptPdf = async (transaction) => {
  const receiptDir = path.join(__dirname, '../public/uploads/receipts');
  if (!fs.existsSync(receiptDir)) fs.mkdirSync(receiptDir, { recursive: true });

  const filePath = path.join(receiptDir, `receipt-${transaction.id}.pdf`);
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(20).text('Order Receipt', { align: 'center' });
  doc.moveDown();
  doc.text(`Order ID: ${transaction.id}`);
  doc.text(`User ID: ${transaction.user_id}`);
  doc.text(`Amount: ₱${transaction.amount}`);
  doc.text(`Status: ${transaction.status}`);
  doc.text(`Date: ${transaction.transaction_date}`);

  doc.end();

  await new Promise((resolve) => stream.on('finish', resolve));
  return `/uploads/receipts/receipt-${transaction.id}.pdf`;
};
