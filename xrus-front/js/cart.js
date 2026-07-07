$(document).ready(function () {
    const url = 'http://localhost:4000'
    const buildImageUrl = (image) => {
        if (!image) return '';
        if (/^https?:\/\//i.test(image)) return image;
        if (image.startsWith('/')) return `${url}${image}`;
        if (image.startsWith('images/')) return `${url}/${image}`;
        return `${url}/images/${image}`;
    }

    // NOTE: use xrusHelpers.getCart()/saveCart() instead of local
    // localStorage('cart') copies — these are scoped per logged-in user
    // so different accounts (and guests) no longer share the same cart.
    function getCart() {
        return xrusHelpers.getCart();
    }

    function saveCart(cart) {
        xrusHelpers.saveCart(cart);
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

    // Shows the logged-in user's own orders (order number, payment method,
    // total, payment status, order status). Guests can still view the cart
    // page, so this only fetches/renders when a token actually exists —
    // it checks sessionStorage directly instead of calling getToken(),
    // which would pop a login warning and redirect guests away.
    function renderMyOrders() {
        const rawToken = sessionStorage.getItem('token');
        if (!rawToken) {
            $('#myOrdersTable').html('<p>Log in to view your order history.</p>');
            return;
        }
        const token = rawToken.replace(/^"|"$/g, '');

        $.ajax({
            method: 'GET',
            url: `${url}/api/v1/orders/me`,
            dataType: 'json',
            headers: { Authorization: 'Bearer ' + token },
            success: function (data) {
                const rows = Array.isArray(data.rows) ? data.rows : [];

                if (!rows.length) {
                    $('#myOrdersTable').html('<p>You have no orders yet.</p>');
                    return;
                }

                let html = `<table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Payment Method</th>
                            <th>Total</th>
                            <th>Payment Status</th>
                            <th>Order Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>`;

                rows.forEach((order) => {
                    html += `<tr>
                        <td>${order.order_number}</td>
                        <td>${order.payment_method || ''}</td>
                        <td>₱ ${Number(order.total_amount || 0).toFixed(2)}</td>
                        <td>${order.payment_status || 'Pending'}</td>
                        <td>${order.order_status || 'Pending'}</td>
                        <td>${order.created_at ? new Date(order.created_at).toLocaleString() : ''}</td>
                    </tr>`;
                });

                html += '</tbody></table>';
                $('#myOrdersTable').html(html);
            },
            error: function (error) {
                console.log(error);
            }
        });
    }

    // Only used inside the checkout flow now — login is enforced at the
    // point of checking out, not just for viewing/using the cart page.
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

        const userId = sessionStorage.getItem('userId');
        const token = getToken();
        if (!token) return;

        // Profile details are required before checkout, since shipping_address
        // is built from them and previously wasn't being sent at all.
        $.ajax({
            method: 'GET',
            url: `${url}/api/v1/profile`,
            dataType: 'json',
            headers: { Authorization: 'Bearer ' + token },
            success: function (data) {
                const profile = data.user || {};

                if (!profile.address || !profile.phone || !profile.town || !profile.zipcode) {
                    Swal.fire({
                        icon: 'warning',
                        text: 'Please complete your profile (address, phone, town, zipcode) before checking out.'
                    }).then(() => {
                        window.location.href = 'profile.html';
                    });
                    return;
                }

                const shippingAddress = `${profile.address}, ${profile.town}, ${profile.zipcode}`;
                const paymentMethod = $('#paymentMethod').val() || 'Cash';
                const payload = JSON.stringify({
                    cart,
                    userId,
                    payment_method: paymentMethod,
                    shipping_address: shippingAddress
                });

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
                        saveCart([]);
                        renderCart();
                        renderMyOrders();
                    },
                    error: function (error) {
                        console.log(error);
                        const response = error.responseJSON || {};

                        // Server tells us exactly which items are stale/out of
                        // stock. Fix the cart instead of leaving the same bad
                        // item stuck in it forever (which was causing checkout
                        // to fail on every retry).
                        if (response.unavailable_items || response.insufficient_items) {
                            let currentCart = getCart();
                            const unavailableIds = (response.unavailable_items || []).map(id => String(id));
                            const insufficientMap = {};
                            (response.insufficient_items || []).forEach(entry => {
                                insufficientMap[String(entry.item_id)] = entry.available;
                            });

                            currentCart = currentCart.filter(item => !unavailableIds.includes(String(item.item_id)));
                            currentCart.forEach(item => {
                                const key = String(item.item_id);
                                if (insufficientMap.hasOwnProperty(key)) {
                                    item.stock = insufficientMap[key];
                                    item.quantity = Math.min(item.quantity, Math.max(insufficientMap[key], 1));
                                }
                            });

                            saveCart(currentCart);
                            renderCart();

                            Swal.fire({
                                icon: 'warning',
                                text: response.error || 'Some items in your cart are no longer available and have been updated. Please review your cart and try again.'
                            });
                            return;
                        }

                        Swal.fire({
                            icon: 'error',
                            text: response.error || 'Order failed'
                        });
                    }
                });
            },
            error: function (error) {
                console.log(error);
                Swal.fire({ icon: 'error', text: 'Unable to verify your profile. Please try again.' });
            }
        });
    });

    renderCart()
    renderMyOrders()

})