$(document).ready(function () {
    const url = 'http://localhost:4000';
    const buildImageUrl = (image) => {
        if (!image) return '';
        if (/^https?:\/\//i.test(image)) return image;
        return image.startsWith('/') ? `${url}${image}` : `${url}/${image}`;
    };

    $('#avatar').on('change', function () {
        // Don't show a preview before the image is actually uploaded and saved.
        // The avatar preview should reflect the saved profile image only.
        $('#avatarPreview').hide();
    });

    $('#profileForm').on('submit', function (event) {
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

        // FormData($('#profileForm')[0]) already picks up every named field
        // (fname, lname, addressline, phone, town, zipcode, image) straight
        // from the form. Re-appending fname/lname/addressline/phone here
        // duplicated those keys, which made multer parse them back as
        // arrays instead of strings and broke the update on the backend.
        // Only userId needs to be added since it isn't a form field.
        let formData = new FormData($('#profileForm')[0]);
        formData.append('userId', userId)

        $.ajax({
            method: 'POST',
            url: `${url}/api/v1/update-profile`,
            data: formData,
            contentType: false,
            processData: false,
            dataType: 'json',
            headers: {
                Authorization: 'Bearer ' + token
            },
            success: function (data) {
                console.log(data);
                if (data.user && data.user.image_url) {
                    try {
                        const src = data.user.image_url;
                        const imageUrl = buildImageUrl(src);
                        console.log('profile: avatar URL ->', imageUrl);
                        $('#avatarPreview').attr('src', imageUrl).show();
                    } catch (e) {
                        console.error('profile: invalid image url', data.user.image_url, e);
                        $('#avatarPreview').hide();
                    }
                }
                Swal.fire({
                    icon: 'success',
                    text: data.message || 'Profile updated',
                    position: 'bottom-right'
                });
            },
            error: function (error) {
                console.log(error);
                Swal.fire({
                    icon: 'error',
                    text: error.responseJSON?.message || error.responseJSON?.error || 'Profile update failed',
                    position: 'bottom-right'
                });
            }
        });
    });

  $('#profile').load('header.html', function () {
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');

    if (!token || !userId) {
        window.location.href = 'login.html';
        return;
    }

    const role = sessionStorage.getItem('role') || 'customer';
    $('.admin-only').toggle(role === 'admin');

    const $loginLink = $('a.nav-link[href="login.html"]');
    $loginLink.text('Logout').attr({ href: '#!', id: 'logout-link' }).on('click', function (e) {
        e.preventDefault();
        Swal.fire({ text: 'logout', showConfirmButton: false, position: 'bottom-right', timer: 1000, timerProgressBar: true });
        sessionStorage.clear();
        window.location.href = 'login.html';
    });

    // NEW: load existing profile data
    $.ajax({
        method: 'GET',
        url: `${url}/api/v1/profile`,
        dataType: 'json',
        headers: { Authorization: 'Bearer ' + token.replace(/^"|"$/g, '') },
            success: function (data) {
            const user = data.user || {};
            $('#firstName').val(user.first_name || '');
            $('#lastName').val(user.last_name || '');
            $('#address').val(user.address || '');
            $('#phone').val(user.phone || '');
            $('#town').val(user.town || '');
            $('#zipcode').val(user.zipcode || '');

            if (user.image_url) {
                try {
                    const imageUrl = buildImageUrl(user.image_url);
                    $('#avatarPreview').attr('src', imageUrl).show();
                } catch (e) {
                    console.error('profile: invalid image url', user.image_url, e);
                    $('#avatarPreview').hide();
                }
            } else {
                $('#avatarPreview').hide();
            }
        },
        error: function (error) {
            console.log(error);
        }
    });
  });
});