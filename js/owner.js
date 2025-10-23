document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Basic token decoding to get user role (for client-side routing)
    // In a real app, you might want to verify this with the backend
    const parseJwt = (token) => {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    };

    const decodedToken = parseJwt(token);
    if (!decodedToken || decodedToken.role !== 'owner') {
        alert('Access Denied: You are not an owner.');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        return;
    }

    const transactionsTableBody = document.querySelector('#transactionsTable tbody');
    const BACKEND_URL = 'http://localhost:3000';

    try {
        const response = await fetch(`${BACKEND_URL}/api/transactions`, {
            method: 'GET',
            headers: {
                'x-auth-token': token,
            },
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert('Session expired or unauthorized. Please log in again.');
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }

        const transactions = await response.json();

        transactions.forEach(tx => {
            const row = transactionsTableBody.insertRow();
            row.setAttribute('data-id', tx._id); // Set data-id attribute for the row
            row.innerHTML = `
                <td>${tx.Timestamp}</td>
                <td>${tx['Kode Transaksi']}</td>
                <td>${tx['Nama Transaksi']}</td>
                <td>${tx.Admin}</td>
                <td>${tx.Barang}</td>
                <td>${tx.Harga}</td>
                <td>${tx.Metode}</td>
                <td>${tx.Tuan || '-'}</td>
                <td>${tx['Nomor HP'] || '-'}</td>
                <td>${tx.Panjar || '0'}</td>
                <td>${tx.Sisa || '0'}</td>
                <td>${tx.Catatan || '-'}</td>
                <td><button class="delete-button" data-id="${tx._id}">Hapus</button></td>
            `;
        });

        transactionsTableBody.addEventListener('click', async (event) => {
            if (event.target.classList.contains('delete-button')) {
                const transactionId = event.target.dataset.id;
                const confirmed = confirm('Apakah Anda yakin ingin menghapus transaksi ini?');
                if (confirmed) {
                    await deleteTransaction(transactionId, token);
                }
            }
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        alert('Failed to load transactions.');
    }

    async function deleteTransaction(id, token) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/transactions/${id}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': token,
                },
            });

            if (response.ok) {
                alert('Transaksi berhasil dihapus.');
                // Remove the row from the table
                const row = document.querySelector(`tr[data-id='${id}']`);
                if (row) {
                    row.remove();
                }
            } else {
                const result = await response.json();
                throw new Error(result.message || 'Gagal menghapus transaksi.');
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert(error.message);
        }
    }

    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

    document.getElementById('settingsButton').addEventListener('click', () => {
        window.location.href = 'settings.html';
    });
});