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
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';

// Initialize logger
const logger = new Logger('AdminDashboard');

// Global variables
let currentUser = null;
let userProfile = null;
let users = [];
let appointments = [];
let activityLogs = [];
let currentSelectedUser = null;
let userModal = null;
let charts = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    logger.info('Admin dashboard initialized');
    
    // Check authentication
    currentUser = authManager.getCurrentUser();
    if (!currentUser || authManager.getUserRole() !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize dashboard
    await initializeDashboard();
});

async function initializeDashboard() {
    try {
        // Initialize Bootstrap components
        userModal = new bootstrap.Modal(document.getElementById('userModal'));
        
        // Load user profile
        userProfile = await loadUserProfile();
        if (userProfile) {
            updateUserInterface();
        }
        
        // Load all data
        await Promise.all([
            loadUsers(),
            loadAppointments(),
            loadActivityLogs(),
            loadStatistics()
        ]);
        
        // Initialize charts
        initializeCharts();
        
        // Setup real-time listeners
        setupRealtimeListeners();
        
        // Initialize form handlers
        initializeFormHandlers();
        
        logger.info('Admin dashboard initialization completed');
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
            logger.info('Admin profile loaded', { userId: currentUser.uid });
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
        document.getElementById('adminName').textContent = userProfile.name || 'Administrator';
    }
}

async function loadUsers() {
    try {
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(usersQuery);
        
        users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        updateUsersTable();
        updateTeachersTable();
        updateStudentsTable();
        
        logger.info('Users loaded', { count: users.length });
    } catch (error) {
        logger.error('Failed to load users', error);
        showNotification('Failed to load users', 'error');
    }
}

async function loadAppointments() {
    try {
        const appointmentsQuery = query(
            collection(db, 'appointments'),
            orderBy('createdAt', 'desc'),
            limit(1000)
        );
        
        const snapshot = await getDocs(appointmentsQuery);
        appointments = await Promise.all(snapshot.docs.map(async doc => {
            const appointmentData = doc.data();
            
            // Get student and teacher details
            const [studentDoc, teacherDoc] = await Promise.all([
                getDoc(doc(db, 'users', appointmentData.studentId)),
                getDoc(doc(db, 'users', appointmentData.teacherId))
            ]);
            
            return {
                id: doc.id,
                ...appointmentData,
                studentName: studentDoc.exists() ? studentDoc.data().name : 'Unknown',
                teacherName: teacherDoc.exists() ? teacherDoc.data().name : 'Unknown'
            };
        }));
        
        updateAppointmentsTable();
        logger.info('Appointments loaded', { count: appointments.length });
    } catch (error) {
        logger.error('Failed to load appointments', error);
        showNotification('Failed to load appointments', 'error');
    }
}

async function loadActivityLogs() {
    try {
        const logsQuery = query(
            collection(db, 'activityLogs'),
            orderBy('timestamp', 'desc'),
            limit(500)
        );
        
        const snapshot = await getDocs(logsQuery);
        activityLogs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        updateLogsTable();
        updateRecentActivity();
        
        logger.info('Activity logs loaded', { count: activityLogs.length });
    } catch (error) {
        logger.error('Failed to load activity logs', error);
        showNotification('Failed to load activity logs', 'error');
    }
}

