import { memorySystem } from './memory-system';
import { reasoningEngine } from './advanced-reasoning';
import { contextEngine } from './context-engine';
import { LearningInsight, UserProfile, LearningPattern } from '../types/memory';
import { AssistantContext, AIResponse } from '../types/assistant';

export interface AdaptationRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  confidence: number;
  successRate: number;
  applications: number;
  lastUsed: Date;
}

export interface LearningObjective {
  id: string;
  name: string;
  description: string;
  type: 'accuracy' | 'efficiency' | 'satisfaction' | 'personalization';
  target: number;
  current: number;
  progress: number;
  strategies: string[];
  active: boolean;
}

export class LearningSystem {
  private adaptationRules: Map<string, AdaptationRule> = new Map();
  private objectives: Map<string, LearningObjective> = new Map();
  private _isActive = false;

  constructor() {
    this.initializeDefaults();
  }

  async startLearning(): Promise<void> {
    this._isActive = true;
    console.log('ARIA: Learning system activated');
    
    // Initialize default objectives
    await this.initializeLearningObjectives();
  }

  async stopLearning(): Promise<void> {
    this._isActive = false;
    console.log('ARIA: Learning system deactivated');
  }

  // Core Learning Methods
  async learnFromInteraction(
    userInput: string,
    aiResponse: AIResponse,
    context: AssistantContext,
    feedback?: {
      rating: number; // 1-5 scale
      type: 'helpful' | 'accurate' | 'relevant' | 'clear' | 'fast';
      comment?: string;
    }
  ): Promise<void> {
    if (!this._isActive) return;

    try {
      // Store interaction in memory
      await memorySystem.storeMemory(
        'conversation',
        'interaction',
        JSON.stringify({
          input: userInput,
          output: aiResponse.content,
          feedback: feedback || null,
          context: this.sanitizeContext(context),
        }),
        'user',
        { 
          confidence: feedback ? feedback.rating / 5 : 0.5,
          relevance: aiResponse.confidence || 0.5 
        }
      );

      // Extract learning patterns
      await this.extractPatterns(userInput, aiResponse, context, feedback);

      // Update user profile
      await this.updateUserProfile(userInput, aiResponse, context, feedback);

      // Generate adaptation rules
      await this.generateAdaptationRules(userInput, aiResponse, context, feedback);

      // Update learning objectives
      await this.updateObjectives(feedback);

      console.log('ARIA: Learned from interaction');
    } catch (error) {
      console.error('Learning from interaction error:', error);
    }
  }

  async adaptResponse(
    originalResponse: AIResponse,
    userInput: string,
    context: AssistantContext
  ): Promise<AIResponse> {
    if (!this._isActive) return originalResponse;

    try {
      // Get user profile for personalization
      const profile = memorySystem.getUserProfile();
      if (!profile) return originalResponse;

      // Apply adaptation rules
      let adaptedContent = originalResponse.content;
      let adaptedActions = originalResponse.actions || [];
      let reasoning = originalResponse.reasoning;

      // Apply learned preferences
      adaptedContent = await this.applyPreferences(adaptedContent, profile);

      // Apply adaptation rules
      for (const rule of this.adaptationRules.values()) {
        if (await this.evaluateCondition(rule.condition, userInput, context, profile)) {
          const result = await this.applyAction(rule.action, adaptedContent, context);
          adaptedContent = result.content;
          adaptedActions = [...adaptedActions, ...result.actions];
          reasoning += ` [Applied rule: ${rule.name}]`;
          
          // Update rule usage
          rule.applications++;
          rule.lastUsed = new Date();
        }
      }

      // Generate personalized response using memory
      adaptedContent = await memorySystem.generatePersonalizedResponse(
        userInput,
        adaptedContent,
        context
      );

      return {
        ...originalResponse,
        content: adaptedContent,
        actions: adaptedActions,
        reasoning,
        contextUsed: [...(originalResponse.contextUsed || []), 'learning_system', 'user_profile'],
      };
    } catch (error) {
      console.error('Response adaptation error:', error);
      return originalResponse;
    }
  }

