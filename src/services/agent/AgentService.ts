/**
 * AgentService.ts
 * Production-grade ReAct (Reasoning and Acting) agent with tool orchestration
 */

import { onDeviceLLMService } from '../llm/OnDeviceLLMService';
import { ragService } from '../rag/RAGService';
import { calendarService } from '../tools/CalendarService';
import { contactsService } from '../tools/ContactsService';
import { fileService } from '../tools/FileService';
import type { 
  AgentAction as AgentActionType, 
  AgentConfig, 
  AgentStep, 
  AgentResponse as AgentResponseType,
  ServiceStatus 
} from '../../types/ai';

// Legacy interfaces for compatibility
export interface Tool {
  name: string;
  description: string;
  execute: (args: any) => Promise<any>;
}

export interface AgentAction {
  type: 'thought' | 'action' | 'observation' | 'answer';
  content: string;
  toolName?: string;
  toolArgs?: any;
  result?: any;
}

export interface AgentResponse {
  answer: string;
  actions: AgentAction[];
  reasoning: string;
  toolsUsed: string[];
}

export class AgentService {
  private config: AgentConfig;
  private isProcessing = false;
  private lastError?: Error;
  private tools = new Map<string, Function>();
  private legacyTools = new Map<string, Tool>(); // Legacy compatibility
  private isInitialized = false;

  private systemPrompt = `
You are ARIA, an autonomous AI assistant on iOS with access to various tools. 
You can think step by step and take actions to help users.

IMPORTANT: When you need to use a tool, respond with a JSON object in this exact format:
{"tool": "tool_name", "params": {"param1": "value1"}, "reasoning": "why you're using this tool"}

Available tools:
- calendar.createEvent: Create calendar events
- calendar.getEvents: Get calendar events  
- contacts.lookup: Look up contacts
- contacts.getAll: Get all contacts
- file.read: Read file contents
- file.write: Write file contents
- file.list: List directory contents
- rag.search: Search knowledge base

For normal conversation, respond in plain text.
Be helpful, concise, and privacy-focused.
`.trim();

  constructor(config: AgentConfig = {}) {
    this.config = {
      maxTokens: 256,
      temperature: 0.7,
      topK: 3,
      maxSteps: 5,
      systemPrompt: this.systemPrompt,
      ...config
    };

    this.registerTools();
    this.isInitialized = true;
  }

