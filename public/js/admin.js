$(function () {
  $('#header').load('header.html');

  const token = localStorage.getItem('token');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  function showAdminError(message) {
    $('#adminMessage').text(message);
  }

  function formatXhrError(xhr, fallback) {
    if (xhr?.responseJSON?.message) return xhr.responseJSON.message;
    if (xhr?.status === 401) return 'Unauthorized: login required.';
    if (xhr?.status === 403) return 'Forbidden: admin access required.';
    return fallback || 'Request failed.';
  }

  function handleAuthFailure(xhr) {
    const error = formatXhrError(xhr, 'Unable to load admin data.');
    showAdminError(error);
    if (xhr?.status === 401 || xhr?.status === 403) {
      localStorage.removeItem('token');
    }
    return error;
  }

  if (!token) {
    showAdminError('Admin page requires login. Please log in with an admin account.');
    return;
  }

  function verifyAdmin() {
    $.ajax({
      url: '/api/profile',
      method: 'GET',
      headers: authHeaders,
      success: function (user) {
        if (user.role !== 'admin') {
          showAdminError(`Access denied. You are logged in as ${user.role}. Admin access is required.`);
          return;
        }
        $('#adminCurrentUser').text(`Logged in as: ${user.name} (${user.email}) — role: ${user.role}`);
        fetchUsers();
        fetchItems();
        fetchOrders();
      },
      error: function (xhr) {
        const message = handleAuthFailure(xhr);
        showAdminError(message);
      },
    });
  }

  let editingUserId = null;

  function resetUserForm() {
    editingUserId = null;
    $('#userId').val('');
    $('#userName').val('');
    $('#userEmail').val('');
    $('#userPassword').val('');
    $('#userRole').val('');
    $('#userSubmitBtn').text('Create User');
    $('#cancelUserEditBtn').hide();
    $('#userPassword').prop('required', true);
  }

  function populateUserForm(user) {
    editingUserId = user.id;
    $('#userId').val(user.id);
    $('#userName').val(user.name);
    $('#userEmail').val(user.email);
    $('#userPassword').val('');
    $('#userRole').val(user.role);
    $('#userSubmitBtn').text('Update User');
    $('#cancelUserEditBtn').show();
    $('#userPassword').prop('required', false);
  }

  function fetchUsers() {
    $.ajax({
      url: '/api/admin/users',
      method: 'GET',
      headers: authHeaders,
      success: function (users) {
        showAdminError('');
        const rows = users.map((user) => `
          <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>${user.status}</td>
            <td>
              <button class="edit-user-btn" data-id="${user.id}" data-name="${encodeURIComponent(user.name)}" data-email="${encodeURIComponent(user.email)}" data-role="${user.role}">Edit</button>
              <button class="deactivate-btn" data-id="${user.id}">Deactivate</button>
              <button class="delete-user-btn" data-id="${user.id}">Delete</button>
            </td>
          </tr>
        `);
        $('#adminUsersTable tbody').html(rows.join(''));
      },
      error: function (xhr) {
        const message = handleAuthFailure(xhr);
        $('#adminUsersTable tbody').html(`<tr><td colspan="6">${message}</td></tr>`);
      },
    });
  }

  $('#userForm').submit(function (e) {
    e.preventDefault();
    const payload = {
      name: $('#userName').val(),
      email: $('#userEmail').val(),
      role: $('#userRole').val(),
    };

    if (!editingUserId) {
      payload.password = $('#userPassword').val();
    } else if ($('#userPassword').val()) {
      payload.password = $('#userPassword').val();
    }

    const method = editingUserId ? 'PATCH' : 'POST';
    const url = editingUserId ? `/api/admin/users/${editingUserId}` : '/api/register';
    
    console.log('Form submission:', { editingUserId, method, url, payload });

    $.ajax({
      url,
      method,
      headers: authHeaders,
      contentType: 'application/json',
      data: JSON.stringify(payload),
      success: function (res) {
        const action = editingUserId ? 'updated' : 'created';
        showAdminError(`User ${action} successfully.`);
        resetUserForm();
        fetchUsers();
        setTimeout(() => showAdminError(''), 2000);
      },
      error: function (xhr) {
        const msg = xhr?.responseJSON?.message || `User save failed (HTTP ${xhr.status})`;
        showAdminError(msg);
      },
    });
  });

  $('#cancelUserEditBtn').click(function () {
    resetUserForm();
  });

  $('#adminUsersTable').on('click', '.edit-user-btn', function () {
    const $btn = $(this);
    const user = {
      id: $btn.data('id'),
      name: decodeURIComponent($btn.data('name')),
      email: decodeURIComponent($btn.data('email')),
      role: $btn.data('role'),
    };
    populateUserForm(user);
  });

  $('#adminUsersTable').on('click', '.delete-user-btn', function () {
    const id = $(this).data('id');
    if (!confirm('Are you sure you want to delete this user?')) return;

    $.ajax({
      url: `/api/admin/users/${id}`,
      method: 'DELETE',
      headers: authHeaders,
      success: function () {
        showAdminError('User deleted.');
        fetchUsers();
        setTimeout(() => showAdminError(''), 2000);
      },
      error: function (xhr) {
        const msg = xhr?.responseJSON?.message || 'Unable to delete user';
        showAdminError(msg);
      },
    });
  });

  let editingItemId = null;

  function resetItemForm() {
    editingItemId = null;
    $('#itemId').val('');
    $('#itemName').val('');
    $('#itemDescription').val('');
    $('#itemPrice').val('');
    $('#itemStock').val('');
    $('#itemCategory').val('');
    $('#itemSubmitBtn').text('Create Item');
    $('#cancelEditBtn').hide();
  }

  function populateItemForm(item) {
    editingItemId = item.id;
    $('#itemId').val(item.id);
    $('#itemName').val(item.name);
    $('#itemDescription').val(item.description || '');
    $('#itemPrice').val(item.price);
    $('#itemStock').val(item.stock);
    $('#itemCategory').val(item.category_id || '');
    $('#itemSubmitBtn').text('Update Item');
    $('#cancelEditBtn').show();
  }

  function fetchItems() {
    $.ajax({
      url: '/api/admin/items',
      method: 'GET',
      headers: authHeaders,
      success: function (items) {
        const rows = items.map((item) => `
          <tr>
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.description || ''}</td>
            <td>${item.price}</td>
            <td>${item.stock}</td>
            <td>${item.category || ''}</td>
            <td>
              <button class="edit-item-btn" data-id="${item.id}" data-name="${encodeURIComponent(item.name)}" data-description="${encodeURIComponent(item.description || '')}" data-price="${item.price}" data-stock="${item.stock}" data-category_id="${item.category_id || ''}">Edit</button>
              <button class="delete-item-btn" data-id="${item.id}">Delete</button>
            </td>
          </tr>
        `);
        $('#adminItemsTable tbody').html(rows.join(''));
      },
      error: function (xhr) {
        const message = handleAuthFailure(xhr);
        $('#adminItemsTable tbody').html(`<tr><td colspan="7">${message}</td></tr>`);
      },
    });
  }

  function fetchOrders() {
    $.ajax({
      url: '/api/admin/orders',
      method: 'GET',
      headers: authHeaders,
      success: function (orders) {
        const rows = orders.map((order) => `
          <tr>
            <td>${order.id}</td>
            <td>${order.user_id}</td>
            <td>${order.amount}</td>
            <td>${order.status}</td>
            <td>${order.transaction_date}</td>
            <td>
              <button class="order-status-btn" data-id="${order.id}" data-status="completed">Completed</button>
              <button class="delete-order-btn" data-id="${order.id}">Delete</button>
            </td>
          </tr>
        `);
        $('#adminOrdersTable tbody').html(rows.join(''));
      },
      error: function (xhr) {
        const message = handleAuthFailure(xhr);
        $('#adminOrdersTable tbody').html(`<tr><td colspan="6">${message}</td></tr>`);
      },
    });
  }

  $('#itemForm').submit(function (e) {
    e.preventDefault();

    const payload = {
      name: $('#itemName').val(),
      description: $('#itemDescription').val(),
      price: parseFloat($('#itemPrice').val()),
      stock: parseInt($('#itemStock').val(), 10),
      category_id: $('#itemCategory').val() ? parseInt($('#itemCategory').val(), 10) : null,
    };

    const method = editingItemId ? 'PATCH' : 'POST';
    const url = editingItemId ? `/api/admin/items/${editingItemId}` : '/api/admin/items';

    $.ajax({
      url,
      method,
      headers: authHeaders,
      contentType: 'application/json',
      data: JSON.stringify(payload),
      success: function (res) {
        const action = editingItemId ? 'updated' : 'created';
        showAdminError(`Item ${action} successfully.`);
        resetItemForm();
        fetchItems();
        setTimeout(() => showAdminError(''), 2000);
      },
      error: function (xhr) {
        console.error('[ITEM SAVE] Error:', xhr.status, xhr.responseJSON);
        const msg = xhr?.responseJSON?.message || `Item save failed (HTTP ${xhr.status})`;
        showAdminError(msg);
      },
    });
  });

  $('#cancelEditBtn').click(function () {
    resetItemForm();
  });

  $('#adminItemsTable').on('click', '.edit-item-btn', function () {
    const $btn = $(this);
    const item = {
      id: $btn.data('id'),
      name: decodeURIComponent($btn.data('name')),
      description: decodeURIComponent($btn.data('description')),
      price: $btn.data('price'),
      stock: $btn.data('stock'),
      category_id: $btn.data('category_id'),
    };
    populateItemForm(item);
  });

  $('#adminItemsTable').on('click', '.delete-item-btn', function () {
    const id = $(this).data('id');
    $.ajax({
      url: `/api/admin/items/${id}`,
      method: 'DELETE',
      headers: authHeaders,
      success: function () {
        fetchItems();
        showAdminError('');
      },
      error: function (xhr) {
        const msg = xhr?.responseJSON?.message || 'Unable to delete item';
        showAdminError(msg);
      },
    });
  });

  $('#adminUsersTable').on('click', '.deactivate-btn', function () {
    const id = $(this).data('id');
    $.ajax({
      url: `/api/users/${id}/status`,
      method: 'PATCH',
      headers: authHeaders,
      contentType: 'application/json',
      data: JSON.stringify({ status: 'inactive' }),
      success: function () {
        fetchUsers();
        showAdminError('');
      },
      error: function (xhr) {
        const msg = xhr?.responseJSON?.message || 'Unable to deactivate user';
        showAdminError(msg);
      },
    });
  });

  $('#adminOrdersTable').on('click', '.order-status-btn', function () {
    const id = $(this).data('id');
    const status = $(this).data('status');
    $.ajax({
      url: `/api/admin/orders/${id}/status`,
      method: 'PATCH',
      headers: authHeaders,
      contentType: 'application/json',
      data: JSON.stringify({ status }),
      success: function () {
        fetchOrders();
        showAdminError('');
      },
      error: function (xhr) {
        const msg = xhr?.responseJSON?.message || 'Unable to update order status';
        showAdminError(msg);
      },
    });
  });

  $('#adminOrdersTable').on('click', '.delete-order-btn', function () {
    const id = $(this).data('id');
    $.ajax({
      url: `/api/admin/orders/${id}`,
      method: 'DELETE',
      headers: authHeaders,
      success: function () {
        fetchOrders();
        showAdminError('');
      },
      error: function (xhr) {
        const msg = xhr?.responseJSON?.message || 'Unable to delete order';
        showAdminError(msg);
      },
    });
  });

  verifyAdmin();
});
