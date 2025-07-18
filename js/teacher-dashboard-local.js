// Teacher Dashboard functionality using localStorage-based data management

// Initialize components
let teacherLogger, dataManager;

// Global variables
let currentUser = null;
let userProfile = null;
let appointments = [];
let students = [];

// Declare functions that will be available globally
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('d-none');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.remove('d-none');
    }
    
    // Update navigation
    document.querySelectorAll('.sidebar-nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`[onclick*="showSection('${sectionName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'appointments': 'Appointments',
        'schedule': 'Schedule',
        'students': 'Students',
        'messages': 'Messages',
        'profile': 'Profile'
    };
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titles[sectionName] || 'Dashboard';
    }
    
    // Load section-specific data
    if (sectionName === 'messages') {
        loadConversations();
    }
    
    if (teacherLogger) {
        teacherLogger.logUserAction('NAVIGATION', { section: sectionName });
    }
}

// Professional Sidebar Management - Always Expanded
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (sidebar && mainContent) {
        // Ensure sidebar is always expanded
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('expanded');
        
        // Set fixed dimensions for always-expanded sidebar
        sidebar.style.width = '300px';
        mainContent.style.marginLeft = '300px';
        
        if (teacherLogger) {
            teacherLogger.logUserAction('SIDEBAR_INITIALIZED', { state: 'expanded' });
        }
    }
}

// Quick action functions
function addTimeSlot() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-plus me-2"></i>Add Time Slot
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="timeSlotForm">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="slotDate" class="form-label">Date</label>
                                <input type="date" class="form-control" id="slotDate" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="slotDay" class="form-label">Day</label>
                                <select class="form-select" id="slotDay" required>
                                    <option value="">Select day...</option>
                                    <option value="monday">Monday</option>
                                    <option value="tuesday">Tuesday</option>
                                    <option value="wednesday">Wednesday</option>
                                    <option value="thursday">Thursday</option>
                                    <option value="friday">Friday</option>
                                    <option value="saturday">Saturday</option>
                                    <option value="sunday">Sunday</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="startTime" class="form-label">Start Time</label>
                                <input type="time" class="form-control" id="startTime" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="endTime" class="form-label">End Time</label>
                                <input type="time" class="form-control" id="endTime" required>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="slotType" class="form-label">Slot Type</label>
                            <select class="form-select" id="slotType" required>
                                <option value="">Select type...</option>
                                <option value="consultation">Consultation</option>
                                <option value="office-hours">Office Hours</option>
                                <option value="group-session">Group Session</option>
                                <option value="one-on-one">One-on-One</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="maxStudents" class="form-label">Maximum Students</label>
                            <input type="number" class="form-control" id="maxStudents" min="1" max="20" value="1">
                        </div>
                        <div class="mb-3">
                            <label for="slotNotes" class="form-label">Notes (Optional)</label>
                            <textarea class="form-control" id="slotNotes" rows="3" placeholder="Any additional information..."></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="saveTimeSlot()">
                        <i class="fas fa-save me-2"></i>Save Time Slot
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    // Set default date to today
    document.getElementById('slotDate').valueAsDate = new Date();
    
    // Clean up modal when hidden
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

