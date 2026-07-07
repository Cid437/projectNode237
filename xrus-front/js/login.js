$(document).ready(function () {
    const url = 'http://localhost:4000/'

    const resetLoginValidation = () => {
        ['#email', '#password'].forEach((selector) => {
            const $field = $(selector);
            $field.removeClass('is-invalid');
            $field.siblings('.invalid-feedback').text('');
        });
    };

    const validateLoginForm = () => {
        resetLoginValidation();
        let valid = true;

        const email = $('#email').val().trim();
        const password = $('#password').val();

        if (!email) {
            $('#email').addClass('is-invalid').siblings('.invalid-feedback').text('Email is required.');
            valid = false;
        } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            $('#email').addClass('is-invalid').siblings('.invalid-feedback').text('Enter a valid email address.');
            valid = false;
        }
        if (!password) {
            $('#password').addClass('is-invalid').siblings('.invalid-feedback').text('Password is required.');
            valid = false;
        }

        return valid;
    };

    // Header is injected by helpers.js

    $('#loginForm').on('submit', function (e) {
        e.preventDefault();

        if (!validateLoginForm()) {
            return;
        }

        let email = $('#email').val().trim()
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