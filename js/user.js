// User data management
function updateUserData() {
    if (!currentUser) return;
    
    const userFromDB = usersDB.find(u => u.id === currentUser.id);
    if (userFromDB) {
        currentUser = { ...userFromDB, ...currentUser };
        localStorage.setItem('aab_currentUser', JSON.stringify(currentUser));
    }
}

// VIP Profit Processing
function processVIPProfit() {
    if (!currentUser || currentUser.vipLevel <= 0 || !currentUser.vipApprovedDate) return;

    const now = new Date();
    const lastProfitDate = currentUser.lastProfitDate ? new Date(currentUser.lastProfitDate) : null;
    const vipApprovedDate = new Date(currentUser.vipApprovedDate);
    const daysSinceApproval = Math.floor((now - vipApprovedDate) / (1000 * 60 * 60 * 24));

    // Check if VIP cycle completed
    if (daysSinceApproval >= 60) {
        handleVIPCycleCompletion();
        return;
    }

    // Check if profit should be added today
    const todayStr = now.toISOString().split('T')[0];
    const lastProfitDayStr = lastProfitDate ? lastProfitDate.toISOString().split('T')[0] : null;
    
    if (!lastProfitDayStr || lastProfitDayStr !== todayStr) {
        addDailyProfit();
    }
}

function handleVIPCycleCompletion() {
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

function addDailyProfit() {
    const userIndex = usersDB.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        const profit = currentUser.dailyProfit;
        const now = new Date();
        
        usersDB[userIndex].balance += profit;
        usersDB[userIndex].totalEarnings += profit;
        usersDB[userIndex].lastProfitDate = now.toISOString();
        usersDB[userIndex].vipDaysCompleted = (usersDB[userIndex].vipDaysCompleted || 0) + 1;
        
        usersDB[userIndex].transactions.push({
            type: `VIP ${currentUser.vipLevel} daily profit (Day ${usersDB[userIndex].vipDaysCompleted}/60)`,
            amount: profit,
            date: now.toISOString(),
            status: 'completed'
        });
        
        localStorage.setItem('aab_users', JSON.stringify(usersDB));
        currentUser = usersDB[userIndex];
        localStorage.setItem('aab_currentUser', JSON.stringify(currentUser));
        
        updateUI();
    }
}

// UI Update functions
function updateUI() {
    if (!currentUser) return;
    
    if (document.getElementById('user-balance')) {
        document.getElementById('user-balance').textContent = `UGX ${currentUser.balance.toLocaleString()}`;
        document.getElementById('total-earnings').textContent = `UGX ${currentUser.totalEarnings.toLocaleString()}`;
        document.getElementById('daily-profit').textContent = `UGX ${currentUser.dailyProfit.toLocaleString()}`;
        document.getElementById('vip-level').textContent = currentUser.vipLevel > 0 ? `VIP ${currentUser.vipLevel}` : 'None';
        document.getElementById('invitation-code').textContent = currentUser.invitationCode;
    }
    
    // Profile page updates
    if (document.getElementById('profile-name')) {
        document.getElementById('profile-name').textContent = currentUser.name;
        document.getElementById('profile-email').textContent = currentUser.email;
        document.getElementById('profile-phone').textContent = currentUser.phone;
        document.getElementById('account-status').textContent = 'Active';
        document.getElementById('vip-level-profile').textContent = currentUser.vipLevel > 0 ? `VIP ${currentUser.vipLevel}` : 'None';
        document.getElementById('reg-date').textContent = new Date(currentUser.createdAt).toLocaleDateString();
        document.getElementById('invitation-code-profile').textContent = currentUser.invitationCode;
        document.getElementById('total-referrals').textContent = currentUser.referrals.length;
        document.getElementById('referral-earnings').textContent = `UGX ${currentUser.referralEarnings.toLocaleString()}`;
        
        updateTransactionList();
    }
}

function updateTransactionList() {
    const transactionsList = document.getElementById('transactions-list');
    if (transactionsList) {
        transactionsList.innerHTML = currentUser.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10)
            .map(txn => `
                <div class="transaction-item">
                    <div>
                        <div class="transaction-type">${txn.type}</div>
                        <div class="transaction-date">${new Date(txn.date).toLocaleString()}</div>
                    </div>
                    <div class="transaction-amount ${txn.amount > 0 ? 'positive' : 'negative'}">
                        ${txn.amount > 0 ? '+' : ''}UGX ${Math.abs(txn.amount).toLocaleString()}
                    </div>
                </div>
            `).join('');
    }
}

