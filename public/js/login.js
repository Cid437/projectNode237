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
        $('#result').html('Login successful. You may now refresh the admin or profile page.');
      },
      error: function (xhr) {
        const message = xhr?.responseJSON?.message || 'Login failed.';
        $('#result').html(message);
      },
    });
  });
});
