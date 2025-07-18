import { db } from './firebase-config.js';
import authManager from './auth.js';
import { Logger } from './logger.js';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';

// Initialize logger
const logger = new Logger('StudentDashboard');

// Global variables
let currentUser = null;
let userProfile = null;
let appointments = [];
let teachers = [];
let currentConversation = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    logger.info('Student dashboard initialized');
    
    // Check authentication
    currentUser = authManager.getCurrentUser();
    if (!currentUser || authManager.getUserRole() !== 'student') {
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize dashboard
    await initializeDashboard();
});

async function initializeDashboard() {
    try {
        // Load user profile
        userProfile = await loadUserProfile();
        if (userProfile) {
            updateUserInterface();
        }
        
        // Load dashboard data
        await Promise.all([
            loadTeachers(),
            loadAppointments(),
            loadStatistics()
        ]);
        
        // Setup real-time listeners
        setupRealtimeListeners();
        
        // Initialize form handlers
        initializeFormHandlers();
        
        logger.info('Dashboard initialization completed');
    } catch (error) {
        logger.error('Failed to initialize dashboard', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

async function loadUserProfile() {
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            logger.info('User profile loaded', { userId: currentUser.uid });
            return data;
        }
        return null;
    } catch (error) {
        logger.error('Failed to load user profile', error);
        return null;
    }
}

function updateUserInterface() {
    if (userProfile) {
        document.getElementById('studentName').textContent = userProfile.name;
        
        // Update profile form
        document.getElementById('profileName').value = userProfile.name || '';
        document.getElementById('profileEmail').value = userProfile.email || '';
        document.getElementById('profileStudentId').value = userProfile.studentId || '';
        document.getElementById('profileProgram').value = userProfile.program || '';
        document.getElementById('profilePhone').value = userProfile.phone || '';
    }
}

async function loadTeachers() {
    try {
        const teachersQuery = query(
            collection(db, 'users'),
            where('role', '==', 'teacher'),
            where('isApproved', '==', true),
            where('isActive', '==', true)
        );
        
        const snapshot = await getDocs(teachersQuery);
        teachers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        populateTeacherSelects();
        logger.info('Teachers loaded', { count: teachers.length });
    } catch (error) {
        logger.error('Failed to load teachers', error);
        showNotification('Failed to load teachers', 'error');
    }
}

function populateTeacherSelects() {
    // Teacher select for booking
    const teacherSelect = document.getElementById('teacherSelect');
    teacherSelect.innerHTML = '<option value="">Choose a teacher...</option>';
    
    // Department select for search
    const departmentSelect = document.getElementById('searchDepartment');
    const departments = [...new Set(teachers.map(t => t.department))];
    departmentSelect.innerHTML = '<option value="">All Departments</option>';
    
    // Subject select for search
    const subjectSelect = document.getElementById('searchSubject');
    const subjects = [...new Set(teachers.map(t => t.subject))];
    subjectSelect.innerHTML = '<option value="">All Subjects</option>';
    
    teachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = `${teacher.name} - ${teacher.department}`;
        teacherSelect.appendChild(option);
    });
    
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        departmentSelect.appendChild(option);
    });
    
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectSelect.appendChild(option);
    });
}

async function loadAppointments() {
    try {
        const appointmentsQuery = query(
            collection(db, 'appointments'),
            where('studentId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(appointmentsQuery);
        appointments = await Promise.all(snapshot.docs.map(async doc => {
            const appointmentData = doc.data();
            
            // Get teacher details
            const teacherDoc = await getDoc(doc(db, 'users', appointmentData.teacherId));
            const teacherData = teacherDoc.exists() ? teacherDoc.data() : {};
            
            return {
                id: doc.id,
                ...appointmentData,
                teacherName: teacherData.name || 'Unknown',
                teacherDepartment: teacherData.department || 'Unknown'
            };
        }));
        
        updateAppointmentsTables();
        logger.info('Appointments loaded', { count: appointments.length });
    } catch (error) {
        logger.error('Failed to load appointments', error);
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
        
        logger.info('Statistics updated', stats);
    } catch (error) {
        logger.error('Failed to load statistics', error);
    }
}

function setupRealtimeListeners() {
    // Listen for appointment updates
    const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('studentId', '==', currentUser.uid)
    );
    
    onSnapshot(appointmentsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'modified') {
                const appointment = change.doc.data();
                showNotification(`Appointment ${appointment.status}`, 'info');
                loadAppointments(); // Reload appointments
            }
        });
    });
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

