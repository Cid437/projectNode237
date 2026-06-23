$(function () {
  $('#header').load('header.html');

  const orderId = new URLSearchParams(window.location.search).get('id');
  if (!orderId) {
    $('#orderInfo').html('<p>No order selected.</p>');
    return;
  }

  $.get(`/api/orders/${orderId}`, function (data) {
    $('#orderInfo').html(`
      <p>Order #${data.id}</p>
      <p>Amount: ₱${data.amount}</p>
      <p>Status: ${data.status}</p>
    `);
  });
});
