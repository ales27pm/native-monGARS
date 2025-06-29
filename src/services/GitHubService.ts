/**
 * GitHub Integration Service
 * 
 * Provides secure GitHub API integration using credentials from specialenv
 * Never logs or exposes the GitHub token
 */

import { getSecureGitHubToken, PROJECT_CONSTANTS } from '../config/ProjectConfig';
import { AuditService } from './AuditService';

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  private: boolean;
  created_at: string;
  updated_at: string;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  html_url: string;
  created_at: string;
  updated_at: string;
}

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
}

class GitHubService {
  private static instance: GitHubService;
  private baseUrl = 'https://api.github.com';

  public static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  private constructor() {}

  private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = getSecureGitHubToken();
    
    if (!token) {
      throw new Error('GitHub token not available');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // Log API usage (but never the token)
    AuditService.getInstance().log(
      'memory_write', 
      `GitHub API call: ${endpoint} (${response.status})`
    );
    
    return data;
  }

  // Get repository information
  async getRepository(): Promise<GitHubRepo> {
    try {
      const repo = await this.makeAuthenticatedRequest(
        `/repos/${PROJECT_CONSTANTS.OWNER}/${PROJECT_CONSTANTS.REPO}`
      );
      return repo;
    } catch (error) {
      console.error('Failed to get repository info:', error);
      throw error;
    }
  }

  // Create a new issue
  async createIssue(title: string, body: string, labels?: string[]): Promise<GitHubIssue> {
    try {
      const issue = await this.makeAuthenticatedRequest(
        `/repos/${PROJECT_CONSTANTS.OWNER}/${PROJECT_CONSTANTS.REPO}/issues`,
        {
          method: 'POST',
          body: JSON.stringify({
            title,
            body,
            labels: labels || [],
          }),
        }
      );
      
      AuditService.getInstance().log('memory_write', `Created GitHub issue: ${title}`);
      return issue;
    } catch (error) {
      console.error('Failed to create issue:', error);
      throw error;
    }
  }

  // Get repository issues
  async getIssues(state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubIssue[]> {
    try {
      const issues = await this.makeAuthenticatedRequest(
        `/repos/${PROJECT_CONSTANTS.OWNER}/${PROJECT_CONSTANTS.REPO}/issues?state=${state}`
      );
      return issues;
    } catch (error) {
      console.error('Failed to get issues:', error);
      throw error;
    }
  }

  // Get releases
  async getReleases(): Promise<GitHubRelease[]> {
    try {
      const releases = await this.makeAuthenticatedRequest(
        `/repos/${PROJECT_CONSTANTS.OWNER}/${PROJECT_CONSTANTS.REPO}/releases`
      );
      return releases;
    } catch (error) {
      console.error('Failed to get releases:', error);
      throw error;
    }
  }

  // Create a release
  async createRelease(
    tagName: string, 
    name: string, 
    body: string, 
    prerelease: boolean = false
  ): Promise<GitHubRelease> {
    try {
      const release = await this.makeAuthenticatedRequest(
        `/repos/${PROJECT_CONSTANTS.OWNER}/${PROJECT_CONSTANTS.REPO}/releases`,
        {
          method: 'POST',
          body: JSON.stringify({
            tag_name: tagName,
            target_commitish: 'main',
            name,
            body,
            draft: false,
            prerelease,
          }),
        }
      );
      
      AuditService.getInstance().log('memory_write', `Created GitHub release: ${name}`);
      return release;
    } catch (error) {
      console.error('Failed to create release:', error);
      throw error;
    }
  }

  // Get repository statistics
  async getRepoStats(): Promise<{
    stars: number;
    forks: number;
    issues: number;
    lastUpdate: string;
  }> {
    try {
      const repo = await this.getRepository();
      const openIssues = await this.getIssues('open');
      
      return {
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        issues: openIssues.length,
        lastUpdate: repo.updated_at,
      };
    } catch (error) {
      console.error('Failed to get repository stats:', error);
      return {
        stars: 0,
        forks: 0,
        issues: 0,
        lastUpdate: new Date().toISOString(),
      };
    }
  }

  // Check if GitHub integration is available
  async isAvailable(): Promise<boolean> {
    try {
      const token = getSecureGitHubToken();
      if (!token) return false;
      
      // Test with a simple API call
      await this.makeAuthenticatedRequest('/user');
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get project constants (safe to expose)
  getProjectInfo() {
    return {
      name: PROJECT_CONSTANTS.NAME,
      owner: PROJECT_CONSTANTS.OWNER,
      repo: PROJECT_CONSTANTS.REPO,
      url: PROJECT_CONSTANTS.URL,
      account: PROJECT_CONSTANTS.ACCOUNT,
    };
  }
}

export default GitHubService.getInstance();