  /** Legacy initialize method for compatibility */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('🤖 Initializing Agent Service...');
      await this.registerDefaultTools();
      this.isInitialized = true;
      console.log('✅ Agent Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Agent service:', error);
      throw error;
    }
  }

  /** Register all available tools */
  private registerTools(): void {
    // Calendar tools
    this.tools.set('calendar.createEvent', async (params: any) => {
      return await calendarService.createEvent(params);
    });

    this.tools.set('calendar.getEvents', async (params: any) => {
      const { startDate, endDate } = params;
      return await calendarService.getEvents?.(startDate, endDate) || [];
    });

    // Contact tools
    this.tools.set('contacts.lookup', async (params: any) => {
      return await contactsService.lookup(params);
    });

    this.tools.set('contacts.getAll', async (params: any) => {
      return await contactsService.getAllContacts?.() || [];
    });

    // File tools
    this.tools.set('file.read', async (params: any) => {
      return await fileService.read(params);
    });

    this.tools.set('file.write', async (params: any) => {
      return await fileService.write?.(params) || 'File write not implemented';
    });

    this.tools.set('file.list', async (params: any) => {
      return await fileService.listDirectory?.(params.path) || [];
    });

    // RAG tools
    this.tools.set('rag.search', async (params: any) => {
      const { query, topK = 3 } = params;
      return await ragService.retrieve(query, topK);
    });

    console.log(`🔧 Registered ${this.tools.size} tools`);
  }

  /** Legacy registerDefaultTools method */
  private async registerDefaultTools(): Promise<void> {
    // Register calendar tool
    this.registerTool({
      name: 'calendar',
      description: 'Access calendar events and schedules',
      execute: async (args: any) => {
        return {
          events: [
            { title: 'Mock Meeting', date: new Date(), duration: 60 },
            { title: 'Another Event', date: new Date(), duration: 30 }
          ],
          message: 'Mock calendar data retrieved'
        };
      }
    });
    
    // Register contacts tool
    this.registerTool({
      name: 'contacts',
      description: 'Search and access contact information',
      execute: async (args: any) => {
        return {
          contacts: [
            { name: 'John Doe', phone: '123-456-7890' },
            { name: 'Jane Smith', phone: '098-765-4321' }
          ],
          message: 'Mock contacts data retrieved'
        };
      }
    });
    
    // Register files tool
    this.registerTool({
      name: 'files',
      description: 'Search and access file system',
      execute: async (args: any) => {
        return {
          files: [
            { name: 'document.pdf', size: '1.2MB', modified: new Date() },
            { name: 'image.jpg', size: '800KB', modified: new Date() }
          ],
          message: 'Mock file data retrieved'
        };
      }
    });
  }

  /** Legacy registerTool method */
  registerTool(tool: Tool): void {
    console.log(`🔧 Registering legacy tool: ${tool.name}`);
    this.legacyTools.set(tool.name, tool);
  }

  /** Main ReAct loop: reason → act → reflect */
  async run(userInput: string): Promise<AgentResponseType> {
    if (this.isProcessing) {
      throw new Error('Agent is already processing a request');
    }

    this.isProcessing = true;
    const startTime = Date.now();
    const steps: AgentStep[] = [];
    const toolsUsed: string[] = [];

    try {
      console.log(`🤖 Agent processing: "${userInput}"`);

      // Step 1: Initial reasoning
      steps.push({
        type: 'thought',
        content: `User asked: "${userInput}". I need to understand what they want and determine if I need to use any tools.`,
        timestamp: Date.now()
      });

      // Step 2: Get RAG context if available
      let ragContext = '';
      try {
        const ragResults = await ragService.retrieve(userInput, this.config.topK || 3);
        if (ragResults.length > 0) {
          ragContext = ragResults.map(r => `[DOC: ${r.content?.slice(0, 200)}...]`).join('\n');
          steps.push({
            type: 'observation',
            content: `Found ${ragResults.length} relevant documents in knowledge base`,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.warn('⚠️ RAG context retrieval failed:', error);
      }

      // Step 3: Build prompt with context
      const prompt = this.buildPrompt(userInput, ragContext, steps);

      // Step 4: Generate response with potential tool usage
      let finalAnswer = '';
      let currentStep = 0;
      const maxSteps = this.config.maxSteps || 5;

      while (currentStep < maxSteps) {
        currentStep++;
        
        console.log(`🔄 Agent step ${currentStep}/${maxSteps}`);
        
        // Generate LLM response
        const llmResponse = await onDeviceLLMService.generateResponse(prompt, {
          maxTokens: this.config.maxTokens,
          temperature: this.config.temperature
        });

        const responseText = llmResponse.text.trim();
        
        // Try to parse as tool action
        const toolAction = this.parseToolAction(responseText);
        
        if (toolAction) {
          // Execute tool action
          steps.push({
            type: 'action',
            content: `Using tool: ${toolAction.tool}`,
            timestamp: Date.now(),
            toolUsed: toolAction.tool
          });

          try {
            const result = await this.executeTool(toolAction);
            toolsUsed.push(toolAction.tool);
            
            steps.push({
              type: 'observation',
              content: `Tool result: ${JSON.stringify(result).slice(0, 200)}`,
              timestamp: Date.now(),
              result
            });

            // Continue reasoning with tool result
            const updatedPrompt = this.buildPrompt(
              userInput, 
              ragContext, 
              steps, 
              `Tool ${toolAction.tool} returned: ${JSON.stringify(result)}`
            );
            
            // Get final response incorporating tool result
            const finalResponse = await onDeviceLLMService.generateResponse(updatedPrompt, {
              maxTokens: this.config.maxTokens,
              temperature: this.config.temperature
            });
            
            finalAnswer = finalResponse.text.trim();
            break;
            
          } catch (error) {
            steps.push({
              type: 'observation',
              content: `Tool execution failed: ${error}`,
              timestamp: Date.now(),
              error: String(error)
            });
            
            // Continue without tool result
            finalAnswer = `I tried to use ${toolAction.tool} but encountered an error. Here's what I can tell you based on available information: ${responseText}`;
            break;
          }
        } else {
          // Direct response, no tool needed
          finalAnswer = responseText;
          break;
        }
      }

      // Final answer step
      steps.push({
        type: 'answer',
        content: finalAnswer,
        timestamp: Date.now()
      });

      const totalTime = Date.now() - startTime;
      
      const response: AgentResponseType = {
        answer: finalAnswer,
        steps,
        totalSteps: steps.length,
        processingTime: totalTime,
        toolsUsed
      };

      console.log(`✅ Agent completed in ${totalTime}ms using ${toolsUsed.length} tools`);
      return response;

    } catch (error) {
      this.lastError = error as Error;
      console.error('❌ Agent processing failed:', error);
      
      return {
        answer: `I encountered an error while processing your request: ${error}`,
        steps: [...steps, {
          type: 'answer',
          content: `Error: ${error}`,
          timestamp: Date.now(),
          error: String(error)
        }],
        totalSteps: steps.length + 1,
        processingTime: Date.now() - startTime,
        toolsUsed
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /** Legacy processQuery method */
  async processQuery(query: string): Promise<AgentResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`🤔 Processing query: ${query}`);
      
      const actions: AgentAction[] = [];
      const toolsUsed: string[] = [];
      
      // Mock ReAct pattern
      actions.push({
        type: 'thought',
        content: `I need to understand what the user is asking: "${query}"`
      });
      
      // Determine if tools are needed
      const needsCalendar = query.toLowerCase().includes('calendar') || 
                           query.toLowerCase().includes('schedule') ||
                           query.toLowerCase().includes('meeting');
      
      const needsContacts = query.toLowerCase().includes('contact') ||
                           query.toLowerCase().includes('call') ||
                           query.toLowerCase().includes('phone');
      
      const needsFiles = query.toLowerCase().includes('file') ||
                        query.toLowerCase().includes('document');
      
      let finalAnswer = `I understand your query: "${query}". `;
      
      if (needsCalendar) {
        actions.push({
          type: 'action',
          content: 'Using calendar tool to check schedule',
          toolName: 'calendar'
        });
        
        const calendarResult = await this.executeLegacyTool('calendar', { query });
        toolsUsed.push('calendar');
        
        actions.push({
          type: 'observation',
          content: 'Retrieved calendar information',
          result: calendarResult
        });
        
        finalAnswer += 'I checked your calendar and found relevant information. ';
      }
      
      if (needsContacts) {
        actions.push({
          type: 'action',
          content: 'Using contacts tool to search contacts',
          toolName: 'contacts'
        });
        
        const contactsResult = await this.executeLegacyTool('contacts', { query });
        toolsUsed.push('contacts');
        
        actions.push({
          type: 'observation',
          content: 'Retrieved contact information',
          result: contactsResult
        });
        
        finalAnswer += 'I searched your contacts for relevant information. ';
      }
      
      if (needsFiles) {
        actions.push({
          type: 'action',
          content: 'Using files tool to search documents',
          toolName: 'files'
        });
        
        const filesResult = await this.executeLegacyTool('files', { query });
        toolsUsed.push('files');
        
        actions.push({
          type: 'observation',
          content: 'Retrieved file information',
          result: filesResult
        });
        
        finalAnswer += 'I searched your files for relevant documents. ';
      }
      
      if (toolsUsed.length === 0) {
        finalAnswer += 'This appears to be a general query that doesn\'t require specific tools. ';
      }
      
      finalAnswer += 'How can I help you further?';
      
      actions.push({
        type: 'answer',
        content: finalAnswer
      });
      
      const response: AgentResponse = {
        answer: finalAnswer,
        actions,
        reasoning: 'Used ReAct pattern to analyze query and determine appropriate tools',
        toolsUsed
      };
      
      console.log(`✅ Processed query with ${toolsUsed.length} tools`);
      return response;
    } catch (error) {
      console.error('❌ Failed to process query:', error);
      throw error;
    }
  }

  /** Build prompt with context and conversation history */
  private buildPrompt(
    userInput: string, 
    ragContext: string, 
    steps: AgentStep[], 
    additionalContext?: string
  ): string {
    const parts = [this.config.systemPrompt || this.systemPrompt];
    
    if (ragContext) {
      parts.push(`\nKnowledge Base Context:\n${ragContext}`);
    }
    
    if (additionalContext) {
      parts.push(`\nAdditional Context:\n${additionalContext}`);
    }
    
    // Add conversation history
    if (steps.length > 0) {
      const history = steps
        .filter(step => step.type === 'thought' || step.type === 'action' || step.type === 'observation')
        .map(step => `${step.type.toUpperCase()}: ${step.content}`)
        .join('\n');
      
      if (history) {
        parts.push(`\nPrevious Steps:\n${history}`);
      }
    }
    
    parts.push(`\nUser: ${userInput}`);
    parts.push('Assistant:');
    
    return parts.join('\n');
  }

  /** Parse potential tool action from LLM response */
  private parseToolAction(response: string): AgentActionType | null {
    try {
      // Look for JSON objects in the response
      const jsonMatch = response.match(/\{[^}]*\}/);
      if (!jsonMatch) return null;
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.tool && parsed.params && this.tools.has(parsed.tool)) {
        return {
          tool: parsed.tool,
          params: parsed.params,
          reasoning: parsed.reasoning
        };
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /** Execute a tool with given parameters */
  private async executeTool(action: AgentActionType): Promise<any> {
    const tool = this.tools.get(action.tool);
    if (!tool) {
      throw new Error(`Unknown tool: ${action.tool}`);
    }

    console.log(`🔧 Executing tool: ${action.tool}`, action.params);
    
    try {
      const result = await tool(action.params);
      console.log(`✅ Tool executed successfully: ${action.tool}`);
      return result;
    } catch (error) {
      console.error(`❌ Tool execution failed: ${action.tool}`, error);
      throw error;
    }
  }

  /** Legacy execute tool method */
  private async executeLegacyTool(toolName: string, args: any): Promise<any> {
    const tool = this.legacyTools.get(toolName);
    if (!tool) {
      throw new Error(`Tool "${toolName}" not found`);
    }
    
    try {
      console.log(`🔧 Executing legacy tool: ${toolName}`);
      const result = await tool.execute(args);
      console.log(`✅ Legacy tool executed successfully: ${toolName}`);
      return result;
    } catch (error) {
      console.error(`❌ Legacy tool execution failed: ${toolName}`, error);
      throw error;
    }
  }

  /** Get list of available tools */
  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  /** Legacy methods for compatibility */
  getRegisteredTools(): string[] {
    return Array.from(this.legacyTools.keys());
  }

  getToolInfo(toolName: string): Tool | undefined {
    return this.legacyTools.get(toolName);
  }

  isToolAvailable(toolName: string): boolean {
    return this.tools.has(toolName) || this.legacyTools.has(toolName);
  }

  /** Update agent configuration */
  updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Agent config updated:', this.config);
  }

  /** Get current configuration */
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  /** Get service status */
  getStatus(): ServiceStatus {
    return {
      initialized: this.isInitialized,
      available: !this.isProcessing,
      lastError: this.lastError ? {
        code: 'AGENT_ERROR',
        message: this.lastError.message,
        details: this.lastError,
        timestamp: Date.now(),
        service: 'Agent'
      } : undefined,
      version: '1.0.0'
    };
  }

  /** Get agent statistics */
  getStats(): {
    toolCount: number;
    isInitialized: boolean;
    toolsRegistered: number;
    isProcessing: boolean;
    availableTools: string[];
  } {
    return {
      toolCount: this.legacyTools.size, // Legacy compatibility
      isInitialized: this.isInitialized,
      toolsRegistered: this.tools.size,
      isProcessing: this.isProcessing,
      availableTools: this.getAvailableTools()
    };
  }

  /** Health check */
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic functionality
      const testResponse = await this.run('Hello');
      return testResponse.answer.length > 0;
    } catch {
      return false;
    }
  }

  /** Force stop current processing */
  async stop(): Promise<void> {
    if (this.isProcessing) {
      console.log('🛑 Stopping agent processing...');
      this.isProcessing = false;
      
      // Try to stop LLM generation
      try {
        await onDeviceLLMService.stop();
      } catch (error) {
        console.warn('⚠️ Failed to stop LLM generation:', error);
      }
    }
  }

  /** Cleanup resources */
  async cleanup(): Promise<void> {
    await this.stop();
    this.tools.clear();
    this.legacyTools.clear();
    console.log('🧹 Agent Service cleaned up');
  }
}

export const agentService = new AgentService();