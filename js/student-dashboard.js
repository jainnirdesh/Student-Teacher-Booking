// Student Dashboard functionality using localStorage-based data management

// Initialize components
let dashboardLogger, dataManager;

// Global variables
let currentUser = null;
let userProfile = null;
let appointments = [];
let teachers = [];
let currentConversation = null;

// Declare functions that will be available globally
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('d-none');
    });
    
    // Show selected section
    document.getElementById(`${sectionName}-section`).classList.remove('d-none');
    
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
        'search-teachers': 'Search Teachers',
        'book-appointment': 'Book Appointment',
        'my-appointments': 'My Appointments',
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
    
    if (dashboardLogger) {
        dashboardLogger.logUserAction('NAVIGATION', { section: sectionName });
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
        
        if (dashboardLogger) {
            dashboardLogger.logUserAction('SIDEBAR_INITIALIZED', { state: 'expanded' });
        }
    }
}



// Global function exports for HTML onclick handlers
window.showSection = showSection;

// Functions will be assigned to window object after they are defined
window.logout = function() {
    showLogoutConfirmation();
};

// Show logout confirmation modal
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

// Perform actual logout after confirmation
function confirmLogout() {
    try {
        // Close the modal first
        const modal = bootstrap.Modal.getInstance(document.querySelector('.modal'));
        if (modal) {
            modal.hide();
        }
        
        // Log the logout action (don't wait for this)
        if (dashboardLogger) {
            dashboardLogger.logUserAction('USER_LOGOUT', { 
                timestamp: new Date().toISOString(),
                userRole: 'student'
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

// Export functions to global scope
window.showLogoutConfirmation = showLogoutConfirmation;
window.confirmLogout = confirmLogout;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('Dashboard DOMContentLoaded event fired');
        
        // Initialize logger and data manager
        dashboardLogger = new Logger('StudentDashboard');
        dataManager = window.localDataManager;
        
        console.log('Logger and data manager initialized');
        console.log('localAuthManager available:', !!window.localAuthManager);
        console.log('localDataManager available:', !!window.localDataManager);
        
        dashboardLogger.info('Student dashboard initialized');
        
        // Check authentication
        if (window.localAuthManager) {
            currentUser = window.localAuthManager.getCurrentUser();
            console.log('Current user:', currentUser);
            
            if (!currentUser || currentUser.role !== 'student') {
                console.log('User not authenticated or not a student, redirecting');
                window.location.href = 'index.html';
                return;
            }
        } else {
            console.log('localAuthManager not available, redirecting');
            window.location.href = 'index.html';
            return;
        }
        
        console.log('Authentication check passed, initializing dashboard');
        
        // Initialize dashboard
        await initializeDashboard();
    } catch (error) {
        console.error('Error in DOMContentLoaded handler:', error);
        showNotification('Failed to initialize application', 'error');
    }
});

async function initializeDashboard() {
    try {
        console.log('Starting dashboard initialization');
        
        // Initialize professional sidebar
        resetSidebarState(); // Reset to expanded state
        forceExpandSidebar(); // Force full expansion
        ensureSafariCompatibility(); // Ensure Safari works
        initializeSidebar();
        
        // Additional compatibility checks
        setTimeout(() => {
            forceExpandSidebar(); // Force again after delay
            if (isSafari()) {
                ensureSafariCompatibility();
            }
        }, 300);
        
        // Load user profile
        console.log('Loading user profile...');
        userProfile = await loadUserProfile();
        if (userProfile) {
            console.log('User profile loaded successfully');
            updateUserInterface();
        } else {
            console.log('No user profile found');
        }
        
        // Load dashboard data with individual error handling
        console.log('Loading teachers...');
        try {
            await loadTeachers();
            console.log('Teachers loaded successfully');
            dashboardLogger.info('Teachers loaded successfully');
        } catch (error) {
            console.error('Failed to load teachers:', error);
            dashboardLogger.error('Failed to load teachers', error);
            showNotification('Failed to load teachers', 'error');
        }
        
        console.log('Loading appointments...');
        try {
            await loadAppointments();
            console.log('Appointments loaded successfully');
            dashboardLogger.info('Appointments loaded successfully');
        } catch (error) {
            console.error('Failed to load appointments:', error);
            dashboardLogger.error('Failed to load appointments', error);
            showNotification('Failed to load appointments', 'error');
        }
        
        console.log('Loading statistics...');
        try {
            await loadStatistics();
            console.log('Statistics loaded successfully');
            dashboardLogger.info('Statistics loaded successfully');
        } catch (error) {
            console.error('Failed to load statistics:', error);
            dashboardLogger.error('Failed to load statistics', error);
            showNotification('Failed to load statistics', 'error');
        }
        
        // Setup real-time listeners
        console.log('Setting up real-time listeners...');
        setupRealtimeListeners();
        
        // Initialize form handlers
        console.log('Initializing form handlers...');
        initializeFormHandlers();
        
        // Initialize message form handler
        console.log('Initializing message form handler...');
        initializeMessageForm();
        
        console.log('Dashboard initialization completed successfully');
        dashboardLogger.info('Dashboard initialization completed');
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        dashboardLogger.error('Failed to initialize dashboard', error);
        showNotification('Failed to initialize dashboard', 'error');
    }
}

async function loadUserProfile() {
    try {
        // Get current user profile from localStorage
        if (currentUser) {
            dashboardLogger.info('User profile loaded', { userId: currentUser.id });
            return currentUser;
        }
        return null;
    } catch (error) {
        dashboardLogger.error('Failed to load user profile', error);
        return null;
    }
}

function updateUserInterface() {
    if (userProfile) {
        const studentNameElement = document.getElementById('studentName');
        if (studentNameElement) {
            studentNameElement.textContent = userProfile.name || userProfile.username || 'Student';
        }
        
        // Update profile form if elements exist
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileStudentId = document.getElementById('profileStudentId');
        const profileProgram = document.getElementById('profileProgram');
        const profilePhone = document.getElementById('profilePhone');
        
        if (profileName) profileName.value = userProfile.name || userProfile.username || '';
        if (profileEmail) profileEmail.value = userProfile.email || '';
        if (profileStudentId) profileStudentId.value = userProfile.studentId || userProfile.id || '';
        if (profileProgram) profileProgram.value = userProfile.program || '';
        if (profilePhone) profilePhone.value = userProfile.phone || '';
    }
}

async function loadTeachers() {
    try {
        teachers = await dataManager.getTeachers();
        populateTeacherSelects();
        dashboardLogger.info('Teachers loaded', { count: teachers.length });
    } catch (error) {
        dashboardLogger.error('Failed to load teachers', error);
        showNotification('Failed to load teachers', 'error');
    }
}

function populateTeacherSelects() {
    // Teacher select for booking
    const teacherSelect = document.getElementById('teacherSelect');
    if (teacherSelect) {
        teacherSelect.innerHTML = '<option value="">Choose a teacher...</option>';
        
        teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = `${teacher.name} - ${teacher.department}`;
            teacherSelect.appendChild(option);
        });
    }
    
    // Department select for search
    const departmentSelect = document.getElementById('searchDepartment');
    if (departmentSelect) {
        const departments = [...new Set(teachers.map(t => t.department))];
        departmentSelect.innerHTML = '<option value="">All Departments</option>';
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            departmentSelect.appendChild(option);
        });
    }
    
    // Subject select for search
    const subjectSelect = document.getElementById('searchSubject');
    if (subjectSelect) {
        const subjects = [...new Set(teachers.map(t => t.subject))];
        subjectSelect.innerHTML = '<option value="">All Subjects</option>';
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectSelect.appendChild(option);
        });
    }
}

