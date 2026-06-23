$(function () {
  $('#header').load('header.html');

  $.get('/api/items', function (data) {
    let html = '';
    data.forEach((item) => {
      html += `
        <div class="item-card">
          <h3>${item.name}</h3>
          <p>₱${item.price}</p>
          <button class="add-to-cart" data-id="${item.id}">Add to Cart</button>
        </div>
      `;
    });
    $('#items').html(html);
  });
});
