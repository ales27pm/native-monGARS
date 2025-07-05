import * as Contacts from 'expo-contacts';

export interface ContactInfo {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phoneNumbers: Array<{
    number: string;
    label: string;
    id: string;
  }>;
  emails: Array<{
    email: string;
    label: string;
    id: string;
  }>;
  addresses: Array<{
    street?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    label: string;
    id: string;
  }>;
  company?: string;
  jobTitle?: string;
  imageAvailable?: boolean;
}

export class ContactsService {
  private static instance: ContactsService;
  private permissionGranted = false;

  static getInstance(): ContactsService {
    if (!ContactsService.instance) {
      ContactsService.instance = new ContactsService();
    }
    return ContactsService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      this.permissionGranted = status === 'granted';
      return this.permissionGranted;
    } catch (error) {
      console.error('Contacts permission error:', error);
      return false;
    }
  }

  async getAllContacts(): Promise<ContactInfo[]> {
    if (!this.permissionGranted) {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Contacts permissions not granted');
      }
    }

    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Addresses,
          Contacts.Fields.Company,
          Contacts.Fields.JobTitle,
          Contacts.Fields.ImageAvailable,
        ],
        sort: Contacts.SortTypes.FirstName,
      });

      return data.map(contact => ({
        id: contact.id,
        name: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
        firstName: contact.firstName,
        lastName: contact.lastName,
        phoneNumbers: contact.phoneNumbers?.map(phone => ({
          number: phone.number || '',
          label: phone.label || 'other',
          id: phone.id || Math.random().toString(),
        })) || [],
        emails: contact.emails?.map(email => ({
          email: email.email || '',
          label: email.label || 'other',
          id: email.id || Math.random().toString(),
        })) || [],
        addresses: contact.addresses?.map(address => ({
          street: address.street,
          city: address.city,
          region: address.region,
          postalCode: address.postalCode,
          country: address.country,
          label: address.label || 'other',
          id: address.id || Math.random().toString(),
        })) || [],
        company: contact.company,
        jobTitle: contact.jobTitle,
        imageAvailable: contact.imageAvailable,
      }));
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }

  async searchContacts(query: string): Promise<ContactInfo[]> {
    const allContacts = await this.getAllContacts();
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      return allContacts;
    }

    return allContacts.filter(contact => {
      // Search in name
      if (contact.name.toLowerCase().includes(normalizedQuery)) {
        return true;
      }

      // Search in phone numbers
      const phoneMatch = contact.phoneNumbers.some(phone => 
        phone.number.replace(/\D/g, '').includes(normalizedQuery.replace(/\D/g, ''))
      );
      if (phoneMatch) {
        return true;
      }

      // Search in emails
      const emailMatch = contact.emails.some(email => 
        email.email.toLowerCase().includes(normalizedQuery)
      );
      if (emailMatch) {
        return true;
      }

      // Search in company
      if (contact.company?.toLowerCase().includes(normalizedQuery)) {
        return true;
      }

      // Search in job title
      if (contact.jobTitle?.toLowerCase().includes(normalizedQuery)) {
        return true;
      }

      return false;
    });
  }

  async getContactById(contactId: string): Promise<ContactInfo | null> {
    if (!this.permissionGranted) {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Contacts permissions not granted');
      }
    }

    try {
      const contact = await Contacts.getContactByIdAsync(contactId, {
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Addresses,
          Contacts.Fields.Company,
          Contacts.Fields.JobTitle,
          Contacts.Fields.ImageAvailable,
        ],
      });

      if (!contact) {
        return null;
      }

      return {
        id: contact.id,
        name: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
        firstName: contact.firstName,
        lastName: contact.lastName,
        phoneNumbers: contact.phoneNumbers?.map(phone => ({
          number: phone.number || '',
          label: phone.label || 'other',
          id: phone.id || Math.random().toString(),
        })) || [],
        emails: contact.emails?.map(email => ({
          email: email.email || '',
          label: email.label || 'other',
          id: email.id || Math.random().toString(),
        })) || [],
        addresses: contact.addresses?.map(address => ({
          street: address.street,
          city: address.city,
          region: address.region,
          postalCode: address.postalCode,
          country: address.country,
          label: address.label || 'other',
          id: address.id || Math.random().toString(),
        })) || [],
        company: contact.company,
        jobTitle: contact.jobTitle,
        imageAvailable: contact.imageAvailable,
      };
    } catch (error) {
      console.error('Error fetching contact:', error);
      throw error;
    }
  }

  async createContact(contactData: Omit<ContactInfo, 'id'>): Promise<string> {
    if (!this.permissionGranted) {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Contacts permissions not granted');
      }
    }

    try {
      const contactId = await Contacts.addContactAsync({
        name: contactData.name,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        phoneNumbers: contactData.phoneNumbers.map(phone => ({
          number: phone.number,
          label: phone.label,
        })),
        emails: contactData.emails.map(email => ({
          email: email.email,
          label: email.label,
        })),
        addresses: contactData.addresses.map(address => ({
          street: address.street,
          city: address.city,
          region: address.region,
          postalCode: address.postalCode,
          country: address.country,
          label: address.label,
        })),
        company: contactData.company,
        jobTitle: contactData.jobTitle,
      });

      return contactId;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  async updateContact(contactId: string, updates: Partial<ContactInfo>): Promise<void> {
    if (!this.permissionGranted) {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Contacts permissions not granted');
      }
    }

    try {
      await Contacts.updateContactAsync(contactId, updates);
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  async deleteContact(contactId: string): Promise<void> {
    if (!this.permissionGranted) {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Contacts permissions not granted');
      }
    }

    try {
      await Contacts.removeContactAsync(contactId);
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  async getContactsWithPhoneNumbers(): Promise<ContactInfo[]> {
    const allContacts = await this.getAllContacts();
    return allContacts.filter(contact => contact.phoneNumbers.length > 0);
  }

  async getContactsWithEmails(): Promise<ContactInfo[]> {
    const allContacts = await this.getAllContacts();
    return allContacts.filter(contact => contact.emails.length > 0);
  }
}