async function loadAppointments() {
    try {
        const allAppointments = await dataManager.getAppointments({ studentId: currentUser.id });
        
        // Enhance appointments with teacher details
        appointments = await Promise.all(allAppointments.map(async appointment => {
            const teacher = await dataManager.getTeacher(appointment.teacherId);
            return {
                ...appointment,
                teacherName: teacher ? teacher.name : 'Unknown',
                teacherDepartment: teacher ? teacher.subject : 'Unknown'
            };
        }));
        
        updateAppointmentsTables();
        dashboardLogger.info('Appointments loaded', { count: appointments.length });
    } catch (error) {
        dashboardLogger.error('Failed to load appointments', error);
        showNotification('Failed to load appointments', 'error');
    }
}

function updateAppointmentsTables() {
    updateRecentAppointmentsTable();
    updateAllAppointmentsTable();
}

function updateRecentAppointmentsTable() {
    const tableBody = document.getElementById('recentAppointmentsTable');
    const recentAppointments = appointments.slice(0, 5);
    
    if (recentAppointments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No recent appointments</td></tr>';
        return;
    }
    
    tableBody.innerHTML = recentAppointments.map(appointment => `
        <tr>
            <td>${appointment.teacherName}</td>
            <td>${formatDate(appointment.date)}</td>
            <td>${appointment.time}</td>
            <td><span class="badge badge-${appointment.status}">${appointment.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewAppointment('${appointment.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                ${appointment.status === 'pending' ? `
                    <button class="btn btn-sm btn-outline-danger" onclick="cancelAppointment('${appointment.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function updateAllAppointmentsTable() {
    const tableBody = document.getElementById('appointmentsTable');
    const filter = document.getElementById('appointmentFilter')?.value || 'all';
    
    let filteredAppointments = appointments;
    if (filter !== 'all') {
        filteredAppointments = appointments.filter(app => app.status === filter);
    }
    
    if (filteredAppointments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No appointments found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = filteredAppointments.map(appointment => `
        <tr>
            <td>
                <div><strong>${appointment.teacherName}</strong></div>
                <small class="text-muted">${appointment.teacherDepartment}</small>
            </td>
            <td>
                <div>${formatDate(appointment.date)}</div>
                <small class="text-muted">${appointment.time}</small>
            </td>
            <td>
                <div class="text-truncate" style="max-width: 200px;" title="${appointment.purpose}">
                    ${appointment.purpose || 'No purpose specified'}
                </div>
            </td>
            <td><span class="badge badge-${appointment.status}">${appointment.status}</span></td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewAppointment('${appointment.id}')" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${appointment.status === 'pending' ? `
                        <button class="btn btn-outline-warning" onclick="editAppointment('${appointment.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="cancelAppointment('${appointment.id}')" title="Cancel">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    ${appointment.status === 'approved' ? `
                        <button class="btn btn-outline-info" onclick="startConversation('${appointment.teacherId}')" title="Message">
                            <i class="fas fa-comment"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadStatistics() {
    try {
        const stats = {
            total: appointments.length,
            approved: appointments.filter(app => app.status === 'approved').length,
            pending: appointments.filter(app => app.status === 'pending').length,
            upcoming: appointments.filter(app => {
                const appointmentDate = new Date(app.date);
                const today = new Date();
                return appointmentDate >= today && app.status === 'approved';
            }).length
        };
        
        document.getElementById('totalAppointments').textContent = stats.total;
        document.getElementById('approvedAppointments').textContent = stats.approved;
        document.getElementById('pendingAppointments').textContent = stats.pending;
        document.getElementById('upcomingAppointments').textContent = stats.upcoming;
        
        dashboardLogger.info('Statistics updated', stats);
    } catch (error) {
        dashboardLogger.error('Failed to load statistics', error);
    }
}

function setupRealtimeListeners() {
    // Simplified real-time listener simulation for localStorage
    // In a real application, you might use localStorage events or polling
    dashboardLogger.info('Real-time listeners setup completed (localStorage mode)');
}

function initializeFormHandlers() {
    // Book appointment form
    const bookAppointmentForm = document.getElementById('bookAppointmentForm');
    if (bookAppointmentForm) {
        bookAppointmentForm.addEventListener('submit', handleBookAppointment);
    }
    
    // Teacher select change handler
    const teacherSelect = document.getElementById('teacherSelect');
    if (teacherSelect) {
        teacherSelect.addEventListener('change', handleTeacherSelection);
    }
    
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Message form
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', handleSendMessage);
    }
    
    // Set minimum date for appointment booking
    const appointmentDate = document.getElementById('appointmentDate');
    if (appointmentDate) {
        const today = new Date();
        appointmentDate.min = today.toISOString().split('T')[0];
    }
}

function handleSendMessage(event) {
    event.preventDefault();
    sendMessage();
}

async function handleTeacherSelection(event) {
    const teacherId = event.target.value;
    if (!teacherId) {
        document.getElementById('appointmentTime').innerHTML = '<option value="">Select time slot...</option>';
        return;
    }
    
    try {
        // Load teacher's available slots from localStorage
        const teacher = await dataManager.getTeacher(teacherId);
        if (teacher) {
            const availableSlots = teacher.availability || [];
            
            const timeSelect = document.getElementById('appointmentTime');
            timeSelect.innerHTML = '<option value="">Select time slot...</option>';
            
            availableSlots.forEach(slot => {
                const option = document.createElement('option');
                option.value = slot;
                option.textContent = slot;
                timeSelect.appendChild(option);
            });
        } else {
            showNotification('Teacher not found', 'error');
        }
    } catch (error) {
        dashboardLogger.error('Failed to load teacher slots', error);
        showNotification('Failed to load available time slots', 'error');
    }
}

async function handleBookAppointment(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const appointmentData = {
        teacherId: formData.get('teacherId') || document.getElementById('teacherSelect').value,
        date: formData.get('date') || document.getElementById('appointmentDate').value,
        time: formData.get('time') || document.getElementById('appointmentTime').value,
        purpose: formData.get('purpose') || document.getElementById('appointmentPurpose').value,
        message: formData.get('message') || document.getElementById('appointmentMessage').value,
        studentId: currentUser.id,
        studentName: currentUser.name || currentUser.username,
        studentEmail: currentUser.email,
        status: 'pending'
    };
    
    // Validation
    if (!appointmentData.teacherId || !appointmentData.date || !appointmentData.time) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        showLoading();
        
        // Check for conflicting appointments using localStorage
        const existingAppointments = await dataManager.getAppointments();
        const conflict = existingAppointments.find(apt => 
            apt.teacherId === appointmentData.teacherId &&
            apt.date === appointmentData.date &&
            apt.time === appointmentData.time &&
            apt.status !== 'cancelled'
        );
        
        if (conflict) {
            throw new Error('This time slot is already booked');
        }
        
        // Create appointment
        await dataManager.createAppointment(appointmentData);
        
        hideLoading();
        showNotification('Appointment booked successfully!', 'success');
        resetAppointmentForm();
        await loadAppointments();
        await loadStatistics();
        
        dashboardLogger.info('Appointment booked successfully', appointmentData);
    } catch (error) {
        hideLoading();
        dashboardLogger.error('Failed to book appointment', error);
        showNotification(error.message || 'Failed to book appointment', 'error');
    }
}

async function handleProfileUpdate(event) {
    event.preventDefault();
    
    const profileData = {
        name: document.getElementById('profileName').value,
        studentId: document.getElementById('profileStudentId').value,
        program: document.getElementById('profileProgram').value,
        phone: document.getElementById('profilePhone').value
    };
    
    try {
        showLoading();
        
        // Update user profile in localStorage
        const updatedUser = { ...currentUser, ...profileData };
        if (window.localAuthManager) {
            window.localAuthManager.updateCurrentUser(updatedUser);
            currentUser = updatedUser;
        }
        
        userProfile = { ...userProfile, ...profileData };
        updateUserInterface();
        
        hideLoading();
        showNotification('Profile updated successfully!', 'success');
        
        dashboardLogger.info('Profile updated', profileData);
    } catch (error) {
        hideLoading();
        dashboardLogger.error('Failed to update profile', error);
        showNotification('Failed to update profile', 'error');
    }
}

async function searchTeachers() {
    const name = document.getElementById('searchName').value.toLowerCase();
    const department = document.getElementById('searchDepartment').value;
    const subject = document.getElementById('searchSubject').value;
    
    let filteredTeachers = teachers;
    
    if (name) {
        filteredTeachers = filteredTeachers.filter(teacher =>
            teacher.name.toLowerCase().includes(name)
        );
    }
    
    if (department) {
        filteredTeachers = filteredTeachers.filter(teacher =>
            teacher.department === department
        );
    }
    
    if (subject) {
        filteredTeachers = filteredTeachers.filter(teacher =>
            teacher.subject === subject
        );
    }
    
    displaySearchResults(filteredTeachers);
    
    dashboardLogger.logUserAction('TEACHER_SEARCH', { name, department, subject, resultsCount: filteredTeachers.length });
}

// Make function available globally
window.searchTeachers = searchTeachers;

function displaySearchResults(searchResults) {
    const resultsContainer = document.getElementById('teacherSearchResults');
    
    if (searchResults.length === 0) {
        resultsContainer.innerHTML = '<div class="text-center text-muted"><p>No teachers found</p></div>';
        return;
    }
    
    resultsContainer.innerHTML = `
        <div class="row">
            ${searchResults.map(teacher => `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">${teacher.name}</h6>
                            <p class="card-text">
                                <small class="text-muted">
                                    <i class="fas fa-building me-1"></i>${teacher.department}<br>
                                    <i class="fas fa-book me-1"></i>${teacher.subject}<br>
                                    <i class="fas fa-envelope me-1"></i>${teacher.email}
                                </small>
                            </p>
                            <button class="btn btn-primary btn-sm" onclick="bookWithTeacher('${teacher.id}')">
                                <i class="fas fa-calendar-plus me-1"></i>Book Appointment
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="startConversation('${teacher.id}')">
                                <i class="fas fa-comment me-1"></i>Message
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function bookWithTeacher(teacherId) {
    document.getElementById('teacherSelect').value = teacherId;
    document.getElementById('teacherSelect').dispatchEvent(new Event('change'));
    showSection('book-appointment');
}

// Make function available globally
window.bookWithTeacher = bookWithTeacher;

async function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
        return;
    }
    
    try {
        showLoading();
        
        await dataManager.updateAppointment(appointmentId, {
            status: 'cancelled'
        });
        
        hideLoading();
        showNotification('Appointment cancelled successfully', 'info');
        await loadAppointments();
        await loadStatistics();
        
        dashboardLogger.info('Appointment cancelled', { appointmentId });
    } catch (error) {
        hideLoading();
        dashboardLogger.error('Failed to cancel appointment', error);
        showNotification('Failed to cancel appointment', 'error');
    }
}

// Make function available globally
window.cancelAppointment = cancelAppointment;

function resetAppointmentForm() {
    document.getElementById('bookAppointmentForm').reset();
    document.getElementById('appointmentTime').innerHTML = '<option value="">Select time slot...</option>';
}

// Make function available globally
window.resetAppointmentForm = resetAppointmentForm;

function filterAppointments() {
    updateAllAppointmentsTable();
}

// Make function available globally
window.filterAppointments = filterAppointments;

// Navigation functions
// Profile functionality functions
function changePassword() {
    // Create modal for password change
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Change Password</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="changePasswordForm">
                        <div class="mb-3">
                            <label for="currentPassword" class="form-label">Current Password</label>
                            <input type="password" class="form-control" id="currentPassword" required>
                        </div>
                        <div class="mb-3">
                            <label for="newPassword" class="form-label">New Password</label>
                            <input type="password" class="form-control" id="newPassword" required minlength="6">
                        </div>
                        <div class="mb-3">
                            <label for="confirmPassword" class="form-label">Confirm New Password</label>
                            <input type="password" class="form-control" id="confirmPassword" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="submitPasswordChange()">Change Password</button>
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

function submitPasswordChange() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
    }
    
    try {
        // Simulate password change
        if (window.localAuthManager) {
            // In a real app, you would verify the current password and update it
            // For demo purposes, we'll just show success
            console.log('Password change requested for:', currentUser?.email);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.querySelector('.modal'));
            modal.hide();
            
            // Show success message
            showNotification('Password changed successfully!', 'success');
            
            if (dashboardLogger) {
                dashboardLogger.logUserAction('PASSWORD_CHANGED', { userId: currentUser?.id });
            }
        } else {
            throw new Error('Authentication manager not available');
        }
    } catch (error) {
        console.error('Password change error:', error);
        showNotification('Failed to change password. Please try again.', 'error');
    }
}

