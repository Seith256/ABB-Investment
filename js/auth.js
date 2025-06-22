// Database and configuration
const DATA_VERSION = '1.2';
const DEFAULT_INVITE_CODE = '2233';

// Initialize or load databases
const usersDB = JSON.parse(localStorage.getItem('aab_users')) || [];
const adminDB = JSON.parse(localStorage.getItem('aab_admin')) || [
    { email: 'admin@aab.com', password: 'admin123', name: 'Admin' }
];

// Initialize default admin if not exists
if (!localStorage.getItem('aab_admin')) {
    localStorage.setItem('aab_admin', JSON.stringify(adminDB));
    localStorage.setItem('aab_data_version', DATA_VERSION);
}

// Check and migrate data
if (localStorage.getItem('aab_data_version') !== DATA_VERSION) {
    migrateData();
}

// Current user session
let currentUser = JSON.parse(localStorage.getItem('aab_currentUser')) || null;
let currentAdmin = JSON.parse(localStorage.getItem('aab_currentAdmin')) || null;

// Data migration function
function migrateData() {
    // Migrate from sessionStorage if available
    if (sessionStorage.getItem('aab_currentUser')) {
        localStorage.setItem('aab_currentUser', sessionStorage.getItem('aab_currentUser'));
        sessionStorage.removeItem('aab_currentUser');
    }
    if (sessionStorage.getItem('aab_currentAdmin')) {
        localStorage.setItem('aab_currentAdmin', sessionStorage.getItem('aab_currentAdmin'));
        sessionStorage.removeItem('aab_currentAdmin');
    }
    localStorage.setItem('aab_data_version', DATA_VERSION);
}

// Authentication functions
function handleLogin(email, password, inviteCode, isAdmin) {
    if (isAdmin) {
        const admin = adminDB.find(a => a.email === email && a.password === password);
        if (admin) {
            localStorage.setItem('aab_currentAdmin', JSON.stringify(admin));
            return { success: true, redirect: 'admin.html' };
        }
        return { success: false, message: 'Invalid admin credentials' };
    } else {
        const user = usersDB.find(u => u.email === email && u.password === password);
        if (user) {
            processInvitation(user, inviteCode);
            localStorage.setItem('aab_currentUser', JSON.stringify(user));
            return { success: true, redirect: 'index.html' };
        }
        return { success: false, message: 'Invalid email or password' };
    }
}

function processInvitation(user, inviteCode) {
    if (inviteCode && inviteCode !== DEFAULT_INVITE_CODE && !user.hasUsedInvite) {
        const inviter = usersDB.find(u => u.invitationCode === inviteCode);
        if (inviter) {
            inviter.balance += 2000;
            inviter.referralEarnings += 2000;
            inviter.referrals.push({
                email: user.email,
                date: new Date().toISOString(),
                bonus: 2000
            });
            user.invitedBy = inviter.email;
            user.hasUsedInvite = true;
            localStorage.setItem('aab_users', JSON.stringify(usersDB));
        }
    }
}

// Signup function
function handleSignup(formData) {
    if (formData.password !== formData.confirmPassword) {
        return { success: false, message: 'Passwords do not match' };
    }
    
    if (usersDB.some(u => u.email === formData.email)) {
        return { success: false, message: 'Email already registered' };
    }

    const newUser = createNewUser(formData);
    usersDB.push(newUser);
    localStorage.setItem('aab_users', JSON.stringify(usersDB));
    localStorage.setItem('aab_currentUser', JSON.stringify(newUser));
    
    return { success: true, redirect: 'index.html' };
}

function createNewUser(formData) {
    return {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        balance: 2000,
        invitationCode: generateInvitationCode(),
        invitedBy: processSignupInvitation(formData.inviteCode),
        hasUsedInvite: Boolean(formData.inviteCode && formData.inviteCode !== DEFAULT_INVITE_CODE),
        vipLevel: 0,
        dailyProfit: 0,
        totalEarnings: 0,
        referralEarnings: 0,
        referrals: [],
        transactions: [{
            type: 'bonus',
            amount: 2000,
            date: new Date().toISOString(),
            status: 'completed'
        }],
        rechargeRequests: [],
        withdrawalRequests: [],
        vipRequests: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

function generateInvitationCode() {
    let code;
    do {
        code = Math.floor(1000 + Math.random() * 9000).toString();
    } while (usersDB.some(u => u.invitationCode === code));
    return code;
}

function processSignupInvitation(inviteCode) {
    if (inviteCode && inviteCode !== DEFAULT_INVITE_CODE) {
        const inviter = usersDB.find(u => u.invitationCode === inviteCode);
        if (inviter) {
            inviter.referrals.push({
                email: formData.email,
                date: new Date().toISOString(),
                bonus: 0
            });
            return inviter.email;
        }
    }
    return null;
}

// Logout function
function handleLogout() {
    localStorage.removeItem('aab_currentUser');
    localStorage.removeItem('aab_currentAdmin');
    return { redirect: 'login.html' };
}

// Data synchronization
function syncUserData() {
    if (!currentUser) return;
    
    const userFromDB = usersDB.find(u => u.id === currentUser.id);
    if (userFromDB) {
        const updatedUser = { ...userFromDB, ...currentUser };
        localStorage.setItem('aab_currentUser', JSON.stringify(updatedUser));
        
        const userIndex = usersDB.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            usersDB[userIndex] = updatedUser;
            localStorage.setItem('aab_users', JSON.stringify(usersDB));
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Setup event listeners
    if (document.getElementById('login-form')) {
        document.getElementById('login-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const result = handleLogin(
                document.getElementById('login-email').value,
                document.getElementById('login-password').value,
                document.getElementById('login-invite').value || DEFAULT_INVITE_CODE,
                document.getElementById('login-admin').checked
            );
            if (result.success) {
                window.location.href = result.redirect;
            } else {
                alert(result.message);
            }
        });
    }

    if (document.getElementById('signup-form')) {
        document.getElementById('signup-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = {
                name: document.getElementById('signup-name').value,
                email: document.getElementById('signup-email').value,
                phone: document.getElementById('signup-phone').value,
                password: document.getElementById('signup-password').value,
                confirmPassword: document.getElementById('signup-confirm').value,
                inviteCode: document.getElementById('signup-invite').value || DEFAULT_INVITE_CODE
            };
            const result = handleSignup(formData);
            if (result.success) {
                window.location.href = result.redirect;
            } else {
                alert(result.message);
            }
        });
    }

    document.querySelectorAll('#logout-btn, #admin-logout-btn').forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const result = handleLogout();
                window.location.href = result.redirect;
            });
        }
    });

    // Setup sync intervals
    setInterval(syncUserData, 30000);
    
    // Cross-tab synchronization
    window.addEventListener('storage', function(event) {
        if (event.key === 'aab_currentUser') {
            currentUser = JSON.parse(event.newValue);
        }
        if (event.key === 'aab_currentAdmin') {
            currentAdmin = JSON.parse(event.newValue);
        }
    });
});
