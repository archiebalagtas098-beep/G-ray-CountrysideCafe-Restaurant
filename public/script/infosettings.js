// Settings Management Script - Simplified Version (Name & Role Only)
let currentUser = null;
let originalUserData = null;

// Element references
let elements = {
    fullNameDisplay: null,
    roleDisplay: null,
    saveBtn: null,
    cancelBtn: null,
    logoutBtn: null
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('Settings page loaded');
    
    // Initialize element references
    initializeElements();
    
    // Load user data
    loadUserData();
    
    // Setup event listeners
    setupEventListeners();
});

// Initialize all DOM element references
function initializeElements() {
    elements.fullNameDisplay = document.getElementById('fullNameDisplay');
    elements.roleDisplay = document.getElementById('roleDisplay');
    elements.saveBtn = document.getElementById('saveBtn');
    elements.cancelBtn = document.getElementById('cancelBtn');
    elements.logoutBtn = document.getElementById('logoutBtn');
    
    // Log missing elements for debugging
    Object.keys(elements).forEach(key => {
        if (!elements[key]) {
            console.warn(`Element not found: ${key}`);
        }
    });
}

// Load user data
async function loadUserData() {
    try {
        console.log('Loading user data...');
        
        const response = await fetch('/api/infosettings/user', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('API Response:', result);
        
        // Check if the response has the expected structure
        if (!result.success) {
            throw new Error(result.message || 'API returned error');
        }
        
        // Extract user data - handle different possible structures
        let userData = null;
        
        if (result.data) {
            // Structure: { success: true, data: { ... } }
            userData = result.data;
        } else if (result.user) {
            // Structure: { success: true, user: { ... } }
            userData = result.user;
        } else if (result._id || result.name || result.fullName || result.role) {
            // Structure: direct object with user properties
            userData = result;
        } else {
            console.error('Unexpected response structure:', result);
            throw new Error('Invalid user data structure');
        }
        
        // Validate that we have at least a name or id
        if (!userData || (!userData.name && !userData.fullName && !userData._id)) {
            console.error('Invalid user data:', userData);
            throw new Error('Invalid user data');
        }
        
        // Store user data - handle both name and fullName fields
        currentUser = {
            _id: userData._id || 'N/A',
            fullName: userData.fullName || userData.name || userData.username || '',
            role: userData.role || 'User'
        };
        
        console.log('✅ User data loaded:', currentUser);
        console.log('   Full Name:', currentUser.fullName);
        console.log('   Role:', currentUser.role);
        
        originalUserData = JSON.parse(JSON.stringify(currentUser));
        
        // Update UI with user data
        populateUserData();
        
    } catch (error) {
        console.error('❌ Error loading user data:', error.message);
        showToast('Failed to load user data: ' + error.message, 'error');
        
        // Fallback to demo data if API fails
        console.log('Using fallback demo data');
        currentUser = {
            _id: 'demo123',
            fullName: 'Demo User',
            role: 'Administrator'
        };
        originalUserData = JSON.parse(JSON.stringify(currentUser));
        populateUserData();
    }
}

// Save user data
async function saveUserData() {
    if (!currentUser || !originalUserData) {
        showToast('User data not loaded', 'error');
        return;
    }
    
    const fullName = elements.fullNameDisplay ? elements.fullNameDisplay.value.trim() : '';
    
    // Validation
    if (!fullName) {
        showToast('Full name is required', 'error');
        return;
    }
    
    // Check if values have changed
    const hasChanges = fullName !== originalUserData.fullName;
    
    if (!hasChanges) {
        showToast('No changes made', 'info');
        return;
    }
    
    try {
        // Disable save button
        if (elements.saveBtn) {
            elements.saveBtn.disabled = true;
            elements.saveBtn.textContent = 'Saving...';
        }
        
        console.log('Saving name:', fullName);
        
        const response = await fetch('/api/infosettings/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                name: fullName  // Send as name to match backend expectation
            })
        });
        
        // Try to parse response even if not OK
        let result;
        try {
            result = await response.json();
        } catch (e) {
            console.error('Could not parse response:', e);
            throw new Error('Invalid server response');
        }
        
        if (!response.ok) {
            throw new Error(result.message || `HTTP ${response.status}`);
        }

        console.log('Save response:', result);
        
        // Update current user
        currentUser.fullName = fullName;
        originalUserData = JSON.parse(JSON.stringify(currentUser));
        
        // Reload user data from database to confirm persistence
        await loadUserData();
        
        showToast('✅ Name updated successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving changes:', error);
        showToast('Error: ' + error.message, 'error');
        
        // Revert to original values
        if (originalUserData && elements.fullNameDisplay) {
            elements.fullNameDisplay.value = originalUserData.fullName || '';
        }
    } finally {
        // Re-enable save button
        if (elements.saveBtn) {
            elements.saveBtn.disabled = false;
            elements.saveBtn.textContent = 'Save Changes';
        }
    }
}