function downloadData() {
    try {
        // Collect all user data
        const userData = {
            profile: currentUser,
            appointments: appointments || [],
            messages: [], // Add messages data if available
            exportDate: new Date().toISOString(),
            note: 'This is your personal data export from the Student Teacher Booking System'
        };
        
        // Create downloadable JSON file
        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Create download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `student_data_${currentUser?.id || 'export'}_${new Date().toISOString().split('T')[0]}.json`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up object URL
        URL.revokeObjectURL(link.href);
        
        showNotification('Your data has been downloaded successfully!', 'success');
        
        if (dashboardLogger) {
            dashboardLogger.logUserAction('DATA_DOWNLOADED', { userId: currentUser?.id });
        }
    } catch (error) {
        console.error('Data download error:', error);
        showNotification('Failed to download data. Please try again.', 'error');
    }
}

function deleteAccount() {
    // Create confirmation modal
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title">Delete Account</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Warning:</strong> This action cannot be undone!
                    </div>
                    <p>Are you sure you want to delete your account? This will:</p>
                    <ul>
                        <li>Permanently delete your profile and personal data</li>
                        <li>Cancel all your appointments</li>
                        <li>Remove access to the system</li>
                        <li>Delete all your messages and conversation history</li>
                    </ul>
                    <div class="mt-3">
                        <label for="deleteConfirmation" class="form-label">
                            Type "DELETE" to confirm:
                        </label>
                        <input type="text" class="form-control" id="deleteConfirmation" placeholder="Type DELETE to confirm">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" onclick="confirmAccountDeletion()">Delete Account</button>
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

function confirmAccountDeletion() {
    const confirmation = document.getElementById('deleteConfirmation').value;
    
    if (confirmation !== 'DELETE') {
        alert('Please type "DELETE" to confirm account deletion.');
        return;
    }
    
    try {
        // Simulate account deletion
        if (window.localAuthManager) {
            console.log('Account deletion requested for:', currentUser?.email);
            
            if (dashboardLogger) {
                dashboardLogger.logUserAction('ACCOUNT_DELETED', { userId: currentUser?.id });
            }
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.querySelector('.modal'));
            modal.hide();
            
            // Show final message and redirect
            showNotification('Account deleted successfully. Goodbye!', 'success');
            
            // Logout and redirect after a short delay
            setTimeout(() => {
                window.localAuthManager.logout();
                window.location.href = 'index.html';
            }, 2000);
        } else {
            throw new Error('Authentication manager not available');
        }
    } catch (error) {
        console.error('Account deletion error:', error);
        showNotification('Failed to delete account. Please try again.', 'error');
    }
}

