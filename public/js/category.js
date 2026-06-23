$(function () {
  $('#header').load('header.html');

  $('#categoryTable').DataTable({
    ajax: '/api/categories',
    columns: [
      { data: 'id' },
      { data: 'name' },
    ],
    pageLength: 10,
    responsive: true,
  });
});
