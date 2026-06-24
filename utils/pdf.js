const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateReceipt = (transaction, user) => {
    return new Promise((resolve, reject) => {
        const receiptsDir = path.join(__dirname, '..', 'public', 'receipts');
        if (!fs.existsSync(receiptsDir)) {
            fs.mkdirSync(receiptsDir, { recursive: true });
        }

        const filename = `receipt-${transaction.id}.pdf`;
        const filepath = path.join(receiptsDir, filename);
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);
        doc.fontSize(20).text('Transaction Receipt');
        doc.moveDown();
        doc.fontSize(12).text(`Receipt No: ${transaction.id}`);
        doc.text(`Customer: ${user ? user.name : 'Customer'}`);
        doc.text(`Email: ${user ? user.email : ''}`);
        doc.text(`Amount: ${transaction.amount}`);
        doc.text(`Status: ${transaction.status}`);
        doc.text(`Date: ${new Date(transaction.transaction_date).toLocaleString()}`);
        doc.end();

        stream.on('finish', () => resolve(`/receipts/${filename}`));
        stream.on('error', reject);
    });
};

module.exports = generateReceipt;