// Helper function to show notifications
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

// Messaging Functions
function showNewConversationModal() {
    // Get all registered teachers dynamically
    const registeredTeachers = getRegisteredTeachers();
    
    const teacherOptions = registeredTeachers.map(teacher => 
        `<option value="${teacher.id}">${teacher.name} - ${teacher.subject || teacher.department || 'Teacher'}</option>`
    ).join('');
    
    // Create modal for new conversation
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Start New Conversation</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="newConversationForm">
                        <div class="mb-3">
                            <label for="teacherSelect" class="form-label">Select Teacher</label>
                            <select class="form-select" id="teacherSelect" required>
                                <option value="">Choose a teacher...</option>
                                ${teacherOptions}
                            </select>
                            ${registeredTeachers.length === 0 ? '<small class="text-muted">No teachers registered yet</small>' : ''}
                        </div>
                        <div class="mb-3">
                            <label for="messageSubject" class="form-label">Subject</label>
                            <input type="text" class="form-control" id="messageSubject" placeholder="Enter subject..." required>
                        </div>
                        <div class="mb-3">
                            <label for="messageText" class="form-label">Message</label>
                            <textarea class="form-control" id="messageText" rows="4" placeholder="Type your message..." required></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="sendNewConversation()" ${registeredTeachers.length === 0 ? 'disabled' : ''}>Send Message</button>
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

function sendNewConversation() {
    const teacherSelect = document.getElementById('teacherSelect');
    const messageSubject = document.getElementById('messageSubject');
    const messageText = document.getElementById('messageText');
    
    if (!teacherSelect.value || !messageSubject.value.trim() || !messageText.value.trim()) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        // Simulate sending message
        console.log('New conversation started:', {
            teacher: teacherSelect.value,
            subject: messageSubject.value,
            message: messageText.value
        });
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.querySelector('.modal'));
        modal.hide();
        
        // Show success message
        showNotification('Message sent successfully!', 'success');
        
        // Refresh conversations (in a real app, this would update the conversation list)
        setTimeout(() => {
            loadConversations();
        }, 1000);
        
        if (dashboardLogger) {
            dashboardLogger.logUserAction('NEW_CONVERSATION_STARTED', { 
                teacher: teacherSelect.value,
                subject: messageSubject.value 
            });
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Failed to send message. Please try again.', 'error');
    }
}

