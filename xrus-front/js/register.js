$(document).ready(function () {
    const url = 'http://localhost:4000/'

    $('#registerForm').on('submit', function (e) {
        e.preventDefault();

        let name = $('#name').val()
        let email = $('#email').val()
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
