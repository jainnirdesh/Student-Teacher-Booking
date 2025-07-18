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
    Timestamp,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';

// Initialize logger
const logger = new Logger('TeacherDashboard');

// Global variables
let currentUser = null;
let userProfile = null;
let appointments = [];
let students = [];
let currentAppointmentId = null;
let appointmentModal = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    logger.info('Teacher dashboard initialized');
    
    // Check authentication
    currentUser = authManager.getCurrentUser();
    if (!currentUser || authManager.getUserRole() !== 'teacher') {
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize dashboard
    await initializeDashboard();
});

async function initializeDashboard() {
    try {
        // Initialize Bootstrap components
        appointmentModal = new bootstrap.Modal(document.getElementById('appointmentModal'));
        
        // Load user profile
        userProfile = await loadUserProfile();
        if (userProfile) {
            updateUserInterface();
        }
        
        // Load dashboard data
        await Promise.all([
            loadAppointments(),
            loadStudents(),
            loadStatistics()
        ]);
        
        // Setup real-time listeners
        setupRealtimeListeners();
        
        // Initialize form handlers
        initializeFormHandlers();
        
        logger.info('Teacher dashboard initialization completed');
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
        document.getElementById('teacherName').textContent = userProfile.name;
        
        // Update profile form
        document.getElementById('profileName').value = userProfile.name || '';
        document.getElementById('profileEmail').value = userProfile.email || '';
        document.getElementById('profileDepartment').value = userProfile.department || '';
        document.getElementById('profileSubject').value = userProfile.subject || '';
        document.getElementById('profilePhone').value = userProfile.phone || '';
        document.getElementById('profileOffice').value = userProfile.office || '';
        document.getElementById('profileBio').value = userProfile.bio || '';
        
        // Update schedule display
        updateScheduleDisplay();
    }
}

