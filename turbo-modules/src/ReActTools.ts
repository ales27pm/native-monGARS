import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface ReActToolsSpec extends TurboModule {
  // Calendar operations
  createCalendarEvent(params: object): Promise<object>;
  getCalendarEvents(params: object): Promise<object[]>;
  
  // Contact operations
  searchContacts(params: object): Promise<object[]>;
  createContact(params: object): Promise<object>;
  
  // File operations
  listFiles(params: object): Promise<object[]>;
  readFile(params: object): Promise<object>;
  writeFile(params: object): Promise<object>;
  searchFiles(params: object): Promise<object[]>;
}

export default TurboModuleRegistry.getEnforcing<ReActToolsSpec>('ReActToolsModule');