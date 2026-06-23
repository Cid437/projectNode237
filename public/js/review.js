$(function () {
  $('#header').load('header.html');

  $('form').submit(function (e) {
    e.preventDefault();
    alert('Review submitted.');
  });
});
