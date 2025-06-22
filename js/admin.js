document.addEventListener('DOMContentLoaded', function() {
    if (!currentAdmin) return;
    
    // Initialize admin dashboard
    updateAdminData();
    updateAdminStats();
    loadRechargeRequests();
    loadWithdrawalRequests();
    loadUsers();
    loadVIPRequests();
    
    // Set up periodic sync
    setInterval(syncAdminData, 30000);
    
    // Admin sidebar navigation
    document.querySelectorAll('.admin-sidebar a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active state
            document.querySelector('.admin-sidebar li.active')?.classList.remove('active');
            this.parentElement.classList.add('active');
            
            // Show the selected section
            const sectionId = this.getAttribute('data-section');
            document.querySelectorAll('.admin-section').forEach(section => {
                section.classList.add('hidden');
            });
            document.getElementById(`${sectionId}-section`)?.classList.remove('hidden');
        });
    });
    
    // Event delegation for action buttons
    const buttonTypes = {
        'approve-recharge': approveRecharge,
        'reject-recharge': rejectRecharge,
        'approve-withdrawal': approveWithdrawal,
        'reject-withdrawal': rejectWithdrawal,
        'approve-vip': approveVIP,
        'reject-vip': rejectVIP,
        'view-user': viewUserDetails,
        'delete-user': deleteUser
    };

    document.addEventListener('click', function(e) {
        for (const buttonType in buttonTypes) {
            if (e.target.classList.contains(buttonType)) {
                const userId = e.target.getAttribute('data-user-id') || e.target.getAttribute('data-id');
                const date = e.target.getAttribute('data-date');
                try {
                    if (buttonTypes[buttonType](userId, date)) {
                        // Reload relevant data if action was successful
                        if (buttonType.startsWith('approve-') || buttonType.startsWith('reject-')) {
                            loadRechargeRequests();
                            loadWithdrawalRequests();
                            loadVIPRequests();
                            updateAdminStats();
                        }
                    }
                } catch (error) {
                    console.error(error);
                }
                break;
            }
        }
    });
    
    // Generate report
    document.getElementById('generate-report-btn')?.addEventListener('click', generateReport);
    
    // Close user detail modal
    document.querySelector('#user-detail-modal .close-modal')?.addEventListener('click', function() {
        document.getElementById('user-detail-modal').classList.remove('show');
    });
});

// Admin data management
function updateAdminData() {
    if (!currentAdmin) return;
    
    const adminFromDB = adminDB.find(a => a.email === currentAdmin.email);
    if (adminFromDB) {
        currentAdmin = adminFromDB;
        localStorage.setItem('aab_currentAdmin', JSON.stringify(currentAdmin));
    }
}

function syncAdminData() {
    updateAdminData();
    updateAdminStats();
}

// Dashboard functions
function updateAdminStats() {
    const totalUsers = usersDB.length;
    const pendingRecharges = usersDB.reduce((acc, user) => 
        acc + user.rechargeRequests.filter(r => r.status === 'pending').length, 0);
    const pendingWithdrawals = usersDB.reduce((acc, user) => 
        acc + user.withdrawalRequests.filter(w => w.status === 'pending').length, 0);
    const totalBalance = usersDB.reduce((acc, user) => acc + user.balance, 0);
    
    if (document.getElementById('total-users')) {
        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('pending-recharges').textContent = pendingRecharges;
        document.getElementById('pending-withdrawals').textContent = pendingWithdrawals;
        document.getElementById('total-balance').textContent = `UGX ${totalBalance.toLocaleString()}`;
    }
    
    updateRecentActivity();
}

function updateRecentActivity() {
    const recentActivity = [];
    usersDB.forEach(user => {
        user.transactions.slice(-3).forEach(txn => {
            recentActivity.push({
                user: user.name,
                type: txn.type,
                amount: txn.amount,
                date: txn.date,
                status: txn.status
            });
        });
    });
    
    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const activityList = document.getElementById('recent-activity');
    if (activityList) {
        activityList.innerHTML = recentActivity.slice(0, 5).map(activity => `
            <div class="activity-item">
                <div class="activity-desc">
                    <strong>${activity.user}</strong> - ${activity.type} (${activity.status})
                </div>
                <div class="activity-time">
                    ${new Date(activity.date).toLocaleString()}
                </div>
            </div>
        `).join('');
    }
}