async function loadAppointments() {
    try {
        const appointmentsQuery = query(
            collection(db, 'appointments'),
            where('teacherId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(appointmentsQuery);
        appointments = await Promise.all(snapshot.docs.map(async doc => {
            const appointmentData = doc.data();
            
            // Get student details
            const studentDoc = await getDoc(doc(db, 'users', appointmentData.studentId));
            const studentData = studentDoc.exists() ? studentDoc.data() : {};
            
            return {
                id: doc.id,
                ...appointmentData,
                studentName: studentData.name || 'Unknown',
                studentEmail: studentData.email || 'Unknown'
            };
        }));
        
        updateAppointmentsTables();
        logger.info('Appointments loaded', { count: appointments.length });
    } catch (error) {
        logger.error('Failed to load appointments', error);
        showNotification('Failed to load appointments', 'error');
    }
}

async function loadStudents() {
    try {
        // Get unique students from appointments
        const uniqueStudentIds = [...new Set(appointments.map(app => app.studentId))];
        
        students = await Promise.all(uniqueStudentIds.map(async studentId => {
            const studentDoc = await getDoc(doc(db, 'users', studentId));
            if (studentDoc.exists()) {
                const studentData = studentDoc.data();
                const studentAppointments = appointments.filter(app => app.studentId === studentId);
                
                return {
                    id: studentId,
                    ...studentData,
                    appointmentCount: studentAppointments.length,
                    lastAppointment: studentAppointments[0]?.date || null
                };
            }
            return null;
        }));
        
        students = students.filter(student => student !== null);
        updateStudentsDisplay();
        
        logger.info('Students loaded', { count: students.length });
    } catch (error) {
        logger.error('Failed to load students', error);
        showNotification('Failed to load students', 'error');
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
            <td>
                <div><strong>${appointment.studentName}</strong></div>
                <small class="text-muted">${appointment.studentEmail}</small>
            </td>
            <td>${formatDate(appointment.date)}</td>
            <td>${appointment.time}</td>
            <td>
                <div class="text-truncate" style="max-width: 150px;" title="${appointment.purpose}">
                    ${appointment.purpose || 'No purpose specified'}
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewAppointment('${appointment.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                ${appointment.status === 'pending' ? `
                    <button class="btn btn-sm btn-outline-success" onclick="quickApprove('${appointment.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="quickReject('${appointment.id}')">
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
                <div><strong>${appointment.studentName}</strong></div>
                <small class="text-muted">${appointment.studentEmail}</small>
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
                    <button class="btn btn-outline-primary" onclick="viewAppointment('${appointment.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${appointment.status === 'pending' ? `
                        <button class="btn btn-outline-success" onclick="quickApprove('${appointment.id}')" title="Approve">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="quickReject('${appointment.id}')" title="Reject">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    ${appointment.status === 'approved' ? `
                        <button class="btn btn-outline-warning" onclick="rescheduleAppointment('${appointment.id}')" title="Reschedule">
                            <i class="fas fa-calendar-alt"></i>
                        </button>
                        <button class="btn btn-outline-info" onclick="markCompleted('${appointment.id}')" title="Mark Completed">
                            <i class="fas fa-check-circle"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function updateStudentsDisplay() {
    const studentsGrid = document.getElementById('studentsGrid');
    
    if (students.length === 0) {
        studentsGrid.innerHTML = '<div class="col-12 text-center text-muted"><p>No students yet</p></div>';
        return;
    }
    
    studentsGrid.innerHTML = students.map(student => `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card">
                <div class="card-body">
                    <h6 class="card-title">${student.name}</h6>
                    <p class="card-text">
                        <small class="text-muted">
                            <i class="fas fa-id-badge me-1"></i>${student.studentId || 'N/A'}<br>
                            <i class="fas fa-graduation-cap me-1"></i>${student.program || 'N/A'}<br>
                            <i class="fas fa-envelope me-1"></i>${student.email}<br>
                            <i class="fas fa-calendar me-1"></i>${student.appointmentCount} appointments
                        </small>
                    </p>
                    <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewStudentHistory('${student.id}')">
                            <i class="fas fa-history"></i> History
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="messageStudent('${student.id}')">
                            <i class="fas fa-comment"></i> Message
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function updateScheduleDisplay() {
    const scheduleContainer = document.getElementById('currentSchedule');
    const availableSlots = userProfile?.availableSlots || [];
    
    if (availableSlots.length === 0) {
        scheduleContainer.innerHTML = '<p class="text-muted">No time slots configured</p>';
        return;
    }
    
    // Group slots by day
    const slotsByDay = {};
    availableSlots.forEach(slot => {
        const [day, time] = slot.split(' - ');
        if (!slotsByDay[day]) {
            slotsByDay[day] = [];
        }
        slotsByDay[day].push(time);
    });
    
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    scheduleContainer.innerHTML = daysOrder.map(day => {
        if (!slotsByDay[day]) return '';
        
        return `
            <div class="mb-3">
                <h6 class="fw-bold">${day}</h6>
                <div class="d-flex flex-wrap gap-1">
                    ${slotsByDay[day].map(time => `
                        <span class="badge bg-primary me-1 mb-1">
                            ${time}
                            <button class="btn-close btn-close-white ms-1" onclick="removeTimeSlot('${day} - ${time}')" style="font-size: 0.6em;"></button>
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

async function loadStatistics() {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const stats = {
            total: appointments.length,
            pending: appointments.filter(app => app.status === 'pending').length,
            today: appointments.filter(app => app.date === today && app.status === 'approved').length,
            students: students.length
        };
        
        document.getElementById('totalAppointments').textContent = stats.total;
        document.getElementById('pendingAppointments').textContent = stats.pending;
        document.getElementById('todayAppointments').textContent = stats.today;
        document.getElementById('totalStudents').textContent = stats.students;
        
        logger.info('Statistics updated', stats);
    } catch (error) {
        logger.error('Failed to load statistics', error);
    }
}

function setupRealtimeListeners() {
    // Listen for new appointment requests
    const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('teacherId', '==', currentUser.uid),
        where('status', '==', 'pending')
    );
    
    onSnapshot(appointmentsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const appointment = change.doc.data();
                showNotification(`New appointment request from ${appointment.studentName}`, 'info');
                loadAppointments(); // Reload appointments
            }
        });
    });
}

function initializeFormHandlers() {
    // Add time slot form
    const addTimeSlotForm = document.getElementById('addTimeSlotForm');
    if (addTimeSlotForm) {
        addTimeSlotForm.addEventListener('submit', handleAddTimeSlot);
    }
    
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
}

async function handleAddTimeSlot(event) {
    event.preventDefault();
    
    const day = document.getElementById('dayOfWeek').value;
    const time = document.getElementById('timeSlot').value;
    
    if (!day || !time) {
        showNotification('Please select both day and time', 'error');
        return;
    }
    
    const timeSlot = `${day} - ${time}`;
    
    try {
        showLoading();
        
        // Add to user's available slots
        await updateDoc(doc(db, 'users', currentUser.uid), {
            availableSlots: arrayUnion(timeSlot)
        });
        
        // Update local profile
        if (!userProfile.availableSlots) {
            userProfile.availableSlots = [];
        }
        userProfile.availableSlots.push(timeSlot);
        
        updateScheduleDisplay();
        
        // Reset form
        event.target.reset();
        
        hideLoading();
        showNotification('Time slot added successfully!', 'success');
        
        logger.info('Time slot added', { timeSlot });
    } catch (error) {
        hideLoading();
        logger.error('Failed to add time slot', error);
        showNotification('Failed to add time slot', 'error');
    }
}

async function removeTimeSlot(timeSlot) {
    if (!confirm('Are you sure you want to remove this time slot?')) {
        return;
    }
    
    try {
        showLoading();
        
        await updateDoc(doc(db, 'users', currentUser.uid), {
            availableSlots: arrayRemove(timeSlot)
        });
        
        // Update local profile
        userProfile.availableSlots = userProfile.availableSlots.filter(slot => slot !== timeSlot);
        updateScheduleDisplay();
        
        hideLoading();
        showNotification('Time slot removed successfully!', 'info');
        
        logger.info('Time slot removed', { timeSlot });
    } catch (error) {
        hideLoading();
        logger.error('Failed to remove time slot', error);
        showNotification('Failed to remove time slot', 'error');
    }
}

async function handleProfileUpdate(event) {
    event.preventDefault();
    
    const profileData = {
        name: document.getElementById('profileName').value,
        department: document.getElementById('profileDepartment').value,
        subject: document.getElementById('profileSubject').value,
        phone: document.getElementById('profilePhone').value,
        office: document.getElementById('profileOffice').value,
        bio: document.getElementById('profileBio').value,
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

async function viewAppointment(appointmentId) {
    const appointment = appointments.find(app => app.id === appointmentId);
    if (!appointment) return;
    
    currentAppointmentId = appointmentId;
    
    const modalBody = document.getElementById('appointmentModalBody');
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>Student Information</h6>
                <p><strong>Name:</strong> ${appointment.studentName}</p>
                <p><strong>Email:</strong> ${appointment.studentEmail}</p>
                <p><strong>Date:</strong> ${formatDate(appointment.date)}</p>
                <p><strong>Time:</strong> ${appointment.time}</p>
            </div>
            <div class="col-md-6">
                <h6>Appointment Details</h6>
                <p><strong>Status:</strong> <span class="badge badge-${appointment.status}">${appointment.status}</span></p>
                <p><strong>Purpose:</strong> ${appointment.purpose || 'Not specified'}</p>
                <p><strong>Message:</strong> ${appointment.message || 'No additional message'}</p>
                <p><strong>Requested:</strong> ${formatDate(appointment.createdAt?.toDate?.() || appointment.createdAt)}</p>
            </div>
        </div>
    `;
    
    // Show/hide action buttons based on status
    const approveBtn = document.getElementById('approveBtn');
    const rejectBtn = document.getElementById('rejectBtn');
    
    if (appointment.status === 'pending') {
        approveBtn.style.display = 'inline-block';
        rejectBtn.style.display = 'inline-block';
    } else {
        approveBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
    }
    
    appointmentModal.show();
}

async function updateAppointmentStatus(status) {
    if (!currentAppointmentId) return;
    
    try {
        showLoading();
        
        await updateDoc(doc(db, 'appointments', currentAppointmentId), {
            status: status,
            updatedAt: Timestamp.now()
        });
        
        await authManager.logActivity('APPOINTMENT_STATUS_UPDATED', {
            appointmentId: currentAppointmentId,
            status: status
        });
        
        appointmentModal.hide();
        hideLoading();
        
        showNotification(`Appointment ${status} successfully!`, 'success');
        await loadAppointments();
        await loadStatistics();
        
        logger.info('Appointment status updated', { appointmentId: currentAppointmentId, status });
    } catch (error) {
        hideLoading();
        logger.error('Failed to update appointment status', error);
        showNotification('Failed to update appointment status', 'error');
    }
}

async function quickApprove(appointmentId) {
    currentAppointmentId = appointmentId;
    await updateAppointmentStatus('approved');
}

async function quickReject(appointmentId) {
    currentAppointmentId = appointmentId;
    await updateAppointmentStatus('rejected');
}

async function markCompleted(appointmentId) {
    if (!confirm('Mark this appointment as completed?')) {
        return;
    }
    
    currentAppointmentId = appointmentId;
    await updateAppointmentStatus('completed');
}

function filterAppointments() {
    updateAllAppointmentsTable();
}

function addTimeSlot() {
    showSection('schedule');
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
        'appointments': 'Appointments',
        'schedule': 'Schedule Management',
        'students': 'Students',
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
    
    const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
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
window.viewAppointment = viewAppointment;
window.updateAppointmentStatus = updateAppointmentStatus;
window.quickApprove = quickApprove;
window.quickReject = quickReject;
window.markCompleted = markCompleted;
window.filterAppointments = filterAppointments;
window.addTimeSlot = addTimeSlot;
window.removeTimeSlot = removeTimeSlot;
window.logout = () => authManager.signOut();
