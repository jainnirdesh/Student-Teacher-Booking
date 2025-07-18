// Local Storage Data Manager
// Replaces Firebase Firestore with localStorage-based data persistence

class LocalDataManager {
    constructor() {
        this.initializeStorage();
    }

    initializeStorage() {
        // Initialize default data structure if not exists
        if (!localStorage.getItem('appointments')) {
            localStorage.setItem('appointments', JSON.stringify([]));
        }
        if (!localStorage.getItem('teachers')) {
            localStorage.setItem('teachers', JSON.stringify([
                {
                    id: 'teacher1',
                    name: 'Dr. John Smith',
                    subject: 'Mathematics',
                    department: 'Mathematics',
                    email: 'john.smith@school.edu',
                    available: true,
                    availability: ['Monday 9:00-12:00', 'Wednesday 14:00-17:00', 'Friday 10:00-13:00']
                },
                {
                    id: 'teacher2',
                    name: 'Prof. Sarah Johnson',
                    subject: 'Physics',
                    department: 'Physics',
                    email: 'sarah.johnson@school.edu',
                    available: true,
                    availability: ['Tuesday 10:00-13:00', 'Thursday 9:00-12:00', 'Friday 14:00-17:00']
                },
                {
                    id: 'teacher3',
                    name: 'Dr. Emily Davis',
                    subject: 'Chemistry',
                    department: 'Chemistry',
                    email: 'emily.davis@school.edu',
                    available: true,
                    availability: ['Monday 14:00-17:00', 'Wednesday 9:00-12:00', 'Thursday 15:00-18:00']
                }
            ]));
        }
        if (!localStorage.getItem('students')) {
            localStorage.setItem('students', JSON.stringify([]));
        }
        if (!localStorage.getItem('conversations')) {
            localStorage.setItem('conversations', JSON.stringify([]));
        }
        if (!localStorage.getItem('messages')) {
            localStorage.setItem('messages', JSON.stringify([]));
        }
        
        // Add a test student user if no users exist
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify([
                {
                    id: 'test-student',
                    username: 'student',
                    email: 'student@test.com',
                    name: 'Test Student',
                    role: 'student',
                    program: 'Computer Science',
                    studentId: 'ST001'
                }
            ]));
        }
        
        // Set a test session if no current user
        if (!localStorage.getItem('currentUser')) {
            localStorage.setItem('currentUser', JSON.stringify({
                id: 'test-student',
                username: 'student',
                email: 'student@test.com',
                name: 'Test Student',
                role: 'student',
                program: 'Computer Science',
                studentId: 'ST001'
            }));
        }
    }

    // Appointments CRUD operations
    async getAppointments(filters = {}) {
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        let filtered = appointments;

        if (filters.studentId) {
            filtered = filtered.filter(apt => apt.studentId === filters.studentId);
        }
        if (filters.teacherId) {
            filtered = filtered.filter(apt => apt.teacherId === filters.teacherId);
        }
        if (filters.status) {
            filtered = filtered.filter(apt => apt.status === filters.status);
        }

        return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    async createAppointment(appointmentData) {
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const newAppointment = {
            id: 'apt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            ...appointmentData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        appointments.push(newAppointment);
        localStorage.setItem('appointments', JSON.stringify(appointments));
        return newAppointment;
    }

    async updateAppointment(appointmentId, updates) {
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const index = appointments.findIndex(apt => apt.id === appointmentId);
        
        if (index !== -1) {
            appointments[index] = {
                ...appointments[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem('appointments', JSON.stringify(appointments));
            return appointments[index];
        }
        throw new Error('Appointment not found');
    }

    async deleteAppointment(appointmentId) {
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const filtered = appointments.filter(apt => apt.id !== appointmentId);
        localStorage.setItem('appointments', JSON.stringify(filtered));
        return true;
    }

    // Teachers CRUD operations
    async getTeachers() {
        return JSON.parse(localStorage.getItem('teachers') || '[]');
    }

    async getTeacher(teacherId) {
        const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
        return teachers.find(teacher => teacher.id === teacherId);
    }

    async updateTeacher(teacherId, updates) {
        const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
        const index = teachers.findIndex(teacher => teacher.id === teacherId);
        
        if (index !== -1) {
            teachers[index] = { ...teachers[index], ...updates };
            localStorage.setItem('teachers', JSON.stringify(teachers));
            return teachers[index];
        }
        throw new Error('Teacher not found');
    }

    // Students CRUD operations
    async getStudents() {
        return JSON.parse(localStorage.getItem('students') || '[]');
    }

    async getStudent(studentId) {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        return students.find(student => student.id === studentId);
    }

    async updateStudent(studentId, updates) {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const index = students.findIndex(student => student.id === studentId);
        
        if (index !== -1) {
            students[index] = { ...students[index], ...updates };
            localStorage.setItem('students', JSON.stringify(students));
            return students[index];
        }
        throw new Error('Student not found');
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatTimestamp(dateString) {
        return new Date(dateString);
    }

    // Real-time listeners simulation (simplified)
    onSnapshot(collection, callback) {
        // For simplicity, we'll just call the callback immediately with current data
        // In a real implementation, you might use localStorage events or polling
        if (collection === 'appointments') {
            callback(this.getAppointments());
        }
        
        // Return a mock unsubscribe function
        return () => {};
    }

    // Statistics and analytics
    async getAppointmentStats(userId, userType) {
        const appointments = await this.getAppointments(
            userType === 'student' ? { studentId: userId } : { teacherId: userId }
        );

        const stats = {
            total: appointments.length,
            approved: appointments.filter(apt => apt.status === 'approved').length,
            pending: appointments.filter(apt => apt.status === 'pending').length,
            upcoming: appointments.filter(apt => 
                apt.status === 'approved' && new Date(apt.date) > new Date()
            ).length
        };

        return stats;
    }

    // Conversations CRUD operations
    getConversations(userId) {
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        return conversations.filter(conv => 
            conv.studentId === userId || conv.teacherId === userId
        );
    }

    saveConversation(conversation) {
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        conversations.push(conversation);
        localStorage.setItem('conversations', JSON.stringify(conversations));
        return conversation;
    }

    updateConversation(updatedConversation) {
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const index = conversations.findIndex(conv => conv.id === updatedConversation.id);
        if (index !== -1) {
            conversations[index] = updatedConversation;
            localStorage.setItem('conversations', JSON.stringify(conversations));
        }
        return updatedConversation;
    }

    deleteConversation(conversationId) {
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const filtered = conversations.filter(conv => conv.id !== conversationId);
        localStorage.setItem('conversations', JSON.stringify(filtered));
        
        // Also delete associated messages
        const messages = JSON.parse(localStorage.getItem('messages') || '[]');
        const filteredMessages = messages.filter(msg => msg.conversationId !== conversationId);
        localStorage.setItem('messages', JSON.stringify(filteredMessages));
    }

    // Messages CRUD operations
    getMessages(conversationId) {
        const messages = JSON.parse(localStorage.getItem('messages') || '[]');
        return messages.filter(msg => msg.conversationId === conversationId);
    }

    saveMessage(message) {
        const messages = JSON.parse(localStorage.getItem('messages') || '[]');
        messages.push(message);
        localStorage.setItem('messages', JSON.stringify(messages));
        return message;
    }

    updateMessage(updatedMessage) {
        const messages = JSON.parse(localStorage.getItem('messages') || '[]');
        const index = messages.findIndex(msg => msg.id === updatedMessage.id);
        if (index !== -1) {
            messages[index] = updatedMessage;
            localStorage.setItem('messages', JSON.stringify(messages));
        }
        return updatedMessage;
    }

    deleteMessage(messageId) {
        const messages = JSON.parse(localStorage.getItem('messages') || '[]');
        const filtered = messages.filter(msg => msg.id !== messageId);
        localStorage.setItem('messages', JSON.stringify(filtered));
    }
}

// Create global instance
window.LocalDataManager = LocalDataManager;
window.localDataManager = new LocalDataManager();
