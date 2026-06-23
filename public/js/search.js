$(function () {
  $('#header').load('header.html');

  $('#search').keyup(function () {
    const query = $(this).val().trim();
    if (!query) {
      $('#results').empty();
      return;
    }

    $.get(`/api/search?q=${encodeURIComponent(query)}`, function (data) {
      let html = '';
      data.forEach((item) => {
        html += `<p>${item.name}</p>`;
      });
      $('#results').html(html);
    });
  });
});
