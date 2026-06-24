$(document).ready(function () {
    protectPage('admin');

    function randomColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(`hsl(${Math.floor(Math.random() * 360)}, 70%, 55%)`);
        }
        return colors;
    }

    $.ajax({
        method: 'GET',
        url: `${API_URL}/users-chart`,
        headers: authHeaders(),
        success: function (data) {
            new Chart($('#usersChart'), {
                type: 'bar',
                data: {
                    labels: data.rows.map(item => item.role),
                    datasets: [{
                        label: 'Users by role',
                        data: data.rows.map(item => item.total),
                        backgroundColor: randomColors(data.rows.length)
                    }]
                }
            });
        }
    });

    $.ajax({
        method: 'GET',
        url: `${API_URL}/sales-chart`,
        headers: authHeaders(),
        success: function (data) {
            new Chart($('#salesChart'), {
                type: 'line',
                data: {
                    labels: data.rows.map(item => item.month),
                    datasets: [{
                        label: 'Monthly sales',
                        data: data.rows.map(item => item.total),
                        borderColor: '#0b5ed7'
                    }]
                }
            });
        }
    });

    $.ajax({
        method: 'GET',
        url: `${API_URL}/items-chart`,
        headers: authHeaders(),
        success: function (data) {
            new Chart($('#itemsChart'), {
                type: 'pie',
                data: {
                    labels: data.rows.map(item => item.item),
                    datasets: [{
                        label: 'Items stock',
                        data: data.rows.map(item => item.total),
                        backgroundColor: randomColors(data.rows.length)
                    }]
                }
            });
        }
    });
});
