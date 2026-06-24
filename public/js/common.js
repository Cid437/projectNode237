const API_URL = '/api/v1';

function getToken() {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    return token ? JSON.parse(token) : null;
}

function authHeaders() {
    const token = getToken();
    return token ? { Authorization: 'Bearer ' + token } : {};
}

function currentUser() {
    const user = sessionStorage.getItem('user') || localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function protectPage(role) {
    const user = currentUser();
    if (!getToken() || (role && (!user || user.role !== role))) {
        window.location.href = 'login.html';
    }
}