// Export new functions to global scope
window.showNewConversationModal = showNewConversationModal;
window.sendNewConversation = sendNewConversation;

// Initialize message form handler
function initializeMessageForm() {
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendMessage();
        });
    }
}

// Setup message form handler
document.addEventListener('DOMContentLoaded', function() {
    // This is a backup event listener in case the main initialization doesn't set it up
    setTimeout(initializeMessageForm, 100);
});

// Force expand sidebar for better first-time user experience
function ensureSidebarExpanded() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    // Sidebar is now always expanded - no need for auto-expand logic
    console.log('Sidebar is always expanded for better visibility');
}

// Call ensureSidebarExpanded on initial load
document.addEventListener('DOMContentLoaded', ensureSidebarExpanded);

// Clear any problematic localStorage and ensure expanded state
function resetSidebarState() {
    // Force expanded state by default
    localStorage.setItem('sidebarCollapsed', 'false');
    
    // Ensure sidebar is expanded
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (sidebar && window.innerWidth > 768) {
        sidebar.classList.remove('collapsed');
        mainContent?.classList.remove('expanded');
        
        // Force styles for Safari
        if (isSafari()) {
            sidebar.style.width = '300px';
            if (mainContent) mainContent.style.marginLeft = '300px';
        }
        
        console.log('Sidebar forced to expanded state');
    }
}

