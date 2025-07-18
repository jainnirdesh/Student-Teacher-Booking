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

// Professional Sidebar Management
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (window.innerWidth <= 768) {
        // Mobile behavior
        if (sidebar && overlay) {
            const isOpen = sidebar.classList.contains('show');
            if (isOpen) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        }
    } else {
        // Desktop behavior
        if (sidebar && mainContent) {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
            
            // Store sidebar state in localStorage
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
            
            // Update toggle button icon
            updateSidebarToggleIcon();
        }
    }
}

function openMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.add('show');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function initializeSidebar() {
    // Start with expanded sidebar by default for better UX
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    // Only apply collapsed state if user explicitly chose it and on desktop
    if (isCollapsed && window.innerWidth > 768) {
        sidebar?.classList.add('collapsed');
        mainContent?.classList.add('expanded');
    } else {
        // Ensure sidebar is expanded by default
        sidebar?.classList.remove('collapsed');
        mainContent?.classList.remove('expanded');
        localStorage.setItem('sidebarCollapsed', 'false');
    }
    
    // Update visual indicators
    updateSidebarToggleIcon();
    addExpandIndicator();
    
    // Add overlay click handler
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeMobileSidebar);
    }
    
    // Handle window resize
    window.addEventListener('resize', handleWindowResize);
    
    // Close mobile sidebar when clicking nav links
    const navLinks = document.querySelectorAll('.sidebar-nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                setTimeout(closeMobileSidebar, 300);
            }
        });
    });
}

function handleWindowResize() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (window.innerWidth > 768) {
        // Desktop mode
        sidebar?.classList.remove('show');
        overlay?.classList.remove('show');
        document.body.style.overflow = '';
        
        // Restore collapsed state if saved
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        const mainContent = document.getElementById('mainContent');
        
        if (isCollapsed) {
            sidebar?.classList.add('collapsed');
            mainContent?.classList.add('expanded');
        } else {
            sidebar?.classList.remove('collapsed');
            mainContent?.classList.remove('expanded');
        }
    } else {
        // Mobile mode - reset to normal state
        const mainContent = document.getElementById('mainContent');
        sidebar?.classList.remove('collapsed');
        mainContent?.classList.remove('expanded');
    }
}

// Add visual indicator for expandable sidebar
function addExpandIndicator() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('collapsed')) {
        // Change toggle button icon when collapsed
        const toggleBtn = sidebar.querySelector('.sidebar-toggle i');
        if (toggleBtn) {
            toggleBtn.className = 'fas fa-chevron-right';
        }
    } else {
        const toggleBtn = sidebar?.querySelector('.sidebar-toggle i');
        if (toggleBtn) {
            toggleBtn.className = 'fas fa-bars';
        }
    }
}

// Update the toggle function to include visual feedback
function updateSidebarToggleIcon() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = sidebar?.querySelector('.sidebar-toggle i');
    const mobileBtn = document.querySelector('.mobile-menu-btn i');
    
    if (window.innerWidth <= 768) {
        // Mobile - always show hamburger
        if (toggleBtn) toggleBtn.className = 'fas fa-bars';
        if (mobileBtn) mobileBtn.className = 'fas fa-bars';
    } else {
        // Desktop - show appropriate icon
        if (sidebar?.classList.contains('collapsed')) {
            if (toggleBtn) toggleBtn.className = 'fas fa-chevron-right';
        } else {
            if (toggleBtn) toggleBtn.className = 'fas fa-chevron-left';
        }
    }
}

window.addEventListener('resize', updateSidebarToggleIcon);

// Global function exports for HTML onclick handlers
window.showSection = showSection;
window.toggleSidebar = toggleSidebar;
window.openMobileSidebar = openMobileSidebar;
window.closeMobileSidebar = closeMobileSidebar;
// Functions will be assigned to window object after they are defined
window.logout = function() {
    try {
        if (window.localAuthManager) {
            window.localAuthManager.logout();
        } else {
            window.location.href = 'index.html';
        }
    } catch(e) {
        console.error('logout error:', e);
        window.location.href = 'index.html';
    }
};

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
        initializeSidebar();
        
        // Safari compatibility fixes
        setTimeout(() => {
            debugSidebarState();
            forceSidebarVisibility();
            ensureSidebarExpanded();
        }, 200);
        
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
// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('d-none');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('d-none');
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(notification => {
        notification.remove();
    });
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="d-flex align-items-center justify-content-between">
            <span>${message}</span>
            <button type="button" class="btn-close btn-close-white ms-3" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Messaging Functions
function showNewConversationModal() {
    // Ensure teachers are loaded
    if (!teachers || teachers.length === 0) {
        loadTeachers().then(() => {
            populateTeacherSelect();
            showModal();
        });
    } else {
        populateTeacherSelect();
        showModal();
    }
    
    function populateTeacherSelect() {
        const teacherSelect = document.getElementById('conversationTeacherSelect');
        teacherSelect.innerHTML = '<option value="">Choose a teacher...</option>';
        
        teachers.forEach(teacher => {
            if (teacher.available) {
                const option = document.createElement('option');
                option.value = teacher.id;
                option.textContent = `${teacher.name} - ${teacher.department}`;
                teacherSelect.appendChild(option);
            }
        });
    }
    
    function showModal() {
        const modal = new bootstrap.Modal(document.getElementById('newConversationModal'));
        modal.show();
    }
}

