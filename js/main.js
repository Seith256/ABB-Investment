// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeModals();
    setupNavigation();
    handleVIPProfits();
    setupStorageSync();
});

// Modal management
function initializeModals() {
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.add('modal-hidden');
        });
    });
    
    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('modal-hidden');
            }
        });
    });
    
    // Modal action buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-action-btn')) {
            const modal = e.target.closest('.modal');
            setTimeout(() => modal.classList.add('modal-hidden'), 2000);
        }
    });
}

// Navigation setup
function setupNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const btnHref = btn.getAttribute('href');
        if (btnHref === currentPage || 
            (currentPage === 'index.html' && btnHref === './') || 
            (currentPage === '' && btnHref === 'index.html')) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// VIP profit handling
function handleVIPProfits() {
    if (!currentUser || currentUser.vipLevel <= 0 || !currentUser.vipApprovedDate) return;

    const now = new Date();
    const lastProfitDate = currentUser.lastProfitDate ? new Date(currentUser.lastProfitDate) : null;
    const vipApprovedDate = new Date(currentUser.vipApprovedDate);
    const daysSinceApproval = Math.floor((now - vipApprovedDate) / (1000 * 60 * 60 * 24));
    
    // Check if VIP cycle completed
    if (daysSinceApproval >= 60) {
        completeVIPCycle();
        return;
    }
    
    // Check if profit should be added today
    const today = now.toISOString().split('T')[0];
    const lastProfitDay = lastProfitDate ? lastProfitDate.toISOString().split('T')[0] : null;
    
    if (!lastProfitDay || lastProfitDay !== today) {
        addVIPProfit();
    }
}

function completeVIPCycle() {
    const userIndex = usersDB.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        usersDB[userIndex].vipLevel = 0;
        usersDB[userIndex].dailyProfit = 0;
        usersDB[userIndex].vipDaysCompleted = 60;
        localStorage.setItem('aab_users', JSON.stringify(usersDB));
        
        currentUser = usersDB[userIndex];
        localStorage.setItem('aab_currentUser', JSON.stringify(currentUser));
        
        if (document.getElementById('user-balance')) {
            alert('Your VIP cycle of 60 days has been completed successfully!');
            window.location.reload();
        }
    }
}

function addVIPProfit() {
    const userIndex = usersDB.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        const profit = currentUser.dailyProfit;
        const now = new Date();
        
        usersDB[userIndex].balance += profit;
        usersDB[userIndex].totalEarnings += profit;
        usersDB[userIndex].lastProfitDate = now.toISOString();
        usersDB[userIndex].vipDaysCompleted = (usersDB[userIndex].vipDaysCompleted || 0) + 1;
        
        usersDB[userIndex].transactions.push({
            type: `VIP ${currentUser.vipLevel} daily profit (Day ${usersDB[userIndex].vipDaysCompleted})`,
            amount: profit,
            date: now.toISOString(),
            status: 'completed'
        });
        
        localStorage.setItem('aab_users', JSON.stringify(usersDB));
        currentUser = usersDB[userIndex];
        localStorage.setItem('aab_currentUser', JSON.stringify(currentUser));
        
        if (document.getElementById('user-balance')) {
            document.getElementById('user-balance').textContent = `UGX ${currentUser.balance.toLocaleString()}`;
            document.getElementById('total-earnings').textContent = `UGX ${currentUser.totalEarnings.toLocaleString()}`;
        }
    }
}

// Cross-tab synchronization
function setupStorageSync() {
    window.addEventListener('storage', function(event) {
        if (event.key === 'aab_currentUser') {
            currentUser = JSON.parse(event.newValue);
            if (document.getElementById('user-balance')) {
                document.getElementById('user-balance').textContent = `UGX ${currentUser.balance.toLocaleString()}`;
                document.getElementById('total-earnings').textContent = `UGX ${currentUser.totalEarnings.toLocaleString()}`;
            }
        }
        if (event.key === 'aab_currentAdmin') {
            currentAdmin = JSON.parse(event.newValue);
        }
    });
}