function saveTimeSlot() {
    const form = document.getElementById('timeSlotForm');
    const formData = new FormData(form);
    
    const timeSlot = {
        date: document.getElementById('slotDate').value,
        day: document.getElementById('slotDay').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        type: document.getElementById('slotType').value,
        maxStudents: document.getElementById('maxStudents').value,
        notes: document.getElementById('slotNotes').value,
        createdAt: new Date().toISOString(),
        teacherId: currentUser?.id || 'teacher-1'
    };
    
    // Validate required fields
    if (!timeSlot.date || !timeSlot.day || !timeSlot.startTime || !timeSlot.endTime || !timeSlot.type) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate time range
    if (timeSlot.startTime >= timeSlot.endTime) {
        showNotification('End time must be after start time', 'error');
        return;
    }
    
    try {
        // Save to localStorage (in real app, this would be saved to database)
        const existingSlots = JSON.parse(localStorage.getItem('teacherTimeSlots') || '[]');
        existingSlots.push(timeSlot);
        localStorage.setItem('teacherTimeSlots', JSON.stringify(existingSlots));
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.querySelector('.modal'));
        modal.hide();
        
        // Show success notification
        showNotification('Time slot added successfully!', 'success');
        
        // Navigate to schedule section
        showSection('schedule');
        
        if (teacherLogger) {
            teacherLogger.logUserAction('TIME_SLOT_ADDED', timeSlot);
        }
        
    } catch (error) {
        console.error('Error saving time slot:', error);
        showNotification('Failed to save time slot. Please try again.', 'error');
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Logout functionality with confirmation
function logout() {
    showLogoutConfirmation();
}

function showLogoutConfirmation() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title">
                        <i class="fas fa-sign-out-alt text-warning me-2"></i>
                        Confirm Logout
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center py-4">
                    <div class="mb-3">
                        <i class="fas fa-question-circle text-warning" style="font-size: 3rem;"></i>
                    </div>
                    <h6 class="mb-3">Are you sure you want to logout?</h6>
                    <p class="text-muted mb-0">You will be redirected to the login page and will need to sign in again to access your dashboard.</p>
                </div>
                <div class="modal-footer border-0 pt-0">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        <i class="fas fa-times me-2"></i>Cancel
                    </button>
                    <button type="button" class="btn btn-danger" onclick="confirmLogout()">
                        <i class="fas fa-sign-out-alt me-2"></i>Yes, Logout
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    // Clean up modal when hidden
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

function confirmLogout() {
    try {
        // Close the modal first
        const modal = bootstrap.Modal.getInstance(document.querySelector('.modal'));
        if (modal) {
            modal.hide();
        }
        
        // Log the logout action
        if (teacherLogger) {
            teacherLogger.logUserAction('USER_LOGOUT', { 
                timestamp: new Date().toISOString(),
                userRole: 'teacher'
            });
        }
        
        // Clear any stored authentication data
        try {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userSession');
            sessionStorage.clear();
        } catch(clearError) {
            console.log('Storage clear error:', clearError);
        }
        
        // Force immediate redirect to login page
        window.location.href = 'index.html';
        
    } catch(e) {
        console.error('logout error:', e);
        // Force redirect even if error occurs
        window.location.href = 'index.html';
    }
}

// New conversation modal for teachers
function showNewConversationModal() {
    // Get all registered students dynamically
    const registeredStudents = getRegisteredStudents();
    
    const studentOptions = registeredStudents.map(student => 
        `<option value="${student.id}">${student.name} - ${student.program || student.department || 'Student'}</option>`
    ).join('');
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-plus me-2"></i>Start New Conversation
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="newConversationForm">
                        <div class="mb-3">
                            <label for="studentSelect" class="form-label">Select Student</label>
                            <select class="form-select" id="studentSelect" required>
                                <option value="">Choose a student...</option>
                                ${studentOptions}
                            </select>
                            ${registeredStudents.length === 0 ? '<small class="text-muted">No students registered yet</small>' : ''}
                        </div>
                        <div class="mb-3">
                            <label for="messageSubject" class="form-label">Subject</label>
                            <input type="text" class="form-control" id="messageSubject" placeholder="Enter subject..." required>
                        </div>
                        <div class="mb-3">
                            <label for="messageText" class="form-label">Message</label>
                            <textarea class="form-control" id="messageText" rows="4" placeholder="Type your message..." required></textarea>
                        </div>
                        <div class="mb-3">
                            <label for="priority" class="form-label">Priority</label>
                            <select class="form-select" id="priority">
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="sendNewConversation()" ${registeredStudents.length === 0 ? 'disabled' : ''}>
                        <i class="fas fa-paper-plane me-2"></i>Send Message
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    // Clean up modal when hidden
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

// Function to get all registered students from the system
function getRegisteredStudents() {
    try {
        // Get users from localStorage using the correct key that the auth system uses
        const users = JSON.parse(localStorage.getItem('edubook_users') || '[]');
        
        console.log('All users from storage:', users); // Debug log
        
        // Filter only students
        const students = users.filter(user => user.role === 'student');
        
        console.log('Filtered students:', students); // Debug log
        
        // Map to a consistent format
        return students.map(student => ({
            id: student.id || student.email,
            name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name || 'Unknown Student',
            email: student.email,
            program: student.program || student.course || student.department || 'Student',
            studentId: student.studentId
        }));
    } catch (error) {
        console.error('Error loading registered students:', error);
        
        // Fallback: try the old 'users' key as well
        try {
            const fallbackUsers = JSON.parse(localStorage.getItem('users') || '[]');
            const fallbackStudents = fallbackUsers.filter(user => user.role === 'student');
            
            if (fallbackStudents.length > 0) {
                return fallbackStudents.map(student => ({
                    id: student.id || student.email,
                    name: student.name || student.fullName || 'Unknown Student',
                    email: student.email,
                    program: student.program || student.course || student.department || 'Student',
                    studentId: student.studentId
                }));
            }
        } catch (fallbackError) {
            console.error('Fallback loading also failed:', fallbackError);
        }
        
        // Final fallback: return current user if they're a student (for testing)
        if (window.localAuthManager) {
            const currentUser = window.localAuthManager.getCurrentUser();
            if (currentUser && currentUser.role === 'student') {
                return [{
                    id: currentUser.id || currentUser.email,
                    name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.name || 'Current Student',
                    email: currentUser.email,
                    program: currentUser.program || 'Student'
                }];
            }
        }
        
        return [];
    }
}

function sendNewConversation() {
    const studentSelect = document.getElementById('studentSelect');
    const messageSubject = document.getElementById('messageSubject');
    const messageText = document.getElementById('messageText');
    const priority = document.getElementById('priority');
    
    if (!studentSelect.value || !messageSubject.value.trim() || !messageText.value.trim()) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        // Get the selected student's information
        const registeredStudents = getRegisteredStudents();
        const selectedStudent = registeredStudents.find(s => s.id === studentSelect.value);
        
        if (!selectedStudent) {
            showNotification('Selected student not found', 'error');
            return;
        }
        
        // Create conversation object
        const conversation = {
            id: 'conv_' + Date.now(),
            studentId: selectedStudent.id,
            studentName: selectedStudent.name,
            studentEmail: selectedStudent.email,
            studentProgram: selectedStudent.program,
            subject: messageSubject.value,
            priority: priority.value,
            createdAt: new Date().toISOString(),
            lastMessage: {
                text: messageText.value,
                sender: 'teacher',
                timestamp: new Date().toISOString()
            },
            teacherId: currentUser?.id || 'teacher-1'
        };
        
        // Save to localStorage (in real app, this would be saved to database)
        const existingConversations = JSON.parse(localStorage.getItem('teacherConversations') || '[]');
        existingConversations.unshift(conversation); // Add to beginning
        localStorage.setItem('teacherConversations', JSON.stringify(existingConversations));
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.querySelector('.modal'));
        modal.hide();
        
        // Show success message
        showNotification(`Conversation started with ${selectedStudent.name}!`, 'success');
        
        // Load conversations to show the new one
        loadConversations();
        
        if (teacherLogger) {
            teacherLogger.logUserAction('NEW_CONVERSATION_STARTED', { 
                studentId: selectedStudent.id,
                studentName: selectedStudent.name,
                subject: messageSubject.value,
                priority: priority.value
            });
        }
    } catch (error) {
        console.error('Error starting conversation:', error);
        showNotification('Failed to start conversation. Please try again.', 'error');
    }
}

