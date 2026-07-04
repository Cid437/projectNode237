$(document).ready(function () {
  const url = 'http://localhost:4000';
  const role = sessionStorage.getItem('role') || 'customer';

  if (role !== 'admin') {
    Swal.fire({ icon: 'warning', text: 'Admin access required for this page.' }).then(() => {
      window.location.href = 'home.html';
    });
    return;
  }

  const getToken = () => {
    let token = sessionStorage.getItem('token');
    if (!token) {
      Swal.fire({ icon: 'warning', text: 'You must be logged in to access this page.' }).then(() => {
        window.location.href = 'login.html';
      });
      return null;
    }
    token = token.replace(/^"|"$/g, '');
    return token;
  };

  $('#updateUserBtn').hide();

  const loadUsers = () => {
    const token = getToken();
    if (!token) return;

    $.ajax({
      method: 'GET',
      url: `${url}/api/v1/users`,
      dataType: 'json',
      headers: { Authorization: `Bearer ${token}` },
      success: function (data) {
        const users = Array.isArray(data.rows) ? data.rows : [];
        const body = $('#usersBody');
        body.empty();

        if (!users.length) {
          body.html('<tr><td colspan="6" class="text-center">No users found</td></tr>');
          return;
        }

        body.html(users.map(user => `
          <tr>
            <td>${user.id}</td>
            <td>${user.first_name || ''} ${user.last_name || ''}</td>
            <td>${user.email}</td>
            <td>
              <select class="form-control form-control-sm role-select" data-id="${user.id}">
                <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>Customer</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
              </select>
            </td>
            <td>${user.status}</td>
            <td>
              <button class="btn btn-sm btn-primary update-role" data-id="${user.id}">Update Role</button>
              <button class="btn btn-sm btn-outline-primary toggle-status" data-id="${user.id}" data-status="${user.status}">
                ${user.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <button class="btn btn-sm btn-outline-info edit-user" data-id="${user.id}" data-first-name="${user.first_name || ''}" data-last-name="${user.last_name || ''}" data-username="${user.username || ''}" data-email="${user.email || ''}" data-role="${user.role || 'customer'}" data-status="${user.status || 'active'}">Edit</button>
              <button class="btn btn-sm btn-outline-danger delete-user" data-id="${user.id}">Delete</button>
            </td>
          </tr>
        `).join(''));
      },
      error: function (error) {
        console.log(error);
        $('#usersBody').html('<tr><td colspan="6" class="text-center">Unable to load users</td></tr>');
      }
    });
  };

  $('#home').load('header.html', function () {
    $('.admin-only').toggle(role === 'admin');
  });

  $('#addUserBtn').on('click', function () {
    $('#userForm')[0].reset();
    $('#userId').val('');
    $('#saveUserBtn').show();
    $('#updateUserBtn').hide();
    $('#userModal').modal('show');
  });

  $('#saveUserBtn').on('click', function () {
    const token = getToken();
    if (!token) return;

    const payload = {
      first_name: $('#userFirstName').val(),
      last_name: $('#userLastName').val(),
      username: $('#userUsername').val(),
      email: $('#userEmail').val(),
      password: $('#userPassword').val(),
      role: $('#userRole').val(),
      status: $('#userStatus').val()
    };

    if (!payload.email || !payload.password) {
      Swal.fire({ icon: 'warning', text: 'Email and password are required' });
      return;
    }

    $.ajax({
      method: 'POST',
      url: `${url}/api/v1/users`,
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify(payload),
      headers: { Authorization: `Bearer ${token}` },
      success: function (data) {
        Swal.fire({ icon: 'success', text: data.message || 'User created', timer: 1200, showConfirmButton: false });
        $('#userModal').modal('hide');
        loadUsers();
      },
      error: function (error) {
        Swal.fire({ icon: 'error', text: error.responseJSON?.message || error.responseJSON?.error || 'Unable to create user' });
      }
    });
  });

  $(document).on('click', '.edit-user', function () {
    $('#userId').val($(this).data('id'));
    $('#userFirstName').val($(this).data('first-name'));
    $('#userLastName').val($(this).data('last-name'));
    $('#userUsername').val($(this).data('username'));
    $('#userEmail').val($(this).data('email'));
    $('#userRole').val($(this).data('role'));
    $('#userStatus').val($(this).data('status'));
    $('#saveUserBtn').hide();
    $('#updateUserBtn').show();
    $('#userModal').modal('show');
  });

  $('#updateUserBtn').on('click', function () {
    const token = getToken();
    if (!token) return;

    const id = $('#userId').val();
    const payload = {
      first_name: $('#userFirstName').val(),
      last_name: $('#userLastName').val(),
      username: $('#userUsername').val(),
      email: $('#userEmail').val(),
      role: $('#userRole').val(),
      status: $('#userStatus').val()
    };

    if (!id || !payload.email) {
      Swal.fire({ icon: 'warning', text: 'Email is required' });
      return;
    }

    $.ajax({
      method: 'PUT',
      url: `${url}/api/v1/users/${id}`,
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify(payload),
      headers: { Authorization: `Bearer ${token}` },
      success: function (data) {
        Swal.fire({ icon: 'success', text: data.message || 'User updated', timer: 1200, showConfirmButton: false });
        $('#userModal').modal('hide');
        loadUsers();
      },
      error: function (error) {
        Swal.fire({ icon: 'error', text: error.responseJSON?.message || error.responseJSON?.error || 'Unable to update user' });
      }
    });
  });

  $(document).on('click', '.toggle-status', function () {
    const token = getToken();
    if (!token) return;

    const id = $(this).data('id');
    const status = $(this).data('status') === 'active' ? 'inactive' : 'active';
    $.ajax({
      method: 'PUT',
      url: `${url}/api/v1/users/${id}/status`,
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify({ status }),
      headers: { Authorization: `Bearer ${token}` },
      success: function (data) {
        Swal.fire({ icon: 'success', text: data.message || 'User status updated', timer: 1200, showConfirmButton: false });
        loadUsers();
      },
      error: function (error) {
        Swal.fire({ icon: 'error', text: error.responseJSON?.message || error.responseJSON?.error || 'Unable to update status' });
      }
    });
  });

  $(document).on('click', '.update-role', function () {
    const token = getToken();
    if (!token) return;

    const id = $(this).data('id');
    const roleValue = $(`.role-select[data-id="${id}"]`).val();
    $.ajax({
      method: 'PUT',
      url: `${url}/api/v1/users/${id}/role`,
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify({ role: roleValue }),
      headers: { Authorization: `Bearer ${token}` },
      success: function (data) {
        Swal.fire({ icon: 'success', text: data.message || 'User role updated', timer: 1200, showConfirmButton: false });
        loadUsers();
      },
      error: function (error) {
        Swal.fire({ icon: 'error', text: error.responseJSON?.message || error.responseJSON?.error || 'Unable to update role' });
      }
    });
  });

  $(document).on('click', '.delete-user', function () {
    const token = getToken();
    if (!token) return;

    const id = $(this).data('id');
    Swal.fire({
      title: 'Delete user?',
      text: 'This cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete'
    }).then((result) => {
      if (!result.isConfirmed) return;
      $.ajax({
        method: 'DELETE',
        url: `${url}/api/v1/users/${id}`,
        dataType: 'json',
        headers: { Authorization: `Bearer ${token}` },
        success: function (data) {
          Swal.fire({ icon: 'success', text: data.message || 'User deleted', timer: 1200, showConfirmButton: false });
          loadUsers();
        },
        error: function (error) {
          Swal.fire({ icon: 'error', text: error.responseJSON?.message || error.responseJSON?.error || 'Unable to delete user' });
        }
      });
    });
  });

  loadUsers();
});