// Cancel changes
function cancelChanges() {
    if (originalUserData) {
        if (elements.fullNameDisplay) {
            elements.fullNameDisplay.value = originalUserData.fullName || '';
        }
        showToast('Changes cancelled', 'info');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    
    // Set background color based on type
    let bgColor = '#17a2b8'; // info default
    if (type === 'success') bgColor = '#28a745';
    else if (type === 'error') bgColor = '#dc3545';
    else if (type === 'warning') bgColor = '#ffc107';
    
    toast.style.cssText = `
        padding: 12px 16px;
        border-radius: 6px;
        color: ${type === 'warning' ? '#000' : 'white'};
        background-color: ${bgColor};
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        font-size: 14px;
        min-width: 200px;
        max-width: 300px;
    `;

    // Add animation styles if not already present
    if (!document.getElementById('toastAnimations')) {
        const style = document.createElement('style');
        style.id = 'toastAnimations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Logout handler - using alert modal
function handleLogout() {
    showLogoutConfirmation(() => {
        // On confirm - proceed with logout
        window.location.href = '/logout';
    }, () => {
        // On cancel - do nothing
        console.log('🔙 Logout cancelled');
    });
}

// Logout confirmation helper - using alert modal matching staff.js style
function showLogoutConfirmation(onConfirm, onCancel) {
    if (document.getElementById('logoutModal')) {
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'logoutModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease;
    `;

    if (!document.getElementById('logoutModalStyles')) {
        const style = document.createElement('style');
        style.id = 'logoutModalStyles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
        text-align: center;
    `;

    modalContent.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #333; font-size: 24px;">Confirm Logout</h3>
            <p style="color: #666; margin: 0; font-size: 16px;">Are you sure you want to logout?</p>
        </div>
        <div style="display: flex; gap: 15px; justify-content: center;">
            <button id="cancelLogoutBtn" style="
                padding: 12px 30px;
                background: #f0f0f0;
                color: #666;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 500;
                transition: all 0.2s ease;
                flex: 1;
                max-width: 130px;
            " onmouseover="this.style.background='#e4e4e4'" 
               onmouseout="this.style.background='#f0f0f0'">
                No
            </button>
            <button id="confirmLogoutBtn" style="
                padding: 12px 30px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 500;
                transition: all 0.2s ease;
                flex: 1;
                max-width: 130px;
            " onmouseover="this.style.background='#c82333'" 
               onmouseout="this.style.background='#dc3545'">
                Confirm
            </button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    const cancelBtn = document.getElementById('cancelLogoutBtn');
    const confirmBtn = document.getElementById('confirmLogoutBtn');

    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
        if (onCancel) onCancel();
    });

    confirmBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
        if (onConfirm) onConfirm();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
            if (onCancel) onCancel();
        }
    });

    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            document.removeEventListener('keydown', handleEscape);
            if (document.getElementById('logoutModal')) {
                document.body.removeChild(modal);
                if (onCancel) onCancel();
            }
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// Setup event listeners
function setupEventListeners() {
    if (elements.saveBtn) {
        elements.saveBtn.addEventListener('click', saveUserData);
    }
    
    if (elements.cancelBtn) {
        elements.cancelBtn.addEventListener('click', cancelChanges);
    }
    
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }
}

// Populate UI with user data
function populateUserData() {
    if (!currentUser) return;
    
    if (elements.fullNameDisplay) {
        elements.fullNameDisplay.value = currentUser.fullName || '';
    }
    
    if (elements.roleDisplay) {
        elements.roleDisplay.value = currentUser.role || '';
        elements.roleDisplay.readOnly = true;
    }
}