function loadConversations() {
    try {
        const conversations = JSON.parse(localStorage.getItem('teacherConversations') || '[]');
        const conversationsList = document.getElementById('conversationsList');
        
        if (!conversationsList) return;
        
        if (conversations.length === 0) {
            conversationsList.innerHTML = `
                <div class="p-3 text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i>
                    <p class="mb-0">No conversations yet</p>
                    <small>Start a new conversation with a student</small>
                </div>
            `;
            return;
        }
        
        conversationsList.innerHTML = conversations.map(conv => `
            <div class="list-group-item list-group-item-action" onclick="selectConversation('${conv.id}')">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${conv.studentName}</h6>
                    <small class="text-muted">${new Date(conv.createdAt).toLocaleDateString()}</small>
                </div>
                <p class="mb-1 text-truncate">${conv.subject}</p>
                <small class="text-muted">${conv.lastMessage.text.substring(0, 50)}${conv.lastMessage.text.length > 50 ? '...' : ''}</small>
                ${conv.priority !== 'normal' ? `<span class="badge bg-${conv.priority === 'urgent' ? 'danger' : 'warning'} ms-2">${conv.priority}</span>` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

function selectConversation(conversationId) {
    try {
        const conversations = JSON.parse(localStorage.getItem('teacherConversations') || '[]');
        const conversation = conversations.find(c => c.id === conversationId);
        
        if (!conversation) return;
        
        // Update chat header
        const chatHeader = document.getElementById('chatHeader');
        if (chatHeader) {
            chatHeader.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-user-graduate me-2"></i>
                    ${conversation.studentName}
                    <span class="badge bg-primary ms-2">${conversation.subject}</span>
                    ${conversation.priority !== 'normal' ? `<span class="badge bg-${conversation.priority === 'urgent' ? 'danger' : 'warning'} ms-2">${conversation.priority}</span>` : ''}
                </div>
            `;
        }
        
        // Show messages
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="message-bubble teacher-message">
                    <div class="message-content">
                        <p class="mb-1">${conversation.lastMessage.text}</p>
                        <small class="text-muted">${new Date(conversation.lastMessage.timestamp).toLocaleString()}</small>
                    </div>
                </div>
                <div class="text-center mt-3">
                    <small class="text-muted">Conversation started</small>
                </div>
            `;
        }
        
        // Show message form
        const messageForm = document.getElementById('messageForm');
        if (messageForm) {
            messageForm.classList.remove('d-none');
        }
        
        // Highlight selected conversation
        document.querySelectorAll('#conversationsList .list-group-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.closest('.list-group-item').classList.add('active');
        
    } catch (error) {
        console.error('Error selecting conversation:', error);
    }
}

// Export functions to global scope
window.showSection = showSection;
window.addTimeSlot = addTimeSlot;
window.saveTimeSlot = saveTimeSlot;
window.logout = logout;
window.showLogoutConfirmation = showLogoutConfirmation;
window.confirmLogout = confirmLogout;
window.showNewConversationModal = showNewConversationModal;
window.sendNewConversation = sendNewConversation;
window.loadConversations = loadConversations;
window.selectConversation = selectConversation;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('Teacher Dashboard DOMContentLoaded event fired');
        
        // Initialize logger
        if (window.Logger) {
            teacherLogger = new window.Logger('TeacherDashboard');
        }
        
        // Check authentication
        if (window.localAuthManager) {
            currentUser = window.localAuthManager.getCurrentUser();
            console.log('Current user:', currentUser);
            
            if (!currentUser || currentUser.role !== 'teacher') {
                console.log('User not authenticated or not a teacher, redirecting');
                window.location.href = 'index.html';
                return;
            }
        } else {
            console.log('localAuthManager not available, redirecting');
            window.location.href = 'index.html';
            return;
        }
        
        console.log('Authentication check passed, initializing dashboard');
        
        // Initialize sidebar
        initializeSidebar();
        
        // Update user name if available
        if (currentUser && currentUser.name) {
            const teacherNameElement = document.getElementById('teacherName');
            if (teacherNameElement) {
                teacherNameElement.textContent = currentUser.name;
            }
            
            const welcomeElement = document.querySelector('.d-flex.align-items-center span');
            if (welcomeElement) {
                welcomeElement.textContent = `Welcome, ${currentUser.name}`;
            }
        }
        
        if (teacherLogger) {
            teacherLogger.info('Teacher dashboard initialized successfully');
        }
        
    } catch (error) {
        console.error('Error initializing teacher dashboard:', error);
    }
});
