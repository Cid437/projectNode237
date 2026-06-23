$(function () {
  $('#header').load('header.html');

  $('form').submit(function (e) {
    e.preventDefault();
    alert('Checkout functionality will be implemented here.');
  });
});
