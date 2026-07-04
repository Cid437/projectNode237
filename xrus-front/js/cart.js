$(document).ready(function () {
    const url = 'http://localhost:4000'
    const buildImageUrl = (image) => {
        if (!image) return '';
        if (/^https?:\/\//i.test(image)) return image;
        if (image.startsWith('/')) return `${url}${image}`;
        if (image.startsWith('images/')) return `${url}/${image}`;
        return `${url}/images/${image}`;
    }

    function getCart() {
        let cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    }

    function saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function renderCart() {
        let cart = getCart();
        let html = '';
        let total = 0;
        if (cart.length === 0) {
            html = '<p>Your cart is empty.</p>';
        } else {
            html = `<table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Description</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Subtotal</th>
                        <th>Remove</th>
                    </tr>
                </thead>
                <tbody>`;
            cart.forEach((item, idx) => {
                let price = Number(item.price || 0);
                let subtotal = price * item.quantity;
                total += subtotal;
                html += `<tr>
                    <td><img src="${buildImageUrl(item.image)}" width="60"></td>
                    <td>${item.description}</td>
                    <td>₱ ${price.toFixed(2)}</td>
                    <td>
                        <input type="number" class="form-control form-control-sm cart-qty" data-idx="${idx}" min="1" max="${item.stock || 999}" value="${item.quantity}">
                    </td>
                    <td>₱ ${(subtotal).toFixed(2)}</td>
                    <td><button class="btn btn-danger btn-sm remove-item" data-idx="${idx}">&times;</button></td>
                </tr>`;
            });
            html += `</tbody></table>
                <h4>Total: ₱ ${total.toFixed(2)}</h4>`;
        }

        $('#cartTable').html(html);
    }

    // function getUserId() {
    //     let userId = sessionStorage.getItem('userId');

    //     return userId ?? '';
    // }

    const getToken = () => {
        let token = sessionStorage.getItem('token');
        if (!token) {
            Swal.fire({
                icon: 'warning',
                text: 'You must be logged in to access this page.',
                showConfirmButton: true
            }).then(() => {
                window.location.href = 'login.html';
            });
            return;
        }
        token = token.replace(/^"|"$/g, '');
        return token
    }

    $('#cartTable').on('click', '.remove-item', function () {
        let idx = $(this).data('idx');
        let cart = getCart();
        cart.splice(idx, 1);
        saveCart(cart);
        renderCart();
    });

    $('#cartTable').on('change', '.cart-qty', function () {
        let idx = $(this).data('idx');
        let quantity = parseInt($(this).val(), 10);
        let max = parseInt($(this).attr('max'), 10);
        let cart = getCart();

        if (!quantity || quantity < 1) {
            quantity = 1;
        }

        if (max && quantity > max) {
            quantity = max;
        }

        cart[idx].quantity = quantity;
        saveCart(cart);
        renderCart();
    });

    $('#home').load("header.html");

    $('#checkoutBtn').on('click', function () {

        let cart = getCart()

        if (!cart.length) {
            Swal.fire({
                icon: 'warning',
                text: 'Your cart is empty'
            });
            return;
        }

        console.log(JSON.stringify(cart));

        const userId = sessionStorage.getItem('userId');
        const payload = JSON.stringify({ cart, userId, payment_method: 'Cash' });
        const token = getToken();
        if (token) {
            $.ajax({
                type: "POST",
                url: `${url}/api/v1/create-order`,
                data: payload,
                dataType: "json",
                processData: false,
                contentType: 'application/json; charset=utf-8',
                headers: {
                    "Authorization": "Bearer " + token
                },
                success: function (data) {
                    console.log(data);
                    Swal.fire({
                        icon: "success",
                        text: data.message || 'Order created successfully',
                    });
                    localStorage.removeItem('cart');
                    renderCart();
                },
                error: function (error) {
                    console.log(error);
                    Swal.fire({
                        icon: 'error',
                        text: error.responseJSON?.error || 'Order failed'
                    });
                }
            });
        }


    });

    renderCart()

})
