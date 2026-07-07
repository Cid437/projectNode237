(async () => {
  const send = require('./utils/sendEmail');
  try {
    await send({ email: 'to@example.com', subject: 'Mailtrap test', message: 'This is a test e-mail message.' });
    console.log('Test send completed');
  } catch (e) {
    console.error('Test send error', e);
    process.exitCode = 1;
  }
})();