  // Pattern Recognition and Learning
  private async extractPatterns(
    userInput: string,
    aiResponse: AIResponse,
    context: AssistantContext,
    feedback?: any
  ): Promise<void> {
    // Analyze query patterns
    const queryPattern = this.analyzeQueryPattern(userInput);
    await this.updateLearningPattern(
      `query_${queryPattern.type}`,
      queryPattern.frequency,
      [context.timeOfDay, context.deviceState.connectivity],
      feedback?.rating >= 4
    );

    // Analyze response effectiveness
    if (feedback) {
      const responsePattern = this.analyzeResponsePattern(aiResponse);
      await this.updateLearningPattern(
        `response_${responsePattern.type}`,
        responsePattern.frequency,
        [aiResponse.model, responsePattern.length.toString()],
        feedback.rating >= 4
      );
    }

    // Analyze contextual patterns
    const contextPattern = this.analyzeContextPattern(context);
    await this.updateLearningPattern(
      `context_${contextPattern.type}`,
      contextPattern.frequency,
      [context.timeOfDay, contextPattern.activity],
      feedback?.rating >= 4
    );
  }

  private async updateLearningPattern(
    patternId: string,
    frequency: number,
    contexts: string[],
    successful: boolean
  ): Promise<void> {
    const existing = await memorySystem.retrieveMemories({
      query: patternId,
      type: 'pattern',
      maxResults: 1,
    });

    if (existing.length > 0) {
      // Update existing pattern
      const pattern = JSON.parse(existing[0].entry.content) as LearningPattern;
      pattern.frequency += frequency;
      pattern.contexts = [...new Set([...pattern.contexts, ...contexts])];
      pattern.lastSeen = new Date();
      
      if (successful) {
        pattern.outcomes.successful++;
      } else {
        pattern.outcomes.failed++;
      }
      
      pattern.confidence = pattern.outcomes.successful / 
        (pattern.outcomes.successful + pattern.outcomes.failed);

      await memorySystem.storeMemory(
        'pattern',
        'learning',
        JSON.stringify(pattern),
        'ai',
        { confidence: pattern.confidence }
      );
    } else {
      // Create new pattern
      const newPattern: LearningPattern = {
        id: patternId,
        pattern: patternId,
        frequency,
        contexts,
        outcomes: {
          successful: successful ? 1 : 0,
          failed: successful ? 0 : 1,
        },
        confidence: successful ? 1.0 : 0.0,
        lastSeen: new Date(),
      };

      await memorySystem.storeMemory(
        'pattern',
        'learning',
        JSON.stringify(newPattern),
        'ai',
        { confidence: newPattern.confidence }
      );
    }
  }

  // User Profile Learning
  private async updateUserProfile(
    userInput: string,
    aiResponse: AIResponse,
    context: AssistantContext,
    feedback?: any
  ): Promise<void> {
    const profile = memorySystem.getUserProfile();
    if (!profile) return;

    const updates: Partial<UserProfile> = {};

    // Learn communication preferences
    if (feedback) {
      if (feedback.type === 'clear' && feedback.rating >= 4) {
        // User likes current verbosity level
        await memorySystem.storeMemory(
          'preference',
          'communication',
          `User appreciates ${profile.preferences.communication.verbosity} responses`,
          'user',
          { confidence: feedback.rating / 5 }
        );
      } else if (feedback.comment?.includes('too long')) {
        // User prefers more concise responses
        updates.preferences = {
          ...profile.preferences,
          communication: {
            ...profile.preferences.communication,
            verbosity: 'concise',
          },
        };
      } else if (feedback.comment?.includes('more detail')) {
        // User wants more detailed responses
        updates.preferences = {
          ...profile.preferences,
          communication: {
            ...profile.preferences.communication,
            verbosity: 'comprehensive',
          },
        };
      }
    }

    // Learn AI model preferences
    if (feedback?.rating >= 4) {
      await memorySystem.storeMemory(
        'preference',
        'ai_model',
        `User satisfied with ${aiResponse.model} response`,
        'user',
        { confidence: feedback.rating / 5 }
      );
    }

    // Learn usage patterns
    const hour = new Date().getHours();
    if (!profile.patterns.usage.mostActiveHours.includes(hour)) {
      updates.patterns = {
        ...profile.patterns,
        usage: {
          ...profile.patterns.usage,
          mostActiveHours: [...profile.patterns.usage.mostActiveHours, hour].slice(-24),
        },
      };
    }

    // Update interests based on queries
    const extractedTopics = await this.extractTopics(userInput);
    if (extractedTopics.length > 0) {
      const currentInterests = profile.preferences.topics.interests;
      const newInterests = [...currentInterests];
      
      extractedTopics.forEach(topic => {
        if (!newInterests.includes(topic)) {
          newInterests.push(topic);
        }
      });

      updates.preferences = {
        ...updates.preferences,
        topics: {
          ...profile.preferences.topics,
          interests: newInterests.slice(-20), // Keep last 20 interests
        },
      };
    }

    if (Object.keys(updates).length > 0) {
      await memorySystem.updateUserProfile(updates);
    }
  }

