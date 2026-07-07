$(document).ready(function () {
    const url = 'http://localhost:4000';
    const token = xrusHelpers.getToken();
    const userId = sessionStorage.getItem('userId');

    if (!token || !userId) {
        Swal.fire({ icon: 'warning', text: 'Please login to view your purchases.', showConfirmButton: true })
            .then(function () {
                window.location.href = 'login.html';
            });
        return;
    }

    $('#home').load('header.html', function () {
        xrusHelpers.applyHeaderState();
    });

    $.ajax({
        method: 'GET',
        url: `${url}/api/v1/orders/me`,
        dataType: 'json',
        headers: { Authorization: 'Bearer ' + token },
        success: function (data) {
            const rows = Array.isArray(data.rows) ? data.rows : [];
            if (!rows.length) {
                $('#ordersList').html('<div class="alert alert-secondary">No purchases yet.</div>');
                return;
            }

            const html = rows.map(function (order) {
                const receiptBtn = order.order_status === 'Completed'
                    ? `<button class="btn btn-sm btn-outline-secondary viewReceiptBtn" data-id="${order.id}">View Receipt</button>`
                    : '<span class="text-muted">Receipt unavailable</span>';

                return `
                    <div class="border rounded p-3 mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <strong>${order.order_number || ''}</strong>
                            <span class="badge badge-info">${order.order_status || 'Pending'}</span>
                        </div>
                        <p class="mb-1 mt-2">Total: ₱ ${Number(order.total_amount || 0).toFixed(2)}</p>
                        <p class="mb-1">Payment: ${order.payment_status || 'Pending'}</p>
                        <p class="mb-2">Date: ${order.created_at ? new Date(order.created_at).toLocaleString() : ''}</p>
                        ${receiptBtn}
                    </div>
                `;
            }).join('');

            $('#ordersList').html(html);
            
            // Attach click handler to fetch protected receipt PDF and open it
            $(document).off('click', '.viewReceiptBtn').on('click', '.viewReceiptBtn', function (e) {
                e.preventDefault();
                const id = $(this).data('id');
                fetch(`${url}/api/v1/orders/${id}/receipt`, {
                    method: 'GET',
                    headers: { Authorization: 'Bearer ' + token }
                }).then(function (resp) {
                    if (resp.status === 401) {
                        sessionStorage.clear();
                        window.location.href = 'login.html';
                        return null;
                    }
                    if (!resp.ok) {
                        return resp.json().then(j => { throw new Error(j.message || 'Unable to fetch receipt'); });
                    }
                    return resp.blob();
                }).then(function (blob) {
                    if (!blob) return;
                    const blobUrl = URL.createObjectURL(blob);
                    window.open(blobUrl, '_blank');
                }).catch(function (err) {
                    console.log(err);
                    Swal.fire({ icon: 'error', text: err.message || 'Unable to open receipt.' });
                });
            });
        },
        error: function (error) {
            console.log(error);
            if (error.status === 401 || error.responseJSON?.message?.includes('Session expired')) {
                sessionStorage.clear();
                window.location.href = 'login.html';
                return;
            }
            Swal.fire({ icon: 'error', text: 'Unable to load your purchases.' });
        }
    });
});
