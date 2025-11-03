const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const serverUrl = window.SERVER_URL || window.location.origin;

document.getElementById('reset-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        return alert('Las contraseñas no coinciden.');
    }

    const response = await fetch(`${serverUrl}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, password: password })
    });

    const data = await response.json();
    alert(data.message);

    if (response.ok) {
        window.location.href = '/login.html';
    }
});
