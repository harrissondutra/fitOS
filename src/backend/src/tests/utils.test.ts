import { validateEmail, validatePhone, formatDate, calculateAge, generateSlug, sanitizeInput, formatCurrency, parseJsonSafely, debounce, throttle } from '../utils/helpers';

describe('Utility Functions', () => {
  // --- Validation Functions ---
  describe('Validation Functions', () => {
    it('validateEmail should return true for valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('validateEmail should return false for invalid emails', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
    });

    it('validatePhone should return true for valid phone numbers', () => {
      expect(validatePhone('+1234567890')).toBe(true);
      expect(validatePhone('(123) 456-7890')).toBe(true);
      expect(validatePhone('123-456-7890')).toBe(true);
    });

    it('validatePhone should return false for invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abc-def-ghij')).toBe(false);
    });
  });

  // --- Formatting Functions ---
  describe('Formatting Functions', () => {
    it('formatDate should format dates correctly', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2023-12-25');
      expect(formatDate(date, 'MM/DD/YYYY')).toBe('12/25/2023');
    });

    it('calculateAge should calculate age correctly', () => {
      const birthDate = new Date('1990-01-01');
      const currentDate = new Date('2023-01-01');
      expect(calculateAge(birthDate, currentDate)).toBe(33);
    });

    it('generateSlug should create URL-friendly slugs', () => {
      expect(generateSlug('Hello World!')).toBe('hello-world');
      expect(generateSlug('Test & Example')).toBe('test-example');
      expect(generateSlug('Special@Characters#')).toBe('specialcharacters');
    });

    it('formatCurrency should format currency correctly', () => {
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
      expect(formatCurrency(999.99, 'EUR')).toBe('€999.99');
    });
  });

  // --- Sanitization Functions ---
  describe('Sanitization Functions', () => {
    it('sanitizeInput should remove dangerous characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('');
      expect(sanitizeInput('Hello & <world>')).toBe('Hello &');
    });

    it('parseJsonSafely should parse valid JSON', () => {
      const result = parseJsonSafely('{"key": "value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('parseJsonSafely should return null for invalid JSON', () => {
      const result = parseJsonSafely('invalid json');
      expect(result).toBeNull();
    });
  });

  // --- Performance Functions ---
  describe('Performance Functions', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('debounce should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('throttle should limit function execution frequency', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  // --- Error Handling ---
  describe('Error Handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
      expect(formatDate(null as any)).toBe('');
      expect(generateSlug(null as any)).toBe('');
    });
  });
});






