/**
 * Utility Functions Tests
 * Tests for utility functions and helper methods
 */

import { Logger } from '../js/logger.js';

describe('Utility Functions Tests', () => {
  let logger;
  
  beforeEach(() => {
    logger = new Logger('UtilityTest');
    jest.clearAllMocks();
  });

  describe('Date and Time Utils', () => {
    test('should format dates correctly', () => {
      const formatDate = (date, format = 'YYYY-MM-DD') => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        switch (format) {
          case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
          case 'DD/MM/YYYY':
            return `${day}/${month}/${year}`;
          case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
          default:
            return `${year}-${month}-${day}`;
        }
      };
      
      const testDate = new Date('2024-01-15');
      
      expect(formatDate(testDate)).toBe('2024-01-15');
      expect(formatDate(testDate, 'DD/MM/YYYY')).toBe('15/01/2024');
      expect(formatDate(testDate, 'MM/DD/YYYY')).toBe('01/15/2024');
    });

    test('should format time correctly', () => {
      const formatTime = (time, format = '24h') => {
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const m = parseInt(minutes);
        
        if (format === '12h') {
          const period = h >= 12 ? 'PM' : 'AM';
          const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
          return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
        }
        
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };
      
      expect(formatTime('09:30')).toBe('09:30');
      expect(formatTime('14:30')).toBe('14:30');
      expect(formatTime('09:30', '12h')).toBe('9:30 AM');
      expect(formatTime('14:30', '12h')).toBe('2:30 PM');
    });

    test('should calculate time differences', () => {
      const getTimeDifference = (start, end) => {
        const startTime = new Date(start);
        const endTime = new Date(end);
        const diff = endTime.getTime() - startTime.getTime();
        
        return {
          milliseconds: diff,
          seconds: Math.floor(diff / 1000),
          minutes: Math.floor(diff / (1000 * 60)),
          hours: Math.floor(diff / (1000 * 60 * 60)),
          days: Math.floor(diff / (1000 * 60 * 60 * 24))
        };
      };
      
      const start = new Date('2024-01-15T10:00:00Z');
      const end = new Date('2024-01-15T12:30:00Z');
      const diff = getTimeDifference(start, end);
      
      expect(diff.minutes).toBe(150);
      expect(diff.hours).toBe(2);
    });

    test('should validate date ranges', () => {
      const isValidDateRange = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return start <= end;
      };
      
      expect(isValidDateRange('2024-01-15', '2024-01-20')).toBe(true);
      expect(isValidDateRange('2024-01-20', '2024-01-15')).toBe(false);
      expect(isValidDateRange('2024-01-15', '2024-01-15')).toBe(true);
    });
  });

  describe('String Utils', () => {
    test('should capitalize strings', () => {
      const capitalize = (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      };
      
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('World');
      expect(capitalize('jOhN')).toBe('John');
    });

    test('should truncate strings', () => {
      const truncate = (str, maxLength, suffix = '...') => {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength) + suffix;
      };
      
      const longText = 'This is a very long text that needs to be truncated';
      
      expect(truncate(longText, 10)).toBe('This is a ...');
      expect(truncate('Short', 10)).toBe('Short');
    });

    test('should generate slugs', () => {
      const generateSlug = (text) => {
        return text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      };
      
      expect(generateSlug('Hello World')).toBe('hello-world');
      expect(generateSlug('Mathematics & Physics')).toBe('mathematics-physics');
      expect(generateSlug('Dr. Smith\'s Class')).toBe('dr-smith-s-class');
    });

    test('should validate email addresses', () => {
      const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };
      
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });
  });

  describe('Array Utils', () => {
    test('should remove duplicates from array', () => {
      const removeDuplicates = (arr) => {
        return [...new Set(arr)];
      };
      
      const arrayWithDuplicates = [1, 2, 2, 3, 3, 3, 4];
      const uniqueArray = removeDuplicates(arrayWithDuplicates);
      
      expect(uniqueArray).toEqual([1, 2, 3, 4]);
    });

    test('should sort array of objects', () => {
      const sortByProperty = (arr, property, ascending = true) => {
        return arr.sort((a, b) => {
          if (ascending) {
            return a[property] > b[property] ? 1 : -1;
          } else {
            return a[property] < b[property] ? 1 : -1;
          }
        });
      };
      
      const users = [
        { name: 'John', age: 25 },
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 20 }
      ];
      
      const sortedByAge = sortByProperty([...users], 'age');
      expect(sortedByAge[0].name).toBe('Bob');
      expect(sortedByAge[2].name).toBe('Alice');
    });

    test('should group array by property', () => {
      const groupBy = (arr, property) => {
        return arr.reduce((groups, item) => {
          const key = item[property];
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(item);
          return groups;
        }, {});
      };
      
      const appointments = [
        { id: 1, status: 'confirmed' },
        { id: 2, status: 'pending' },
        { id: 3, status: 'confirmed' },
        { id: 4, status: 'cancelled' }
      ];
      
      const grouped = groupBy(appointments, 'status');
      
      expect(grouped.confirmed).toHaveLength(2);
      expect(grouped.pending).toHaveLength(1);
      expect(grouped.cancelled).toHaveLength(1);
    });
  });

  describe('Object Utils', () => {
    test('should deep clone objects', () => {
      const deepClone = (obj) => {
        return JSON.parse(JSON.stringify(obj));
      };
      
      const original = {
        name: 'John',
        details: {
          age: 25,
          address: {
            city: 'New York',
            country: 'USA'
          }
        }
      };
      
      const cloned = deepClone(original);
      cloned.details.age = 30;
      
      expect(original.details.age).toBe(25);
      expect(cloned.details.age).toBe(30);
    });

    test('should merge objects', () => {
      const mergeObjects = (target, source) => {
        return { ...target, ...source };
      };
      
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      const merged = mergeObjects(obj1, obj2);
      
      expect(merged).toEqual({ a: 1, b: 3, c: 4 });
    });

    test('should check if object has property', () => {
      const hasProperty = (obj, path) => {
        return path.split('.').reduce((current, key) => {
          return current && current[key] !== undefined;
        }, obj);
      };
      
      const user = {
        name: 'John',
        profile: {
          settings: {
            theme: 'dark'
          }
        }
      };
      
      expect(hasProperty(user, 'name')).toBe(true);
      expect(hasProperty(user, 'profile.settings.theme')).toBe(true);
      expect(hasProperty(user, 'profile.settings.language')).toBe(false);
    });
  });

  describe('Validation Utils', () => {
    test('should validate phone numbers', () => {
      const isValidPhone = (phone) => {
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
      };
      
      expect(isValidPhone('+1234567890')).toBe(true);
      expect(isValidPhone('(123) 456-7890')).toBe(true);
      expect(isValidPhone('123-456-7890')).toBe(true);
      expect(isValidPhone('123')).toBe(false);
    });

    test('should validate required fields', () => {
      const validateRequired = (obj, requiredFields) => {
        const errors = [];
        
        requiredFields.forEach(field => {
          if (!obj[field] || obj[field].toString().trim() === '') {
            errors.push(`${field} is required`);
          }
        });
        
        return {
          isValid: errors.length === 0,
          errors: errors
        };
      };
      
      const user = {
        name: 'John',
        email: 'john@example.com',
        phone: ''
      };
      
      const validation = validateRequired(user, ['name', 'email', 'phone']);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('phone is required');
    });

    test('should validate password strength', () => {
      const validatePassword = (password) => {
        const requirements = {
          minLength: password.length >= 8,
          hasUppercase: /[A-Z]/.test(password),
          hasLowercase: /[a-z]/.test(password),
          hasNumber: /\d/.test(password),
          hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        
        const score = Object.values(requirements).filter(Boolean).length;
        
        return {
          requirements,
          score,
          strength: score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong'
        };
      };
      
      const weakPassword = 'password';
      const strongPassword = 'MyStr0ng!P@ssw0rd';
      
      const weakValidation = validatePassword(weakPassword);
      const strongValidation = validatePassword(strongPassword);
      
      expect(weakValidation.strength).toBe('weak');
      expect(strongValidation.strength).toBe('strong');
    });
  });

  describe('Storage Utils', () => {
    test('should handle localStorage operations', () => {
      const storageUtils = {
        set: (key, value) => {
          localStorage.setItem(key, JSON.stringify(value));
        },
        get: (key) => {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        },
        remove: (key) => {
          localStorage.removeItem(key);
        }
      };
      
      const testData = { name: 'John', age: 25 };
      
      storageUtils.set('user', testData);
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(testData));
      
      storageUtils.get('user');
      expect(localStorage.getItem).toHaveBeenCalledWith('user');
      
      storageUtils.remove('user');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('URL Utils', () => {
    test('should parse URL parameters', () => {
      const parseUrlParams = (url) => {
        const params = {};
        const urlObj = new URL(url);
        
        urlObj.searchParams.forEach((value, key) => {
          params[key] = value;
        });
        
        return params;
      };
      
      const testUrl = 'https://example.com/page?name=John&age=25&active=true';
      const params = parseUrlParams(testUrl);
      
      expect(params.name).toBe('John');
      expect(params.age).toBe('25');
      expect(params.active).toBe('true');
    });

    test('should build URL with parameters', () => {
      const buildUrl = (baseUrl, params) => {
        const url = new URL(baseUrl);
        
        Object.keys(params).forEach(key => {
          url.searchParams.append(key, params[key]);
        });
        
        return url.toString();
      };
      
      const baseUrl = 'https://example.com/api';
      const params = { userId: '123', role: 'student' };
      const url = buildUrl(baseUrl, params);
      
      expect(url).toBe('https://example.com/api?userId=123&role=student');
    });
  });

  describe('Error Handling Utils', () => {
    test('should handle async errors', async () => {
      const asyncWithErrorHandling = async (fn, fallback = null) => {
        try {
          return await fn();
        } catch (error) {
          logger.error('Async operation failed', error);
          return fallback;
        }
      };
      
      const successfulOperation = async () => 'success';
      const failingOperation = async () => { throw new Error('Failed'); };
      
      const result1 = await asyncWithErrorHandling(successfulOperation);
      const result2 = await asyncWithErrorHandling(failingOperation, 'fallback');
      
      expect(result1).toBe('success');
      expect(result2).toBe('fallback');
    });

    test('should retry operations', async () => {
      const retry = async (fn, maxRetries = 3, delay = 1000) => {
        let lastError;
        
        for (let i = 0; i <= maxRetries; i++) {
          try {
            return await fn();
          } catch (error) {
            lastError = error;
            if (i < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        throw lastError;
      };
      
      let attemptCount = 0;
      const unreliableOperation = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };
      
      const result = await retry(unreliableOperation, 3, 100);
      
      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });
  });
});
