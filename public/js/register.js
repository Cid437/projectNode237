$(function () {
  $('#header').load('header.html');

  $('#registerForm').submit(function (e) {
    e.preventDefault();

    $.ajax({
      url: '/api/register',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        name: $('#name').val(),
        email: $('#email').val(),
        password: $('#password').val(),
      }),
      success: function () {
        alert('Registration Successful');
      },
      error: function () {
        alert('Registration failed.');
      },
    });
  });
});