function updateUsersTable() {
    const tableBody = document.getElementById('usersTable');
    const roleFilter = document.getElementById('userRoleFilter')?.value || 'all';
    const statusFilter = document.getElementById('userStatusFilter')?.value || 'all';
    
    let filteredUsers = users;
    
    if (roleFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
    }
    
    if (statusFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user => {
            if (statusFilter === 'active') return user.isActive && user.isApproved;
            if (statusFilter === 'inactive') return !user.isActive;
            if (statusFilter === 'pending') return !user.isApproved;
            return true;
        });
    }
    
    if (filteredUsers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = filteredUsers.map(user => `
        <tr>
            <td>
                <div><strong>${user.name}</strong></div>
                <small class="text-muted">${user.email}</small>
            </td>
            <td>
                <span class="badge bg-${getRoleColor(user.role)}">${user.role}</span>
            </td>
            <td>
                <span class="badge bg-${getStatusColor(user)}">${getUserStatus(user)}</span>
            </td>
            <td>${formatDate(user.createdAt)}</td>
            <td>${formatDate(user.lastLogin) || 'Never'}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewUser('${user.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning" onclick="editUser('${user.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${!user.isApproved ? `
                        <button class="btn btn-outline-success" onclick="approveUser('${user.id}')" title="Approve">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    <button class="btn btn-outline-danger" onclick="suspendUser('${user.id}')" title="Suspend">
                        <i class="fas fa-ban"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateTeachersTable() {
    const tableBody = document.getElementById('teachersTable');
    const teachers = users.filter(user => user.role === 'teacher');
    
    if (teachers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No teachers found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = teachers.map(teacher => {
        const teacherAppointments = appointments.filter(app => app.teacherId === teacher.id);
        
        return `
            <tr>
                <td>
                    <div><strong>${teacher.name}</strong></div>
                    <small class="text-muted">${teacher.email}</small>
                </td>
                <td>${teacher.department || 'Not specified'}</td>
                <td>${teacher.subject || 'Not specified'}</td>
                <td>${teacherAppointments.length}</td>
                <td>
                    <span class="badge bg-${getStatusColor(teacher)}">${getUserStatus(teacher)}</span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="viewUser('${teacher.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="editUser('${teacher.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${!teacher.isApproved ? `
                            <button class="btn btn-outline-success" onclick="approveUser('${teacher.id}')" title="Approve">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-outline-danger" onclick="deleteUser('${teacher.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateStudentsTable() {
    const tableBody = document.getElementById('studentsTable');
    const students = users.filter(user => user.role === 'student');
    
    if (students.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No students found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = students.map(student => {
        const studentAppointments = appointments.filter(app => app.studentId === student.id);
        
        return `
            <tr>
                <td>
                    <div><strong>${student.name}</strong></div>
                    <small class="text-muted">${student.email}</small>
                </td>
                <td>${student.studentId || 'Not specified'}</td>
                <td>${student.program || 'Not specified'}</td>
                <td>${studentAppointments.length}</td>
                <td>
                    <span class="badge bg-${getStatusColor(student)}">${getUserStatus(student)}</span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="viewUser('${student.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="editUser('${student.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteUser('${student.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateAppointmentsTable() {
    const tableBody = document.getElementById('appointmentsTable');
    const statusFilter = document.getElementById('appointmentStatusFilter')?.value || 'all';
    
    let filteredAppointments = appointments;
    if (statusFilter !== 'all') {
        filteredAppointments = appointments.filter(app => app.status === statusFilter);
    }
    
    if (filteredAppointments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No appointments found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = filteredAppointments.map(appointment => `
        <tr>
            <td>
                <div><strong>${appointment.studentName}</strong></div>
                <small class="text-muted">${appointment.studentEmail}</small>
            </td>
            <td>
                <div><strong>${appointment.teacherName}</strong></div>
                <small class="text-muted">Teacher</small>
            </td>
            <td>
                <div>${formatDate(appointment.date)}</div>
                <small class="text-muted">${appointment.time}</small>
            </td>
            <td>
                <div class="text-truncate" style="max-width: 150px;" title="${appointment.purpose}">
                    ${appointment.purpose || 'No purpose specified'}
                </div>
            </td>
            <td>
                <span class="badge badge-${appointment.status}">${appointment.status}</span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewAppointment('${appointment.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteAppointment('${appointment.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateLogsTable() {
    const tableBody = document.getElementById('logsTable');
    const dateFilter = document.getElementById('logDateFilter')?.value;
    const actionFilter = document.getElementById('logActionFilter')?.value || 'all';
    
    let filteredLogs = activityLogs;
    
    if (dateFilter) {
        filteredLogs = filteredLogs.filter(log => {
            const logDate = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
            return logDate.toISOString().split('T')[0] === dateFilter;
        });
    }
    
    if (actionFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.action === actionFilter);
    }
    
    if (filteredLogs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No logs found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = filteredLogs.slice(0, 100).map(log => `
        <tr>
            <td>${formatDateTime(log.timestamp)}</td>
            <td>${log.userEmail || 'System'}</td>
            <td><span class="badge bg-info">${log.action}</span></td>
            <td>
                <div class="text-truncate" style="max-width: 200px;" title="${JSON.stringify(log.details)}">
                    ${JSON.stringify(log.details).substring(0, 50)}...
                </div>
            </td>
            <td>${log.details?.ipAddress || 'N/A'}</td>
        </tr>
    `).join('');
}

function updateRecentActivity() {
    const container = document.getElementById('recentActivity');
    const recentLogs = activityLogs.slice(0, 10);
    
    if (recentLogs.length === 0) {
        container.innerHTML = '<p class="text-muted">No recent activity</p>';
        return;
    }
    
    container.innerHTML = recentLogs.map(log => `
        <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
            <div>
                <small class="fw-bold">${log.action}</small><br>
                <small class="text-muted">${log.userEmail || 'System'}</small>
            </div>
            <small class="text-muted">${formatRelativeTime(log.timestamp)}</small>
        </div>
    `).join('');
}

async function loadStatistics() {
    try {
        const stats = {
            totalUsers: users.length,
            totalTeachers: users.filter(u => u.role === 'teacher').length,
            totalStudents: users.filter(u => u.role === 'student').length,
            totalAppointments: appointments.length
        };
        
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('totalTeachers').textContent = stats.totalTeachers;
        document.getElementById('totalStudents').textContent = stats.totalStudents;
        document.getElementById('totalAppointments').textContent = stats.totalAppointments;
        
        logger.info('Statistics updated', stats);
    } catch (error) {
        logger.error('Failed to load statistics', error);
    }
}

function initializeCharts() {
    try {
        // User Registration Chart
        const userRegCtx = document.getElementById('userRegistrationChart');
        if (userRegCtx) {
            charts.userRegistration = new Chart(userRegCtx, {
                type: 'line',
                data: {
                    labels: getLast7Days(),
                    datasets: [{
                        label: 'Registrations',
                        data: getUserRegistrationData(),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        // Appointment Status Chart
        const appointmentCtx = document.getElementById('appointmentStatusChart');
        if (appointmentCtx) {
            charts.appointmentStatus = new Chart(appointmentCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Pending', 'Approved', 'Rejected', 'Completed'],
                    datasets: [{
                        data: getAppointmentStatusData(),
                        backgroundColor: [
                            '#fbbf24',
                            '#10b981',
                            '#ef4444',
                            '#3b82f6'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
        
        logger.info('Charts initialized');
    } catch (error) {
        logger.error('Failed to initialize charts', error);
    }
}

function setupRealtimeListeners() {
    // Listen for new user registrations
    const usersQuery = query(collection(db, 'users'));
    onSnapshot(usersQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const user = change.doc.data();
                if (user.role === 'teacher' && !user.isApproved) {
                    showNotification(`New teacher registration: ${user.name}`, 'info');
                }
            }
        });
    });
    
    // Listen for new appointments
    const appointmentsQuery = query(collection(db, 'appointments'));
    onSnapshot(appointmentsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                showNotification('New appointment booked', 'info');
            }
        });
    });
}

function initializeFormHandlers() {
    // Add teacher form
    const addTeacherForm = document.getElementById('addTeacherForm');
    if (addTeacherForm) {
        addTeacherForm.addEventListener('submit', handleAddTeacher);
    }
    
    // System settings form
    const systemSettingsForm = document.getElementById('systemSettingsForm');
    if (systemSettingsForm) {
        systemSettingsForm.addEventListener('submit', handleSystemSettings);
    }
}

async function handleAddTeacher(event) {
    event.preventDefault();
    
    const teacherData = {
        name: document.getElementById('teacherName').value,
        email: document.getElementById('teacherEmail').value,
        department: document.getElementById('teacherDepartment').value,
        subject: document.getElementById('teacherSubject').value,
        role: 'teacher',
        isApproved: true,
        isActive: true,
        createdAt: Timestamp.now(),
        availableSlots: []
    };
    
    try {
        showLoading();
        
        // Add teacher to database
        await addDoc(collection(db, 'users'), teacherData);
        
        // Log activity
        await authManager.logActivity('TEACHER_ADDED_BY_ADMIN', teacherData);
        
        // Reset form
        event.target.reset();
        
        // Reload data
        await loadUsers();
        
        hideLoading();
        showNotification('Teacher added successfully!', 'success');
        
        logger.info('Teacher added by admin', teacherData);
    } catch (error) {
        hideLoading();
        logger.error('Failed to add teacher', error);
        showNotification('Failed to add teacher', 'error');
    }
}

async function approveUser(userId) {
    try {
        showLoading();
        
        await updateDoc(doc(db, 'users', userId), {
            isApproved: true,
            updatedAt: Timestamp.now()
        });
        
        await authManager.logActivity('USER_APPROVED', { userId });
        
        await loadUsers();
        
        hideLoading();
        showNotification('User approved successfully!', 'success');
        
        logger.info('User approved', { userId });
    } catch (error) {
        hideLoading();
        logger.error('Failed to approve user', error);
        showNotification('Failed to approve user', 'error');
    }
}

async function suspendUser(userId) {
    if (!confirm('Are you sure you want to suspend this user?')) {
        return;
    }
    
    try {
        showLoading();
        
        await updateDoc(doc(db, 'users', userId), {
            isActive: false,
            updatedAt: Timestamp.now()
        });
        
        await authManager.logActivity('USER_SUSPENDED', { userId });
        
        await loadUsers();
        
        hideLoading();
        showNotification('User suspended successfully!', 'info');
        
        logger.info('User suspended', { userId });
    } catch (error) {
        hideLoading();
        logger.error('Failed to suspend user', error);
        showNotification('Failed to suspend user', 'error');
    }
}

function viewUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    currentSelectedUser = user;
    
    const modalBody = document.getElementById('userModalBody');
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>Personal Information</h6>
                <p><strong>Name:</strong> ${user.name}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Role:</strong> <span class="badge bg-${getRoleColor(user.role)}">${user.role}</span></p>
                <p><strong>Status:</strong> <span class="badge bg-${getStatusColor(user)}">${getUserStatus(user)}</span></p>
            </div>
            <div class="col-md-6">
                <h6>Account Details</h6>
                <p><strong>Registered:</strong> ${formatDate(user.createdAt)}</p>
                <p><strong>Last Login:</strong> ${formatDate(user.lastLogin) || 'Never'}</p>
                <p><strong>Approved:</strong> ${user.isApproved ? 'Yes' : 'No'}</p>
                <p><strong>Active:</strong> ${user.isActive ? 'Yes' : 'No'}</p>
            </div>
        </div>
        ${user.role === 'teacher' ? `
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Teacher Information</h6>
                    <p><strong>Department:</strong> ${user.department || 'Not specified'}</p>
                    <p><strong>Subject:</strong> ${user.subject || 'Not specified'}</p>
                    <p><strong>Office:</strong> ${user.office || 'Not specified'}</p>
                    <p><strong>Available Slots:</strong> ${user.availableSlots?.length || 0}</p>
                </div>
            </div>
        ` : ''}
        ${user.role === 'student' ? `
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Student Information</h6>
                    <p><strong>Student ID:</strong> ${user.studentId || 'Not specified'}</p>
                    <p><strong>Program:</strong> ${user.program || 'Not specified'}</p>
                    <p><strong>Phone:</strong> ${user.phone || 'Not specified'}</p>
                </div>
            </div>
        ` : ''}
    `;
    
    userModal.show();
}

// Helper functions
function getRoleColor(role) {
    switch (role) {
        case 'admin': return 'danger';
        case 'teacher': return 'success';
        case 'student': return 'primary';
        default: return 'secondary';
    }
}

function getStatusColor(user) {
    if (!user.isActive) return 'secondary';
    if (!user.isApproved) return 'warning';
    return 'success';
}

function getUserStatus(user) {
    if (!user.isActive) return 'Inactive';
    if (!user.isApproved) return 'Pending';
    return 'Active';
}

function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return days;
}

function getUserRegistrationData() {
    const data = new Array(7).fill(0);
    const today = new Date();
    
    users.forEach(user => {
        if (user.createdAt) {
            const createdDate = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
            const daysAgo = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
            
            if (daysAgo >= 0 && daysAgo < 7) {
                data[6 - daysAgo]++;
            }
        }
    });
    
    return data;
}

function getAppointmentStatusData() {
    const statusCounts = {
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0
    };
    
    appointments.forEach(appointment => {
        if (statusCounts.hasOwnProperty(appointment.status)) {
            statusCounts[appointment.status]++;
        }
    });
    
    return [statusCounts.pending, statusCounts.approved, statusCounts.rejected, statusCounts.completed];
}

function filterUsers() {
    updateUsersTable();
}

function filterAppointments() {
    updateAppointmentsTable();
}

function filterLogs() {
    updateLogsTable();
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
        'dashboard': 'Admin Dashboard',
        'users': 'User Management',
        'teachers': 'Teacher Management',
        'students': 'Student Management',
        'appointments': 'Appointment Overview',
        'analytics': 'System Analytics',
        'logs': 'Activity Logs',
        'settings': 'System Settings'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName] || 'Admin Dashboard';
    
    logger.logUserAction('ADMIN_NAVIGATION', { section: sectionName });
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

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    
    const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatRelativeTime(dateString) {
    if (!dateString) return 'N/A';
    
    const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
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
window.viewUser = viewUser;
window.approveUser = approveUser;
window.suspendUser = suspendUser;
window.filterUsers = filterUsers;
window.filterAppointments = filterAppointments;
window.filterLogs = filterLogs;
window.logout = () => authManager.signOut();
