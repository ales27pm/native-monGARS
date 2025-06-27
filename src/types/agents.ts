export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  inputTypes: string[];
  outputTypes: string[];
  requirements: string[];
  performance: {
    accuracy: number;
    speed: number;
    reliability: number;
  };
}

export interface AgentPersonality {
  style: 'professional' | 'casual' | 'technical' | 'creative' | 'analytical';
  tone: 'formal' | 'friendly' | 'enthusiastic' | 'calm' | 'authoritative';
  verbosity: 'minimal' | 'concise' | 'detailed' | 'comprehensive';
  creativity: number; // 0-1 scale
  empathy: number; // 0-1 scale
  precision: number; // 0-1 scale
}

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  type: 'specialist' | 'generalist' | 'assistant' | 'analyzer' | 'creator';
  status: 'active' | 'inactive' | 'training' | 'maintenance';
  capabilities: AgentCapability[];
  personality: AgentPersonality;
  expertise: {
    domains: string[];
    skills: string[];
    languages: string[];
    tools: string[];
  };
  configuration: {
    preferredModel: 'openai' | 'anthropic' | 'grok' | 'adaptive';
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    examples: Array<{
      input: string;
      output: string;
      reasoning: string;
    }>;
  };
  performance: {
    totalTasks: number;
    successfulTasks: number;
    averageRating: number;
    averageResponseTime: number;
    lastUsed: Date;
    createdAt: Date;
  };
  learning: {
    trainingData: Array<{
      input: string;
      output: string;
      feedback: number;
      timestamp: Date;
    }>;
    adaptations: Array<{
      change: string;
      reason: string;
      impact: number;
      timestamp: Date;
    }>;
    improvements: string[];
  };
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  input: any;
  output?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  context: {
    user: string;
    session: string;
    timestamp: Date;
    metadata: Record<string, any>;
  };
  performance: {
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    tokensUsed?: number;
    cost?: number;
  };
  feedback?: {
    rating: number;
    comment: string;
    helpful: boolean;
    accurate: boolean;
  };
}

export interface AgentCollaboration {
  id: string;
  name: string;
  description: string;
  agents: string[];
  workflow: Array<{
    step: number;
    agent: string;
    action: string;
    dependencies: string[];
    outputs: string[];
  }>;
  status: 'active' | 'inactive';
  successRate: number;
  lastUsed: Date;
}

export interface AgentResponse {
  agentId: string;
  agentName: string;
  content: string;
  reasoning: string;
  confidence: number;
  capabilities: string[];
  metadata: {
    model: string;
    tokens: number;
    duration: number;
    cost?: number;
  };
  actions?: string[];
  followUp?: string[];
  collaboration?: {
    recommendedAgents: string[];
    reasoning: string;
  };
}