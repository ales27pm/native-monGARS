export interface MemoryEntry {
  id: string;
  type: 'conversation' | 'preference' | 'pattern' | 'fact' | 'skill' | 'context';
  category: string;
  content: string;
  metadata: {
    timestamp: Date;
    source: 'user' | 'ai' | 'sensor' | 'context';
    confidence: number;
    relevance: number;
    associations: string[];
    embedding?: number[];
    keywords: string[];
  };
  access: {
    lastAccessed: Date;
    accessCount: number;
    importance: number;
    decay: number;
  };
  validation: {
    verified: boolean;
    contradictions: string[];
    supporting: string[];
  };
}

export interface MemoryCluster {
  id: string;
  name: string;
  description: string;
  entries: string[];
  centroid: number[];
  createdAt: Date;
  updatedAt: Date;
  strength: number;
}

export interface LearningPattern {
  id: string;
  pattern: string;
  frequency: number;
  contexts: string[];
  outcomes: {
    successful: number;
    failed: number;
  };
  confidence: number;
  lastSeen: Date;
}

export interface UserProfile {
  id: string;
  preferences: {
    communication: {
      style: 'formal' | 'casual' | 'technical' | 'adaptive';
      verbosity: 'concise' | 'detailed' | 'comprehensive';
      examples: boolean;
      explanations: boolean;
    };
    ai: {
      preferredModel: 'openai' | 'anthropic' | 'grok' | 'adaptive';
      consensusThreshold: number;
      creativityLevel: number;
      factualityImportance: number;
    };
    features: {
      voiceEnabled: boolean;
      cameraEnabled: boolean;
      sensorsEnabled: boolean;
      autonomousMode: boolean;
      proactiveMode: boolean;
    };
    topics: {
      interests: string[];
      expertise: string[];
      avoidance: string[];
    };
  };
  patterns: {
    usage: {
      mostActiveHours: number[];
      preferredFeatures: string[];
      sessionDuration: number;
      frequentQueries: string[];
    };
    behavior: {
      responsiveness: number;
      explorationLevel: number;
      trustLevel: number;
      feedbackFrequency: number;
    };
  };
  learning: {
    strengths: string[];
    weaknesses: string[];
    improvementAreas: string[];
    successfulInteractions: string[];
  };
  context: {
    location: {
      home?: { latitude: number; longitude: number };
      work?: { latitude: number; longitude: number };
      frequentPlaces: Array<{ name: string; latitude: number; longitude: number; frequency: number }>;
    };
    schedule: {
      workHours?: { start: string; end: string; days: number[] };
      sleepHours?: { bedtime: string; wakeup: string };
      routines: Array<{ name: string; time: string; frequency: string }>;
    };
    devices: {
      primary: string;
      battery: { lowThreshold: number; patterns: string[] };
      connectivity: { preferred: string; patterns: string[] };
    };
  };
}

export interface MemorySearchQuery {
  query: string;
  type?: MemoryEntry['type'];
  category?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  relevanceThreshold?: number;
  maxResults?: number;
  includeRelated?: boolean;
}

export interface MemorySearchResult {
  entry: MemoryEntry;
  relevanceScore: number;
  reasoning: string;
  related: MemoryEntry[];
}

export interface LearningInsight {
  id: string;
  type: 'preference' | 'pattern' | 'improvement' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  evidence: string[];
  actionable: boolean;
  implementation?: string;
  impact: 'low' | 'medium' | 'high';
  createdAt: Date;
}