/**
 * Project Configuration
 * 
 * This file loads configuration from the secure specialenv directory
 * without exposing sensitive credentials in the main codebase.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface ProjectConfig {
  githubAccount: string;
  githubRepo: string;
  projectOwner: string;
  projectName: string;
  githubUrl: string;
  // Note: GitHub token is intentionally not exposed in this interface
}

class ConfigLoader {
  private static instance: ConfigLoader;
  private config: ProjectConfig | null = null;

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  private constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      // Load from secure specialenv directory
      const envPath = join(process.cwd(), 'specialenv', '.env');
      const envContent = readFileSync(envPath, 'utf8');
      
      const envVars = this.parseEnvFile(envContent);
      
      this.config = {
        githubAccount: envVars.GITHUB_ACCOUNT || 'ales27pm',
        githubRepo: envVars.GITHUB_REPO || 'native-monGARS',
        projectOwner: envVars.PROJECT_OWNER || 'ales27pm',
        projectName: envVars.PROJECT_NAME || 'native-monGARS',
        githubUrl: envVars.GITHUB_URL || 'https://github.com/ales27pm/native-monGARS',
      };
    } catch (error) {
      console.warn('Could not load project config from specialenv, using defaults');
      
      // Fallback configuration
      this.config = {
        githubAccount: 'ales27pm',
        githubRepo: 'native-monGARS',
        projectOwner: 'ales27pm',
        projectName: 'native-monGARS',
        githubUrl: 'https://github.com/ales27pm/native-monGARS',
      };
    }
  }

  private parseEnvFile(content: string): Record<string, string> {
    const envVars: Record<string, string> = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (trimmed.startsWith('#') || !trimmed) {
        return;
      }
      
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return envVars;
  }

  public getConfig(): ProjectConfig {
    if (!this.config) {
      this.loadConfig();
    }
    return this.config!;
  }

  // Secure method to get GitHub token for authenticated operations
  // This method should only be used in secure contexts and never logged
  public getGitHubToken(): string | null {
    try {
      const envPath = join(process.cwd(), 'specialenv', '.env');
      const envContent = readFileSync(envPath, 'utf8');
      const envVars = this.parseEnvFile(envContent);
      return envVars.GITHUB_TOKEN || null;
    } catch (error) {
      console.warn('Could not load GitHub token from secure environment');
      return null;
    }
  }
}

// Export singleton instance
export const ProjectConfig = ConfigLoader.getInstance().getConfig();

// Export secure token getter (use sparingly and never log)
export const getSecureGitHubToken = (): string | null => {
  return ConfigLoader.getInstance().getGitHubToken();
};

// Export project constants for use throughout the app
export const PROJECT_CONSTANTS = {
  NAME: ProjectConfig.projectName,
  OWNER: ProjectConfig.projectOwner,
  REPO: ProjectConfig.githubRepo,
  URL: ProjectConfig.githubUrl,
  ACCOUNT: ProjectConfig.githubAccount,
} as const;