  // Adaptation Rules
  private async generateAdaptationRules(
    userInput: string,
    aiResponse: AIResponse,
    context: AssistantContext,
    feedback?: any
  ): Promise<void> {
    if (!feedback || feedback.rating < 4) return;

    // Generate rule based on successful interaction
    const conditions = [];
    const actions = [];

    // Time-based conditions
    if (context.timeOfDay) {
      conditions.push(`timeOfDay == "${context.timeOfDay}"`);
    }

    // Query type conditions
    const queryType = this.classifyQuery(userInput);
    conditions.push(`queryType == "${queryType}"`);

    // Context conditions
    if (context.deviceState.battery < 20) {
      conditions.push('batteryLow == true');
      actions.push('prioritize_efficiency');
    }

    // Response type actions
    if (feedback.type === 'helpful') {
      actions.push(`use_model_${aiResponse.model}`);
    }

    if (feedback.comment?.includes('examples')) {
      actions.push('include_examples');
    }

    // Create adaptation rule
    if (conditions.length > 0 && actions.length > 0) {
      const ruleId = `rule_${Date.now()}`;
      const rule: AdaptationRule = {
        id: ruleId,
        name: `Successful ${queryType} pattern`,
        condition: conditions.join(' AND '),
        action: actions.join(','),
        confidence: feedback.rating / 5,
        successRate: 1.0,
        applications: 0,
        lastUsed: new Date(),
      };

      this.adaptationRules.set(ruleId, rule);
      
      await memorySystem.storeMemory(
        'skill',
        'adaptation',
        JSON.stringify(rule),
        'ai',
        { confidence: rule.confidence }
      );
    }
  }

  // Learning Objectives
  private async initializeLearningObjectives(): Promise<void> {
    const objectives: LearningObjective[] = [
      {
        id: 'response_accuracy',
        name: 'Response Accuracy',
        description: 'Improve accuracy of AI responses',
        type: 'accuracy',
        target: 0.9,
        current: 0.7,
        progress: 0,
        strategies: ['better_context_usage', 'model_selection', 'fact_verification'],
        active: true,
      },
      {
        id: 'user_satisfaction',
        name: 'User Satisfaction',
        description: 'Increase user satisfaction with interactions',
        type: 'satisfaction',
        target: 4.5,
        current: 3.8,
        progress: 0,
        strategies: ['personalization', 'response_adaptation', 'preference_learning'],
        active: true,
      },
      {
        id: 'response_efficiency',
        name: 'Response Efficiency',
        description: 'Reduce response time while maintaining quality',
        type: 'efficiency',
        target: 0.8,
        current: 0.6,
        progress: 0,
        strategies: ['model_optimization', 'caching', 'smart_routing'],
        active: true,
      },
      {
        id: 'personalization_depth',
        name: 'Personalization Depth',
        description: 'Increase depth of personalized responses',
        type: 'personalization',
        target: 0.85,
        current: 0.5,
        progress: 0,
        strategies: ['memory_utilization', 'preference_tracking', 'pattern_recognition'],
        active: true,
      },
    ];

    objectives.forEach(objective => {
      this.objectives.set(objective.id, objective);
    });
  }

  private async updateObjectives(feedback?: any): Promise<void> {
    if (!feedback) return;

    // Update satisfaction objective
    const satisfaction = this.objectives.get('user_satisfaction');
    if (satisfaction) {
      const newCurrent = (satisfaction.current * 0.9) + (feedback.rating * 0.1);
      satisfaction.current = newCurrent;
      satisfaction.progress = (newCurrent - 3.8) / (satisfaction.target - 3.8);
    }

    // Update accuracy if feedback indicates correctness
    if (feedback.type === 'accurate') {
      const accuracy = this.objectives.get('response_accuracy');
      if (accuracy) {
        const improvement = feedback.rating >= 4 ? 0.01 : -0.005;
        accuracy.current = Math.max(0, Math.min(1, accuracy.current + improvement));
        accuracy.progress = (accuracy.current - 0.7) / (accuracy.target - 0.7);
      }
    }
  }

