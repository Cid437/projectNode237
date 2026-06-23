$(function () {
  $('#header').load('header.html');

  $.get('/api/profile', function (data) {
    $('#profile').html(`
      <p>Name: ${data.name}</p>
      <p>Email: ${data.email}</p>
    `);
  });
});
