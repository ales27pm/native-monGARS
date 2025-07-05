# Settings Architecture Improvement

## Overview

The Settings screen has been refactored to use centralized state management through the `appStore`, replacing local `useState` hooks with persistent, app-wide settings. This ensures user preferences are saved across app sessions and provides a consistent settings interface throughout the application.

## Architecture Changes

### 1. Created `useSettings` Hook

**File**: `src/hooks/useSettings.ts`

```typescript
import useAppStore, { type AppSettings } from '../state/appStore';
import { logger } from '../utils/logger';

export const useSettings = () => {
  const { settings, updateSettings, resetSettings } = useAppStore();

  const setSetting = (key: keyof AppSettings, value: any) => {
    logger.info('useSettings', `Setting updated: ${key} = ${value}`);
    updateSettings({ [key]: value });
  };

  // Computed properties for UI convenience
  const darkMode = settings.theme === 'dark';

  return {
    ...settings,
    darkMode, // Computed property for theme
    setSetting,
    resetSettings,
  };
};
```

**Key Features:**
- **Centralized Access**: Single interface for all settings operations
- **Type Safety**: Full TypeScript support with `AppSettings` type
- **Logging**: Comprehensive logging for debugging and monitoring
- **Computed Properties**: Convenient UI properties (e.g., `darkMode`)
- **Persistence**: Automatic persistence through `appStore`

### 2. Refactored SettingsScreen

**Before (Local State)**:
```typescript
const [notifications, setNotifications] = useState(true);
const [privacy, setPrivacy] = useState(true);
const [analytics, setAnalytics] = useState(false);
const [darkMode, setDarkMode] = useState(false);
```

**After (Centralized State)**:
```typescript
const {
  privacyMode,
  autoSaveConversations,
  notificationsEnabled,
  darkMode,
  setSetting,
  resetSettings,
} = useSettings();
```

### 3. Updated Hook Exports

**File**: `src/hooks/index.ts`

```typescript
// Hook exports
export { useAgent } from './useAgent';
export { useRAG } from './useRAG';
export { useSettings } from './useSettings';
```

## Settings Mapping

The settings have been mapped to the centralized `AppSettings` interface:

| UI Setting | AppStore Property | Type | Description |
|------------|------------------|------|-------------|
| Privacy Mode | `privacyMode` | `boolean` | On-device processing mode |
| Analytics | `autoSaveConversations` | `boolean` | Save conversation history |
| Notifications | `notificationsEnabled` | `boolean` | Enable app notifications |
| Dark Mode | `theme` | `'light' \| 'dark' \| 'system'` | App theme preference |

## Benefits

### 1. **Persistence**
- Settings are automatically saved to AsyncStorage
- User preferences persist across app launches
- No data loss on app restart

### 2. **Consistency**
- Single source of truth for all settings
- Consistent behavior across the app
- Easy to access settings from any component

### 3. **Type Safety**
- Full TypeScript support
- Compile-time error checking
- IntelliSense support for settings

### 4. **Debugging**
- Comprehensive logging for all setting changes
- Easy to track user preferences
- Clear audit trail for settings modifications

### 5. **Scalability**
- Easy to add new settings
- Centralized settings management
- Reusable hook pattern

## Usage Examples

### Reading Settings
```typescript
const { privacyMode, notificationsEnabled } = useSettings();
```

### Updating Settings
```typescript
const { setSetting } = useSettings();

// Update a single setting
setSetting('theme', 'dark');
setSetting('privacyMode', true);
```

### Resetting Settings
```typescript
const { resetSettings } = useSettings();

// Reset all settings to defaults
resetSettings();
```

## State Management Flow

```
User Interaction (Toggle Switch)
    ↓
SettingsScreen calls setSetting()
    ↓
useSettings hook calls updateSettings()
    ↓
appStore updates settings state
    ↓
AsyncStorage persistence (automatic)
    ↓
UI re-renders with new values
```

## Data Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  SettingsScreen │───▶│  useSettings    │───▶│    appStore     │
│                 │    │      Hook       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                        ▲                      │
         │                        │                      ▼
         │                        │            ┌─────────────────┐
         │                        └────────────│  AsyncStorage   │
         │                                     │  (Persistence)  │
         └─────────────────────────────────────┘                 │
                    UI Updates                 └─────────────────┘
```

## Testing Considerations

### 1. **Hook Testing**
```typescript
// Test setting updates
const { setSetting } = useSettings();
setSetting('theme', 'dark');
expect(settings.theme).toBe('dark');
```

### 2. **Persistence Testing**
```typescript
// Test persistence across app launches
const settings1 = useSettings();
settings1.setSetting('privacyMode', true);

// Simulate app restart
const settings2 = useSettings();
expect(settings2.privacyMode).toBe(true);
```

### 3. **UI Integration Testing**
```typescript
// Test switch components
const { privacyMode, setSetting } = useSettings();
const switch = render(<Switch value={privacyMode} onValueChange={setSetting} />);
fireEvent.press(switch);
expect(privacyMode).toBe(!privacyMode);
```

## Future Enhancements

1. **Settings Validation**: Add validation for setting values
2. **Settings Migration**: Handle settings schema changes
3. **Settings Sync**: Cloud synchronization for settings
4. **Settings Groups**: Organize settings into logical groups
5. **Settings Search**: Search functionality for settings
6. **Settings Export**: Export/import settings functionality

## Performance Considerations

- **Minimal Re-renders**: Only affected components re-render
- **Efficient Updates**: Batch setting updates when possible
- **Lazy Loading**: Load settings only when needed
- **Memory Management**: Proper cleanup of listeners

This architecture provides a robust, scalable, and maintainable foundation for application settings management while ensuring excellent user experience and developer productivity.