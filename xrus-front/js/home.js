$(document).ready(function () {
    const url = 'http://localhost:4000';
    const PAGE_SIZE = 8;
    var itemCount = 0;
    var allItems = [];
    var infiniteLoadedCount = 0;
    var isSearchMode = false;

    const buildImageUrl = (image) => {
        if (!image) return '';
        const cleaned = image.replace(/\\/g, '/').trim();
        if (/^https?:\/\//i.test(cleaned)) return cleaned;
        let relative = cleaned.replace(/^\/+/, '');
        if (!relative.toLowerCase().startsWith('images/')) {
            const match = relative.match(/(?:.*\/)?(images\/.+)$/i);
            if (match) {
                relative = match[1];
            }
        }
        return `${url}/${relative}`;
    };

    // Load the shared header into the #home container (no extra callback logic)
    $('#home').load('header.html');
    // Load shared footer
    $('#siteFooter').load('footer.html');

    // NOTE: use xrusHelpers.getCart()/saveCart() — scoped per logged-in
    // user (or guest) instead of one shared localStorage('cart') key.
    const getCart = () => xrusHelpers.getCart();
    const saveCart = (cart) => xrusHelpers.saveCart(cart);

    const buildCard = (value) => `<div class="col-md-3 mb-4">
        <div class="card h-100">
        <img src="${buildImageUrl(value.image)}" class="card-img-top" alt="${value.name}">
        <div class="card-body">
        <h5 class="card-title">${value.name}</h5>
        <p class="card-text">₱ ${value.sell_price}</p>
        <p class="card-text"><small class="text-muted">Stock: ${value.stock ?? 0}</small></p>
        <a href="#!" class="btn btn-primary show-details" role="button" data-id="${value.id}" data-name="${value.name}" data-description="${value.description || ''}" data-price="${value.sell_price}" data-image="${value.image}" data-stock="${value.stock ?? 0}">Details</a>
        </div>
        </div>
        </div>`;

    const appendProducts = (items) => {
        items.forEach(value => $('#productsGrid').append(buildCard(value)));
    };

    // Default browsing mode: infinite scroll
    const renderInfiniteBatch = (reset) => {
        if (reset) {
            $('#productsGrid').empty();
            infiniteLoadedCount = 0;
        }
        if (!allItems.length) {
            $('#productsGrid').html('<div class="alert alert-secondary">No products found.</div>');
            $('#homeLoading').hide();
            return;
        }
        const nextItems = allItems.slice(infiniteLoadedCount, infiniteLoadedCount + PAGE_SIZE);
        appendProducts(nextItems);
        infiniteLoadedCount += nextItems.length;
        $('#homeLoading').toggle(infiniteLoadedCount < allItems.length);
    };

    // Search mode: numbered pagination
    const renderPaginationControls = (totalItems, page) => {
        const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
        const nav = $('#homePagination');
        nav.empty();
        if (totalPages <= 1) return;
        for (let p = 1; p <= totalPages; p++) {
            nav.append(`<button type="button" class="btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline-primary'} mr-1 page-btn" data-page="${p}">${p}</button>`);
        }
    };

    const renderSearchPage = (filteredItems, page) => {
        $('#productsGrid').empty();
        if (!filteredItems.length) {
            $('#productsGrid').html('<div class="alert alert-secondary">No products found.</div>');
            $('#homePagination').empty();
            return;
        }
        const start = (page - 1) * PAGE_SIZE;
        appendProducts(filteredItems.slice(start, start + PAGE_SIZE));
        renderPaginationControls(filteredItems.length, page);
    };

    $(window).on('scroll', function () {
        if (isSearchMode) return;
        if ($(window).scrollTop() + $(window).height() >= $(document).height() - 150) {
            if (infiniteLoadedCount < allItems.length) {
                renderInfiniteBatch(false);
            }
        }
    });

    $(document).on('click', '.page-btn', function () {
        const page = parseInt($(this).data('page'), 10);
        const query = $('#homeSearch').val().toLowerCase().trim();
        const filtered = allItems.filter(item => item.name.toLowerCase().includes(query));
        renderSearchPage(filtered, page);
    });

    $.ajax({
        method: 'GET',
        url: `${url}/api/v1/items`,
        dataType: 'json',
        success: function (data) {
            allItems = Array.isArray(data.rows) ? data.rows : [];
            renderInfiniteBatch(true);

            // Item details modal + live search filtering are set up FIRST,
            // before autocomplete, so they always work even if the
            // autocomplete widget below fails to initialize for any reason.
            $('#homeSearch').on('input', function () {
                const query = $(this).val().toLowerCase().trim();
                if (!query) {
                    isSearchMode = false;
                    $('#homePagination').empty();
                    $('#homeLoading').toggle(infiniteLoadedCount < allItems.length);
                    renderInfiniteBatch(true);
                    return;
                }
                isSearchMode = true;
                $('#homeLoading').hide();
                const filtered = allItems.filter(item => item.name.toLowerCase().includes(query));
                renderSearchPage(filtered, 1);
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

                // Fetch the full item (including images) from the API so we
                // can show every picture the item has in the modal.
                $.ajax({
                    method: 'GET',
                    url: `${url}/api/v1/items/${id}`,
                    dataType: 'json',
                    success: function (data) {
                        const item = data.result || {};
                        const images = Array.isArray(data.images) ? data.images : [];
                        const mainImage = images.length ? images[0].image_path : item.image || '';
                        const stock = item.stock || 0;

                        $('#productDetailsModalLabel').text(item.name || 'Item');

                        let galleryHtml = '';
                        if (mainImage) {
                            galleryHtml += `<img id="detailsMainImage" src="${buildImageUrl(mainImage)}" class="img-fluid mb-3" style="max-height:300px;">`;
                        } else {
                            galleryHtml += `<div class="mb-3">No image available</div>`;
                        }

                        if (images.length > 1) {
                            galleryHtml += '<div class="d-flex justify-content-center mb-3" id="detailsThumbs">';
                            images.forEach(img => {
                                const src = buildImageUrl(img.image_path);
                                galleryHtml += `<img src="${src}" class="img-thumbnail mr-2 details-thumb" style="width:80px;height:80px;object-fit:cover;cursor:pointer;">`;
                            });
                            galleryHtml += '</div>';
                        }

                        $('#productDetailsModalBody').html(`
                            ${galleryHtml}
                            <p>${item.description || 'No description available.'}</p>
                            <p id="price">Price: ₱<strong>${item.sell_price || 0}</strong></p>
                            <p>Stock: ${stock}</p>
                            <input type="hidden" id="detailsItemId" value="${id}">
                            ${stock > 0 ? `
                                <input type="number" class="form-control mb-3" id="detailsQty" min="1" max="${stock}" value="1">
                                <button type="button" class="btn btn-primary" id="detailsAddToCart">Add to Cart</button>
                            ` : `
                                <p class="text-danger"><strong>Out of stock</strong></p>
                                <button type="button" class="btn btn-secondary" disabled>Add to Cart</button>
                            `}
                        `);

                        // Thumbnail click swaps main image
                        $(document).off('click', '.details-thumb').on('click', '.details-thumb', function () {
                            const src = $(this).attr('src');
                            $('#detailsMainImage').attr('src', src);
                        });

                        $('#productDetailsModal').modal('show');
                    },
                    error: function (err) {
                        console.log(err);
                        Swal.fire({ icon: 'error', text: 'Unable to load item details.' });
                    }
                });
            });

            // Autocomplete is an addition on top of the live filter above,
            // not a replacement for it — select() reuses the same 'input'
            // handler by triggering it.
            $('#homeSearch').autocomplete({
                source: function (request, response) {
                    const term = request.term.toLowerCase();
                    const matches = allItems
                        .filter(item => item.name.toLowerCase().includes(term))
                        .map(item => item.name);
                    response(matches.slice(0, 8));
                },
                minLength: 1,
                select: function (event, ui) {
                    $('#homeSearch').val(ui.item.value).trigger('input');
                    return false;
                }
            });
        },
        error: function (error) {
            console.log(error);
        }
    });

    $(document).off('click', '#detailsAddToCart').on('click', '#detailsAddToCart', function (e) {
        e.preventDefault();
        const stock = parseInt($('#productDetailsModalBody p:contains("Stock")').text().replace(/[^\d]/g, ''), 10) || 0;
        if (stock <= 0) {
            Swal.fire({ icon: 'warning', text: 'This item is out of stock', timer: 1200, showConfirmButton: false });
            return;
        }
        const qty = parseInt($('#detailsQty').val(), 10) || 1;
        const id = parseInt($('#detailsItemId').val(), 10);
        const description = $('#productDetailsModalLabel').text();
        const price = $('#productDetailsModalBody strong').text().replace(/[^\d.]/g, '');
        const image = $('#productDetailsModalBody img').attr('src');
        let cart = getCart();

        let existing = cart.find(item => item.item_id == id);
        if (existing) {
            if (existing.quantity + qty > stock) {
                Swal.fire({
                    icon: 'warning',
                    text: 'Cannot add more than available stock',
                    timer: 1500,
                    showConfirmButton: false
                });
                return;
            }

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

    // header is loaded separately; initial role notice removed per request
});