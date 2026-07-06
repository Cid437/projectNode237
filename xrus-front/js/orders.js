$(document).ready(function () {
    const url = 'http://localhost:4000';
    const role = sessionStorage.getItem('role') || 'customer';

    $('#home').load('header.html', function () {
        $('.admin-only').toggle(role === 'admin');
    });

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

    const ordersTable = $('#otable').DataTable({
        ajax: {
            url: `${url}/api/v1/orders`,
            headers: { Authorization: `Bearer ${getToken()}` },
            dataSrc: function (data) {
                return Array.isArray(data.rows) ? data.rows : [];
            },
            error: function (error) {
                console.log(error);
            }
        },
        columns: [
            { data: 'order_number' },
            {
                data: null,
                render: function (row) {
                    return `${row.first_name || ''} ${row.last_name || ''}<br><small>${row.email || ''}</small>`;
                }
            },
            {
                data: 'total_amount',
                render: function (total_amount) {
                    return `₱ ${Number(total_amount || 0).toFixed(2)}`;
                }
            },
            { data: 'payment_status', defaultContent: 'Pending' },
            { data: 'order_status', defaultContent: 'Pending' },
            {
                data: 'created_at',
                render: function (created_at) {
                    return created_at ? new Date(created_at).toLocaleString() : '';
                }
            },
            {
                data: 'id',
                orderable: false,
                render: function (id) {
                    return `
                        <a href='#' class='viewBtn' data-id='${id}'><i class='fas fa-eye' style='font-size:22px'></i></a>
                        <a href='#' class='deleteOrderBtn' data-id='${id}'><i class='fas fa-trash-alt' style='font-size:22px; color:red'></i></a>
                    `;
                }
            }
        ]
    });

    const reloadOrders = () => {
        ordersTable.ajax.reload(null, false);
    };

    $('#otable tbody').on('click', 'a.viewBtn', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        const token = getToken();
        if (!token) return;

        $.ajax({
            method: 'GET',
            url: `${url}/api/v1/orders/${id}`,
            dataType: 'json',
            headers: { Authorization: `Bearer ${token}` },
            success: function (data) {
                const order = data.result || {};
                $('#orderId').val(id);
                $('#orderNumber').text(order.order_number || '');
                $('#orderCustomer').text(`${order.first_name || ''} ${order.last_name || ''} (${order.email || ''})`);
                $('#orderAddress').text(order.shipping_address || 'N/A');
                $('#orderStatus').val(order.order_status || 'Pending');
                $('#paymentStatus').val(order.payment_status || 'Pending');

                const items = Array.isArray(order.items) ? order.items : [];
                $('#orderItemsBody').html(items.map(item => `
                    <tr>
                        <td>${item.name || ''}</td>
                        <td>${item.quantity}</td>
                        <td>₱ ${Number(item.price || 0).toFixed(2)}</td>
                        <td>₱ ${Number(item.subtotal || 0).toFixed(2)}</td>
                    </tr>
                `).join(''));

                $('#orderModal').modal('show');
            },
            error: function (error) {
                console.log(error);
                Swal.fire({ icon: 'error', text: 'Unable to load order details' });
            }
        });
    });

$('#orderUpdateBtn').on('click', function () {
        const token = getToken();
        if (!token) return;
        const id = $('#orderId').val();

        if (!id) {
            Swal.fire({ icon: 'warning', text: 'No order selected' });
            return;
        }     

        $.ajax({
            method: 'PUT',
            url: `${url}/api/v1/orders/${id}`,
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({
                order_status: $('#orderStatus').val(),
                payment_status: $('#paymentStatus').val()
            }),
            headers: { Authorization: `Bearer ${token}` },
            success: function (data) {
                Swal.fire({ icon: 'success', text: data.message || 'Order updated', timer: 1200, showConfirmButton: false });
                $('#orderModal').modal('hide');
                reloadOrders();
            },
            error: function (error) {
                Swal.fire({ icon: 'error', text: error.responseJSON?.error || 'Unable to update order' });
            }
        });
    });

    $('#otable tbody').on('click', 'a.deleteOrderBtn', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        const token = getToken();
        if (!token) return;

        bootbox.confirm({
            message: 'Delete this order?',
            buttons: { confirm: { label: 'Yes', className: 'btn-success' }, cancel: { label: 'No', className: 'btn-danger' } },
            callback: function (result) {
                if (!result) return;
                $.ajax({
                    method: 'DELETE',
                    url: `${url}/api/v1/orders/${id}`,
                    dataType: 'json',
                    headers: { Authorization: `Bearer ${token}` },
                    success: function () {
                        reloadOrders();
                        bootbox.alert('Order deleted successfully');
                    },
                    error: function (error) {
                        console.log(error);
                    }
                });
            }
        });
    });
});