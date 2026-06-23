$(function () {
  $('#header').load('header.html');

  $('#loginForm').submit(function (e) {
    e.preventDefault();

    $.ajax({
      url: '/api/login',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        email: $('#email').val(),
        password: $('#password').val(),
      }),
      success: function (data) {
        localStorage.setItem('token', data.token);
        $('#result').html('Login Successful');
      },
      error: function () {
        $('#result').html('Login failed.');
      },
    });
  });
});