// Make function available globally
window.resetSidebarState = resetSidebarState;

// Force sidebar to be fully expanded and functional
function forceExpandSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (sidebar && window.innerWidth > 768) {
        // Remove collapsed state
        sidebar.classList.remove('collapsed');
        mainContent?.classList.remove('expanded');
        
        // Force expanded styles
        sidebar.style.width = '300px';
        sidebar.style.transform = 'translateX(0)';
        if (mainContent) {
            mainContent.style.marginLeft = '300px';
        }
        
        // Update localStorage
        localStorage.setItem('sidebarCollapsed', 'false');
        
        // Make toggle button more visible
        const toggleBtn = sidebar.querySelector('.sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.style.display = 'block';
            toggleBtn.style.visibility = 'visible';
            toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        }
        
        console.log('Sidebar forced to expanded state with full functionality');
    }
}

// Call forceExpandSidebar on initial load
document.addEventListener('DOMContentLoaded', forceExpandSidebar);

// Safari debugging and compatibility fixes
function debugSidebarState() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (sidebar) {
        console.log('=== SIDEBAR DEBUG INFO ===');
        console.log('Sidebar element found:', !!sidebar);
        console.log('Sidebar classes:', sidebar.className);
        console.log('Sidebar style.display:', sidebar.style.display);
        console.log('Sidebar style.visibility:', sidebar.style.visibility);
        console.log('Sidebar style.opacity:', sidebar.style.opacity);
        console.log('Sidebar style.transform:', sidebar.style.transform);
        console.log('Sidebar computed width:', window.getComputedStyle(sidebar).width);
        console.log('Sidebar computed left:', window.getComputedStyle(sidebar).left);
        console.log('Sidebar computed visibility:', window.getComputedStyle(sidebar).visibility);
        console.log('Window width:', window.innerWidth);
        console.log('User agent:', navigator.userAgent);
        console.log('==========================');
        
        // Force sidebar to be visible in Safari
        sidebar.style.display = 'block';
        sidebar.style.visibility = 'visible';
        sidebar.style.opacity = '1';
        sidebar.style.transform = 'translateX(0)';
        sidebar.style.left = '0';
        
        if (mainContent) {
            mainContent.style.marginLeft = '300px';
        }
    } else {
        console.error('Sidebar element not found!');
    }
}

