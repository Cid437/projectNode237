(function () {
    const baseUrl = 'http://localhost:4000/'

    window.xrusHelpers = {
        baseUrl: baseUrl,
        getToken: function () {
            let token = sessionStorage.getItem('token');
            if (!token) {
                return null;
            }
            token = token.replace(/^"|"$/g, '');
            return token || null;
        },
        getRole: function () {
            return (sessionStorage.getItem('role') || 'customer').toLowerCase();
        },
        getCart: function () {
            const cart = localStorage.getItem('cart');
            return cart ? JSON.parse(cart) : [];
        },
        saveCart: function (cart) {
            localStorage.setItem('cart', JSON.stringify(cart));
        },
        updateCartBadge: function () {
            const count = this.getCart().reduce(function (sum, item) {
                return sum + (parseInt(item.quantity || 0, 10));
            }, 0);
            const badge = $('#itemCount');
            if (!badge.length) {
                return;
            }
            badge.text(count).css('display', count ? 'block' : 'none');
        },
        applyHeaderState: function () {
            const role = this.getRole();
            $('.admin-only').toggle(role === 'admin');

            const loginLink = $('a.nav-link[href="login.html"]');
            if (!loginLink.length) {
                return;
            }

            const token = this.getToken();
            const userId = sessionStorage.getItem('userId');
            if (token && userId) {
                loginLink.text('Logout').attr({ href: '#!', id: 'logout-link' }).off('click').on('click', function (e) {
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
            } else {
                loginLink.text('Login').attr({ href: 'login.html', id: '' }).off('click');
            }
        }
    };
})();
