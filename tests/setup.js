// Test setup file
import 'jsdom-global/register';

// Mock Firebase
global.firebase = {
  initializeApp: jest.fn(),
  auth: jest.fn(() => ({
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn()
  })),
  firestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
    setDoc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn()
  }))
};

// Mock Bootstrap
global.bootstrap = {
  Modal: jest.fn(() => ({
    show: jest.fn(),
    hide: jest.fn()
  }))
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.sessionStorage = sessionStorageMock;
