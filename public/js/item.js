$(document).ready(function () {
    let page = 1;
    let loading = false;

    function imagePath(row) {
        return row.Files && row.Files.length ? row.Files[0].filepath : '';
    }

    function renderItems(rows, append) {
        if (!append) {
            $('#items').empty();
        }

        $.each(rows, function (key, value) {
            const image = imagePath(value);
            $('#items').append(`<div class="card">
                ${image ? `<img src="${image}" alt="${value.name}">` : ''}
                <h3>${value.name}</h3>
                <p>${value.description || ''}</p>
                <p>Price: ${value.price}</p>
                <p>Stock: ${value.stock}</p>
                <button class="addCart" data-id="${value.id}" data-name="${value.name}" data-price="${value.price}">Add to Cart</button>
            </div>`);
        });
    }

    function loadHomeItems(append) {
        if (loading) return;
        loading = true;

        $.ajax({
            method: 'GET',
            url: `${API_URL}/items?page=${page}&limit=8`,
            dataType: 'json',
            success: function (data) {
                renderItems(data.rows, append);
                loading = false;
                if (page >= data.pages) {
                    $('#loadMore').hide();
                }
            }
        });
    }

    if ($('#items').length) {
        loadHomeItems(false);

        $('#loadMore').on('click', function () {
            page++;
            loadHomeItems(true);
        });

        $(window).on('scroll', function () {
            if ($(window).scrollTop() + $(window).height() >= $(document).height() - 80) {
                page++;
                loadHomeItems(true);
            }
        });
    }

    $(document).on('click', '.addCart', function () {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        cart.push({
            item_id: $(this).data('id'),
            name: $(this).data('name'),
            price: parseFloat($(this).data('price')),
            quantity: 1
        });
        localStorage.setItem('cart', JSON.stringify(cart));
        alert('Added to cart');
    });

    if ($('#itemsTable').length) {
        protectPage('admin');
        const table = $('#itemsTable').DataTable({
            ajax: {
                url: `${API_URL}/items?limit=1000`,
                dataSrc: 'rows',
                headers: authHeaders()
            },
            columns: [
                { data: 'id' },
                { data: 'name' },
                { data: 'description' },
                { data: 'price' },
                { data: 'stock' },
                {
                    data: null,
                    render: function (row) {
                        return `<button class="editBtn" data-id="${row.id}">Edit</button>
                        <button class="deleteBtn danger" data-id="${row.id}">Delete</button>`;
                    }
                }
            ]
        });

        $('#itemForm').on('submit', function (e) {
            e.preventDefault();
            const id = $('#itemId').val();
            const method = id ? 'PUT' : 'POST';
            const url = id ? `${API_URL}/items/${id}` : `${API_URL}/items`;
            const formData = new FormData(this);

            $.ajax({
                method,
                url,
                data: formData,
                contentType: false,
                processData: false,
                dataType: 'json',
                headers: authHeaders(),
                success: function () {
                    $('#itemForm')[0].reset();
                    $('#itemId').val('');
                    table.ajax.reload();
                }
            });
        });

        $('#itemsTable').on('click', '.editBtn', function () {
            $.ajax({
                method: 'GET',
                url: `${API_URL}/items/${$(this).data('id')}`,
                success: function (data) {
                    $('#itemId').val(data.result.id);
                    $('#name').val(data.result.name);
                    $('#description').val(data.result.description);
                    $('#price').val(data.result.price);
                    $('#stock').val(data.result.stock);
                }
            });
        });

        $('#itemsTable').on('click', '.deleteBtn', function () {
            if (!confirm('Do you want to delete this item?')) return;
            $.ajax({
                method: 'DELETE',
                url: `${API_URL}/items/${$(this).data('id')}`,
                headers: authHeaders(),
                success: function () {
                    table.ajax.reload();
                }
            });
        });
    }
});
