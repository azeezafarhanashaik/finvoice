// FinVoice Financial Tracker JavaScript

// Global Variables
let transactions = [];
let goals = [];
let userProfile = {
    name: 'Your Name',
    joinDate: new Date().toISOString().split('T')[0]
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initializeApp();
    updateDashboard();
    updateGoalsDisplay();
    updateTransactionsDisplay();
    updateProfileDisplay();
    
    // Set default date to today
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
});

// Data Management
function loadData() {
    // Load transactions
    const savedTransactions = localStorage.getItem('finvoice_transactions');
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
    }
    
    // Load goals
    const savedGoals = localStorage.getItem('finvoice_goals');
    if (savedGoals) {
        goals = JSON.parse(savedGoals);
    }
    
    // Load user profile
    const savedProfile = localStorage.getItem('finvoice_profile');
    if (savedProfile) {
        userProfile = JSON.parse(savedProfile);
    }
}

function saveData() {
    localStorage.setItem('finvoice_transactions', JSON.stringify(transactions));
    localStorage.setItem('finvoice_goals', JSON.stringify(goals));
    localStorage.setItem('finvoice_profile', JSON.stringify(userProfile));
}

// Navigation Functions
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    document.getElementById(sectionName).classList.add('active');
    
    // Update navigation active state
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Update displays when switching sections
    if (sectionName === 'dashboard') {
        updateDashboard();
    } else if (sectionName === 'goals') {
        updateGoalsDisplay();
    } else if (sectionName === 'history') {
        updateTransactionsDisplay();
    } else if (sectionName === 'profile') {
        updateProfileDisplay();
    }
}

// Dashboard Functions
function updateDashboard() {
    const totalIncome = calculateTotalIncome();
    const totalExpenses = calculateTotalExpenses();
    const currentBalance = totalIncome - totalExpenses;
    
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('currentBalance').textContent = formatCurrency(currentBalance);
    
    // Add color coding for balance
    const balanceElement = document.getElementById('currentBalance');
    if (currentBalance > 0) {
        balanceElement.className = 'text-success';
    } else if (currentBalance < 0) {
        balanceElement.className = 'text-danger';
    } else {
        balanceElement.className = 'text-dark';
    }
}