// Force sidebar visibility for Safari
function forceSidebarVisibility() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        // Remove any problematic classes
        sidebar.classList.remove('collapsed', 'hidden', 'd-none');
        
        // Force styles
        sidebar.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 300px !important;
            height: 100vh !important;
            z-index: 1050 !important;
            background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            transform: translateX(0) !important;
        `;
        
        console.log('Forced sidebar visibility for Safari');
    }
}

// Safari detection and specific fixes
function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

// Safari detection and compatibility
function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

function ensureSafariCompatibility() {
    if (isSafari()) {
        console.log('Safari detected, ensuring base compatibility...');
        
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        if (sidebar) {
            // Ensure basic visibility without preventing collapse functionality
            sidebar.style.position = 'fixed';
            sidebar.style.top = '0';
            sidebar.style.left = '0';
            sidebar.style.height = '100vh';
            sidebar.style.zIndex = '1050';
            sidebar.style.display = 'block';
            sidebar.style.visibility = 'visible';
            sidebar.style.opacity = '1';
            
            // Only set width and margin if not collapsed
            if (!sidebar.classList.contains('collapsed')) {
                sidebar.style.width = '300px';
                if (mainContent) {
                    mainContent.style.marginLeft = '300px';
                }
            }
        }
        
        console.log('Safari compatibility ensured');
    }
}

// Apply Safari-specific fixes on DOMContentLoaded
document.addEventListener('DOMContentLoaded', applySafariSpecificFixes);
