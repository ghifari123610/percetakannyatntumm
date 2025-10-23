document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const BACKEND_URL = 'http://localhost:3000';
    const messageDiv = document.getElementById('message');
    const currentUsernameInput = document.getElementById('currentUsername');

    // Decode JWT to get username
    const parseJwt = (token) => {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    };
    const decodedToken = parseJwt(token);
    if (decodedToken && decodedToken.username) {
        currentUsernameInput.value = decodedToken.username;
    }

    document.getElementById('settingsForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        messageDiv.textContent = '';
        messageDiv.className = 'message';

        if (!currentPassword) {
            messageDiv.textContent = 'Password saat ini tidak boleh kosong.';
            messageDiv.classList.add('error');
            return;
        }

        if (newPassword && newPassword !== confirmNewPassword) {
            messageDiv.textContent = 'Password baru dan konfirmasi password tidak cocok.';
            messageDiv.classList.add('error');
            return;
        }

        if (newPassword && newPassword.length < 6) {
            messageDiv.textContent = 'Password baru minimal 6 karakter.';
            messageDiv.classList.add('error');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/users/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                messageDiv.textContent = data.message;
                messageDiv.classList.add('success');
                // Clear password fields after successful update
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmNewPassword').value = '';
            } else {
                messageDiv.textContent = data.message || 'Gagal memperbarui password.';
                messageDiv.classList.add('error');
            }
        } catch (error) {
            messageDiv.textContent = 'Terjadi kesalahan jaringan atau server.';
            messageDiv.classList.add('error');
            console.error('Error updating password:', error);
        }
    });

    document.getElementById('backButton').addEventListener('click', () => {
        // Redirect based on the user's role after going back
        if (decodedToken && decodedToken.role === 'owner') {
            window.location.href = 'owner.html';
        } else {
            window.location.href = 'index.html';
        }
    });
});