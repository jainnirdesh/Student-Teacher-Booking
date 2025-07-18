// Test setup file
// DOM environment is handled by jest-environment-jsdom

// Mock Firebase
global.firebase = {
  initializeApp: jest.fn(),
  auth: jest.fn(() => ({
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    currentUser: null
  })),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      })),
      add: jest.fn(),
      where: jest.fn(),
      orderBy: jest.fn(),
      onSnapshot: jest.fn()
    })),
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
    hide: jest.fn(),
    dispose: jest.fn()
  })),
  Toast: jest.fn(() => ({
    show: jest.fn(),
    hide: jest.fn(),
    dispose: jest.fn()
  }))
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
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

// Mock Date.now for consistent testing
const mockDateNow = jest.fn(() => new Date('2024-01-15T10:00:00Z').getTime());
global.Date.now = mockDateNow;

// Mock URL constructor
global.URL = jest.fn().mockImplementation((url) => ({
  href: url,
  pathname: '/',
  search: '',
  searchParams: {
    get: jest.fn(),
    set: jest.fn(),
    append: jest.fn(),
    delete: jest.fn(),
    forEach: jest.fn()
  }
}));

// Mock btoa and atob for base64 encoding/decoding
global.btoa = jest.fn((str) => Buffer.from(str).toString('base64'));
global.atob = jest.fn((str) => Buffer.from(str, 'base64').toString());

// Mock DOM methods
document.getElementById = jest.fn().mockReturnValue({
  value: '',
  textContent: '',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  click: jest.fn(),
  focus: jest.fn(),
  blur: jest.fn()
});

document.querySelector = jest.fn().mockReturnValue({
  value: '',
  textContent: '',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  click: jest.fn(),
  focus: jest.fn(),
  blur: jest.fn()
});

document.querySelectorAll = jest.fn().mockReturnValue([]);

// Mock window.location
delete window.location;
window.location = {
  href: '',
  pathname: '',
  search: '',
  hash: '',
  assign: jest.fn(),
  reload: jest.fn(),
  replace: jest.fn()
};

// Setup cleanup before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset localStorage and sessionStorage mocks
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // Reset console mocks
  console.log.mockClear();
  console.warn.mockClear();
  console.error.mockClear();
  
  // Reset Date.now mock
  mockDateNow.mockClear();
});
