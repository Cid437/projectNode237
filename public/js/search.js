$(document).ready(function () {
    $('#search').on('keyup', function () {
        $.ajax({
            method: 'GET',
            url: `${API_URL}/items/search/autocomplete?q=${encodeURIComponent($(this).val())}`,
            dataType: 'json',
            success: function (data) {
                $('#results').empty();
                $.each(data.rows, function (key, value) {
                    $('#results').append(`<div class="card">
                        <h3>${value.name}</h3>
                        <p>${value.description || ''}</p>
                        <p>${value.price}</p>
                    </div>`);
                });
            }
        });
    });
});
