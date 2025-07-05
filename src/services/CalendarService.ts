import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  allDay?: boolean;
}

export interface CalendarInfo {
  id: string;
  title: string;
  color: string;
  source: string;
  allowsModifications: boolean;
}

export class CalendarService {
  private static instance: CalendarService;
  private permissionGranted = false;

  static getInstance(): CalendarService {
    if (!CalendarService.instance) {
      CalendarService.instance = new CalendarService();
    }
    return CalendarService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      this.permissionGranted = status === 'granted';
      return this.permissionGranted;
    } catch (error) {
      console.error('Calendar permission error:', error);
      return false;
    }
  }

  async getCalendars(): Promise<CalendarInfo[]> {
    if (!this.permissionGranted) {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Calendar permissions not granted');
      }
    }

    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      return calendars.map(cal => ({
        id: cal.id,
        title: cal.title,
        color: cal.color,
        source: cal.source?.name || 'Unknown',
        allowsModifications: cal.allowsModifications
      }));
    } catch (error) {
      console.error('Error fetching calendars:', error);
      throw error;
    }
  }

  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    if (!this.permissionGranted) {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Calendar permissions not granted');
      }
    }

    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const events = await Calendar.getEventsAsync(
        calendars.map(cal => cal.id),
        startDate,
        endDate
      );

      return events.map(event => ({
        id: event.id,
        title: event.title,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        location: event.location || undefined,
        notes: event.notes,
        allDay: event.allDay
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  async createEvent(event: Omit<CalendarEvent, 'id'>): Promise<string> {
    if (!this.permissionGranted) {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Calendar permissions not granted');
      }
    }

    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => cal.allowsModifications) || calendars[0];
      
      if (!defaultCalendar) {
        throw new Error('No writable calendar found');
      }

      const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        notes: event.notes,
        allDay: event.allDay || false
      });

      return eventId;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<void> {
    if (!this.permissionGranted) {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Calendar permissions not granted');
      }
    }

    try {
      await Calendar.updateEventAsync(eventId, updates);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    if (!this.permissionGranted) {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Calendar permissions not granted');
      }
    }

    try {
      await Calendar.deleteEventAsync(eventId);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  async getTodaysEvents(): Promise<CalendarEvent[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    return this.getEvents(startOfDay, endOfDay);
  }

  async getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return this.getEvents(now, futureDate);
  }
}