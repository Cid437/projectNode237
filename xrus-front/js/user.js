$(document).ready(function () {
    const url = 'http://localhost:4000/'

    $("#registerForm").on('submit', function (e) {
        e.preventDefault();
        let name = $("#name").val()
        let email = $("#email").val()
        let password = $("#password").val()
        let user = {
            name,
            email,
            password,
            username: email.split('@')[0]
        }
        $.ajax({
            method: "POST",
            url: `${url}api/v1/register`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
            success: function (data) {
                console.log(data);
                $("#registerForm")[0].reset();
                Swal.fire({
                    icon: "success",
                    text: data.message || "register success",
                    position: 'bottom-right'

                });
            },
            error: function (error) {
                console.log(error);
                Swal.fire({
                    icon: "error",
                    text: error.responseJSON?.message || error.responseJSON?.error || 'Registration failed',
                    position: 'bottom-right'
                });
            }
        });
    });

    $('#avatar').on('change', function () {
        const file = this.files[0];
        // console.log(this.files[0])
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                console.log(e.target.result)
                $('#avatarPreview').attr('src', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    $("#loginForm").on('submit', function (e) {
        e.preventDefault();

        let email = $("#email").val()
        let password = $("#password").val()
        let user = {
            email,
            password
        }
        $.ajax({
            method: "POST",
            url: `${url}api/v1/login`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
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
                    icon: "error",
                    text: error.responseJSON?.message || error.responseJSON?.error || 'Login failed',
                    showConfirmButton: false,
                    position: 'bottom-right',
                    timer: 1000,
                    timerProgressBar: true

                });
            }
        });
    });

    $("#profileForm").on('submit', function (event) {
        event.preventDefault();
        let userId = sessionStorage.getItem('userId')
        let token = sessionStorage.getItem('token')

        if (!token || !userId) {
            Swal.fire({
                icon: 'warning',
                text: 'You must be logged in to update your profile.',
                position: 'bottom-right'
            });
            return;
        }
        token = token.replace(/^"|"$/g, '');

        var data = $('#profileForm')[0];

        let formData = new FormData(data);
        formData.append('userId', userId)
        formData.append('fname', $('#firstName').val())
        formData.append('lname', $('#lastName').val())
        formData.append('addressline', $('#address').val())
        formData.append('phone', $('#phone').val())

        $.ajax({
            method: "POST",
            url: `${url}api/v1/update-profile`,
            data: formData,
            contentType: false,
            processData: false,
            dataType: "json",
            headers: {
                "Authorization": "Bearer " + token
            },
            success: function (data) {
                console.log(data);
                Swal.fire({
                    icon: "success",
                    text: data.message || 'Profile updated',
                    position: 'bottom-right'
                });
            },
            error: function (error) {
                console.log(error);
                Swal.fire({
                    icon: "error",
                    text: error.responseJSON?.message || error.responseJSON?.error || 'Profile update failed',
                    position: 'bottom-right'
                });
            }
        });
    });

    $("#deactivateBtn").on('click', function (e) {
        e.preventDefault();
        let email = $("#email").val()
        let user = {
            email,
        }
        $.ajax({
            method: "DELETE",
            url: `${url}api/v1/deactivate`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
            success: function (data) {
                console.log(data);
                Swal.fire({
                    text: data.message,
                    showConfirmButton: false,
                    position: 'bottom-right',
                    timer: 2000,
                    timerProgressBar: true
                });
                sessionStorage.removeItem('userId')
                sessionStorage.removeItem('token')
                sessionStorage.removeItem('role')
                window.location.href = 'home.html'
            },
            error: function (error) {
                console.log(error);
            }
        });
    });

    $("#logout").on('click', function (e) {
        e.preventDefault();
        Swal.fire({
            text: 'logout',
            showConfirmButton: false,
            position: 'bottom-right',
            timer: 1000,
            timerProgressBar: true

        });
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('userId')
        sessionStorage.removeItem('role')
        window.location.href = 'login.html'

    });

    $("#profile").load("header.html", function () {
        const token = sessionStorage.getItem('token');
        const userId = sessionStorage.getItem('userId');

        if (!token || !userId) {
            window.location.href = 'login.html';
            return;
        }

        const role = sessionStorage.getItem('role') || 'customer';
        $('.admin-only').toggle(role === 'admin');

        const $loginLink = $('a.nav-link[href="login.html"]');
        $loginLink.text('Logout').attr({ 'href': '#!', 'id': 'logout-link' }).on('click', function (e) {
            e.preventDefault();
            Swal.fire({
                text: 'logout',
                showConfirmButton: false,
                position: 'bottom-right',
                timer: 1000,
                timerProgressBar: true

            });
            sessionStorage.clear();
            window.location.href = 'login.html';
        });
    });
})
