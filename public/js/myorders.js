$(function () {
  $('#header').load('header.html');

  $.get('/api/orders', function (data) {
    let html = '';
    data.forEach((order) => {
      html += `
        <div class="order-card">
          <p>Order #${order.id}</p>
          <p>Status: ${order.status}</p>
        </div>
      `;
    });
    $('#orders').html(html);
  });
});
