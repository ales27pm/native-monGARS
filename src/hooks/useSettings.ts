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

export default useSettings;