function calculateTotalIncome() {
    return transactions
        .filter(t => t.type === 'Income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
}

function calculateTotalExpenses() {
    return transactions
        .filter(t => t.type === 'Expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
}

// Transaction Functions
function showTransactionModal() {
    const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
    
    // Reset form
    document.getElementById('transactionForm').reset();
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    
    modal.show();
}

function saveTransaction() {
    const form = document.getElementById('transactionForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const transaction = {
        id: Date.now().toString(),
        date: document.getElementById('transactionDate').value,
        amount: parseFloat(document.getElementById('transactionAmount').value),
        receiver: document.getElementById('transactionReceiver').value,
        type: document.getElementById('transactionType').value,
        description: document.getElementById('transactionDescription').value || 'No description'
    };
    
    transactions.unshift(transaction); // Add to beginning of array
    saveData();
    
    // Update displays
    updateDashboard();
    updatePieChart();
    updateTransactionsDisplay();
    updateProfileDisplay();
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('transactionModal')).hide();
    
    // Show success animation
    showSuccessMessage('Transaction added successfully!');
    
    // Add animation to the cards
    document.querySelectorAll('.golden-card').forEach(card => {
        card.classList.add('success-animation');
        setTimeout(() => card.classList.remove('success-animation'), 600);
    });
}

function updateTransactionsDisplay() {
    const tbody = document.getElementById('transactionsList');
    
    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="fas fa-receipt fa-3x mb-3 d-block"></i>
                    No transactions yet. Add your first transaction!
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = transactions.map(transaction => `
        <tr class="animate-in">
            <td>${formatDate(transaction.date)}</td>
            <td class="${transaction.type === 'Income' ? 'text-success' : 'text-danger'}">
                ${transaction.type === 'Income' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </td>
            <td>${transaction.receiver}</td>
            <td>
                <span class="badge ${transaction.type === 'Income' ? 'bg-success' : 'bg-danger'}">
                    ${transaction.type}
                </span>
            </td>
            <td>${transaction.description}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction('${transaction.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function deleteTransaction(transactionId) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== transactionId);
        saveData();
        
        updateDashboard();
        updateTransactionsDisplay();
        updateProfileDisplay();
        
        showSuccessMessage('Transaction deleted successfully!');
    }
}

// Goals Functions
function showAddGoalForm() {
    document.getElementById('addGoalForm').style.display = 'block';
    document.getElementById('addGoalForm').scrollIntoView({ behavior: 'smooth' });
}

function hideAddGoalForm() {
    document.getElementById('addGoalForm').style.display = 'none';
    document.getElementById('goalForm').reset();
}

document.getElementById('goalForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const goal = {
        id: Date.now().toString(),
        name: document.getElementById('goalName').value,
        target: parseFloat(document.getElementById('goalTarget').value),
        saved: parseFloat(document.getElementById('goalSaved').value) || 0,
        createdDate: new Date().toISOString().split('T')[0]
    };
    
    goals.push(goal);
    saveData();
    
    updateGoalsDisplay();
    updateProfileDisplay();
    hideAddGoalForm();
    
    showSuccessMessage('Goal added successfully!');
});

function updateGoalsDisplay() {
    const goalsList = document.getElementById('goalsList');
    
    if (goals.length === 0) {
        goalsList.innerHTML = `
            <div class="col-12">
                <div class="text-center text-muted py-5">
                    <i class="fas fa-bullseye fa-4x mb-3"></i>
                    <h4>No goals yet</h4>
                    <p>Start by adding your first financial goal!</p>
                </div>
            </div>
        `;
        return;
    }
    
    goalsList.innerHTML = goals.map(goal => {
        const progress = (goal.saved / goal.target) * 100;
        const isCompleted = goal.saved >= goal.target;
        
        return `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="goal-card ${isCompleted ? 'border-success' : ''}">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="text-dark mb-0">${goal.name}</h5>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="showAddMoneyModal('${goal.id}')">
                                    <i class="fas fa-plus me-2"></i>Add Money
                                </a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="deleteGoal('${goal.id}')">
                                    <i class="fas fa-trash me-2"></i>Delete
                                </a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted">Progress</span>
                            <span class="text-dark fw-bold">${Math.min(progress, 100).toFixed(1)}%</span>
                        </div>
                        <div class="golden-progress">
                            <div class="golden-progress-bar" style="width: ${Math.min(progress, 100)}%"></div>
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-between">
                        <div>
                            <small class="text-muted">Saved</small>
                            <div class="fw-bold text-success">${formatCurrency(goal.saved)}</div>
                        </div>
                        <div class="text-end">
                            <small class="text-muted">Target</small>
                            <div class="fw-bold text-warning">${formatCurrency(goal.target)}</div>
                        </div>
                    </div>
                    
                    ${isCompleted ? '<div class="alert alert-success mt-3 mb-0"><i class="fas fa-check-circle me-2"></i>Goal Completed! 🎉</div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

function showAddMoneyModal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    document.getElementById('goalId').value = goalId;
    document.getElementById('goalNameDisplay').value = goal.name;
    document.getElementById('amountToAdd').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('addMoneyModal'));
    modal.show();
}

function addMoneyToGoal() {
    const goalId = document.getElementById('goalId').value;
    const amountToAdd = parseFloat(document.getElementById('amountToAdd').value);
    
    if (!amountToAdd || amountToAdd <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    const goalIndex = goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) return;
    
    goals[goalIndex].saved += amountToAdd;
    saveData();
    
    updateGoalsDisplay();
    
    bootstrap.Modal.getInstance(document.getElementById('addMoneyModal')).hide();
    showSuccessMessage('Money added to goal successfully!');
}

function deleteGoal(goalId) {
    if (confirm('Are you sure you want to delete this goal?')) {
        goals = goals.filter(g => g.id !== goalId);
        saveData();
        updateGoalsDisplay();
        updateProfileDisplay();
        showSuccessMessage('Goal deleted successfully!');
    }
}

// Profile Functions
function updateProfileDisplay() {
    document.getElementById('userName').textContent = userProfile.name;
    document.getElementById('profileTotalTransactions').textContent = transactions.length;
    document.getElementById('profileTotalGoals').textContent = goals.length;
    
    // Calculate days active
    const joinDate = new Date(userProfile.joinDate);
    const today = new Date();
    const diffTime = Math.abs(today - joinDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    document.getElementById('profileDaysActive').textContent = diffDays;
}

function editProfile() {
    document.getElementById('editUserName').value = userProfile.name;
    
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();
}

function saveProfile() {
    const newName = document.getElementById('editUserName').value.trim();
    
    if (!newName) {
        alert('Please enter a valid name');
        return;
    }
    
    userProfile.name = newName;
    saveData();
    
    updateProfileDisplay();
    
    bootstrap.Modal.getInstance(document.getElementById('editProfileModal')).hide();
    showSuccessMessage('Profile updated successfully!');
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showSuccessMessage(message) {
    // Create and show a temporary success message
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show position-fixed';
    alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alert.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 3000);
}

function initializeApp() {
    // Add smooth scrolling for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Add loading states for buttons
    const buttons = document.querySelectorAll('.btn-golden');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.disabled) {
                this.classList.add('loading');
                setTimeout(() => {
                    this.classList.remove('loading');
                }, 1000);
            }
        });
    });
    
    // Add hover effects to cards
    const cards = document.querySelectorAll('.golden-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Handle form submissions with Enter key
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const activeModal = document.querySelector('.modal.show');
        if (activeModal) {
            if (activeModal.id === 'transactionModal') {
                saveTransaction();
            } else if (activeModal.id === 'addMoneyModal') {
                addMoneyToGoal();
            } else if (activeModal.id === 'editProfileModal') {
                saveProfile();
            }
        }
    }
});

// Handle escape key for modals
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.show');
        if (activeModal) {
            bootstrap.Modal.getInstance(activeModal).hide();
        }
    }
});

// Auto-save functionality
setInterval(() => {
    if (transactions.length > 0 || goals.length > 0 || userProfile.name !== 'Your Name') {
        saveData();
    }
}, 30000); // Save every 30 seconds

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Page became visible, refresh displays
        updateDashboard();
        updateGoalsDisplay();
        updateTransactionsDisplay();
        updateProfileDisplay();
    }
});
