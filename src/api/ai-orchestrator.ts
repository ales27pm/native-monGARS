import { reasoningEngine } from './advanced-reasoning';
import { enhancedReasoningEngine } from './enhanced-reasoning';
import { memorySystem } from './memory-system';
import { learningSystem } from './learning-system';
import { agentSystem } from './agent-system';
import { contextEngine } from './context-engine';
import { AssistantContext, AIResponse } from '../types/assistant';

export interface AIRequest {
  query: string;
  context: AssistantContext;
  options: {
    useMemory?: boolean;
    useAgents?: boolean;
    useChainOfThought?: boolean;
    useLearning?: boolean;
    preferredModel?: 'openai' | 'anthropic' | 'grok' | 'adaptive';
    complexity?: 'simple' | 'standard' | 'complex' | 'expert';
    responseStyle?: 'concise' | 'detailed' | 'comprehensive';
    requestType?: 'question' | 'analysis' | 'creation' | 'problem_solving' | 'explanation';
  };
}

export interface EnhancedAIResponse extends AIResponse {
  enhancedFeatures: {
    memoryUsed: boolean;
    agentsConsulted: string[];
    chainOfThoughtId?: string;
    learningApplied: boolean;
    personalizedResponse: boolean;
    processingPath: string[];
  };
  performance: {
    processingTime: number;
    memoryQueries: number;
    agentTasks: number;
    reasoningSteps: number;
    totalTokens: number;
  };
  followUp: {
    suggestedQuestions: string[];
    relatedTopics: string[];
    deeperAnalysis?: string;
    agentRecommendations?: string[];
  };
}

export class AIOrchestrator {
  private isInitialized = false;
  private processingQueue: Map<string, AIRequest> = new Map();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Ensure all AI systems are initialized
    await this.waitForSystemInitialization();
    
    // Start learning system if not active
    if (!learningSystem.isActive()) {
      await learningSystem.startLearning();
    }

