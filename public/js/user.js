$(document).ready(function () {
    $('#registerForm').on('submit', function (e) {
        e.preventDefault();

        $.ajax({
            method: 'POST',
            url: `${API_URL}/register`,
            data: JSON.stringify({
                name: $('#name').val(),
                email: $('#email').val(),
                password: $('#password').val()
            }),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            success: function () {
                $('#result').html('Register success');
                window.location.href = 'login.html';
            },
            error: function (error) {
                $('#result').html(error.responseJSON?.error || 'Register failed');
            }
        });
    });

    $('#loginForm').on('submit', function (e) {
        e.preventDefault();

        $.ajax({
            method: 'POST',
            url: `${API_URL}/login`,
            data: JSON.stringify({
                email: $('#email').val(),
                password: $('#password').val()
            }),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            success: function (data) {
                sessionStorage.setItem('token', JSON.stringify(data.token));
                sessionStorage.setItem('user', JSON.stringify(data.user));
                $('#result').html('Login successful');
                window.location.href = data.user.role === 'admin' ? 'item.html' : 'home.html';
            },
            error: function (error) {
                $('#result').html(error.responseJSON?.message || 'Login failed');
            }
        });
    });

    if ($('#usersTable').length) {
        protectPage('admin');
        const table = $('#usersTable').DataTable({
            ajax: {
                url: `${API_URL}/users`,
                dataSrc: 'rows',
                headers: authHeaders()
            },
            columns: [
                { data: 'id' },
                { data: 'name' },
                { data: 'email' },
                { data: 'role' },
                { data: 'status' },
                {
                    data: null,
                    render: function (row) {
                        return `<select class="role" data-id="${row.id}">
                            <option value="admin" ${row.role === 'admin' ? 'selected' : ''}>admin</option>
                            <option value="user" ${row.role === 'user' ? 'selected' : ''}>user</option>
                            <option value="guest" ${row.role === 'guest' ? 'selected' : ''}>guest</option>
                        </select>
                        <button class="deactivate danger" data-id="${row.id}">Deactivate</button>`;
                    }
                }
            ]
        });

        $('#usersTable').on('change', '.role', function () {
            $.ajax({
                method: 'PUT',
                url: `${API_URL}/users/${$(this).data('id')}/role`,
                data: JSON.stringify({ role: $(this).val() }),
                headers: authHeaders(),
                contentType: 'application/json; charset=utf-8',
                success: function () {
                    table.ajax.reload();
                }
            });
        });

        $('#usersTable').on('click', '.deactivate', function () {
            $.ajax({
                method: 'DELETE',
                url: `${API_URL}/users/${$(this).data('id')}/deactivate`,
                headers: authHeaders(),
                success: function () {
                    table.ajax.reload();
                }
            });
        });
    }

    $('#logout').on('click', function (e) {
        e.preventDefault();
        sessionStorage.clear();
        window.location.href = 'login.html';
    });
});
