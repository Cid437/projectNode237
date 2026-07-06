$(document).ready(function () {
    const url = 'http://localhost:4000';
    const buildImageUrl = (image) => {
        if (!image) return '';
        if (/^https?:\/\//i.test(image)) return image;
        if (image.startsWith('/')) return `${url}${image}`;
        if (image.startsWith('images/')) return `${url}/${image}`;
        return `${url}/images/${image}`;
    };
    const role = sessionStorage.getItem('role') || 'customer';

    $('#home').load('header.html', function () {
        $('.admin-only').toggle(role === 'admin');
    });

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
    });

  $('#itemSubmit').on('click', function (e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    const name = $('#itemName').val().trim();
    const buyPrice = $('#itemBuyPrice').val();
    const sellPrice = $('#itemSellPrice').val();

        if (!name || !buyPrice || !sellPrice || parseFloat(buyPrice) <= 0 || parseFloat(sellPrice) <= 0) {
            Swal.fire({ icon: 'warning', text: 'Name, Buy Price, and Sell Price are required and must be greater than 0' });
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
        const formData = new FormData($('#iform')[0]);

        const name = $('#itemName').val().trim();
        const buyPrice = $('#itemBuyPrice').val();
        const sellPrice = $('#itemSellPrice').val();

        if (!name || !buyPrice || !sellPrice || parseFloat(buyPrice) <= 0 || parseFloat(sellPrice) <= 0) {
            Swal.fire({ icon: 'warning', text: 'Name, Buy Price, and Sell Price are required and must be greater than 0' });
            return;
        }

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