// Request management functions
function loadRechargeRequests() {
    const requests = usersDB.flatMap(user => 
        user.rechargeRequests
            .filter(r => r.status === 'pending')
            .map(request => ({
                id: `${user.id}-${new Date(request.date).getTime()}`,
                user: user.name,
                email: user.email,
                amount: request.amount,
                date: request.date,
                proof: request.proof,
                userId: user.id
            }))
    ).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const tbody = document.getElementById('recharge-requests');
    if (tbody) {
        tbody.innerHTML = requests.map(request => `
            <tr>
                <td>${request.user} (${request.email})</td>
                <td>UGX ${request.amount.toLocaleString()}</td>
                <td>${new Date(request.date).toLocaleDateString()}</td>
                <td>${request.proof}</td>
                <td>
                    <button class="action-btn approve-btn approve-recharge" 
                            data-user-id="${request.userId}" 
                            data-date="${request.date}">
                        Approve
                    </button>
                    <button class="action-btn reject-btn reject-recharge" 
                            data-user-id="${request.userId}" 
                            data-date="${request.date}">
                        Reject
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

function loadWithdrawalRequests() {
    const requests = usersDB.flatMap(user => 
        user.withdrawalRequests
            .filter(w => w.status === 'pending')
            .map(request => ({
                id: `${user.id}-${new Date(request.date).getTime()}`,
                user: user.name,
                email: user.email,
                amount: request.amount,
                phone: request.phone,
                network: request.network,
                date: request.date,
                userId: user.id
            }))
    ).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const tbody = document.getElementById('withdrawal-requests');
    if (tbody) {
        tbody.innerHTML = requests.map(request => `
            <tr>
                <td>${request.user} (${request.email})</td>
                <td>UGX ${request.amount.toLocaleString()}</td>
                <td>${request.phone}</td>
                <td>${request.network}</td>
                <td>${new Date(request.date).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn approve-btn approve-withdrawal" 
                            data-user-id="${request.userId}" 
                            data-date="${request.date}">
                        Approve
                    </button>
                    <button class="action-btn reject-btn reject-withdrawal" 
                            data-user-id="${request.userId}" 
                            data-date="${request.date}">
                        Reject
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

function loadVIPRequests() {
    const vipLevels = [1800, 6000, 10000, 13000, 28000, 60000, 75000, 150000, 400000, 600000];
    const requests = usersDB.flatMap(user => 
        user.vipRequests
            .filter(v => v.status === 'pending')
            .map(request => ({
                id: `${user.id}-${new Date(request.date).getTime()}`,
                user: user.name,
                email: user.email,
                level: request.level,
                amount: request.amount,
                date: request.date,
                dailyProfit: vipLevels[request.level - 1],
                userId: user.id
            }))
    ).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const tbody = document.getElementById('vip-requests');
    if (tbody) {
        tbody.innerHTML = requests.map(request => `
            <tr>
                <td>${request.user} (${request.email})</td>
                <td>VIP ${request.level}</td>
                <td>UGX ${request.amount.toLocaleString()}</td>
                <td>${new Date(request.date).toLocaleDateString()}</td>
                <td>UGX ${request.dailyProfit.toLocaleString()}</td>
                <td>
                    <button class="action-btn approve-btn approve-vip" 
                            data-user-id="${request.userId}" 
                            data-date="${request.date}">
                        Approve
                    </button>
                    <button class="action-btn reject-btn reject-vip" 
                            data-user-id="${request.userId}" 
                            data-date="${request.date}">
                        Reject
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

function loadUsers() {
    const tbody = document.getElementById('users-list');
    if (tbody) {
        tbody.innerHTML = usersDB.map(user => `
            <tr>
                <td>${user.id.slice(-6)}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td>UGX ${user.balance.toLocaleString()}</td>
                <td>${user.vipLevel > 0 ? `VIP ${user.vipLevel}` : 'None'}</td>
                <td>
                    <button class="action-btn view-btn view-user" data-id="${user.id}">View</button>
                    <button class="action-btn reject-btn delete-user" data-id="${user.id}">Delete</button>
                </td>
            </tr>
        `).join('');
    }
    
    // User search functionality
    document.getElementById('search-users-btn')?.addEventListener('click', function() {
        const searchTerm = document.getElementById('user-search').value.toLowerCase();
        const filteredUsers = usersDB.filter(user => 
            user.name.toLowerCase().includes(searchTerm) || 
            user.email.toLowerCase().includes(searchTerm) ||
            user.phone.includes(searchTerm));
        
        const tbody = document.getElementById('users-list');
        if (tbody) {
            tbody.innerHTML = filteredUsers.map(user => `
                <tr>
                    <td>${user.id.slice(-6)}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.phone}</td>
                    <td>UGX ${user.balance.toLocaleString()}</td>
                    <td>${user.vipLevel > 0 ? `VIP ${user.vipLevel}` : 'None'}</td>
                    <td>
                        <button class="action-btn view-btn view-user" data-id="${user.id}">View</button>
                        <button class="action-btn reject-btn delete-user" data-id="${user.id}">Delete</button>
                    </td>
                </tr>
            `).join('');
        }
    });
}

// Approval functions
function approveRecharge(userId, date) {
    const userIndex = usersDB.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    const requestIndex = usersDB[userIndex].rechargeRequests.findIndex(r => 
        new Date(r.date).getTime() === new Date(date).getTime());
    if (requestIndex === -1) return false;

    const rechargeAmount = usersDB[userIndex].rechargeRequests[requestIndex].amount;
    
    // Update request status
    usersDB[userIndex].rechargeRequests[requestIndex].status = 'approved';
    
    // Update user balance
    usersDB[userIndex].balance += rechargeAmount;
    
    // Update transaction status
    const txnIndex = usersDB[userIndex].transactions.findIndex(t => 
        t.type === 'recharge' && 
        t.amount === rechargeAmount && 
        t.status === 'pending');
    
    if (txnIndex !== -1) {
        usersDB[userIndex].transactions[txnIndex].status = 'completed';
    }
    
    // Process referral bonus if applicable
    processReferralBonus(userIndex, rechargeAmount);
    
    // Save changes
    localStorage.setItem('aab_users', JSON.stringify(usersDB));
    return true;
}

function rejectRecharge(userId, date) {
    const userIndex = usersDB.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    const requestIndex = usersDB[userIndex].rechargeRequests.findIndex(r => 
        new Date(r.date).getTime() === new Date(date).getTime());
    if (requestIndex === -1) return false;

    // Update request status
    usersDB[userIndex].rechargeRequests[requestIndex].status = 'rejected';
    
    // Update transaction status
    const rechargeAmount = usersDB[userIndex].rechargeRequests[requestIndex].amount;
    const txnIndex = usersDB[userIndex].transactions.findIndex(t => 
        t.type === 'recharge' && 
        t.amount === rechargeAmount && 
        t.status === 'pending');
    
    if (txnIndex !== -1) {
        usersDB[userIndex].transactions[txnIndex].status = 'rejected';
    }
    
    // Save changes
    localStorage.setItem('aab_users', JSON.stringify(usersDB));
    return true;
}

function approveWithdrawal(userId, date) {
    const userIndex = usersDB.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    const requestIndex = usersDB[userIndex].withdrawalRequests.findIndex(w => 
        new Date(w.date).getTime() === new Date(date).getTime());
    if (requestIndex === -1) return false;

    const amount = usersDB[userIndex].withdrawalRequests[requestIndex].amount;
    
    if (usersDB[userIndex].balance < amount) {
        alert('User has insufficient balance');
        return false;
    }
    
    // Update request status
    usersDB[userIndex].withdrawalRequests[requestIndex].status = 'approved';
    
    // Update user balance
    usersDB[userIndex].balance -= amount;
    
    // Update transaction status
    const txnIndex = usersDB[userIndex].transactions.findIndex(t => 
        t.type === 'withdrawal' && 
        t.amount === -amount && 
        t.status === 'pending');
    
    if (txnIndex !== -1) {
        usersDB[userIndex].transactions[txnIndex].status = 'completed';
    }
    
    // Save changes
    localStorage.setItem('aab_users', JSON.stringify(usersDB));
    return true;
}

function rejectWithdrawal(userId, date) {
    const userIndex = usersDB.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    const requestIndex = usersDB[userIndex].withdrawalRequests.findIndex(w => 
        new Date(w.date).getTime() === new Date(date).getTime());
    if (requestIndex === -1) return false;

    // Update request status
    usersDB[userIndex].withdrawalRequests[requestIndex].status = 'rejected';
    
    // Update transaction status
    const amount = usersDB[userIndex].withdrawalRequests[requestIndex].amount;
    const txnIndex = usersDB[userIndex].transactions.findIndex(t => 
        t.type === 'withdrawal' && 
        t.amount === -amount && 
        t.status === 'pending');
    
    if (txnIndex !== -1) {
        usersDB[userIndex].transactions[txnIndex].status = 'rejected';
    }
    
    // Save changes
    localStorage.setItem('aab_users', JSON.stringify(usersDB));
    return true;
}

function approveVIP(userId, date) {
    const userIndex = usersDB.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    const requestIndex = usersDB[userIndex].vipRequests.findIndex(v => 
        new Date(v.date).getTime() === new Date(date).getTime());
    if (requestIndex === -1) return false;

    // Update VIP status
    usersDB[userIndex].vipRequests[requestIndex].status = 'approved';
    usersDB[userIndex].vipLevel = usersDB[userIndex].vipRequests[requestIndex].level;
    
    // Set daily profit based on VIP level
    const vipLevels = [1800, 6000, 10000, 13000, 28000, 60000, 75000, 150000, 400000, 600000];
    usersDB[userIndex].dailyProfit = vipLevels[usersDB[userIndex].vipLevel - 1];
    
    // Initialize tracking variables
    usersDB[userIndex].vipApprovedDate = new Date().toISOString();
    usersDB[userIndex].vipDaysCompleted = 0;
    usersDB[userIndex].lastProfitDate = null;
    
    // Update transaction status
    const amount = usersDB[userIndex].vipRequests[requestIndex].amount;
    const txnIndex = usersDB[userIndex].transactions.findIndex(t => 
        t.type.includes('VIP') && 
        t.amount === -amount && 
        t.status === 'pending');
    
    if (txnIndex !== -1) {
        usersDB[userIndex].transactions[txnIndex].status = 'completed';
    }
    
    // Save changes
    localStorage.setItem('aab_users', JSON.stringify(usersDB));
    
    // Update current user session if this is the current user
    if (currentUser && currentUser.id === userId) {
        currentUser = usersDB[userIndex];
        localStorage.setItem('aab_currentUser', JSON.stringify(currentUser));
    }
    
    return true;
}

function rejectVIP(userId, date) {
    const userIndex = usersDB.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    const requestIndex = usersDB[userIndex].vipRequests.findIndex(v => 
        new Date(v.date).getTime() === new Date(date).getTime());
    if (requestIndex === -1) return false;

    // Update request status
    usersDB[userIndex].vipRequests[requestIndex].status = 'rejected';
    
    // Refund amount
    const amount = usersDB[userIndex].vipRequests[requestIndex].amount;
    usersDB[userIndex].balance += amount;
    
    // Update transaction status
    const txnIndex = usersDB[userIndex].transactions.findIndex(t => 
        t.type.includes('VIP') && 
        t.amount === -amount && 
        t.status === 'pending');
    
    if (txnIndex !== -1) {
        usersDB[userIndex].transactions[txnIndex].status = 'refunded';
    }
    
    // Save changes
    localStorage.setItem('aab_users', JSON.stringify(usersDB));
    return true;
}

function processReferralBonus(userIndex, amount) {
    const user = usersDB[userIndex];
    if (!user.invitedBy) return;

    const inviter = usersDB.find(u => u.email === user.invitedBy);
    if (!inviter) return;

    const inviterIndex = usersDB.indexOf(inviter);
    const referralBonus = Math.floor(amount * 0.15);
    
    // Update inviter's balance and records
    usersDB[inviterIndex].balance += referralBonus;
    usersDB[inviterIndex].referralEarnings += referralBonus;
    
    // Update referral record
    const referralIndex = usersDB[inviterIndex].referrals.findIndex(r => 
        r.email === user.email);
    
    if (referralIndex !== -1) {
        usersDB[inviterIndex].referrals[referralIndex].bonus += referralBonus;
        usersDB[inviterIndex].referrals[referralIndex].lastBonusDate = new Date().toISOString();
    }
    
    // Add transactions
    usersDB[inviterIndex].transactions.push({
        type: `Referral bonus from ${user.email}`,
        amount: referralBonus,
        date: new Date().toISOString(),
        status: 'completed'
    });
    
    usersDB[userIndex].transactions.push({
        type: `Referral bonus to ${inviter.email}`,
        amount: -referralBonus,
        date: new Date().toISOString(),
        status: 'completed'
    });
}

// User management
function viewUserDetails(userId) {
    const user = usersDB.find(u => u.id === userId);
    if (!user) return false;

    document.getElementById('modal-user-title').textContent = user.name;
    
    const detailsContent = document.getElementById('user-details-content');
    detailsContent.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${user.email}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${user.phone}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Balance:</span>
            <span class="detail-value">UGX ${user.balance.toLocaleString()}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">VIP Level:</span>
            <span class="detail-value">${user.vipLevel > 0 ? `VIP ${user.vipLevel}` : 'None'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Daily Profit:</span>
            <span class="detail-value">UGX ${user.dailyProfit.toLocaleString()}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Total Earnings:</span>
            <span class="detail-value">UGX ${user.totalEarnings.toLocaleString()}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Referral Earnings:</span>
            <span class="detail-value">UGX ${user.referralEarnings.toLocaleString()}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Invitation Code:</span>
            <span class="detail-value">${user.invitationCode}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Invited By:</span>
            <span class="detail-value">${user.invitedBy || 'None'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Referrals:</span>
            <span class="detail-value">${user.referrals.length}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Member Since:</span>
            <span class="detail-value">${new Date(user.createdAt).toLocaleDateString()}</span>
        </div>
        
        <h4 style="margin-top: 1.5rem;">Recent Transactions</h4>
        <div class="transactions-list" style="max-height: 200px; margin-top: 1rem;">
            ${user.transactions.slice(-5).reverse().map(txn => `
                <div class="transaction-item">
                    <div>
                        <div class="transaction-type">${txn.type}</div>
                        <div class="transaction-date">${new Date(txn.date).toLocaleString()}</div>
                    </div>
                    <div class="transaction-amount ${txn.amount > 0 ? 'positive' : 'negative'}">
                        ${txn.amount > 0 ? '+' : ''}UGX ${Math.abs(txn.amount).toLocaleString()}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    document.getElementById('user-detail-modal').classList.add('show');
    return true;
}

function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user account? This action cannot be undone.')) {
        return false;
    }

    const userIndex = usersDB.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    usersDB.splice(userIndex, 1);
    localStorage.setItem('aab_users', JSON.stringify(usersDB));
    return true;
}

// Report generation
function generateReport() {
    const reportType = document.getElementById('report-type').value;
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    
    let reportHTML = '';
    
    if (reportType === 'transactions') {
        const allTransactions = usersDB.flatMap(user => 
            user.transactions.map(txn => ({
                user: user.name,
                type: txn.type,
                amount: txn.amount,
                date: txn.date,
                status: txn.status
            }))
        );
        
        // Filter by date if provided
        let filteredTransactions = allTransactions;
        if (dateFrom) {
            filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= new Date(dateFrom));
        }
        if (dateTo) {
            filteredTransactions = filteredTransactions.filter(t => new Date(t.date) <= new Date(dateTo));
        }
        
        // Sort by date
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Calculate totals
        const totalDeposits = filteredTransactions
            .filter(t => t.amount > 0 && (t.type === 'recharge' || t.type === 'bonus' || t.type.includes('referral')))
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalWithdrawals = filteredTransactions
            .filter(t => t.amount < 0 && (t.type === 'withdrawal' || t.type.includes('VIP')))
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        reportHTML = `
            <h3>Transactions Report</h3>
            <p>Period: ${dateFrom || 'Start'} to ${dateTo || 'Now'}</p>
            
            <div class="report-summary">
                <div class="summary-card">
                    <h4>Total Transactions</h4>
                    <div class="summary-value">${filteredTransactions.length}</div>
                </div>
                <div class="summary-card">
                    <h4>Total Deposits</h4>
                    <div class="summary-value">UGX ${totalDeposits.toLocaleString()}</div>
                </div>
                <div class="summary-card">
                    <h4>Total Withdrawals</h4>
                    <div class="summary-value">UGX ${totalWithdrawals.toLocaleString()}</div>
                </div>
            </div>
            
            <div class="report-table">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>User</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredTransactions.slice(0, 50).map(txn => `
                            <tr>
                                <td>${new Date(txn.date).toLocaleDateString()}</td>
                                <td>${txn.user}</td>
                                <td>${txn.type}</td>
                                <td class="${txn.amount > 0 ? 'positive' : 'negative'}">
                                    ${txn.amount > 0 ? '+' : ''}UGX ${Math.abs(txn.amount).toLocaleString()}
                                </td>
                                <td>${txn.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (reportType === 'users') {
        // Filter users by registration date if provided
        let filteredUsers = usersDB;
        if (dateFrom) {
            filteredUsers = filteredUsers.filter(u => new Date(u.createdAt) >= new Date(dateFrom));
        }
        if (dateTo) {
            filteredUsers = filteredUsers.filter(u => new Date(u.createdAt) <= new Date(dateTo));
        }
        
        // Group by date for chart
        const usersByDate = {};
        filteredUsers.forEach(user => {
            const date = new Date(user.createdAt).toLocaleDateString();
            usersByDate[date] = (usersByDate[date] || 0) + 1;
        });
        
        const dates = Object.keys(usersByDate).sort();
        const counts = dates.map(date => usersByDate[date]);
        
        reportHTML = `
            <h3>User Growth Report</h3>
            <p>Period: ${dateFrom || 'Start'} to ${dateTo || 'Now'}</p>
            <p>Total New Users: ${filteredUsers.length}</p>
            
            <div style="height: 300px; margin: 2rem 0; background-color: #f8f9fa; display: flex; align-items: flex-end; justify-content: space-around;">
                ${counts.map((count, i) => `
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        <div style="width: 30px; height: ${(count / Math.max(...counts)) * 250}px; background-color: var(--primary-color);"></div>
                        <div style="font-size: 0.8rem; margin-top: 0.5rem;">${dates[i]}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="report-table">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>New Users</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dates.map((date, i) => `
                            <tr>
                                <td>${date}</td>
                                <td>${counts[i]}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (reportType === 'profits') {
        // Calculate total profits distributed
        const vipUsers = usersDB.filter(u => u.vipLevel > 0);
        const totalDailyProfit = vipUsers.reduce((sum, user) => sum + user.dailyProfit, 0);
        const totalEarnings = vipUsers.reduce((sum, user) => sum + user.totalEarnings, 0);
        
        reportHTML = `
            <h3>Profit Distribution Report</h3>
            <p>Total VIP Users: ${vipUsers.length}</p>
            <p>Total Daily Profit Distribution: UGX ${totalDailyProfit.toLocaleString()}</p>
            <p>Total Earnings Distributed: UGX ${totalEarnings.toLocaleString()}</p>
            
            <div style="margin: 2rem 0;">
                <h4>VIP Level Distribution</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1rem;">
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => {
                        const count = vipUsers.filter(u => u.vipLevel === level).length;
                        return count > 0 ? `
                            <div style="background-color: var(--light-gray); padding: 0.5rem 1rem; border-radius: 5px;">
                                VIP ${level}: ${count} users
                            </div>
                        ` : '';
                    }).join('')}
                </div>
            </div>
            
            <div class="report-table"> 
                <table class="admin-table"> 
                    <thead> 
                        <tr> 
                            <th>VIP Level</th> 
                            <th>Users</th> 
                            <th>Daily Profit</th> 
                            <th>Total Distributed</th> 
                        </tr> 
                    </thead> 
                    <tbody> 
                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => { 
                            const levelUsers = vipUsers.filter(u => u.vipLevel === level); 
                            const count = levelUsers.length; 
                            if (count === 0) return ''; 
                            const vipLevels = [1800, 6000, 10000, 13000, 28000, 60000, 75000, 150000, 400000, 600000]; 
                            const daily = vipLevels[level - 1]; 
                            const total = levelUsers.reduce((sum, user) => sum + user.totalEarnings, 0); 
                            return ` 
                                <tr> 
                                    <td>VIP ${level}</td> 
                                    <td>${count}</td> 
                                    <td>UGX ${daily.toLocaleString()}</td> 
                                    <td>UGX ${(daily * count).toLocaleString()}</td> 
                                </tr> 
                            `; 
                        }).join('')} 
                    </tbody> 
                </table> 
            </div>
        `;
    }
    
    document.getElementById('report-results').innerHTML = reportHTML;
}
