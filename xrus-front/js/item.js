$(document).ready(function () {
    const url = 'http://localhost:4000';
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

    const loadItems = () => {
        const token = getToken();
        if (!token) return;

        $.ajax({
            method: 'GET',
            url: `${url}/api/v1/items`,
            dataType: 'json',
            headers: { Authorization: `Bearer ${token}` },
            success: function (data) {
                const rows = Array.isArray(data.rows) ? data.rows : [];
                const body = $('#ibody');
                body.empty();

                if (!rows.length) {
                    body.html('<tr><td colspan="8" class="text-center">No items found</td></tr>');
                    return;
                }

                body.html(rows.map(item => `
                    <tr>
                        <td>${item.id}</td>
                        <td><img src="${item.image ? `${url}/${item.image}` : ''}" width="50" height="60"></td>
                        <td>${item.name || ''}</td>
                        <td>${item.description || ''}</td>
                        <td>₱ ${Number(item.buy_price || 0).toFixed(2)}</td>
                        <td>₱ ${Number(item.sell_price || 0).toFixed(2)}</td>
                        <td>${item.stock ?? 0}</td>
                        <td>
                            <a href='#' class='editBtn' data-id='${item.id}'><i class='fas fa-edit' aria-hidden='true' style='font-size:24px'></i></a>
                            <a href='#' class='deletebtn' data-id='${item.id}'><i class='fas fa-trash-alt' style='font-size:24px; color:red'></i></a>
                        </td>
                    </tr>
                `).join(''));
            },
            error: function (error) {
                console.log(error);
                $('#ibody').html('<tr><td colspan="8" class="text-center">Unable to load items</td></tr>');
            }
        });
    };

    $('#itemSearch').on('input', function () {
        const query = $(this).val().toLowerCase();
        $('#ibody tr').each(function () {
            const rowText = $(this).text().toLowerCase();
            $(this).toggle(rowText.includes(query));
        });
    });

    loadItems();

    $('button[data-target="#itemModal"]').on('click', function () {
        $('#iform')[0].reset();
        $('#itemId').val('');
        $('#itemSubmit').show();
        $('#itemUpdate').hide();
        $('#itemImagePreview').remove();
    });

    $('#itemModal').on('hidden.bs.modal', function () {
        $('#iform')[0].reset();
        $('#itemId').val('');
        $('#itemSubmit').show();
        $('#itemUpdate').hide();
        $('#itemImagePreview').remove();
    });

    $('#itemSubmit').on('click', function (e) {
        e.preventDefault();
        const token = getToken();
        if (!token) return;

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
                loadItems();
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
                $('#itemName').val(item.name || '');
                $('#itemDescription').val(item.description || '');
                $('#itemBrand').val(item.brand || '');
                $('#itemBuyPrice').val(item.buy_price || '');
                $('#itemSellPrice').val(item.sell_price || '');
                $('#itemStock').val(item.stock || 0);
                $('#itemCategoryId').val(item.category_id || 1);
                $('#itemImagePreview').remove();
                if (item.image) {
                    $('#iform').append(`<img id="itemImagePreview" src="${url}/${item.image}" width="120" class="mt-2" />`);
                }
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
                loadItems();
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
                        loadItems();
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
