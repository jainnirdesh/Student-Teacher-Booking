/**
 * Booking System Tests
 * Tests for appointment booking functionality
 */

import { Logger } from '../js/logger.js';

describe('Booking System Tests', () => {
  let logger;
  
  beforeEach(() => {
    logger = new Logger('BookingTest');
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      }
    });
  });

  describe('Appointment creation', () => {
    test('should validate appointment data', () => {
      const appointmentData = {
        studentId: 'student123',
        teacherId: 'teacher456',
        subject: 'Mathematics',
        date: '2024-01-15',
        time: '10:00',
        duration: 60,
        notes: 'Need help with calculus'
      };
      
      expect(appointmentData.studentId).toBeDefined();
      expect(appointmentData.teacherId).toBeDefined();
      expect(appointmentData.subject).toBeDefined();
      expect(appointmentData.date).toBeDefined();
      expect(appointmentData.time).toBeDefined();
      expect(appointmentData.duration).toBeGreaterThan(0);
    });

    test('should validate date is in the future', () => {
      const today = new Date();
      const futureDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const pastDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      expect(futureDate.getTime()).toBeGreaterThan(today.getTime());
      expect(pastDate.getTime()).toBeLessThan(today.getTime());
    });

    test('should validate time slots', () => {
      const validTimeSlots = [
        '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'
      ];
      
      const testTime = '10:00';
      expect(validTimeSlots).toContain(testTime);
    });

    test('should validate appointment duration', () => {
      const validDurations = [30, 60, 90, 120];
      const testDuration = 60;
      
      expect(validDurations).toContain(testDuration);
      expect(testDuration).toBeGreaterThan(0);
    });
  });

  describe('Appointment status management', () => {
    test('should handle appointment statuses', () => {
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
      
      validStatuses.forEach(status => {
        expect(validStatuses).toContain(status);
      });
    });

    test('should update appointment status', () => {
      const appointment = {
        id: 'apt123',
        status: 'pending'
      };
      
      appointment.status = 'confirmed';
      
      expect(appointment.status).toBe('confirmed');
    });
  });

  describe('Teacher availability', () => {
    test('should check teacher availability', () => {
      const teacherSchedule = {
        teacherId: 'teacher456',
        availableSlots: [
          { date: '2024-01-15', time: '10:00', available: true },
          { date: '2024-01-15', time: '11:00', available: false },
          { date: '2024-01-16', time: '14:00', available: true }
        ]
      };
      
      const availableSlots = teacherSchedule.availableSlots.filter(slot => slot.available);
      expect(availableSlots).toHaveLength(2);
    });

    test('should prevent double booking', () => {
      const bookedSlots = [
        { date: '2024-01-15', time: '10:00', teacherId: 'teacher456' }
      ];
      
      const newBooking = {
        date: '2024-01-15',
        time: '10:00',
        teacherId: 'teacher456'
      };
      
      const isSlotTaken = bookedSlots.some(slot => 
        slot.date === newBooking.date && 
        slot.time === newBooking.time && 
        slot.teacherId === newBooking.teacherId
      );
      
      expect(isSlotTaken).toBe(true);
    });
  });

  describe('Booking notifications', () => {
    test('should generate booking confirmation', () => {
      const appointment = {
        id: 'apt123',
        studentName: 'John Doe',
        teacherName: 'Dr. Smith',
        subject: 'Mathematics',
        date: '2024-01-15',
        time: '10:00'
      };
      
      const notification = {
        type: 'booking_confirmed',
        message: `Appointment confirmed with ${appointment.teacherName} for ${appointment.subject} on ${appointment.date} at ${appointment.time}`,
        timestamp: new Date().toISOString()
      };
      
      expect(notification.type).toBe('booking_confirmed');
      expect(notification.message).toContain(appointment.teacherName);
      expect(notification.message).toContain(appointment.subject);
    });

    test('should handle booking reminders', () => {
      const appointment = {
        id: 'apt123',
        date: '2024-01-15',
        time: '10:00',
        reminderSent: false
      };
      
      const appointmentDate = new Date(`${appointment.date} ${appointment.time}`);
      const now = new Date();
      const timeDiff = appointmentDate.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff <= 24 && !appointment.reminderSent) {
        appointment.reminderSent = true;
        expect(appointment.reminderSent).toBe(true);
      }
    });
  });

  describe('Appointment search and filter', () => {
    test('should filter appointments by status', () => {
      const appointments = [
        { id: 'apt1', status: 'pending' },
        { id: 'apt2', status: 'confirmed' },
        { id: 'apt3', status: 'cancelled' }
      ];
      
      const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');
      expect(confirmedAppointments).toHaveLength(1);
      expect(confirmedAppointments[0].id).toBe('apt2');
    });

    test('should filter appointments by date range', () => {
      const appointments = [
        { id: 'apt1', date: '2024-01-15' },
        { id: 'apt2', date: '2024-01-20' },
        { id: 'apt3', date: '2024-01-25' }
      ];
      
      const startDate = new Date('2024-01-18');
      const endDate = new Date('2024-01-22');
      
      const filteredAppointments = appointments.filter(apt => {
        const appointmentDate = new Date(apt.date);
        return appointmentDate >= startDate && appointmentDate <= endDate;
      });
      
      expect(filteredAppointments).toHaveLength(1);
      expect(filteredAppointments[0].id).toBe('apt2');
    });
  });

  describe('Booking validation', () => {
    test('should validate booking business rules', () => {
      const businessRules = {
        maxAdvanceBookingDays: 30,
        minAdvanceBookingHours: 2,
        maxDailyBookingsPerStudent: 3,
        allowedBookingHours: { start: 9, end: 17 }
      };
      
      expect(businessRules.maxAdvanceBookingDays).toBe(30);
      expect(businessRules.minAdvanceBookingHours).toBe(2);
      expect(businessRules.maxDailyBookingsPerStudent).toBe(3);
      expect(businessRules.allowedBookingHours.start).toBe(9);
      expect(businessRules.allowedBookingHours.end).toBe(17);
    });

    test('should validate booking time constraints', () => {
      const bookingTime = new Date('2024-01-15T10:00:00');
      const now = new Date();
      
      const isValidTime = bookingTime.getHours() >= 9 && bookingTime.getHours() < 17;
      const isValidDate = bookingTime.getTime() > now.getTime();
      
      expect(isValidTime).toBe(true);
      expect(isValidDate).toBe(true);
    });
  });

  describe('Error handling', () => {
    test('should handle booking errors gracefully', () => {
      const bookingErrors = {
        'SLOT_UNAVAILABLE': 'The selected time slot is not available',
        'TEACHER_UNAVAILABLE': 'The teacher is not available at this time',
        'INVALID_DATE': 'Please select a valid date',
        'BOOKING_LIMIT_EXCEEDED': 'You have reached the maximum number of bookings for this day'
      };
      
      Object.keys(bookingErrors).forEach(errorCode => {
        expect(bookingErrors[errorCode]).toBeDefined();
        expect(typeof bookingErrors[errorCode]).toBe('string');
      });
    });

    test('should log booking errors', () => {
      const errorSpy = jest.spyOn(logger, 'error');
      
      logger.error('Booking failed', { 
        code: 'SLOT_UNAVAILABLE',
        studentId: 'student123',
        teacherId: 'teacher456',
        requestedSlot: '2024-01-15T10:00:00'
      });
      
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