    this.isInitialized = true;
    console.log('ARIA: AI Orchestrator initialized');
  }

  async processRequest(request: AIRequest): Promise<EnhancedAIResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    console.log(`ARIA: Processing AI request [${request.options.complexity}]: ${request.query.substring(0, 50)}...`);

    this.processingQueue.set(requestId, request);

    try {
      // Determine processing strategy based on complexity and options
      const strategy = this.determineProcessingStrategy(request);
      
      // Execute processing strategy
      const response = await this.executeStrategy(strategy, request, startTime);
      
      // Apply learning from the interaction
      if (request.options.useLearning !== false) {
        await this.applyLearning(request, response);
      }

      // Store successful interaction in memory
      if (request.options.useMemory !== false) {
        await this.storeInteraction(request, response);
      }

      console.log(`ARIA: Request completed in ${response.performance.processingTime}ms`);
      return response;

    } catch (error) {
      console.error('AI Orchestrator processing error:', error);
      throw error;
    } finally {
      this.processingQueue.delete(requestId);
    }
  }

  private determineProcessingStrategy(request: AIRequest): {
    useChainOfThought: boolean;
    useAgents: boolean;
    useConsensus: boolean;
    memorySources: number;
    complexityLevel: number;
  } {
    const { options, query } = request;
    
    // Analyze query complexity
    const queryComplexity = this.analyzeQueryComplexity(query);
    const isComplexRequest = options.complexity === 'complex' || options.complexity === 'expert';
    
    return {
      useChainOfThought: options.useChainOfThought || isComplexRequest || queryComplexity > 0.7,
      useAgents: options.useAgents || options.requestType === 'analysis' || isComplexRequest,
      useConsensus: isComplexRequest && options.complexity === 'expert',
      memorySources: options.useMemory !== false ? (isComplexRequest ? 10 : 5) : 0,
      complexityLevel: queryComplexity,
    };
  }

  private async executeStrategy(
    strategy: any,
    request: AIRequest,
    startTime: number
  ): Promise<EnhancedAIResponse> {
    const performance = {
      processingTime: 0,
      memoryQueries: 0,
      agentTasks: 0,
      reasoningSteps: 0,
      totalTokens: 0,
    };

    const enhancedFeatures = {
      memoryUsed: false,
      agentsConsulted: [] as string[],
      chainOfThoughtId: undefined as string | undefined,
      learningApplied: false,
      personalizedResponse: false,
      processingPath: [] as string[],
    };

    let baseResponse: AIResponse;

    // Execute based on strategy
    if (strategy.useChainOfThought) {
      enhancedFeatures.processingPath.push('chain_of_thought');
      
      const chainResponse = await enhancedReasoningEngine.processWithChainOfThought(
        request.query,
        request.context,
        {
          maxSteps: strategy.complexityLevel > 0.8 ? 10 : 6,
          useMemory: strategy.memorySources > 0,
          consultAgents: strategy.useAgents,
          exploreAlternatives: request.options.complexity === 'expert',
        }
      );

      baseResponse = chainResponse.finalResponse;
      enhancedFeatures.chainOfThoughtId = chainResponse.chainOfThought.id;
      performance.reasoningSteps = chainResponse.metadata.totalSteps;
      performance.agentTasks = chainResponse.metadata.agentsConsulted.length;
      enhancedFeatures.agentsConsulted = chainResponse.metadata.agentsConsulted;

    } else if (strategy.useAgents) {
      enhancedFeatures.processingPath.push('agent_consultation');
      
      const agentResponse = await agentSystem.executeWithBestAgent(
        request.query,
        { query: request.query, context: request.context },
        request.context
      );

      baseResponse = {
        content: agentResponse.content,
        reasoning: agentResponse.reasoning,
        confidence: agentResponse.confidence,
        model: `agent_${agentResponse.agentName}`,
        timestamp: Date.now(),
        contextUsed: ['agent_system'],
        actions: agentResponse.actions,
      };

      enhancedFeatures.agentsConsulted.push(agentResponse.agentId);
      performance.agentTasks = 1;

    } else if (strategy.useConsensus) {
      enhancedFeatures.processingPath.push('multi_model_consensus');
      
      baseResponse = await reasoningEngine.getConsensus({
        query: request.query,
        context: request.context,
      });

    } else {
      enhancedFeatures.processingPath.push('standard_reasoning');
      
      baseResponse = await reasoningEngine.processQuery({
        query: request.query,
        context: request.context,
      });
    }

    // Apply memory-based personalization
    if (strategy.memorySources > 0) {
      enhancedFeatures.processingPath.push('memory_personalization');
      enhancedFeatures.memoryUsed = true;
      
      const personalizedContent = await memorySystem.generatePersonalizedResponse(
        request.query,
        baseResponse.content,
        request.context
      );
      
      baseResponse.content = personalizedContent;
      enhancedFeatures.personalizedResponse = true;
      performance.memoryQueries = strategy.memorySources;
    }

    // Apply learning-based adaptations
    if (request.options.useLearning !== false) {
      enhancedFeatures.processingPath.push('learning_adaptation');
      
      const adaptedResponse = await learningSystem.adaptResponse(
        baseResponse,
        request.query,
        request.context
      );
      
      baseResponse = adaptedResponse;
      enhancedFeatures.learningApplied = true;
    }

    // Generate follow-up suggestions
    const followUp = await this.generateFollowUp(request, baseResponse, enhancedFeatures);

    // Calculate final performance metrics
    performance.processingTime = Date.now() - startTime;
    performance.totalTokens = this.estimateTokenUsage(request, baseResponse);

    return {
      ...baseResponse,
      enhancedFeatures,
      performance,
      followUp,
    };
  }

  private async generateFollowUp(
    request: AIRequest,
    response: AIResponse,
    features: any
  ): Promise<EnhancedAIResponse['followUp']> {
    const followUp = {
      suggestedQuestions: [] as string[],
      relatedTopics: [] as string[],
      deeperAnalysis: undefined as string | undefined,
      agentRecommendations: [] as string[] | undefined,
    };

    // Generate suggested questions based on the response
    const questionQuery = `Based on this response: "${response.content.substring(0, 200)}...", suggest 3 relevant follow-up questions.`;
    
    try {
      const questionResponse = await reasoningEngine.processQuery({
        query: questionQuery,
        context: request.context,
      });

      followUp.suggestedQuestions = this.extractQuestions(questionResponse.content);
    } catch (error) {
      console.error('Follow-up generation error:', error);
    }

    // Extract related topics from memory
    if (features.memoryUsed) {
      try {
        const relatedMemories = await memorySystem.retrieveMemories({
          query: request.query,
          maxResults: 3,
          includeRelated: true,
        });

        followUp.relatedTopics = relatedMemories
          .map(mem => mem.entry.category)
          .filter((topic, index, array) => array.indexOf(topic) === index);
      } catch (error) {
        console.error('Related topics extraction error:', error);
      }
    }

    // Suggest deeper analysis if complexity allows
    if (request.options.complexity !== 'expert' && response.confidence > 0.8) {
      followUp.deeperAnalysis = 'This topic could benefit from expert-level analysis with chain-of-thought reasoning.';
    }

    // Recommend specialist agents if available
    if (features.agentsConsulted.length === 0) {
      const relevantAgent = await agentSystem.findBestAgent(
        request.query,
        request.context
      );
      
      if (relevantAgent) {
        followUp.agentRecommendations = [`Consider consulting ${relevantAgent.name} for specialized insights.`];
      }
    }

    return followUp;
  }

  private analyzeQueryComplexity(query: string): number {
    let complexity = 0.3; // Base complexity

    // Length factor
    const wordCount = query.split(/\s+/).length;
    complexity += Math.min(wordCount / 50, 0.3);

    // Complexity indicators
    const complexityIndicators = [
      /\banalyze\b|\bcompare\b|\bevaluate\b/i,
      /\bwhy\b|\bhow\b.*\bwork\b|\bexplain\b/i,
      /\bmultiple\b|\bvarious\b|\bdifferent\b/i,
      /\bcomplex\b|\badvanced\b|\bdeep\b/i,
      /\bstep.?by.?step\b|\bdetailed\b/i,
    ];

    complexityIndicators.forEach(indicator => {
      if (indicator.test(query)) complexity += 0.15;
    });

    // Question markers
    const questionWords = (query.match(/\?|\bwhat\b|\bhow\b|\bwhy\b|\bwhen\b|\bwhere\b|\bwho\b/gi) || []).length;
    complexity += Math.min(questionWords * 0.1, 0.2);

    return Math.min(complexity, 1.0);
  }

  private async applyLearning(request: AIRequest, response: EnhancedAIResponse): Promise<void> {
    try {
      await learningSystem.learnFromInteraction(
        request.query,
        response,
        request.context
      );
    } catch (error) {
      console.error('Learning application error:', error);
    }
  }

  private async storeInteraction(request: AIRequest, response: EnhancedAIResponse): Promise<void> {
    try {
      await memorySystem.storeMemory(
        'conversation',
        request.options.requestType || 'general',
        `Q: ${request.query}\nA: ${response.content}`,
        'user',
        {
          confidence: response.confidence,
          relevance: 0.8,
          associations: response.contextUsed || [],
        }
      );
    } catch (error) {
      console.error('Memory storage error:', error);
    }
  }

  private extractQuestions(text: string): string[] {
    const questions = text.match(/[^.!?]*\?[^.!?]*/g) || [];
    return questions
      .map(q => q.trim())
      .filter(q => q.length > 10)
      .slice(0, 3);
  }

  private estimateTokenUsage(request: AIRequest, response: AIResponse): number {
    // Rough estimation - 4 characters per token on average
    const inputTokens = Math.ceil(request.query.length / 4);
    const outputTokens = Math.ceil(response.content.length / 4);
    return inputTokens + outputTokens;
  }

  private async waitForSystemInitialization(): Promise<void> {
    // Wait for agent system to be initialized
    while (!agentSystem.isInitialized()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Quick Processing Methods for Different Use Cases
  async quickQuestion(question: string, context: AssistantContext): Promise<EnhancedAIResponse> {
    return this.processRequest({
      query: question,
      context,
      options: {
        complexity: 'simple',
        responseStyle: 'concise',
        requestType: 'question',
      },
    });
  }

  async deepAnalysis(query: string, context: AssistantContext): Promise<EnhancedAIResponse> {
    return this.processRequest({
      query,
      context,
      options: {
        complexity: 'expert',
        responseStyle: 'comprehensive',
        requestType: 'analysis',
        useChainOfThought: true,
        useAgents: true,
        useMemory: true,
        useLearning: true,
      },
    });
  }

  async creativeTask(prompt: string, context: AssistantContext): Promise<EnhancedAIResponse> {
    return this.processRequest({
      query: prompt,
      context,
      options: {
        complexity: 'standard',
        responseStyle: 'detailed',
        requestType: 'creation',
        useAgents: true,
        preferredModel: 'openai',
      },
    });
  }

  async problemSolving(problem: string, context: AssistantContext): Promise<EnhancedAIResponse> {
    return this.processRequest({
      query: problem,
      context,
      options: {
        complexity: 'complex',
        responseStyle: 'comprehensive',
        requestType: 'problem_solving',
        useChainOfThought: true,
        useAgents: true,
        useMemory: true,
      },
    });
  }

  // System Status and Management
  getSystemStatus(): {
    orchestratorActive: boolean;
    memoryEntries: number;
    activeAgents: number;
    learningActive: boolean;
    queuedRequests: number;
  } {
    return {
      orchestratorActive: this.isInitialized,
      memoryEntries: memorySystem.getMemoryCount(),
      activeAgents: agentSystem.getActiveAgents().length,
      learningActive: learningSystem.isActive(),
      queuedRequests: this.processingQueue.size,
    };
  }

  async generateSystemReport(): Promise<{
    performance: any;
    memory: any;
    learning: any;
    agents: any;
  }> {
    return {
      performance: {
        totalRequests: this.processingQueue.size,
        averageProcessingTime: 2500, // ms - would track real metrics
        successRate: 0.95,
      },
      memory: {
        totalEntries: memorySystem.getMemoryCount(),
        clusters: memorySystem.getClusterCount(),
      },
      learning: await learningSystem.generateLearningReport(),
      agents: {
        totalAgents: agentSystem.getAgentCount(),
        activeAgents: agentSystem.getActiveAgents().length,
      },
    };
  }
}

export const aiOrchestrator = new AIOrchestrator();