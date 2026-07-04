$(document).ready(function () {
    const url = 'http://localhost:4000/'
    var itemCount = 0;
    var allItems = [];

    const getCart = () => {
        let cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    };

    const saveCart = cart => {
        localStorage.setItem('cart', JSON.stringify(cart));
    };

    const renderProducts = (items) => {
        const grid = $('#productsGrid');
        grid.empty();

        if (!items.length) {
            grid.html('<div class="alert alert-secondary">No products found.</div>');
            return;
        }

        let row;
        items.forEach((value, key) => {
            if (key % 4 === 0) {
                row = $('<div class="row"></div>');
                grid.append(row);
            }

            const item = `<div class="col-md-3 mb-4">
                <div class="card h-100">
                <img src="${url}${value.image}" class="card-img-top" alt="${value.name}" >
                <div class="card-body">
                <h5 class="card-title">${value.name}</h5>
                <p class="card-text">₱ ${value.sell_price}</p>
                <p class="card-text"><small class="text-muted">Stock: ${value.stock ?? 0}</small></p>
                <a href="#!" class="btn btn-primary show-details" role="button" data-id="${value.id}" data-name="${value.name}" data-description="${value.description || ''}" data-price="${value.sell_price}" data-image="${value.image}" data-stock="${value.stock ?? 0}">Details</a>
                </div>
                </div>
                </div>`;
            row.append(item);
        });
    };

    $.ajax({
        method: 'GET',
        url: `${url}api/v1/items`,
        dataType: 'json',
        success: function (data) {
            allItems = Array.isArray(data.rows) ? data.rows : [];
            renderProducts(allItems);

            $('#homeSearch').on('input', function () {
                const query = $(this).val().toLowerCase().trim();
                if (!query) {
                    renderProducts(allItems);
                    return;
                }
                const filtered = allItems.filter(item => item.name.toLowerCase().includes(query));
                renderProducts(filtered);
            });

            if ($('#productDetailsModal').length === 0) {
                $('body').append(`
                    <div class="modal fade" id="productDetailsModal" tabindex="-1" role="dialog" aria-labelledby="productDetailsModalLabel" aria-hidden="true">
                      <div class="modal-dialog modal-dialog-centered" role="document">
                        <div class="modal-content">
                          <div class="modal-header">
                            <h5 class="modal-title" id="productDetailsModalLabel"></h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                              <span aria-hidden="true">&times;</span>
                            </button>
                          </div>
                          <div class="modal-body text-center" id="productDetailsModalBody"></div>
                        </div>
                      </div>
                    </div>`);
            }

            $(document).off('click', '.show-details').on('click', '.show-details', function (e) {
                e.preventDefault();
                const id = $(this).data('id');
                const name = $(this).data('name');
                const description = $(this).data('description');
                const price = $(this).data('price');
                const image = $(this).data('image');
                const stock = $(this).data('stock');

                $('#productDetailsModalLabel').text(name);
                $('#productDetailsModalBody').html(`
                    <img src="${image ? `${url}${image}` : ''}" class="img-fluid mb-3" style="max-height:200px;">
                    <p>${description || 'No description available.'}</p>
                    <p id="price">Price: ₱<strong>${price}</strong></p>
                    <p>Stock: ${stock}</p>
                    <input type="number" class="form-control mb-3" id="detailsQty" min="1" max="${stock}" value="1">
                    <input type="hidden" id="detailsItemId" value="${id}">
                    <button type="button" class="btn btn-primary" id="detailsAddToCart">Add to Cart</button>
                `);
                $('#productDetailsModal').modal('show');
            });
        },
        error: function (error) {
            console.log(error);
        }
    });

    $(document).off('click', '#detailsAddToCart').on('click', '#detailsAddToCart', function (e) {
        e.preventDefault();
        const qty = parseInt($('#detailsQty').val(), 10) || 1;
        const id = parseInt($('#detailsItemId').val(), 10);
        const description = $('#productDetailsModalLabel').text();
        const price = $('#productDetailsModalBody strong').text().replace(/[^\d.]/g, '');
        const image = $('#productDetailsModalBody img').attr('src');
        const stock = parseInt($('#productDetailsModalBody p:contains("Stock")').text().replace(/[^\d]/g, ''), 10) || 0;
        let cart = getCart();

        let existing = cart.find(item => item.item_id == id);
        if (existing) {
            existing.quantity += qty;
        } else {
            cart.push({ item_id: id, description, price: parseFloat(price), image, stock, quantity: qty });
        }
        saveCart(cart);

        itemCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        $('#itemCount').text(itemCount).css('display', 'block');
        $('#productDetailsModal').modal('hide');
        Swal.fire({ icon: 'success', text: 'Item added to cart', timer: 1000, showConfirmButton: false });
    });

    $('#home').load('header.html', function () {
        const role = sessionStorage.getItem('role') || 'customer';
        $('.admin-only').toggle(role === 'admin');
        $('#roleNotice').text(role === 'admin' ? 'Admin view: you can access items and dashboard.' : 'Customer view: you can browse products and place orders.').show();
    });
});