// Make function available globally
window.showNewConversationModal = showNewConversationModal;

async function createNewConversation() {
    const teacherId = document.getElementById('conversationTeacherSelect').value;
    const initialMessage = document.getElementById('initialMessage').value.trim();
    
    if (!teacherId || !initialMessage) {
        showNotification('Please select a teacher and enter a message.', 'error');
        return;
    }
    
    try {
        const teacher = teachers.find(t => t.id === teacherId);
        if (!teacher) {
            showNotification('Selected teacher not found.', 'error');
            return;
        }
        
        // Create new conversation
        const conversationId = `conv_${Date.now()}_${currentUser.id}_${teacherId}`;
        const conversation = {
            id: conversationId,
            studentId: currentUser.id,
            teacherId: teacherId,
            teacherName: teacher.name,
            studentName: currentUser.name,
            lastMessage: initialMessage,
            lastMessageTime: new Date().toISOString(),
            unreadCount: 0,
            createdAt: new Date().toISOString()
        };
        
        // Create initial message
        const message = {
            id: `msg_${Date.now()}`,
            conversationId: conversationId,
            senderId: currentUser.id,
            senderName: currentUser.name,
            message: initialMessage,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        // Save conversation and message
        dataManager.saveConversation(conversation);
        dataManager.saveMessage(message);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('newConversationModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('newConversationForm').reset();
        
        // Refresh conversations list and select the new conversation
        await loadConversations();
        selectConversation(conversationId);
        
        showNotification('Conversation started successfully!', 'success');
        
    } catch (error) {
        dashboardLogger.error('Error creating conversation:', error);
        showNotification('Error starting conversation. Please try again.', 'error');
    }
}

// Make function available globally
window.createNewConversation = createNewConversation;

async function startConversation(teacherId) {
    try {
        // Check if conversation already exists
        const conversations = dataManager.getConversations(currentUser.id);
        const existingConversation = conversations.find(conv => 
            conv.teacherId === teacherId && conv.studentId === currentUser.id
        );
        
        if (existingConversation) {
            // Switch to messages section and select conversation
            showSection('messages');
            await loadConversations();
            selectConversation(existingConversation.id);
        } else {
            // Pre-select teacher and show new conversation modal
            showSection('messages');
            setTimeout(() => {
                showNewConversationModal();
                document.getElementById('conversationTeacherSelect').value = teacherId;
            }, 100);
        }
        
    } catch (error) {
        dashboardLogger.error('Error starting conversation:', error);
        showNotification('Error starting conversation. Please try again.', 'error');
    }
}

// Make function available globally
window.startConversation = startConversation;

async function loadConversations() {
    try {
        const conversations = dataManager.getConversations(currentUser.id);
        const conversationsList = document.getElementById('conversationsList');
        
        if (conversations.length === 0) {
            conversationsList.innerHTML = `
                <div class="text-center p-4 text-muted">
                    <i class="fas fa-comments fa-2x mb-2"></i>
                    <p>No conversations yet.<br>Start a conversation with a teacher!</p>
                </div>
            `;
            return;
        }
        
        // Sort conversations by last message time
        conversations.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        
        conversationsList.innerHTML = conversations.map(conversation => {
            const lastMessageTime = new Date(conversation.lastMessageTime);
            const timeString = lastMessageTime.toLocaleString();
            const unreadBadge = conversation.unreadCount > 0 ? 
                `<span class="badge bg-primary">${conversation.unreadCount}</span>` : '';
            
            return `
                <div class="list-group-item list-group-item-action conversation-item" 
                     data-conversation-id="${conversation.id}"
                     onclick="selectConversation('${conversation.id}')">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${conversation.teacherName}</h6>
                        <small class="text-muted">${timeString}</small>
                    </div>
                    <div class="d-flex w-100 justify-content-between">
                        <p class="mb-1 text-muted">${conversation.lastMessage.substring(0, 50)}...</p>
                        ${unreadBadge}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        dashboardLogger.error('Error loading conversations:', error);
        showNotification('Error loading conversations.', 'error');
    }
}

async function selectConversation(conversationId) {
    try {
        currentConversation = conversationId;
        
        // Update active conversation in UI
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const selectedItem = document.querySelector(`[data-conversation-id="${conversationId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
        
        // Load conversation details
        const conversations = dataManager.getConversations(currentUser.id);
        const conversation = conversations.find(conv => conv.id === conversationId);
        
        if (!conversation) {
            showNotification('Conversation not found.', 'error');
            return;
        }
        
        // Update chat header
        document.getElementById('chatHeader').textContent = `Chat with ${conversation.teacherName}`;
        
        // Load messages
        await loadMessages(conversationId);
        
        // Show message form
        document.getElementById('messageForm').classList.remove('d-none');
        
        // Mark conversation as read
        if (conversation.unreadCount > 0) {
            conversation.unreadCount = 0;
            dataManager.updateConversation(conversation);
            await loadConversations(); // Refresh to remove unread badge
        }
        
    } catch (error) {
        dashboardLogger.error('Error selecting conversation:', error);
        showNotification('Error loading conversation.', 'error');
    }
}

// Make function available globally
window.selectConversation = selectConversation;

async function loadMessages(conversationId) {
    try {
        const messages = dataManager.getMessages(conversationId);
        const messagesContainer = document.getElementById('messagesContainer');
        
        if (messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-comment fa-2x mb-2"></i>
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `;
            return;
        }
        
        // Sort messages by timestamp
        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        messagesContainer.innerHTML = messages.map(message => {
            const isOwnMessage = message.senderId === currentUser.id;
            const messageTime = new Date(message.timestamp).toLocaleString();
            
            return `
                <div class="message ${isOwnMessage ? 'own-message' : 'other-message'} mb-3">
                    <div class="message-content">
                        <div class="message-header">
                            <strong>${message.senderName}</strong>
                            <small class="text-muted ms-2">${messageTime}</small>
                        </div>
                        <div class="message-text mt-1">${message.message}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
    } catch (error) {
        dashboardLogger.error('Error loading messages:', error);
        showNotification('Error loading messages.', 'error');
    }
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();
    
    if (!messageText || !currentConversation) {
        return;
    }
    
    try {
        // Create message object
        const message = {
            id: `msg_${Date.now()}`,
            conversationId: currentConversation,
            senderId: currentUser.id,
            senderName: currentUser.name,
            message: messageText,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        // Save message
        dataManager.saveMessage(message);
        
        // Update conversation last message
        const conversations = dataManager.getConversations(currentUser.id);
        const conversation = conversations.find(conv => conv.id === currentConversation);
        if (conversation) {
            conversation.lastMessage = messageText;
            conversation.lastMessageTime = message.timestamp;
            dataManager.updateConversation(conversation);
        }
        
        // Clear input
        messageInput.value = '';
        
        // Reload messages and conversations
        await loadMessages(currentConversation);
        await loadConversations();
        
    } catch (error) {
        dashboardLogger.error('Error sending message:', error);
        showNotification('Error sending message. Please try again.', 'error');
    }
}

// Make function available globally
window.sendMessage = sendMessage;

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
    
    if (sidebar?.classList.contains('collapsed') && window.innerWidth > 768) {
        sidebar.classList.remove('collapsed');
        mainContent?.classList.remove('expanded');
        localStorage.setItem('sidebarCollapsed', 'false');
        updateSidebarToggleIcon();
        addExpandIndicator();
        
        // Show a subtle notification
        console.log('Sidebar expanded for better visibility');
    }
}

// Call ensureSidebarExpanded on initial load
document.addEventListener('DOMContentLoaded', ensureSidebarExpanded);

// Clear any problematic localStorage and ensure expanded state
function resetSidebarState() {
    // Clear the collapsed state to start fresh
    localStorage.removeItem('sidebarCollapsed');
    
    // Ensure sidebar is expanded
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (sidebar && window.innerWidth > 768) {
        sidebar.classList.remove('collapsed');
        mainContent?.classList.remove('expanded');
        localStorage.setItem('sidebarCollapsed', 'false');
        
        console.log('Sidebar reset to expanded state');
    }
}

// Make function available globally
window.resetSidebarState = resetSidebarState;

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

function applySafariSpecificFixes() {
    if (isSafari()) {
        console.log('Safari detected, applying specific fixes...');
        
        // Add Safari-specific class to body
        document.body.classList.add('safari-browser');
        
        // Force sidebar visibility with inline styles
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.style.setProperty('display', 'block', 'important');
            sidebar.style.setProperty('position', 'fixed', 'important');
            sidebar.style.setProperty('left', '0', 'important');
            sidebar.style.setProperty('top', '0', 'important');
            sidebar.style.setProperty('width', '300px', 'important');
            sidebar.style.setProperty('height', '100vh', 'important');
            sidebar.style.setProperty('z-index', '1050', 'important');
            sidebar.style.setProperty('background', 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', 'important');
            sidebar.style.setProperty('box-shadow', '0 8px 32px rgba(0, 0, 0, 0.08)', 'important');
            sidebar.style.setProperty('border-right', '1px solid rgba(226, 232, 240, 0.6)', 'important');
        }
        
        // Ensure main content has proper margin
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.style.setProperty('margin-left', '300px', 'important');
        }
        
        console.log('Safari fixes applied');
    }
}

// Apply Safari-specific fixes on DOMContentLoaded
document.addEventListener('DOMContentLoaded', applySafariSpecificFixes);
