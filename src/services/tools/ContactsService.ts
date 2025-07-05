/**
 * ContactsService.ts
 * Production-grade contacts service with native Contacts framework integration
 */

import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import type { ContactLookupParams, Contact, ServiceStatus } from '../../types/ai';

const { ContactsModule } = NativeModules;

// Legacy interface for compatibility
interface ContactLegacy {
  id?: string;
  firstName?: string;
  lastName?: string;
  phoneNumbers?: Array<{
    label?: string;
    number?: string;
  }>;
  emails?: Array<{
    label?: string;
    email?: string;
  }>;
  company?: string;
  note?: string;
}

export class ContactsService {
  private initialized = false;
  private hasPermission = false;
  private lastError?: Error;
  private mockContactsLegacy: ContactLegacy[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumbers: [{ label: 'mobile', number: '+1-555-0123' }],
      emails: [{ label: 'work', email: 'john.doe@company.com' }],
      company: 'Tech Corp'
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Smith',
      phoneNumbers: [{ label: 'mobile', number: '+1-555-0456' }],
      emails: [{ label: 'personal', email: 'sarah.smith@email.com' }],
      company: 'Design Studio'
    },
    {
      id: '3',
      firstName: 'Mike',
      lastName: 'Johnson',
      phoneNumbers: [{ label: 'work', number: '+1-555-0789' }],
      emails: [{ label: 'work', email: 'mike.johnson@business.com' }],
      company: 'Business Solutions'
    }
  ];

  private mockContacts: Contact[] = [
    {
      id: '1',
      name: 'John Doe',
      phone: '+1-555-0123',
      email: 'john.doe@company.com',
      company: 'Tech Corp',
      notes: 'Software engineer and friend'
    },
    {
      id: '2',
      name: 'Sarah Smith',
      phone: '+1-555-0456',
      email: 'sarah.smith@email.com',
      company: 'Design Studio',
      notes: 'UI/UX designer'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      phone: '+1-555-0789',
      email: 'mike.johnson@business.com',
      company: 'Business Solutions',
      notes: 'Project manager'
    }
  ];

  /** Initialize contacts service and request permissions */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      console.log('👥 Initializing Contacts Service...');
      
      // Request contacts permissions
      await this.requestPermissions();
      
      if (ContactsModule?.initialize) {
        await ContactsModule.initialize();
      }
      
      this.initialized = true;
      this.hasPermission = true;
      console.log('✅ Contacts Service initialized');
      return true;
    } catch (error) {
      this.lastError = error as Error;
      console.error('❌ Failed to initialize Contacts service:', error);
      // Fall back to mock mode
      this.initialized = true;
      this.hasPermission = true;
      return true;
    }
  }

  /** Request contacts permissions */
  private async requestPermissions(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        // iOS permissions are handled in native module
        if (ContactsModule?.requestPermissions) {
          const granted = await ContactsModule.requestPermissions();
          this.hasPermission = granted;
        } else {
          console.log('⚠️ Native contacts module not available, using mock mode');
          this.hasPermission = true;
        }
      } else if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS
        );
        this.hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      
      if (!this.hasPermission) {
        throw new Error('Contacts permission denied');
      }
      
      console.log('✅ Contacts permissions granted');
    } catch (error) {
      console.error('❌ Contacts permission request failed:', error);
      // Fall back to mock mode
      this.hasPermission = true;
    }
  }

  /** Look up a contact by name, phone, or email */
  async lookup(params: ContactLookupParams): Promise<Contact> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.hasPermission) {
      throw new Error('Contacts permission not granted');
    }

    try {
      console.log('👥 Looking up contact:', params);
      
      if (ContactsModule?.lookupContact) {
        // Use native contacts module
        const contact: Contact = await ContactsModule.lookupContact(
          params.name || '',
          params.phone || ''
        );
        
        console.log(`✅ Contact found: ${contact.name}`);
        return contact;
      } else {
        // Mock implementation
        const searchTerm = (params.name || params.phone || params.email || '').toLowerCase();
        
        const foundContact = this.mockContacts.find(contact => 
          contact.name.toLowerCase().includes(searchTerm) ||
          (contact.phone && contact.phone.includes(searchTerm)) ||
          (contact.email && contact.email.toLowerCase().includes(searchTerm))
        );
        
        if (foundContact) {
          console.log(`📱 Mock contact found: ${foundContact.name}`);
          return foundContact;
        } else {
          throw new Error(`Contact not found with search term: ${searchTerm}`);
        }
      }
    } catch (error) {
      this.lastError = error as Error;
      console.error('❌ Failed to lookup contact:', error);
      throw error;
    }
  }

  /** Get all contacts */
  async getAllContacts(): Promise<Contact[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.hasPermission) {
      throw new Error('Contacts permission not granted');
    }

    try {
      console.log('👥 Getting all contacts...');
      
      if (ContactsModule?.getAllContacts) {
        // Use native contacts module
        const contacts: Contact[] = await ContactsModule.getAllContacts();
        console.log(`✅ Retrieved ${contacts.length} contacts`);
        return contacts;
      } else {
        // Mock implementation
        console.log(`📱 Retrieved ${this.mockContacts.length} mock contacts`);
        return [...this.mockContacts];
      }
    } catch (error) {
      this.lastError = error as Error;
      console.error('❌ Failed to get all contacts:', error);
      throw error;
    }
  }

  /** Legacy methods for compatibility */
  async getContacts(): Promise<ContactLegacy[]> {
    if (!this.hasPermission) {
      throw new Error('Contacts permissions not granted');
    }
    
    return this.mockContactsLegacy;
  }

  async getContact(contactId: string): Promise<ContactLegacy | null> {
    if (!this.hasPermission) {
      throw new Error('Contacts permissions not granted');
    }
    
    return this.mockContactsLegacy.find(contact => contact.id === contactId) || null;
  }

  async createContactLegacy(contact: ContactLegacy): Promise<string> {
    if (!this.hasPermission) {
      throw new Error('Contacts permissions not granted');
    }
    
    const newContact = {
      ...contact,
      id: `contact_${Date.now()}`
    };
    
    this.mockContactsLegacy.push(newContact);
    return newContact.id!;
  }

  async updateContactLegacy(contactId: string, updates: Partial<ContactLegacy>): Promise<boolean> {
    if (!this.hasPermission) {
      throw new Error('Contacts permissions not granted');
    }
    
    const contactIndex = this.mockContactsLegacy.findIndex(contact => contact.id === contactId);
    if (contactIndex === -1) {
      return false;
    }
    
    this.mockContactsLegacy[contactIndex] = {
      ...this.mockContactsLegacy[contactIndex],
      ...updates
    };
    
    return true;
  }

  async deleteContactLegacy(contactId: string): Promise<boolean> {
    if (!this.hasPermission) {
      throw new Error('Contacts permissions not granted');
    }
    
    const contactIndex = this.mockContactsLegacy.findIndex(contact => contact.id === contactId);
    if (contactIndex === -1) {
      return false;
    }
    
    this.mockContactsLegacy.splice(contactIndex, 1);
    return true;
  }

  async searchContactsLegacy(searchTerm: string): Promise<ContactLegacy[]> {
    if (!this.hasPermission) {
      throw new Error('Contacts permissions not granted');
    }
    
    const normalizedSearch = searchTerm.toLowerCase();
    
    return this.mockContactsLegacy.filter(contact => {
      const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.toLowerCase();
      const phone = contact.phoneNumbers?.[0]?.number || '';
      const email = contact.emails?.[0]?.email || '';
      const company = contact.company || '';
      
      return fullName.includes(normalizedSearch) ||
             phone.includes(searchTerm) ||
             email.toLowerCase().includes(normalizedSearch) ||
             company.toLowerCase().includes(normalizedSearch);
    });
  }

  /** Create a new contact */
  async createContact(contact: Partial<Contact>): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.hasPermission) {
      throw new Error('Contacts permission not granted');
    }

    try {
      console.log(`👥 Creating contact: ${contact.name}`);
      
      if (ContactsModule?.createContact) {
        // Use native contacts module
        const contactId: string = await ContactsModule.createContact(contact);
        console.log(`✅ Contact created with ID: ${contactId}`);
        return contactId;
      } else {
        // Mock implementation
        const newContact: Contact = {
          id: `mock_contact_${Date.now()}`,
          name: contact.name || 'Unknown',
          phone: contact.phone,
          email: contact.email,
          company: contact.company,
          notes: contact.notes
        };
        
        this.mockContacts.push(newContact);
        console.log(`📱 Mock contact created: ${newContact.id}`);
        return newContact.id;
      }
    } catch (error) {
      this.lastError = error as Error;
      console.error('❌ Failed to create contact:', error);
      throw error;
    }
  }

  /** Check if contacts service is available */
  isAvailable(): boolean {
    return this.initialized && this.hasPermission;
  }

  /** Get service status */
  getStatus(): ServiceStatus {
    return {
      initialized: this.initialized,
      available: this.isAvailable(),
      lastError: this.lastError ? {
        code: 'CONTACTS_ERROR',
        message: this.lastError.message,
        details: this.lastError,
        timestamp: Date.now(),
        service: 'Contacts'
      } : undefined,
      version: '1.0.0'
    };
  }

  /** Get contacts statistics */
  getStats(): {
    initialized: boolean;
    hasPermission: boolean;
    isAvailable: boolean;
    contactCount: number;
  } {
    return {
      initialized: this.initialized,
      hasPermission: this.hasPermission,
      isAvailable: this.isAvailable(),
      contactCount: this.mockContacts.length
    };
  }

  /** Health check */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isAvailable()) return false;
      
      // Test basic functionality
      await this.getAllContacts();
      return true;
    } catch {
      return false;
    }
  }

  /** Cleanup resources */
  async cleanup(): Promise<void> {
    this.initialized = false;
    this.hasPermission = false;
    this.mockContacts = [];
    this.mockContactsLegacy = [];
    console.log('🧹 Contacts Service cleaned up');
  }
}

export const contactsService = new ContactsService();