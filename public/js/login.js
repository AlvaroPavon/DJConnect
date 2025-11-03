document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const serverUrl = window.SERVER_URL || window.location.origin;

    const response = await fetch(`${serverUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('dj-token', data.token);
        alert('¡Login correcto!');
        window.location.href = `/html/dj.html`; // <-- RUTA CORREGIDA
    } else {
        const data = await response.json();
        alert(`Error: ${data.message}`);
    }
});