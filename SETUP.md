# 🚀 Setup Guide for Student-Teacher Booking System

## 📋 Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (v8 or higher) - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)
- **Modern web browser** (Chrome, Firefox, Safari, or Edge)
- **Firebase account** - [Create here](https://firebase.google.com/)

## 🛠️ Installation Steps

### 1. Clone or Download Project
```bash
# If using Git
git clone https://github.com/yourusername/student-teacher-booking-system.git
cd student-teacher-booking-system

# Or download and extract the ZIP file
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Setup

#### 3.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `student-teacher-booking`
4. Enable Google Analytics (optional)
5. Wait for project creation

#### 3.2 Enable Authentication
1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. Click **Save**

#### 3.3 Create Firestore Database
1. Go to **Firestore Database**
2. Click **Create database**
3. Start in **test mode** (we'll set up security rules later)
4. Choose location closest to your users
5. Click **Done**

#### 3.4 Get Firebase Configuration
1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps**
3. Click **Web** icon (`</>`)
4. Register app with name: `EduBook`
5. Copy the configuration object

#### 3.5 Configure Firebase in Project
1. Open `js/firebase-config.js`
2. Replace the placeholder configuration with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
};
```

### 4. Set Up Firestore Security Rules
1. In Firebase Console, go to **Firestore Database** > **Rules**
2. Replace default rules with the content from `firestore.rules`
3. Click **Publish**

### 5. Set Up Firestore Indexes
1. Go to **Firestore Database** > **Indexes**
2. Import the indexes from `firestore.indexes.json`
3. Wait for indexes to build

## 🚀 Running the Application

### Development Server
```bash
# Start the development server
npm run dev

# Application will be available at:
# http://localhost:3000
```

### Production Build
```bash
# Create production build
npm run build

# Start production server
npm start
```

## 👥 Creating Admin User

Since the first admin user cannot be created through the normal registration process, you'll need to manually create one in Firestore:

1. Go to **Firestore Database** in Firebase Console
2. Click **Start collection** > **users**
3. Add document with auto-generated ID
4. Add the following fields:

```javascript
{
  name: "Admin User",
  email: "admin@yourdomain.com",
  role: "admin",
  isApproved: true,
  isActive: true,
  createdAt: "current timestamp"
}
```

5. Save the document
6. Create an authentication account:
   - Go to **Authentication** > **Users**
   - Click **Add user**
   - Enter same email and a password
   - Copy the UID from the created user
   - Go back to Firestore and update the user document ID to match the UID

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### Linting
```bash
# Check code quality
npm run lint

# Fix linting issues automatically
npm run lint -- --fix
```

## 🌐 Deployment

### Firebase Hosting
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase hosting
firebase init hosting

# Deploy to Firebase
npm run deploy
```

### Other Hosting Options

#### Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.`
4. Deploy

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project directory
3. Follow setup prompts

## 🔧 Configuration Options

### Environment Variables
Create a `.env` file in the project root for environment-specific settings:

```env
# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Application Settings
APP_NAME=EduBook
APP_VERSION=1.0.0
LOG_LEVEL=info
```

### System Settings
After deployment, log in as admin and configure:

- **Working Hours**: Set institution operating hours
- **Appointment Duration**: Default meeting length
- **Max Appointments**: Daily limit per teacher
- **Auto-approval**: Enable/disable automatic student approval

## 📱 User Accounts for Testing

### Test Student Account
- **Email**: student@test.com
- **Password**: student123
- **Role**: Student
- **Student ID**: STU001
- **Program**: Computer Science

### Test Teacher Account
- **Email**: teacher@test.com
- **Password**: teacher123
- **Role**: Teacher
- **Department**: Computer Science
- **Subject**: Web Development

> **Note**: These accounts need to be created through the registration process or manually added to Firestore.

## 🔍 Troubleshooting

### Common Issues

#### 1. Firebase Configuration Error
**Error**: "Firebase configuration not found"
**Solution**: 
- Check `js/firebase-config.js` has correct configuration
- Ensure all required Firebase services are enabled

#### 2. Authentication Issues
**Error**: "User registration failed"
**Solution**:
- Verify Email/Password provider is enabled in Firebase Authentication
- Check Firestore security rules allow user creation

#### 3. Permission Denied Errors
**Error**: "Missing or insufficient permissions"
**Solution**:
- Check Firestore security rules
- Ensure user has correct role assignments
- Verify user is authenticated

#### 4. Page Not Loading
**Error**: Server connection issues
**Solution**:
- Check if development server is running on correct port
- Clear browser cache and cookies
- Check browser console for JavaScript errors

#### 5. Database Connection Issues
**Error**: Cannot connect to Firestore
**Solution**:
- Verify Firebase configuration is correct
- Check network connectivity
- Ensure Firestore database is created and accessible

### Debug Mode
Enable debug logging by setting localStorage:
```javascript
localStorage.setItem('logLevel', 'debug');
```

### Check Console Logs
Open browser Developer Tools and check Console tab for error messages and debug information.

## 📞 Support

### Getting Help
1. **Check Documentation**: Review this README and code comments
2. **Browser Console**: Check for error messages
3. **Firebase Console**: Verify configuration and data
4. **Network Tab**: Check API calls and responses

### Reporting Issues
When reporting issues, include:
- Browser and version
- Error messages from console
- Steps to reproduce
- Screenshots if applicable

## 🔄 Updates and Maintenance

### Updating Dependencies
```bash
# Check for updates
npm outdated

# Update all dependencies
npm update

# Update specific package
npm install package-name@latest
```

### Database Maintenance
- Regular backups of Firestore data
- Monitor usage and costs in Firebase Console
- Review and update security rules as needed
- Clean up old activity logs periodically

### Performance Monitoring
- Use Firebase Analytics for user behavior
- Monitor page load times
- Check for JavaScript errors in production
- Review Firebase usage and billing

---

**🎉 Congratulations!** Your Student-Teacher Booking System is now ready to use. Start by creating admin and test accounts, then explore all the features of this comprehensive booking platform.