// Products page functions
function loadVIPProducts() {
    if (!document.getElementById('vip-products')) return;
    
    const productsContainer = document.getElementById('vip-products');
    productsContainer.innerHTML = '';
    
    const prices = [10000, 30000, 50000, 80000, 120000, 240000, 300000, 600000, 1200000, 2000000];
    const dailyProfits = [1800, 6000, 10000, 13000, 28000, 60000, 75000, 150000, 400000, 600000];
    const productImages = [
        './images/vip1.jpeg',
        './images/vip2.jpeg',
        './images/vip3.jpg',
        './images/vip4.jpeg',
        './images/vip5.jpeg',
        './images/vip6.jpeg',
        './images/vip7.jpeg',
        './images/vip8.jpg',
        './images/vip9.jpeg',
        './images/vip10.png'
    ];

    for (let i = 0; i < prices.length; i++) {
        const price = prices[i];
        const dailyProfit = dailyProfits[i];
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${productImages[i]}" alt="VIP ${i + 1} Package" class="product-image" onerror="this.src='https://via.placeholder.com/300x200?text=VIP+${i+1}'">
                <div class="vip-badge">VIP ${i + 1}</div>
            </div>
            <div class="product-details">
                <h3>VIP ${i + 1} Package</h3>
                <div class="product-price">Price: UGX ${price.toLocaleString()}</div>
                <div class="product-profit">Daily income: UGX ${dailyProfit.toLocaleString()}</div>
                <div class="product-cycle">Cycle: 60 days</div>
                <ul class="product-features">
                    <li><i class="fas fa-check"></i> Daily profit for 60 days</li>
                    <li><i class="fas fa-check"></i> 24/7 Support</li>
                    <li><i class="fas fa-check"></i> Automatic payments</li>
                </ul>
                <button class="buy-btn" data-vip="${i + 1}" data-price="${price}" data-profit="${dailyProfit}">
                    <i class="fas fa-shopping-cart"></i> Buy Now
                </button>
            </div>
        `;
        productsContainer.appendChild(productCard);
    }
    
    // Add event listeners to buy buttons
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const vipLevel = this.getAttribute('data-vip');
            const price = parseInt(this.getAttribute('data-price'));
            const dailyProfit = parseInt(this.getAttribute('data-profit'));
            
            if (currentUser.balance >= price) {
                // Show confirmation modal
                document.getElementById('vip-modal-title').textContent = `Upgrade to VIP ${vipLevel}`;
                document.getElementById('vip-details').innerHTML = `
                    <p><strong>Package:</strong> VIP ${vipLevel}</p>
                    <p><strong>Price:</strong> UGX ${price.toLocaleString()}</p>
                    <p><strong>Daily Profit:</strong> UGX ${dailyProfit.toLocaleString()}</p>
                    <p>Your account will be charged immediately upon confirmation.</p>
                `;
                
                document.getElementById('vip-modal').classList.remove('modal-hidden');
            } else {
                alert('Insufficient balance. Please recharge your account.');
            }
        });
    });
}

// Modal functions
function setupModals() {
    // Recharge functionality
    if (document.getElementById('recharge-btn')) {
        document.getElementById('recharge-btn').addEventListener('click', function() {
            document.getElementById('recharge-modal').classList.remove('modal-hidden');
        });
    }

    if (document.getElementById('recharge-form')) {
        document.getElementById('recharge-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const amount = parseInt(document.getElementById('recharge-amount').value);
            const proof = document.getElementById('recharge-proof').files[0];
            if (amount < 10000) {
                alert('Minimum recharge amount is UGX 10,000');
                return;
            }
            if (!proof) {
                alert('Please upload payment proof');
                return;
            }
            
            const userIndex = usersDB.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                usersDB[userIndex].rechargeRequests.push({
                    amount,
                    date: new Date().toISOString(),
                    status: 'pending',
                    proof: proof.name
                });
                usersDB[userIndex].transactions.push({
                    type: 'recharge',
                    amount,
                    date: new Date().toISOString(),
                    status: 'pending'
                });
                localStorage.setItem('aab_users', JSON.stringify(usersDB));
                
                currentUser = usersDB[userIndex];
                localStorage.setItem('aab_currentUser', JSON.stringify(currentUser));
                alert('Recharge request submitted for approval. You will be notified once approved.');
                document.getElementById('recharge-modal').classList.add('modal-hidden');
                this.reset();
            }
        });
    }
    
    // Withdraw functionality
    if (document.getElementById('withdraw-btn')) {
        document.getElementById('withdraw-btn').addEventListener('click', function() {
            document.getElementById('withdraw-modal').classList.remove('modal-hidden');
        });
    }
    
    if (document.getElementById('withdraw-form')) {
        document.getElementById('withdraw-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const amount = parseInt(document.getElementById('withdraw-amount').value);
            const phone = document.getElementById('withdraw-number').value;
            const network = document.getElementById('withdraw-network').value;
            
            if (amount < 5000 || amount > 2000000) {
                alert('Withdrawal amount must be between UGX 5,000 and UGX 2,000,000');
                return;
            }
            
            if (amount > currentUser.balance) {
                alert('Insufficient balance for this withdrawal');
                return;
            }
            
            const userIndex = usersDB.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                usersDB[userIndex].withdrawalRequests.push({
                    amount,
                    phone,
                    network,
                    date: new Date().toISOString(),
                    status: 'pending'
                });
                
                usersDB[userIndex].transactions.push({
                    type: 'withdrawal',
                    amount: -amount,
                    date: new Date().toISOString(),
                    status: 'pending'
                });
                
                localStorage.setItem('aab_users', JSON.stringify(usersDB));
                currentUser = usersDB[userIndex];
                localStorage.setItem('aab_currentUser', JSON.stringify(currentUser));
                
                alert('Withdrawal request submitted for approval. You will be notified once processed.');
                document.getElementById('withdraw-modal').classList.add('modal-hidden');
                this.reset();
            }
        });
    }
    
    // VIP purchase confirmation
    if (document.getElementById('confirm-vip-btn')) {
        document.getElementById('confirm-vip-btn').addEventListener('click', function() {
            const modalTitle = document.getElementById('vip-modal-title').textContent;
            const vipLevel = parseInt(modalTitle.replace('Upgrade to VIP ', ''));
            const prices = [10000, 30000, 50000, 80000, 120000, 240000, 300000, 600000, 1200000, 2000000];
            const dailyProfits = [1800, 6000, 10000, 13000, 28000, 60000, 75000, 150000, 400000, 600000];
            const price = prices[vipLevel - 1];
            const dailyProfit = dailyProfits[vipLevel - 1];

            const userIndex = usersDB.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                usersDB[userIndex].balance -= price;
                usersDB[userIndex].vipRequests.push({ 
                    level: vipLevel, 
                    amount: price, 
                    date: new Date().toISOString(), 
                    status: 'pending',
                    daysRemaining: 60
                });
                usersDB[userIndex].transactions.push({ 
                    type: `VIP ${vipLevel} purchase`, 
                    amount: -price, 
                    date: new Date().toISOString(), 
                    status: 'pending' 
                });
                localStorage.setItem('aab_users', JSON.stringify(usersDB));

                currentUser = usersDB[userIndex];
                localStorage.setItem('aab_currentUser', JSON.stringify(currentUser));
                alert(`VIP ${vipLevel} purchase request submitted for approval.`);
                document.getElementById('vip-modal').classList.add('modal-hidden');

                if (window.location.pathname.includes('products.html')) {
                    window.location.reload();
                }
            }
        });
    }
    
    // Profile editing
    if (document.getElementById('edit-profile-btn')) {
        document.getElementById('edit-profile-btn').addEventListener('click', function() {
            document.getElementById('edit-name').value = currentUser.name;
            document.getElementById('edit-email').value = currentUser.email;
            document.getElementById('edit-phone').value = currentUser.phone;
            document.getElementById('edit-modal').classList.remove('modal-hidden');
        });
    }
    
    if (document.getElementById('edit-profile-form')) {
        document.getElementById('edit-profile-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('edit-name').value;
            const email = document.getElementById('edit-email').value;
            const phone = document.getElementById('edit-phone').value;
            const password = document.getElementById('edit-password').value;
            const confirmPassword = document.getElementById('edit-confirm').value;
            
            if (password && password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            const userIndex = usersDB.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                usersDB[userIndex].name = name;
                usersDB[userIndex].email = email;
                usersDB[userIndex].phone = phone;
                usersDB[userIndex].updatedAt = new Date().toISOString();
                
                if (password) {
                    usersDB[userIndex].password = password;
                }
                
                localStorage.setItem('aab_users', JSON.stringify(usersDB));
                currentUser = usersDB[userIndex];
                localStorage.setItem('aab_currentUser', JSON.stringify(currentUser));
                
                alert('Profile updated successfully');
                document.getElementById('edit-modal').classList.add('modal-hidden');
                window.location.reload();
            }
        });
    }
    
    // Account deletion
    if (document.getElementById('delete-account-btn')) {
        document.getElementById('delete-account-btn').addEventListener('click', function() {
            document.getElementById('delete-modal').classList.remove('modal-hidden');
        });
    }
    
    if (document.getElementById('confirm-delete-btn')) {
        document.getElementById('confirm-delete-btn').addEventListener('click', function() {
            const userIndex = usersDB.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                usersDB.splice(userIndex, 1);
                localStorage.setItem('aab_users', JSON.stringify(usersDB));
                localStorage.removeItem('aab_currentUser');
                window.location.href = 'login.html';
            }
        });
    }
    
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
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    if (!currentUser && !currentAdmin) return;
    
    if (currentUser) {
        updateUserData();
        processVIPProfit();
        updateUI();
        loadVIPProducts();
        setupModals();
        
        // Setup periodic sync
        setInterval(() => {
            updateUserData();
            updateUI();
        }, 30000);
        
        // Upgrade to VIP button
        if (document.getElementById('upgrade-btn')) {
            document.getElementById('upgrade-btn').addEventListener('click', function() {
                window.location.href = 'products.html';
            });
        }
        
        // Share buttons functionality
        if (document.querySelector('.share-btn.copy')) {
            document.querySelector('.share-btn.copy').addEventListener('click', function() {
                navigator.clipboard.writeText(currentUser.invitationCode)
                    .then(() => alert('Invitation code copied to clipboard!'))
                    .catch(() => alert('Failed to copy code. Please copy it manually.'));
            });
        }
    }
});
