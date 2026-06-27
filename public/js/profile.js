$(function () {
  $('#header').load('header.html');

  const token = localStorage.getItem('token');
  if (!token) {
    $('#profileError').text('Not logged in. Please log in first.');
    return;
  }

  $.ajax({
    url: '/api/profile',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: function (data) {
      $('#profile').html(`
        <p>ID: ${data.id}</p>
        <p>Name: ${data.name}</p>
        <p>Email: ${data.email}</p>
        <p>Role: ${data.role}</p>
        <p>Status: ${data.status}</p>
      `);
    },
    error: function (xhr) {
      const message = xhr?.responseJSON?.message || 'Unable to load profile.';
      $('#profileError').text(message);
    },
  });
});
