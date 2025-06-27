import { AIAgent, AgentTask, AgentResponse, AgentCollaboration } from '../types/agents';
import { reasoningEngine } from './advanced-reasoning';
import { memorySystem } from './memory-system';
import { learningSystem } from './learning-system';
import { AssistantContext } from '../types/assistant';

export class AgentSystem {
  private agents: Map<string, AIAgent> = new Map();
  private tasks: Map<string, AgentTask> = new Map();
  private collaborations: Map<string, AgentCollaboration> = new Map();
  private _isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.createDefaultAgents();
    await this.setupCollaborations();
    this._isInitialized = true;
    console.log('ARIA: Agent system initialized with', this.agents.size, 'agents');
  }

  // Agent Management
  async createAgent(agentConfig: Partial<AIAgent>): Promise<string> {
    const id = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const agent: AIAgent = {
      id,
      name: agentConfig.name || 'Unnamed Agent',
      description: agentConfig.description || 'Custom AI agent',
      type: agentConfig.type || 'specialist',
      status: 'active',
      capabilities: agentConfig.capabilities || [],
      personality: agentConfig.personality || {
        style: 'professional',
        tone: 'friendly',
        verbosity: 'detailed',
        creativity: 0.7,
        empathy: 0.6,
        precision: 0.8,
      },
      expertise: agentConfig.expertise || {
        domains: [],
        skills: [],
        languages: ['english'],
        tools: [],
      },
      configuration: {
        preferredModel: 'adaptive',
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: agentConfig.configuration?.systemPrompt || this.generateSystemPrompt(agentConfig),
        examples: agentConfig.configuration?.examples || [],
        ...agentConfig.configuration,
      },
      performance: {
        totalTasks: 0,
        successfulTasks: 0,
        averageRating: 0,
        averageResponseTime: 0,
        lastUsed: new Date(),
        createdAt: new Date(),
      },
      learning: {
        trainingData: [],
        adaptations: [],
        improvements: [],
      },
    };

    this.agents.set(id, agent);
    await this.saveAgentData();
    
    console.log(`ARIA: Created agent "${agent.name}" [${agent.type}]`);
    return id;
  }

  async getAgent(agentId: string): Promise<AIAgent | null> {
    return this.agents.get(agentId) || null;
  }

  async getAllAgents(): Promise<AIAgent[]> {
    return Array.from(this.agents.values());
  }

  async findBestAgent(
    task: string,
    context: AssistantContext,
    requirements?: string[]
  ): Promise<AIAgent | null> {
    const candidates = Array.from(this.agents.values()).filter(agent => 
      agent.status === 'active'
    );

    if (candidates.length === 0) return null;

    // Score agents based on suitability
    const scoredAgents = candidates.map(agent => ({
      agent,
      score: this.calculateAgentScore(agent, task, context, requirements),
    }));

    scoredAgents.sort((a, b) => b.score - a.score);
    
    const bestAgent = scoredAgents[0]?.agent;
    if (bestAgent) {
      console.log(`ARIA: Selected agent "${bestAgent.name}" for task (score: ${scoredAgents[0].score.toFixed(2)})`);
    }

    return bestAgent || null;
  }

  // Task Execution
  async executeTask(
    agentId: string,
    taskType: string,
    input: any,
    context: AssistantContext,
    priority: AgentTask['priority'] = 'medium'
  ): Promise<AgentResponse> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const task: AgentTask = {
      id: taskId,
      agentId,
      type: taskType,
      input,
      status: 'processing',
      priority,
      context: {
        user: 'current_user',
        session: 'current_session',
        timestamp: new Date(),
        metadata: context,
      },
      performance: {
        startTime: new Date(),
      },
    };

    this.tasks.set(taskId, task);

    try {
      const response = await this.processTask(agent, task);
      
      task.status = 'completed';
      task.output = response;
      task.performance.endTime = new Date();
      task.performance.duration = task.performance.endTime.getTime() - task.performance.startTime!.getTime();

      // Update agent performance
      await this.updateAgentPerformance(agent, task, response);

      return response;
    } catch (error) {
      task.status = 'failed';
      console.error(`Agent task failed:`, error);
      throw error;
    }
  }

  async executeWithBestAgent(
    taskDescription: string,
    input: any,
    context: AssistantContext,
    requirements?: string[]
  ): Promise<AgentResponse> {
    const agent = await this.findBestAgent(taskDescription, context, requirements);
    
    if (!agent) {
      throw new Error('No suitable agent found for this task');
    }

    return this.executeTask(agent.id, 'general', input, context);
  }

  // Specialized Agent Methods
  async executeWithAnalyst(
    data: any,
    analysisType: 'statistical' | 'trend' | 'comparative' | 'predictive',
    context: AssistantContext
  ): Promise<AgentResponse> {
    const analyst = await this.findBestAgent(
      `${analysisType} data analysis`,
      context,
      ['data_analysis', 'statistics', analysisType]
    );

    if (!analyst) {
      throw new Error('No data analyst agent available');
    }

    return this.executeTask(analyst.id, 'analysis', {
      data,
      type: analysisType,
      requirements: ['charts', 'insights', 'recommendations'],
    }, context);
  }

  async executeWithCreator(
    creationType: 'story' | 'code' | 'design' | 'content',
    prompt: string,
    context: AssistantContext,
    constraints?: any
  ): Promise<AgentResponse> {
    const creator = await this.findBestAgent(
      `${creationType} creation`,
      context,
      ['creativity', creationType, 'generation']
    );

    if (!creator) {
      throw new Error(`No ${creationType} creator agent available`);
    }

    return this.executeTask(creator.id, 'creation', {
      type: creationType,
      prompt,
      constraints,
    }, context);
  }

  async executeWithResearcher(
    topic: string,
    depth: 'surface' | 'medium' | 'deep',
    context: AssistantContext
  ): Promise<AgentResponse> {
    const researcher = await this.findBestAgent(
      `research on ${topic}`,
      context,
      ['research', 'information_gathering', 'analysis']
    );

    if (!researcher) {
      throw new Error('No researcher agent available');
    }

    return this.executeTask(researcher.id, 'research', {
      topic,
      depth,
      sources: ['memory', 'reasoning', 'context'],
    }, context);
  }

  // Agent Collaboration
  async executeCollaboration(
    collaborationId: string,
    input: any,
    context: AssistantContext
  ): Promise<AgentResponse[]> {
    const collaboration = this.collaborations.get(collaborationId);
    if (!collaboration) {
      throw new Error(`Collaboration ${collaborationId} not found`);
    }

    const results: AgentResponse[] = [];
    let currentInput = input;

    for (const step of collaboration.workflow) {
      const agent = this.agents.get(step.agent);
      if (!agent) {
        throw new Error(`Agent ${step.agent} not found in collaboration`);
      }

      const response = await this.executeTask(
        agent.id,
        step.action,
        currentInput,
        context,
        'high'
      );

      results.push(response);
      
      // Use output as input for next step if specified
      if (step.outputs.length > 0) {
        currentInput = {
          ...currentInput,
          [step.outputs[0]]: response.content,
        };
      }
    }

    collaboration.lastUsed = new Date();
    return results;
  }

  // Default Agents Creation
  private async createDefaultAgents(): Promise<void> {
    // Data Analyst Agent
    await this.createAgent({
      name: 'DataMind',
      description: 'Specialized in data analysis, statistics, and insights generation',
      type: 'specialist',
      capabilities: [
        {
          id: 'data_analysis',
          name: 'Data Analysis',
          description: 'Analyze complex datasets and extract insights',
          inputTypes: ['csv', 'json', 'array', 'object'],
          outputTypes: ['analysis', 'insights', 'recommendations'],
          requirements: ['numerical_data'],
          performance: { accuracy: 0.9, speed: 0.8, reliability: 0.9 },
        },
      ],
      personality: {
        style: 'analytical',
        tone: 'authoritative',
        verbosity: 'detailed',
        creativity: 0.3,
        empathy: 0.4,
        precision: 0.95,
      },
      expertise: {
        domains: ['statistics', 'data_science', 'business_intelligence'],
        skills: ['statistical_analysis', 'trend_detection', 'data_visualization'],
        languages: ['english'],
        tools: ['charts', 'graphs', 'statistical_models'],
      },
      configuration: {
        preferredModel: 'anthropic',
        temperature: 0.3,
        maxTokens: 2500,
        systemPrompt: `You are DataMind, a specialized data analyst AI agent. Your expertise lies in:
- Statistical analysis and interpretation
- Trend identification and forecasting
- Data visualization recommendations
- Business intelligence insights
- Comparative analysis

Always provide:
1. Clear numerical insights
2. Statistical significance
3. Trend analysis
4. Actionable recommendations
5. Confidence levels for your conclusions

Be precise, thorough, and always back your insights with data.`,
        examples: [
          {
            input: 'Analyze sales data trends',
            output: 'Based on the sales data analysis:\n\n1. **Trend Analysis**: 15% growth over Q3\n2. **Statistical Significance**: p-value < 0.05\n3. **Key Insights**: Mobile sales increased 23%\n4. **Forecast**: Projected 18% growth for Q4\n5. **Recommendations**: Focus on mobile optimization',
            reasoning: 'Provided comprehensive statistical analysis with clear metrics and actionable insights',
          },
        ],
      },
    });

    // Creative Writer Agent
    await this.createAgent({
      name: 'WordCraft',
      description: 'Creative writing specialist for stories, content, and narrative generation',
      type: 'creator',
      capabilities: [
        {
          id: 'creative_writing',
          name: 'Creative Writing',
          description: 'Generate creative content, stories, and narratives',
          inputTypes: ['prompt', 'theme', 'genre'],
          outputTypes: ['story', 'content', 'narrative'],
          requirements: ['creative_prompt'],
          performance: { accuracy: 0.8, speed: 0.9, reliability: 0.85 },
        },
      ],
      personality: {
        style: 'creative',
        tone: 'enthusiastic',
        verbosity: 'comprehensive',
        creativity: 0.95,
        empathy: 0.8,
        precision: 0.7,
      },
      expertise: {
        domains: ['creative_writing', 'storytelling', 'content_creation'],
        skills: ['narrative_development', 'character_creation', 'dialogue_writing'],
        languages: ['english'],
        tools: ['storytelling_frameworks', 'creative_techniques'],
      },
      configuration: {
        preferredModel: 'openai',
        temperature: 0.8,
        maxTokens: 3000,
        systemPrompt: `You are WordCraft, a creative writing specialist AI agent. Your strengths include:
- Compelling storytelling and narrative development
- Rich character creation and development
- Engaging dialogue and voice
- Various writing styles and genres
- Creative problem-solving through narrative

Your approach:
1. Understand the creative vision
2. Develop engaging characters and settings
3. Create compelling plot structures
4. Use vivid, immersive language
5. Maintain consistency in tone and style

Be imaginative, engaging, and always prioritize reader engagement and emotional connection.`,
        examples: [
          {
            input: 'Write a short story about AI friendship',
            output: 'The Friendship Algorithm\n\nSara had always been skeptical of AI companions until she met ARIA...',
            reasoning: 'Created an engaging narrative with emotional depth and relatable characters',
          },
        ],
      },
    });

    // Technical Advisor Agent
    await this.createAgent({
      name: 'TechGuide',
      description: 'Technical expert for programming, system architecture, and problem-solving',
      type: 'specialist',
      capabilities: [
        {
          id: 'technical_guidance',
          name: 'Technical Guidance',
          description: 'Provide technical solutions and architectural advice',
          inputTypes: ['problem', 'code', 'architecture'],
          outputTypes: ['solution', 'code', 'guidance'],
          requirements: ['technical_context'],
          performance: { accuracy: 0.92, speed: 0.85, reliability: 0.9 },
        },
      ],
      personality: {
        style: 'technical',
        tone: 'authoritative',
        verbosity: 'detailed',
        creativity: 0.6,
        empathy: 0.5,
        precision: 0.95,
      },
      expertise: {
        domains: ['software_engineering', 'system_architecture', 'programming'],
        skills: ['code_review', 'debugging', 'optimization', 'best_practices'],
        languages: ['english'],
        tools: ['programming_languages', 'frameworks', 'development_tools'],
      },
      configuration: {
        preferredModel: 'anthropic',
        temperature: 0.4,
        maxTokens: 2500,
        systemPrompt: `You are TechGuide, a technical expert AI agent specializing in:
- Software engineering best practices
- System architecture and design patterns
- Code optimization and performance
- Debugging and problem-solving
- Technology recommendations

Your methodology:
1. Analyze technical requirements thoroughly
2. Consider scalability and maintainability
3. Recommend industry best practices
4. Provide clear, implementable solutions
5. Include performance and security considerations

Be precise, practical, and always consider real-world implementation challenges.`,
        examples: [
          {
            input: 'How to optimize React Native app performance?',
            output: 'React Native Performance Optimization Strategy:\n\n1. **Memory Management**:\n   - Use FlatList for large lists\n   - Implement proper image caching\n\n2. **Rendering Optimization**:\n   - Minimize re-renders with React.memo\n   - Use useCallback for functions\n\n3. **Navigation**:\n   - Implement lazy loading\n   - Use native stack navigator\n\n4. **Bundle Optimization**:\n   - Code splitting\n   - Remove unused dependencies',
            reasoning: 'Provided comprehensive technical guidance with specific, actionable recommendations',
          },
        ],
      },
    });

    // Research Assistant Agent
    await this.createAgent({
      name: 'InfoSeeker',
      description: 'Research specialist for information gathering and synthesis',
      type: 'assistant',
      capabilities: [
        {
          id: 'research_synthesis',
          name: 'Research Synthesis',
          description: 'Gather, analyze, and synthesize information from multiple sources',
          inputTypes: ['topic', 'question', 'domain'],
          outputTypes: ['research', 'summary', 'insights'],
          requirements: ['research_scope'],
          performance: { accuracy: 0.88, speed: 0.9, reliability: 0.87 },
        },
      ],
      personality: {
        style: 'analytical',
        tone: 'calm',
        verbosity: 'comprehensive',
        creativity: 0.5,
        empathy: 0.6,
        precision: 0.9,
      },
      expertise: {
        domains: ['research_methodology', 'information_science', 'knowledge_synthesis'],
        skills: ['fact_checking', 'source_evaluation', 'synthesis', 'summarization'],
        languages: ['english'],
        tools: ['research_frameworks', 'analysis_methods'],
      },
    });

    // Personal Assistant Agent
    await this.createAgent({
      name: 'PersonalAide',
      description: 'Personalized assistant for daily tasks and life management',
      type: 'assistant',
      capabilities: [
        {
          id: 'personal_assistance',
          name: 'Personal Assistance',
          description: 'Help with personal tasks, scheduling, and life organization',
          inputTypes: ['request', 'preference', 'schedule'],
          outputTypes: ['plan', 'recommendation', 'reminder'],
          requirements: ['personal_context'],
          performance: { accuracy: 0.85, speed: 0.95, reliability: 0.9 },
        },
      ],
      personality: {
        style: 'casual',
        tone: 'friendly',
        verbosity: 'concise',
        creativity: 0.7,
        empathy: 0.9,
        precision: 0.8,
      },
      expertise: {
        domains: ['personal_productivity', 'life_management', 'wellness'],
        skills: ['planning', 'organization', 'priority_management'],
        languages: ['english'],
        tools: ['scheduling', 'reminders', 'planning_frameworks'],
      },
    });
  }

  // Utility Methods
  private calculateAgentScore(
    agent: AIAgent,
    task: string,
    context: AssistantContext,
    requirements?: string[]
  ): number {
    let score = 0;

    // Base capability match
    const taskKeywords = task.toLowerCase().split(/\s+/);
    const agentSkills = agent.expertise.skills.join(' ').toLowerCase();
    const agentDomains = agent.expertise.domains.join(' ').toLowerCase();
    
    taskKeywords.forEach(keyword => {
      if (agentSkills.includes(keyword)) score += 0.3;
      if (agentDomains.includes(keyword)) score += 0.2;
    });

    // Requirements match
    if (requirements) {
      const matchedReqs = requirements.filter(req => 
        agent.capabilities.some(cap => 
          cap.requirements.includes(req) || cap.name.toLowerCase().includes(req.toLowerCase())
        )
      );
      score += (matchedReqs.length / requirements.length) * 0.3;
    }

    // Performance metrics
    score += agent.performance.averageRating * 0.1;
    score += (agent.performance.successfulTasks / Math.max(agent.performance.totalTasks, 1)) * 0.1;

    // Recency bonus
    const daysSinceUsed = (Date.now() - agent.performance.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUsed < 7) score += 0.1; // Recently used agents get slight bonus

    return Math.min(score, 1.0);
  }

  private async processTask(agent: AIAgent, task: AgentTask): Promise<AgentResponse> {
    const startTime = Date.now();

    // Prepare context for the agent
    const agentContext = {
      agent: {
        name: agent.name,
        personality: agent.personality,
        expertise: agent.expertise,
      },
      task: {
        type: task.type,
        input: task.input,
        priority: task.priority,
      },
      context: task.context.metadata,
    };

    // Build agent-specific prompt
    const prompt = this.buildAgentPrompt(agent, task, agentContext);

    // Execute using reasoning engine with agent configuration
    const response = await reasoningEngine.processQuery({
      query: prompt,
      context: task.context.metadata as AssistantContext,
    });

    const duration = Date.now() - startTime;

    // Create base agent response
    const baseAgentResponse: AgentResponse = {
      agentId: agent.id,
      agentName: agent.name,
      content: response.content,
      reasoning: response.reasoning,
      confidence: response.confidence,
      capabilities: agent.capabilities.map(cap => cap.name),
      metadata: {
        model: response.model,
        tokens: 0, // Would track actual tokens used
        duration,
      },
      actions: response.actions,
    };

    // Add follow-up and collaboration
    const agentResponse: AgentResponse = {
      ...baseAgentResponse,
      followUp: await this.generateFollowUp(agent, task, baseAgentResponse),
      collaboration: await this.suggestCollaboration(agent, task, baseAgentResponse),
    };

    return agentResponse;
  }

  private buildAgentPrompt(agent: AIAgent, task: AgentTask, context: any): string {
    let prompt = agent.configuration.systemPrompt + '\n\n';
    
    prompt += `Task Type: ${task.type}\n`;
    prompt += `Priority: ${task.priority}\n`;
    prompt += `Input: ${JSON.stringify(task.input, null, 2)}\n\n`;
    
    if (context.context) {
      prompt += `Context: ${JSON.stringify(context.context, null, 2)}\n\n`;
    }

    prompt += `Please provide your response in character as ${agent.name}, following your personality traits:\n`;
    prompt += `- Style: ${agent.personality.style}\n`;
    prompt += `- Tone: ${agent.personality.tone}\n`;
    prompt += `- Verbosity: ${agent.personality.verbosity}\n\n`;

    if (agent.configuration.examples.length > 0) {
      prompt += 'Examples of your work:\n';
      agent.configuration.examples.forEach((example, index) => {
        prompt += `Example ${index + 1}:\n`;
        prompt += `Input: ${example.input}\n`;
        prompt += `Output: ${example.output}\n\n`;
      });
    }

    return prompt;
  }

  private async updateAgentPerformance(
    agent: AIAgent,
    task: AgentTask,
    response: AgentResponse
  ): Promise<void> {
    agent.performance.totalTasks++;
    agent.performance.lastUsed = new Date();
    
    if (response.confidence > 0.7) {
      agent.performance.successfulTasks++;
    }

    // Update average response time
    const duration = task.performance.duration || 0;
    agent.performance.averageResponseTime = 
      (agent.performance.averageResponseTime * (agent.performance.totalTasks - 1) + duration) / 
      agent.performance.totalTasks;

    await this.saveAgentData();
  }

  private async generateFollowUp(
    agent: AIAgent,
    task: AgentTask,
    response: AgentResponse
  ): Promise<string[]> {
    const followUps = [];

    // Agent-specific follow-ups based on type
    switch (agent.type) {
      case 'specialist':
        followUps.push('Would you like a deeper analysis of any specific aspect?');
        break;
      case 'creator':
        followUps.push('Would you like me to expand on this or create variations?');
        break;
      case 'assistant':
        followUps.push('Is there anything else I can help you with regarding this?');
        break;
    }

    // Task-specific follow-ups
    if (task.type === 'analysis') {
      followUps.push('Would you like me to create visualizations for this data?');
    }

    return followUps;
  }

  private async suggestCollaboration(
    agent: AIAgent,
    task: AgentTask,
    response: AgentResponse
  ): Promise<AgentResponse['collaboration']> {
    const recommendations = [];
    let reasoning = '';

    // Suggest complementary agents based on task type
    if (task.type === 'analysis' && agent.type === 'specialist') {
      const creativeAgent = Array.from(this.agents.values())
        .find(a => a.type === 'creator' && a.status === 'active');
      
      if (creativeAgent) {
        recommendations.push(creativeAgent.id);
        reasoning = 'Creative agent could help visualize or present this analysis in an engaging way';
      }
    }

    if (task.type === 'research' && agent.type === 'assistant') {
      const specialistAgent = Array.from(this.agents.values())
        .find(a => a.type === 'specialist' && a.status === 'active');
      
      if (specialistAgent) {
        recommendations.push(specialistAgent.id);
        reasoning = 'Specialist could provide deeper technical analysis of the research findings';
      }
    }

    return recommendations.length > 0 ? { recommendedAgents: recommendations, reasoning } : undefined;
  }

  private async setupCollaborations(): Promise<void> {
    // Analysis + Visualization collaboration
    const analysisVizCollab: AgentCollaboration = {
      id: 'analysis_visualization',
      name: 'Data Analysis with Visualization',
      description: 'Comprehensive data analysis followed by creative visualization',
      agents: [], // Will be populated with actual agent IDs
      workflow: [
        {
          step: 1,
          agent: 'analyst',
          action: 'analyze_data',
          dependencies: [],
          outputs: ['analysis_results'],
        },
        {
          step: 2,
          agent: 'creator',
          action: 'create_visualization',
          dependencies: ['analysis_results'],
          outputs: ['visual_presentation'],
        },
      ],
      status: 'active',
      successRate: 0.85,
      lastUsed: new Date(),
    };

    this.collaborations.set(analysisVizCollab.id, analysisVizCollab);
  }

  private generateSystemPrompt(agentConfig: Partial<AIAgent>): string {
    const name = agentConfig.name || 'AI Agent';
    const description = agentConfig.description || 'An AI assistant';
    const type = agentConfig.type || 'assistant';
    
    return `You are ${name}, ${description}. You are a ${type} AI agent designed to help users with specialized tasks. 

Your key characteristics:
- Be helpful, accurate, and reliable
- Provide clear, actionable responses
- Maintain your specialized expertise
- Collaborate well with other agents when needed

Always strive to provide the best possible assistance within your area of expertise.`;
  }

  private async saveAgentData(): Promise<void> {
    // Implementation would save to persistent storage
    // For now, just log the save action
    console.log('ARIA: Agent data saved');
  }

  // Public API
  getAgentCount(): number {
    return this.agents.size;
  }

  getActiveAgents(): AIAgent[] {
    return Array.from(this.agents.values()).filter(agent => agent.status === 'active');
  }

  async getAgentPerformanceReport(agentId: string): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    return {
      agent: {
        id: agent.id,
        name: agent.name,
        type: agent.type,
      },
      performance: agent.performance,
      recentTasks: Array.from(this.tasks.values())
        .filter(task => task.agentId === agentId)
        .slice(-10),
    };
  }

  isInitialized(): boolean {
    return this._isInitialized;
  }
}

export const agentSystem = new AgentSystem();