async function handleTeacherSelection(event) {
    const teacherId = event.target.value;
    if (!teacherId) {
        document.getElementById('appointmentTime').innerHTML = '<option value="">Select time slot...</option>';
        return;
    }
    
    try {
        // Load teacher's available slots
        const teacherDoc = await getDoc(doc(db, 'users', teacherId));
        if (teacherDoc.exists()) {
            const teacherData = teacherDoc.data();
            const availableSlots = teacherData.availableSlots || [];
            
            const timeSelect = document.getElementById('appointmentTime');
            timeSelect.innerHTML = '<option value="">Select time slot...</option>';
            
            availableSlots.forEach(slot => {
                const option = document.createElement('option');
                option.value = slot;
                option.textContent = slot;
                timeSelect.appendChild(option);
            });
        }
    } catch (error) {
        logger.error('Failed to load teacher slots', error);
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
        studentId: currentUser.uid,
        studentName: userProfile.name,
        studentEmail: userProfile.email,
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    };
    
    // Validation
    if (!appointmentData.teacherId || !appointmentData.date || !appointmentData.time) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        showLoading();
        
        // Check for conflicting appointments
        const conflictQuery = query(
            collection(db, 'appointments'),
            where('teacherId', '==', appointmentData.teacherId),
            where('date', '==', appointmentData.date),
            where('time', '==', appointmentData.time),
            where('status', '!=', 'cancelled')
        );
        
        const conflictSnapshot = await getDocs(conflictQuery);
        if (!conflictSnapshot.empty) {
            throw new Error('This time slot is already booked');
        }
        
        // Create appointment
        await addDoc(collection(db, 'appointments'), appointmentData);
        
        // Log activity
        await authManager.logActivity('APPOINTMENT_BOOKED', {
            teacherId: appointmentData.teacherId,
            date: appointmentData.date,
            time: appointmentData.time
        });
        
        hideLoading();
        showNotification('Appointment booked successfully!', 'success');
        resetAppointmentForm();
        await loadAppointments();
        await loadStatistics();
        
        logger.info('Appointment booked successfully', appointmentData);
    } catch (error) {
        hideLoading();
        logger.error('Failed to book appointment', error);
        showNotification(error.message || 'Failed to book appointment', 'error');
    }
}

async function handleProfileUpdate(event) {
    event.preventDefault();
    
    const profileData = {
        name: document.getElementById('profileName').value,
        studentId: document.getElementById('profileStudentId').value,
        program: document.getElementById('profileProgram').value,
        phone: document.getElementById('profilePhone').value,
        updatedAt: Timestamp.now()
    };
    
    try {
        showLoading();
        
        await updateDoc(doc(db, 'users', currentUser.uid), profileData);
        
        userProfile = { ...userProfile, ...profileData };
        updateUserInterface();
        
        hideLoading();
        showNotification('Profile updated successfully!', 'success');
        
        logger.info('Profile updated', profileData);
    } catch (error) {
        hideLoading();
        logger.error('Failed to update profile', error);
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
    
    logger.logUserAction('TEACHER_SEARCH', { name, department, subject, resultsCount: filteredTeachers.length });
}

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

async function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
        return;
    }
    
    try {
        showLoading();
        
        await updateDoc(doc(db, 'appointments', appointmentId), {
            status: 'cancelled',
            updatedAt: Timestamp.now()
        });
        
        await authManager.logActivity('APPOINTMENT_CANCELLED', { appointmentId });
        
        hideLoading();
        showNotification('Appointment cancelled successfully', 'info');
        await loadAppointments();
        await loadStatistics();
        
        logger.info('Appointment cancelled', { appointmentId });
    } catch (error) {
        hideLoading();
        logger.error('Failed to cancel appointment', error);
        showNotification('Failed to cancel appointment', 'error');
    }
}

function resetAppointmentForm() {
    document.getElementById('bookAppointmentForm').reset();
    document.getElementById('appointmentTime').innerHTML = '<option value="">Select time slot...</option>';
}

function filterAppointments() {
    updateAllAppointmentsTable();
}

// Navigation functions
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
    document.querySelector(`[onclick="showSection('${sectionName}')"]`).classList.add('active');
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'search-teachers': 'Search Teachers',
        'book-appointment': 'Book Appointment',
        'my-appointments': 'My Appointments',
        'messages': 'Messages',
        'profile': 'Profile'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';
    
    logger.logUserAction('NAVIGATION', { section: sectionName });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}

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

// Global function exports for HTML onclick handlers
window.showSection = showSection;
window.toggleSidebar = toggleSidebar;
window.searchTeachers = searchTeachers;
window.bookWithTeacher = bookWithTeacher;
window.cancelAppointment = cancelAppointment;
window.resetAppointmentForm = resetAppointmentForm;
window.filterAppointments = filterAppointments;
window.logout = () => authManager.signOut();
