$(document).ready(function () {
    function renderCart() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        let total = 0;
        $('#cartItems').empty();

        $.each(cart, function (key, item) {
            const lineTotal = item.price * item.quantity;
            total += lineTotal;
            $('#cartItems').append(`<div class="card">
                <strong>${item.name}</strong>
                <p>${item.quantity} x ${item.price} = ${lineTotal}</p>
            </div>`);
        });

        $('#cartTotal').text(total.toFixed(2));
    }

    renderCart();

    $('#checkoutBtn').on('click', function () {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const amount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

        $.ajax({
            method: 'POST',
            url: `${API_URL}/transactions`,
            data: JSON.stringify({ amount, status: 'pending' }),
            headers: authHeaders(),
            contentType: 'application/json; charset=utf-8',
            success: function () {
                localStorage.removeItem('cart');
                window.location.href = 'myorders.html';
            },
            error: function () {
                window.location.href = 'login.html';
            }
        });
    });
});