  // Utility Methods
  private analyzeQueryPattern(query: string): { type: string; frequency: number } {
    const patterns = {
      question: /\?|\bwhat\b|\bhow\b|\bwhy\b|\bwhen\b|\bwhere\b|\bwho\b/i,
      request: /\bplease\b|\bcan you\b|\bwould you\b|\bcould you\b/i,
      command: /\bdo\b|\bmake\b|\bcreate\b|\bgenerate\b|\bshow\b/i,
      analysis: /\banalyze\b|\bcompare\b|\bevaluate\b|\bassess\b/i,
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(query)) {
        return { type, frequency: 1 };
      }
    }

    return { type: 'statement', frequency: 1 };
  }

  private analyzeResponsePattern(response: AIResponse): { type: string; frequency: number; length: string } {
    const length = response.content.length;
    const lengthCategory = length < 100 ? 'short' : length < 500 ? 'medium' : 'long';
    
    const hasActions = response.actions && response.actions.length > 0;
    const hasReasoning = response.reasoning && response.reasoning.length > 0;
    
    let type = 'simple';
    if (hasActions && hasReasoning) type = 'comprehensive';
    else if (hasActions) type = 'actionable';
    else if (hasReasoning) type = 'explanatory';

    return { type, frequency: 1, length: lengthCategory };
  }

  private analyzeContextPattern(context: AssistantContext): { type: string; frequency: number; activity: string } {
    const activity = context.recentActivity.length > 0 ? context.recentActivity[0] : 'unknown';
    const type = `${context.timeOfDay}_${context.deviceState.connectivity}`;
    
    return { type, frequency: 1, activity };
  }

  private classifyQuery(query: string): string {
    const classifications = {
      technical: /\bcode\b|\bapi\b|\bfunction\b|\balgorithm\b|\bprogramming\b/i,
      creative: /\bwrite\b|\bcreate\b|\bdesign\b|\bimagine\b|\bstory\b/i,
      analytical: /\banalyze\b|\bcompare\b|\bevaluate\b|\bcalculate\b/i,
      informational: /\bwhat\b|\bhow\b|\bwhy\b|\bexplain\b|\btell me\b/i,
      personal: /\bi\b|\bmy\b|\bme\b|\bmine\b|\bmyself\b/i,
    };

    for (const [type, pattern] of Object.entries(classifications)) {
      if (pattern.test(query)) return type;
    }

    return 'general';
  }

  private async extractTopics(text: string): Promise<string[]> {
    // Simple topic extraction - could be enhanced with NLP
    const topics = [];
    const words = text.toLowerCase().split(/\s+/);
    
    const topicKeywords = {
      technology: ['ai', 'computer', 'software', 'app', 'code', 'programming'],
      health: ['health', 'fitness', 'exercise', 'diet', 'medical', 'wellness'],
      business: ['business', 'work', 'job', 'career', 'money', 'finance'],
      education: ['learn', 'study', 'education', 'school', 'course', 'book'],
      travel: ['travel', 'trip', 'vacation', 'flight', 'hotel', 'tourism'],
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => words.includes(keyword))) {
        topics.push(topic);
      }
    }

    return topics;
  }

  private async applyPreferences(content: string, profile: UserProfile): Promise<string> {
    const { communication } = profile.preferences;
    
    // Apply verbosity preference
    if (communication.verbosity === 'concise' && content.length > 200) {
      // Summarize content (simplified)
      const sentences = content.split(/[.!?]+/);
      return sentences.slice(0, Math.ceil(sentences.length / 2)).join('. ') + '.';
    }
    
    // Apply style preference
    if (communication.style === 'formal') {
      return content.replace(/\b(hey|yeah|ok)\b/gi, match => {
        const replacements: { [key: string]: string } = {
          hey: 'Hello',
          yeah: 'Yes',
          ok: 'Understood',
        };
        return replacements[match.toLowerCase()] || match;
      });
    }

    return content;
  }

  private async evaluateCondition(
    condition: string,
    userInput: string,
    context: AssistantContext,
    profile: UserProfile
  ): Promise<boolean> {
    // Simple condition evaluation - could be enhanced with a proper expression parser
    const variables = {
      timeOfDay: context.timeOfDay,
      queryType: this.classifyQuery(userInput),
      batteryLow: context.deviceState.battery < 20,
      connectivity: context.deviceState.connectivity,
    };

    // Very basic evaluation
    for (const [key, value] of Object.entries(variables)) {
      condition = condition.replace(new RegExp(`\\b${key}\\b`, 'g'), JSON.stringify(value));
    }

    try {
      // This is a simplified evaluation - in production, use a safe expression evaluator
      return eval(condition);
    } catch {
      return false;
    }
  }

  private async applyAction(
    action: string,
    content: string,
    context: AssistantContext
  ): Promise<{ content: string; actions: string[] }> {
    const actions = action.split(',');
    let modifiedContent = content;
    const newActions: string[] = [];

    for (const act of actions) {
      switch (act.trim()) {
        case 'prioritize_efficiency':
          modifiedContent = modifiedContent.substring(0, 150) + '...';
          newActions.push('Prioritized efficiency due to low battery');
          break;
        case 'include_examples':
          modifiedContent += '\n\nFor example: [Context-specific example would be added here]';
          break;
        case 'use_model_openai':
        case 'use_model_anthropic':
        case 'use_model_grok':
          newActions.push(`Recommended model: ${act.split('_')[2]}`);
          break;
      }
    }

    return { content: modifiedContent, actions: newActions };
  }

  private sanitizeContext(context: AssistantContext): any {
    // Remove sensitive information before storing
    return {
      timeOfDay: context.timeOfDay,
      recentActivity: context.recentActivity.slice(-3),
      deviceState: {
        battery: context.deviceState.battery,
        connectivity: context.deviceState.connectivity,
      },
    };
  }

  private initializeDefaults(): void {
    // Initialize with some basic adaptation rules
    const defaultRules: AdaptationRule[] = [
      {
        id: 'low_battery_efficiency',
        name: 'Low Battery Efficiency',
        condition: 'batteryLow == true',
        action: 'prioritize_efficiency',
        confidence: 0.9,
        successRate: 0.8,
        applications: 0,
        lastUsed: new Date(),
      },
      {
        id: 'morning_brief',
        name: 'Morning Brief Responses',
        condition: 'timeOfDay == "morning"',
        action: 'use_concise_style',
        confidence: 0.7,
        successRate: 0.75,
        applications: 0,
        lastUsed: new Date(),
      },
    ];

    defaultRules.forEach(rule => {
      this.adaptationRules.set(rule.id, rule);
    });
  }

  // Public API
  getAdaptationRules(): AdaptationRule[] {
    return Array.from(this.adaptationRules.values());
  }

  getLearningObjectives(): LearningObjective[] {
    return Array.from(this.objectives.values());
  }

  async generateLearningReport(): Promise<{
    objectives: LearningObjective[];
    rules: AdaptationRule[];
    insights: LearningInsight[];
    recommendations: string[];
  }> {
    const insights = await memorySystem.generateLearningInsights();
    const recommendations = this.generateRecommendations();

    return {
      objectives: this.getLearningObjectives(),
      rules: this.getAdaptationRules(),
      insights,
      recommendations,
    };
  }

  private generateRecommendations(): string[] {
    const recommendations = [];
    
    // Check objective progress
    for (const objective of this.objectives.values()) {
      if (objective.progress < 0.3) {
        recommendations.push(`Focus on improving ${objective.name} - consider strategies: ${objective.strategies.join(', ')}`);
      }
    }

    // Check rule effectiveness
    const lowPerformingRules = Array.from(this.adaptationRules.values())
      .filter(rule => rule.applications > 5 && rule.successRate < 0.6);
    
    if (lowPerformingRules.length > 0) {
      recommendations.push('Review and update low-performing adaptation rules');
    }

    // Memory utilization
    const memoryCount = memorySystem.getMemoryCount();
    if (memoryCount < 100) {
      recommendations.push('Increase interaction frequency to build richer memory base');
    }

    return recommendations;
  }

  isActive(): boolean {
    return this._isActive;
  }
}

export const learningSystem = new LearningSystem();