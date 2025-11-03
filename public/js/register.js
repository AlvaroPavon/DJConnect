// --- Define la URL completa de tu servidor ---
const serverUrl = window.SERVER_URL || window.location.origin;

const passwordInput = document.getElementById('password');
const passwordToggle = document.querySelector('.password-toggle');
const strengthBar = document.getElementById('strength-bar');
const passwordHint = document.getElementById('password-hint');

// Lógica para mostrar/ocultar contraseña
if (passwordToggle) {
    passwordToggle.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        passwordToggle.textContent = type === 'password' ? '👁️' : '🙈';
    });
}


// Lógica para la barra de fuerza de la contraseña
passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let hint = '';
    let strengthClass = 'strength-bar';
    switch (score) {
        case 1: case 2: strengthClass += ' weak'; hint = 'Débil'; break;
        case 3: strengthClass += ' medium'; hint = 'Aceptable'; break;
        case 4: strengthClass += ' strong'; hint = 'Fuerte'; break;
        case 5: strengthClass += ' very-strong'; hint = 'Muy Fuerte'; break;
    }
    strengthBar.className = strengthClass;
    passwordHint.textContent = hint;
});

// Lógica de envío del formulario
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // Usamos la URL completa para la petición
        const response = await fetch(`${serverUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        alert(data.message); 

        if (response.ok) {
            window.location.href = '/html/login.html'; // <-- RUTA CORREGIDA
        }
    } catch (error) {
        console.error('Error en la petición de registro:', error);
        alert('Ocurrió un error al contactar con el servidor. Revisa tu conexión a internet.');
    }
});