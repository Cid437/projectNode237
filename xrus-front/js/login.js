$(document).ready(function () {
    const url = 'http://localhost:4000/'

    $('#loginForm').on('submit', function (e) {
        e.preventDefault();

        let email = $('#email').val()
        let password = $('#password').val()
        let user = {
            email,
            password
        }

        $.ajax({
            method: 'POST',
            url: `${url}api/v1/login`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            success: function (data) {
                console.log(data);
                Swal.fire({
                    text: data.message || 'Login successful',
                    showConfirmButton: false,
                    position: 'bottom-right',
                    timer: 1000,
                    timerProgressBar: true
                });
                sessionStorage.setItem('token', data.token)
                sessionStorage.setItem('userId', String(data.user.id))
                sessionStorage.setItem('role', data.user.role || 'customer')

                window.location.href = 'profile.html'
            },
            error: function (error) {
                console.log(error);
                Swal.fire({
                    icon: 'error',
                    text: error.responseJSON?.message || error.responseJSON?.error || 'Login failed',
                    showConfirmButton: false,
                    position: 'bottom-right',
                    timer: 1000,
                    timerProgressBar: true
                });
            }
        });
    });
});
