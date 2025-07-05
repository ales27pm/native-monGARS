import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface ReActToolsSpec extends TurboModule {
  // Calendar Integration
  createCalendarEvent(params: {
    title: string;
    startDate: string;
    endDate: string;
    location?: string;
    notes?: string;
    allDay?: boolean;
    reminder?: number; // minutes before
  }): Promise<{
    success: boolean;
    eventId?: string;
    error?: string;
  }>;
  
  updateCalendarEvent(eventId: string, params: {
    title?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    notes?: string;
    allDay?: boolean;
    reminder?: number;
  }): Promise<{
    success: boolean;
    error?: string;
  }>;
  
  deleteCalendarEvent(eventId: string): Promise<{
    success: boolean;
    error?: string;
  }>;
  
  searchCalendarEvents(params: {
    startDate?: string;
    endDate?: string;
    query?: string;
    limit?: number;
  }): Promise<Array<{
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    location?: string;
    notes?: string;
    allDay: boolean;
  }>>;
  
  // Contacts Integration
  searchContacts(params: {
    name?: string;
    email?: string;
    phone?: string;
    limit?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    organization?: string;
  }>>;
  
  createContact(params: {
    name: string;
    email?: string;
    phone?: string;
    organization?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    contactId?: string;
    error?: string;
  }>;
  
  updateContact(contactId: string, params: {
    name?: string;
    email?: string;
    phone?: string;
    organization?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    error?: string;
  }>;
  
  deleteContact(contactId: string): Promise<{
    success: boolean;
    error?: string;
  }>;
  
  // File System Operations
  listFiles(params: {
    path?: string;
    recursive?: boolean;
    filter?: string; // file extension filter
    limit?: number;
  }): Promise<Array<{
    name: string;
    path: string;
    type: 'file' | 'directory';
    size: number;
    modifiedDate: string;
    createdDate: string;
  }>>;
  
  readFile(path: string, encoding?: string): Promise<{
    success: boolean;
    content?: string;
    error?: string;
  }>;
  
  writeFile(path: string, content: string, encoding?: string): Promise<{
    success: boolean;
    error?: string;
  }>;
  
  deleteFile(path: string): Promise<{
    success: boolean;
    error?: string;
  }>;
  
  createDirectory(path: string): Promise<{
    success: boolean;
    error?: string;
  }>;
  
  getFileInfo(path: string): Promise<{
    exists: boolean;
    name?: string;
    path?: string;
    type?: 'file' | 'directory';
    size?: number;
    modifiedDate?: string;
    createdDate?: string;
  }>;
  
  // Web Browser Integration
  openURL(url: string): Promise<{
    success: boolean;
    error?: string;
  }>;
  
  searchWeb(query: string, limit?: number): Promise<Array<{
    title: string;
    url: string;
    snippet: string;
    domain: string;
  }>>;
  
  // System Information
  getSystemInfo(): Promise<{
    platform: string;
    version: string;
    deviceModel: string;
    availableMemory: number;
    totalMemory: number;
    batteryLevel: number;
    isCharging: boolean;
    networkType: string;
    timeZone: string;
  }>;
  
  // Notification Management
  scheduleNotification(params: {
    title: string;
    body: string;
    date: string;
    identifier?: string;
    sound?: string;
    badge?: number;
  }): Promise<{
    success: boolean;
    notificationId?: string;
    error?: string;
  }>;
  
  cancelNotification(notificationId: string): Promise<{
    success: boolean;
    error?: string;
  }>;
  
  getPendingNotifications(): Promise<Array<{
    id: string;
    title: string;
    body: string;
    date: string;
    sound?: string;
    badge?: number;
  }>>;
  
  // Location Services
  getCurrentLocation(): Promise<{
    success: boolean;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    error?: string;
  }>;
  
  getLocationFromAddress(address: string): Promise<{
    success: boolean;
    latitude?: number;
    longitude?: number;
    formattedAddress?: string;
    error?: string;
  }>;
  
  getAddressFromLocation(latitude: number, longitude: number): Promise<{
    success: boolean;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    error?: string;
  }>;
  
  // Camera and Photos
  takePhoto(options?: {
    quality?: number;
    allowsEditing?: boolean;
    saveToGallery?: boolean;
  }): Promise<{
    success: boolean;
    uri?: string;
    width?: number;
    height?: number;
    error?: string;
  }>;
  
  pickFromGallery(options?: {
    mediaType?: 'photo' | 'video' | 'mixed';
    quality?: number;
    allowsEditing?: boolean;
    allowsMultipleSelection?: boolean;
  }): Promise<{
    success: boolean;
    assets?: Array<{
      uri: string;
      type: string;
      width: number;
      height: number;
      fileName?: string;
    }>;
    error?: string;
  }>;
  
  // Tool Registration and Management
  registerTool(toolName: string, toolFunction: string): Promise<{
    success: boolean;
    toolId?: string;
    error?: string;
  }>;
  
  unregisterTool(toolId: string): Promise<{
    success: boolean;
    error?: string;
  }>;
  
  getRegisteredTools(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    enabled: boolean;
  }>>;
  
  executeTool(toolId: string, params: Record<string, any>): Promise<{
    success: boolean;
    result?: any;
    error?: string;
  }>;
}

export default TurboModuleRegistry.getEnforcing<ReActToolsSpec>('ReActToolsModule');