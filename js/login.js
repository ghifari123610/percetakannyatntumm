document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            const parseJwt = (token) => {
                try {
                    return JSON.parse(atob(token.split('.')[1]));
                } catch (e) {
                    return null;
                }
            };
            const decodedToken = parseJwt(data.token);
            if (decodedToken && decodedToken.role === 'owner') {
                window.location.href = 'owner.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            errorMessage.textContent = data.message || 'Login failed';
        }
    } catch (error) {
        errorMessage.textContent = 'Network error or server is down.';
        console.error('Login error:', error);
    }
});