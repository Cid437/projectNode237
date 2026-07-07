$(document).ready(function () {
    const url = 'http://localhost:4000';
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
    const role = sessionStorage.getItem('role') || 'customer';

    // Header injected by helpers.js; state is applied there

    $('#itemUpdate').hide();

    if (role !== 'admin') {
        Swal.fire({ icon: 'warning', text: 'Admin access required for this page.', showConfirmButton: true })
            .then(() => { window.location.href = 'home.html'; });
        return;
    }

    const getToken = () => {
        let token = sessionStorage.getItem('token');
        if (!token) {
            Swal.fire({ icon: 'warning', text: 'You must be logged in to access this page.', showConfirmButton: true })
                .then(() => { window.location.href = 'login.html'; });
            return null;
        }
        token = token.replace(/^"|"$/g, '');
        return token;
    };

    // DataTables now handles AJAX loading, pagination, sorting and searching
    // (this replaces the old manual loadItems()/#itemSearch implementation).
    const itemsTable = $('#itable').DataTable({
        ajax: {
            url: `${url}/api/v1/items`,
            headers: { Authorization: `Bearer ${getToken()}` },
            dataSrc: function (data) {
                return Array.isArray(data.rows) ? data.rows : [];
            },
            error: function (error) {
                console.log(error);
            }
        },
        columns: [
            { data: 'id' },
            {
                data: 'image',
                orderable: false,
                render: function (image) {
                    return `<img src="${buildImageUrl(image)}" width="50" height="60">`;
                }
            },
            { data: 'name', defaultContent: '' },
            { data: 'description', defaultContent: '' },
            {
                data: 'buy_price',
                render: function (buy_price) {
                    return `₱ ${Number(buy_price || 0).toFixed(2)}`;
                }
            },
            {
                data: 'sell_price',
                render: function (sell_price) {
                    return `₱ ${Number(sell_price || 0).toFixed(2)}`;
                }
            },
            { data: 'stock', defaultContent: 0 },
            {
                data: 'id',
                orderable: false,
                render: function (id) {
                    return `
                        <a href='#' class='editBtn' data-id='${id}'><i class='fas fa-edit' aria-hidden='true' style='font-size:24px'></i></a>
                        <a href='#' class='deletebtn' data-id='${id}'><i class='fas fa-trash-alt' style='font-size:24px; color:red'></i></a>
                    `;
                }
            }
        ]
    });

    const reloadItems = () => {
        itemsTable.ajax.reload(null, false);
    };

    $('button[data-target="#itemModal"]').on('click', function () {
        $('#iform')[0].reset();
        $('#itemId').val('');
        $('#itemSubmit').show();
        $('#itemUpdate').hide();
        $('#itemImagePreviews').empty();
    });

    $('#itemModal').on('hidden.bs.modal', function () {
        $('#iform')[0].reset();
        $('#itemId').val('');
        $('#itemSubmit').show();
        $('#itemUpdate').hide();
        $('#itemImagePreviews').empty();
        resetItemValidation();
    });

  const resetItemValidation = () => {
        const fields = ['#itemName', '#itemDescription', '#itemBrand', '#itemBuyPrice', '#itemSellPrice', '#itemStock', '#itemCategoryId'];
        fields.forEach((selector) => {
            const $field = $(selector);
            $field.removeClass('is-invalid');
            $field.siblings('.invalid-feedback').text('');
        });
    };

    const validateItemForm = () => {
        resetItemValidation();
        let valid = true;

        const name = $('#itemName').val().trim();
        const description = $('#itemDescription').val().trim();
        const brand = $('#itemBrand').val().trim();
        const buyPrice = $('#itemBuyPrice').val();
        const sellPrice = $('#itemSellPrice').val();
        const stock = $('#itemStock').val();
        const categoryId = $('#itemCategoryId').val();

        if (!name) {
            $('#itemName').addClass('is-invalid').siblings('.invalid-feedback').text('Name is required.');
            valid = false;
        }
        if (!description) {
            $('#itemDescription').addClass('is-invalid').siblings('.invalid-feedback').text('Description is required.');
            valid = false;
        }
        if (!brand) {
            $('#itemBrand').addClass('is-invalid').siblings('.invalid-feedback').text('Brand is required.');
            valid = false;
        }
        if (!buyPrice || parseFloat(buyPrice) <= 0) {
            $('#itemBuyPrice').addClass('is-invalid').siblings('.invalid-feedback').text('Buy Price is required and must be greater than 0.');
            valid = false;
        }
        if (!sellPrice || parseFloat(sellPrice) <= 0) {
            $('#itemSellPrice').addClass('is-invalid').siblings('.invalid-feedback').text('Sell Price is required and must be greater than 0.');
            valid = false;
        }
        if (!stock || parseInt(stock, 10) < 0) {
            $('#itemStock').addClass('is-invalid').siblings('.invalid-feedback').text('Stock is required and cannot be negative.');
            valid = false;
        }
        if (!categoryId || parseInt(categoryId, 10) <= 0) {
            $('#itemCategoryId').addClass('is-invalid').siblings('.invalid-feedback').text('Category ID is required and must be a positive number.');
            valid = false;
        }

        return valid;
    };

  $('#itemSubmit').on('click', function (e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    if (!validateItemForm()) {
        return;
    }

    const formData = new FormData($('#iform')[0]);
        $.ajax({
            method: 'POST',
            url: `${url}/api/v1/items`,
            data: formData,
            contentType: false,
            processData: false,
            dataType: 'json',
            headers: { Authorization: `Bearer ${token}` },
            success: function (data) {
                Swal.fire({ icon: 'success', text: data.message || 'Item saved' });
                $('#itemModal').modal('hide');
                $('#iform')[0].reset();
                reloadItems();
            },
            error: function (error) {
                Swal.fire({ icon: 'error', text: error.responseJSON?.error || 'Unable to save item' });
                console.log(error);
            }
        });
    });

    $('#itable tbody').on('click', 'a.editBtn', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        $('#itemId').val(id);
        $('#itemSubmit').hide();
        $('#itemUpdate').show();
        $('#itemModal').modal('show');

        $.ajax({
            method: 'GET',
            url: `${url}/api/v1/items/${id}`,
            dataType: 'json',
            headers: { Authorization: `Bearer ${getToken()}` },
            success: function (data) {
                const item = data.result || {};
                const images = Array.isArray(data.images) ? data.images : [];
                $('#itemName').val(item.name || '');
                $('#itemDescription').val(item.description || '');
                $('#itemBrand').val(item.brand || '');
                $('#itemBuyPrice').val(item.buy_price || '');
                $('#itemSellPrice').val(item.sell_price || '');
                $('#itemStock').val(item.stock || 0);
                $('#itemCategoryId').val(item.category_id || 1);

                $('#itemImagePreviews').empty();
                images.forEach(function (img) {
                    $('#itemImagePreviews').append(
                        `<img src="${buildImageUrl(img.image_path)}" width="120" class="mt-2 mr-2" />`
                    );
                });
            },
            error: function (error) {
                console.log(error);
            }
        });
    });

    $('#itemUpdate').on('click', function (e) {
        e.preventDefault();
        const token = getToken();
        if (!token) return;
        const id = $('#itemId').val();

        if (!validateItemForm()) {
            return;
        }

        const formData = new FormData($('#iform')[0]);

        $.ajax({
            method: 'PUT',
            url: `${url}/api/v1/items/${id}`,
            data: formData,
            contentType: false,
            processData: false,
            dataType: 'json',
            headers: { Authorization: `Bearer ${token}` },
            success: function () {
                    $('#itemModal').modal('hide');
                    reloadItems();
                    Swal.fire({ icon: 'success', text: 'Item updated successfully', timer: 1200, showConfirmButton: false });
            },
            error: function (error) {
                console.log(error);
                Swal.fire({ icon: 'error', text: error.responseJSON?.error || 'Unable to update item' });
            }
        });
    });

    $('#itable tbody').on('click', 'a.deletebtn', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        const token = getToken();
        if (!token) return;

        bootbox.confirm({
            message: 'Do you want to delete this item?',
            buttons: { confirm: { label: 'Yes', className: 'btn-success' }, cancel: { label: 'No', className: 'btn-danger' } },
            callback: function (result) {
                if (!result) return;
                $.ajax({
                    method: 'DELETE',
                    url: `${url}/api/v1/items/${id}`,
                    dataType: 'json',
                    headers: { Authorization: `Bearer ${token}` },
                    success: function () {
                        reloadItems();
                        bootbox.alert('Item deleted successfully');
                    },
                    error: function (error) {
                        console.log(error);
                    }
                });
            }
        });
    });
});