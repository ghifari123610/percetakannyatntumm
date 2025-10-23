document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

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

    const formatIDR = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

    const todayAmountEl = document.getElementById('todayAmount');
    const weekAmountEl = document.getElementById('weekAmount');
    const monthAmountEl = document.getElementById('monthAmount');
    const detailsButtons = document.querySelectorAll('.details-button');
    const showAllButton = document.getElementById('showAllButton');
    const filterStatus = document.getElementById('filterStatus');

    let allTransactions = [];

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

        allTransactions = await response.json();

        // Process transactions for summary cards
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let todayTotal = 0;
        let weekTotal = 0;
        let monthTotal = 0;

        allTransactions.forEach(tx => {
            const txDate = new Date(tx.Timestamp.split(' ')[0]);
            if (txDate >= today) {
                todayTotal += tx.Harga;
            }
            if (txDate >= startOfWeek) {
                weekTotal += tx.Harga;
            }
            if (txDate >= startOfMonth) {
                monthTotal += tx.Harga;
            }
        });

        todayAmountEl.textContent = formatIDR(todayTotal);
        weekAmountEl.textContent = formatIDR(weekTotal);
        monthAmountEl.textContent = formatIDR(monthTotal);

        populateTable(allTransactions);
        filterStatus.textContent = 'Menampilkan Semua Transaksi';

        detailsButtons.forEach(button => {
            button.addEventListener('click', () => {
                const period = button.dataset.period;
                filterAndDisplayTransactions(period);
            });
        });

        showAllButton.addEventListener('click', () => {
            populateTable(allTransactions);
            filterStatus.textContent = 'Menampilkan Semua Transaksi';
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

    function populateTable(transactions) {
        transactionsTableBody.innerHTML = '';
        transactions.forEach(tx => {
            const row = transactionsTableBody.insertRow();
            row.setAttribute('data-id', tx._id);
            row.innerHTML = `
                <td>${tx.Timestamp}</td>
                <td>${tx['Kode Transaksi']}</td>
                <td>${tx['Nama Transaksi']}</td>
                <td>${tx.Admin}</td>
                <td>${tx.Barang}</td>
                <td>${formatIDR(tx.Harga)}</td>
                <td>${tx.Metode}</td>
                <td>${tx.Tuan || '-' }</td>
                <td>${tx['Nomor HP'] || '-' }</td>
                <td>${formatIDR(tx.Panjar || 0)}</td>
                <td>${formatIDR(tx.Sisa || 0)}</td>
                <td>${tx.Catatan || '-' }</td>
                <td><button class="delete-button" data-id="${tx._id}">Hapus</button></td>
            `;
        });
    }

    function filterAndDisplayTransactions(period) {
        let filteredTransactions = [];
        const now = new Date();
        let statusText = '';

        if (period === 'today') {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            filteredTransactions = allTransactions.filter(tx => new Date(tx.Timestamp.split(' ')[0]) >= today);
            statusText = 'Transaksi Hari Ini';
        } else if (period === 'week') {
            const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            filteredTransactions = allTransactions.filter(tx => new Date(tx.Timestamp.split(' ')[0]) >= startOfWeek);
            statusText = 'Transaksi Pekan Ini';
        } else if (period === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            filteredTransactions = allTransactions.filter(tx => new Date(tx.Timestamp.split(' ')[0]) >= startOfMonth);
            statusText = 'Transaksi Bulan Ini';
        }
        populateTable(filteredTransactions);
        filterStatus.textContent = statusText;
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
                allTransactions = allTransactions.filter(tx => tx._id !== id);
                populateTable(allTransactions);
                // Recalculate summaries
                // This is a simplified approach; a more robust solution might update totals without a full re-render
                window.location.reload();
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