$(document).ready(function () {
    if ($('#transactionsTable').length) {
        protectPage('admin');
        const table = $('#transactionsTable').DataTable({
            ajax: {
                url: `${API_URL}/transactions`,
                dataSrc: 'rows',
                headers: authHeaders()
            },
            columns: [
                { data: 'id' },
                { data: 'User.email' },
                { data: 'amount' },
                { data: 'status' },
                {
                    data: null,
                    render: function (row) {
                        return row.receipt_path ? `<a href="${row.receipt_path}" target="_blank">PDF</a>` : '';
                    }
                },
                {
                    data: null,
                    render: function (row) {
                        return `<select class="status" data-id="${row.id}">
                            <option value="pending" ${row.status === 'pending' ? 'selected' : ''}>pending</option>
                            <option value="completed" ${row.status === 'completed' ? 'selected' : ''}>completed</option>
                            <option value="cancelled" ${row.status === 'cancelled' ? 'selected' : ''}>cancelled</option>
                        </select>
                        <button class="deleteTxn danger" data-id="${row.id}">Delete</button>`;
                    }
                }
            ]
        });

        $('#transactionsTable').on('change', '.status', function () {
            $.ajax({
                method: 'PUT',
                url: `${API_URL}/transactions/${$(this).data('id')}`,
                data: JSON.stringify({ status: $(this).val() }),
                headers: authHeaders(),
                contentType: 'application/json; charset=utf-8',
                success: function () {
                    table.ajax.reload();
                }
            });
        });

        $('#transactionsTable').on('click', '.deleteTxn', function () {
            $.ajax({
                method: 'DELETE',
                url: `${API_URL}/transactions/${$(this).data('id')}`,
                headers: authHeaders(),
                success: function () {
                    table.ajax.reload();
                }
            });
        });
    }
});
