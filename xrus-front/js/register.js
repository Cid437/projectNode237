$(document).ready(function () {
    const url = 'http://localhost:4000/'

    const resetRegisterValidation = () => {
        ['#name', '#email', '#password'].forEach((selector) => {
            const $field = $(selector);
            $field.removeClass('is-invalid');
            $field.siblings('.invalid-feedback').text('');
        });
    };

    const validateRegisterForm = () => {
        resetRegisterValidation();
        let valid = true;

        const name = $('#name').val().trim();
        const email = $('#email').val().trim();
        const password = $('#password').val();

        if (!name) {
            $('#name').addClass('is-invalid').siblings('.invalid-feedback').text('Name is required.');
            valid = false;
        }
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
        } else if (password.length < 6) {
            $('#password').addClass('is-invalid').siblings('.invalid-feedback').text('Password must be at least 6 characters.');
            valid = false;
        }

        return valid;
    };

    // Header is injected by helpers.js

    $('#registerForm').on('submit', function (e) {
        e.preventDefault();

        if (!validateRegisterForm()) {
            return;
        }

        let name = $('#name').val().trim()
        let email = $('#email').val().trim()
        let password = $('#password').val()
        let user = {
            name,
            email,
            password,
            username: email.split('@')[0]
        }

        $.ajax({
            method: 'POST',
            url: `${url}api/v1/register`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            success: function (data) {
                console.log(data);
                $('#registerForm')[0].reset();
                Swal.fire({
                    icon: 'success',
                    text: data.message || 'Register success',
                    position: 'bottom-right'
                });
            },
            error: function (error) {
                console.log(error);
                Swal.fire({
                    icon: 'error',
                    text: error.responseJSON?.message || error.responseJSON?.error || 'Registration failed',
                    position: 'bottom-right'
                });
            }
        });
    });

    $('#avatar').on('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                $('#avatarPreview').attr('src', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
});