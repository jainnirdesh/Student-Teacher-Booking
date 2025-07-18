# Student-Teacher Booking System

A modern web-based appointment booking system that allows students and teachers to seamlessly schedule meetings and consultations. Built with vanilla JavaScript and localStorage for a simple, dependency-free authentication system.

## ✨ Features

### 🔐 Authentication
- **Local Storage Authentication**: Simple, secure login system using localStorage
- **Session Management**: Automatic session handling with persistent login
- **User Profiles**: Comprehensive user profile management
- **Role-Based Access**: Different access levels for students, teachers, and admins

### 📅 Booking System
- **Real-time Availability**: Check teacher availability instantly
- **Flexible Scheduling**: Multiple time slots and duration options
- **Booking Management**: Easy booking creation, modification, and cancellation
- **Conflict Prevention**: Automatic detection of scheduling conflicts

### 👥 User Management
- **Student Dashboard**: Personal booking history and profile management
- **Teacher Dashboard**: Availability management and booking oversight
- **Admin Panel**: Complete system administration and user management

### 🎨 User Interface
- **Responsive Design**: Mobile-first approach with Bootstrap integration
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Dark/Light Mode**: Theme switching for user preference
- **Accessibility**: WCAG compliant design for all users

### 🚀 Technical Features
- **Vanilla JavaScript**: No framework dependencies
- **localStorage**: Client-side data persistence
- **Modular Architecture**: Clean, maintainable code structure
- **Error Handling**: Comprehensive error management and logging
- **Testing**: Full test coverage with Jest

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Bootstrap 5, Custom CSS
- **Authentication**: localStorage-based authentication
- **Testing**: Jest, Node.js
- **Development**: VS Code, Git, GitHub

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14.0 or higher)
- npm (version 6.0 or higher)
- A modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/student-teacher-booking.git
   cd student-teacher-booking
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📖 Usage Guide

### For Students

1. **Login** to your student account
2. **Browse available teachers** and their schedules
3. **Book appointments** by selecting date and time
4. **Manage your bookings** from the dashboard
5. **View booking history** and upcoming appointments

### For Teachers

1. **Login** to your teacher account
2. **Set your availability** using the schedule manager
3. **View incoming bookings** and appointment requests
4. **Manage your schedule** and update availability
5. **Track student interactions** and booking patterns

### For Administrators

1. **Login** to your admin account
2. **Manage all users** (students and teachers)
3. **View system analytics** and booking statistics
4. **Handle disputes** and system maintenance
5. **Export data** and generate reports

## 🔧 Configuration

### Authentication Settings

The authentication system uses localStorage for simplicity. Key configuration options:

```javascript
// Session timeout (in milliseconds)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

// Password minimum length
const MIN_PASSWORD_LENGTH = 8;

// Maximum login attempts
const MAX_LOGIN_ATTEMPTS = 5;
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

## 🔐 Security Features

- **Data Encryption**: All sensitive data is encrypted
- **Session Security**: Secure session management
- **Input Validation**: Comprehensive input sanitization
- **Error Handling**: Secure error reporting

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

- **Documentation**: Check this README and inline comments
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join our GitHub Discussions

### Common Issues

1. **Login Problems**: Clear localStorage and refresh the page
2. **Booking Conflicts**: Check for existing appointments
3. **Performance Issues**: Clear browser cache
4. **Mobile Issues**: Ensure latest browser version

---

**Made with ❤️ by the Student-Teacher Booking System Team**

For questions or support, please contact us or create an issue on GitHub.
