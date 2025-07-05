/**
 * LocalLLMService.ts
 * Comprehensive service for local LLM inference with RAG and ReAct tool use
 * Integrates Llama 3.2 3B Core ML with local embeddings and tool execution
 */

import { LocalLLMModule, LocalEmbeddingModule, ReActToolsModule } from './TurboModuleRegistry';
import { NativeEventEmitter } from 'react-native';
import { logger } from '../utils/logger';

interface StreamEvent {
  sessionId: string;
  token: string;
  index?: number;
  total?: number;
}

interface CompleteEvent {
  sessionId: string;
  reason: 'stop' | 'cancelled' | 'error';
  totalTokens?: number;
}

export interface LocalLLMOptions {
  modelName?: string;
  embeddingModel?: string;
  maxTokens?: number;
  temperature?: number;
  useRAG?: boolean;
  useTools?: boolean;
  systemPrompt?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  toolCallId: string;
  result: any;
  error?: string;
}

export interface GenerationResult {
  text: string;
  finishReason: 'stop' | 'length' | 'tool_calls';
  toolCalls?: ToolCall[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class LocalLLMService {
  private isInitialized = false;
  private isModelLoaded = false;
  private currentStateId: string | null = null;
  private ragEnabled = false;
  private toolsEnabled = false;
  private eventEmitter: NativeEventEmitter | null = null;
  
  // Available tools
  private availableTools = {
    calendar: {
      createEvent: 'Create a calendar event',
      getEvents: 'Get calendar events for a date range',
    },
    contacts: {
      search: 'Search for contacts by name',
      create: 'Create a new contact',
    },
    files: {
      list: 'List files in a directory',
      read: 'Read file contents',
      write: 'Write content to a file',
      search: 'Search for files by name',
    },
  };

  /**
   * Initialize the local LLM service
   */
  async initialize(options: LocalLLMOptions = {}): Promise<boolean> {
    try {
      console.log('🧠 Initializing Local LLM Service...');

      if (!LocalLLMModule) {
        console.warn('LocalLLMModule not available, using fallback');
        return false;
      }

      // Set up event emitter for streaming
      this.eventEmitter = new NativeEventEmitter(LocalLLMModule as any);

      // Load Core ML models
      const modelName = options.modelName || 'Llama-3.2-3B-Instruct';

      // Load main LLM model
      console.log(`📥 Loading model: ${modelName}`);
      const modelLoaded = await LocalLLMModule.loadModel(modelName);
      
      if (!modelLoaded) {
        throw new Error(`Failed to load model: ${modelName}`);
      }
      
      this.isModelLoaded = true;

      // Load embedding model for RAG
      if (options.useRAG !== false && LocalEmbeddingModule) {
        console.log(`📥 Loading embedding model...`);
        try {
          const embeddingLoaded = await LocalEmbeddingModule.loadEmbeddingModel('all-MiniLM-L6-v2');
          if (embeddingLoaded) {
            this.ragEnabled = true;
            console.log('✅ RAG pipeline initialized');
          }
        } catch (error) {
          console.warn('⚠️ Embedding model failed to load, RAG disabled');
        }
      }

      // Enable tools if requested
      this.toolsEnabled = options.useTools !== false;

      this.isInitialized = true;
      console.log('✅ Local LLM Service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Local LLM Service:', error);
      return false;
    }
  }

  /**
   * Generate a response using the local LLM with optional RAG and tool use
   */
  async chat(
    messages: ChatMessage[],
    options: LocalLLMOptions = {}
  ): Promise<GenerationResult> {
    if (!this.isInitialized || !this.isModelLoaded) {
      throw new Error('Local LLM service not initialized');
    }

    try {
      console.log('💭 Starting chat generation...');

      // Build context with RAG if enabled
      let enhancedMessages = [...messages];
      const lastMessage = messages[messages.length - 1];
      
      if (this.ragEnabled && lastMessage.role === 'user') {
        const ragContext = await this.performRAG(lastMessage.content);
        if (ragContext) {
          enhancedMessages = [
            ...messages.slice(0, -1),
            {
              role: 'system',
              content: `Context: ${ragContext}`,
            },
            lastMessage,
          ];
        }
      }

      // Create prompt from messages
      const prompt = this.buildPrompt(enhancedMessages, options);
      
      // Initialize state for generation
      if (!this.currentStateId) {
        this.currentStateId = await LocalLLMModule!.initializeState();
      }

      // Generate response
      let fullResponse = '';
      let tokenCount = 0;
      const maxTokens = options.maxTokens || 512;

      // Simple generation loop (in production, implement proper streaming)
      const sessionId = await LocalLLMModule!.generateStream(prompt, {
        maxTokens,
        temperature: options.temperature || 0.7,
      });

      // For simplicity, wait for completion (in production, implement streaming)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response for demonstration
      fullResponse = await this.generateMockResponse(lastMessage.content, options);
      tokenCount = fullResponse.split(' ').length;

      // Check for tool calls if tools are enabled
      let toolCalls: ToolCall[] | undefined;
      let finishReason: 'stop' | 'length' | 'tool_calls' = 'stop';

      if (this.toolsEnabled) {
        const extractedTools = this.extractToolCalls(fullResponse);
        if (extractedTools.length > 0) {
          toolCalls = extractedTools;
          finishReason = 'tool_calls';
          
          // Execute tools and get results
          const toolResults = await this.executeTools(toolCalls);
          
          // Continue generation with tool results
          if (toolResults.length > 0) {
            const toolContext = this.buildToolContext(toolResults);
            const followUpPrompt = `${prompt}\n\nTool Results:\n${toolContext}\n\nPlease provide a response based on the tool results:`;
            
            // Generate follow-up response
            const followUpResponse = await this.generateMockResponse(followUpPrompt, options);
            fullResponse = followUpResponse;
            finishReason = 'stop';
          }
        }
      }

      return {
        text: fullResponse,
        finishReason,
        toolCalls,
        usage: {
          promptTokens: prompt.split(' ').length,
          completionTokens: tokenCount,
          totalTokens: prompt.split(' ').length + tokenCount,
        },
      };

    } catch (error) {
      console.error('❌ Chat generation failed:', error);
      throw error;
    }
  }

  /**
   * Start streaming chat generation
   */
  async chatStream(prompt: string, options: LocalLLMOptions = {}): Promise<string> {
    if (!this.isInitialized || !this.isModelLoaded || !LocalLLMModule) {
      throw new Error('Local LLM service not initialized');
    }

    try {
      console.log('🚀 Starting streaming generation...');
      
      const sessionId = await LocalLLMModule.generateStream(prompt, {
        maxTokens: options.maxTokens || 512,
        temperature: options.temperature || 0.7,
      });
      
      return sessionId;
    } catch (error) {
      console.error('❌ Stream generation failed:', error);
      throw error;
    }
  }

  /**
   * Cancel ongoing generation
   */
  async cancelGeneration(sessionId: string): Promise<boolean> {
    if (!LocalLLMModule) {
      return false;
    }

    try {
      return await LocalLLMModule?.cancelGeneration?.(sessionId) || false;
    } catch (error) {
      console.error('❌ Cancel generation failed:', error);
      return false;
    }
  }

  /**
   * Listen for streaming tokens
   */
  onToken(callback: (event: StreamEvent) => void): () => void {
    if (!this.eventEmitter) {
      return () => {};
    }

    const subscription = this.eventEmitter.addListener('Token', callback);
    return () => subscription.remove();
  }

  /**
   * Listen for completion events
   */
  onComplete(callback: (event: CompleteEvent) => void): () => void {
    if (!this.eventEmitter) {
      return () => {};
    }

    const subscription = this.eventEmitter.addListener('Complete', callback);
    return () => subscription.remove();
  }

  /**
   * Listen for error events
   */
  onError(callback: (error: any) => void): () => void {
    if (!this.eventEmitter) {
      return () => {};
    }

    const subscription = this.eventEmitter.addListener('Error', callback);
    return () => subscription.remove();
  }

  /**
   * Add documents to the RAG vector store
   */
  async addDocuments(documents: Array<{ id: string; text: string; metadata?: any }>): Promise<void> {
    if (!this.ragEnabled) {
      throw new Error('RAG is not enabled');
    }

    try {
      console.log(`📚 Adding ${documents.length} documents to vector store...`);

      const embeddings: number[][] = [];
      const metadata: any[] = [];

      if (!LocalEmbeddingModule) throw new Error('LocalEmbeddingModule not available');

      for (const doc of documents) {
        const embedding = await LocalEmbeddingModule.generateEmbedding(doc.text);
        embeddings.push(embedding);
        metadata.push({
          id: doc.id,
          text: doc.text,
          ...doc.metadata,
        });
      }

      if (!VectorStore) throw new Error('VectorStore not available');

      await VectorStore.addVectors(embeddings, metadata);
      console.log('✅ Documents added to vector store');
    } catch (error) {
      console.error('❌ Failed to add documents:', error);
      throw error;
    }
  }

  /**
   * Perform Retrieval-Augmented Generation
   */
  private async performRAG(query: string): Promise<string | null> {
    try {
      if (!LocalEmbeddingModule) throw new Error('LocalEmbeddingModule not available');
      if (!VectorStore) throw new Error('VectorStore not available');

      const queryEmbedding = await LocalEmbeddingModule.generateEmbedding(query);
      const results = await VectorStore.search(queryEmbedding, 3, 0.7);

      if (results.length === 0) {
        return null;
      }

      const context = results
        .map((result: any) => result.metadata.text)
        .join('\n\n');

      console.log(`📖 RAG context retrieved: ${results.length} documents`);
      return context;
    } catch (error) {
      console.error('⚠️ RAG failed:', error);
      return null;
    }
  }

  /**
   * Extract tool calls from LLM response
   */
  private extractToolCalls(response: string): ToolCall[] {
    const toolCalls: ToolCall[] = [];
    
    // Simple regex to extract JSON tool calls
    const toolCallRegex = /\{[^}]*"action":\s*"([^"]+)"[^}]*"params":\s*({[^}]*})[^}]*\}/g;
    let match;

    while ((match = toolCallRegex.exec(response)) !== null) {
      const [, action, params] = match;
      
      toolCalls.push({
        id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'function',
        function: {
          name: action,
          arguments: params,
        },
      });
    }

    return toolCalls;
  }

  /**
   * Execute tool calls using native modules
   */
  private async executeTools(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      try {
        const { name, arguments: args } = toolCall.function;
        if (!ReActToolsModule) throw new Error('ReActToolsModule not available');

        const params = JSON.parse(args);
        
        let result: any;

        // Route to appropriate tool
        if (name.startsWith('calendar.')) {
          result = await this.executeCalendarTool(name, params);
        } else if (name.startsWith('contacts.')) {
          result = await this.executeContactTool(name, params);
        } else if (name.startsWith('files.')) {
          result = await this.executeFileTool(name, params);
        } else {
          throw new Error(`Unknown tool: ${name}`);
        }

        results.push({
          toolCallId: toolCall.id,
          result,
        });

        console.log(`🔧 Tool executed: ${name}`);
      } catch (error) {
        console.error(`❌ Tool execution failed: ${toolCall.function.name}`, error);
        results.push({
          toolCallId: toolCall.id,
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Execute calendar tools
   */
  private async executeCalendarTool(toolName: string, params: any): Promise<any> {
    switch (toolName) {
      case 'calendar.getEvents':
        if (!ReActToolsModule) throw new Error('ReActToolsModule not available');
        return await ReActToolsModule.searchCalendarEvents(params);
      case 'calendar.createEvent':
        if (!ReActToolsModule) throw new Error('ReActToolsModule not available');
        return await ReActToolsModule.createCalendarEvent(params);
      default:
        throw new Error(`Unknown calendar tool: ${toolName}`);
    }
  }

  /**
   * Execute contact tools
   */
  private async executeContactTool(toolName: string, params: any): Promise<any> {
    switch (toolName) {
      case 'contacts.search':
        if (!ReActToolsModule) throw new Error('ReActToolsModule not available');
        return await ReActToolsModule.searchContacts(params);
      case 'contacts.create':
        if (!ReActToolsModule) throw new Error('ReActToolsModule not available');
        return await ReActToolsModule.createContact(params);
      default:
        throw new Error(`Unknown contact tool: ${toolName}`);
    }
  }

  /**
   * Execute file tools
   */
  private async executeFileTool(toolName: string, params: any): Promise<any> {
    if (!ReActToolsModule) throw new Error('ReActToolsModule not available');
    switch (toolName) {
      case 'files.list':
        return await ReActToolsModule.listFiles(params);
      case 'files.read':
        return await ReActToolsModule.readFile(params.path, params.encoding);
      case 'files.write':
        return await ReActToolsModule.writeFile(params.path, params.content, params.encoding);
      case 'files.search':
        const files = await ReActToolsModule.listFiles({ path: params.path || '.' });
        const query = params.query.toLowerCase();
        return files.filter((file: any) =>
          (file.name as string).toLowerCase().includes(query)
        );
      default:
        throw new Error(`Unknown file tool: ${toolName}`);
    }
  }

  /**
   * Build context from tool results
   */
  private buildToolContext(toolResults: ToolResult[]): string {
    return toolResults
      .map(result => {
        if (result.error) {
          return `Error: ${result.error}`;
        }
        return JSON.stringify(result.result, null, 2);
      })
      .join('\n\n');
  }

  /**
   * Build prompt from chat messages
   */
  private buildPrompt(messages: ChatMessage[], options: LocalLLMOptions): string {
    let prompt = '';

    // Add system prompt
    if (options.systemPrompt) {
      prompt += `<|start_header_id|>system<|end_header_id|>\n${options.systemPrompt}<|eot_id|>\n`;
    }

    // Add tool definitions if tools are enabled
    if (this.toolsEnabled) {
      const toolDefinitions = this.buildToolDefinitions();
      prompt += `<|start_header_id|>system<|end_header_id|>\n${toolDefinitions}<|eot_id|>\n`;
    }

    // Add conversation messages
    for (const message of messages) {
      const role = message.role === 'assistant' ? 'assistant' : 'user';
      prompt += `<|start_header_id|>${role}<|end_header_id|>\n${message.content}<|eot_id|>\n`;
    }

    // Start assistant response
    prompt += `<|start_header_id|>assistant<|end_header_id|>\n`;

    return prompt;
  }

  /**
   * Build tool definitions for the prompt
   */
  private buildToolDefinitions(): string {
    return `You have access to the following tools:

Calendar Tools:
- calendar.createEvent: Create a calendar event with title, date, duration, location, and notes
- calendar.getEvents: Get calendar events for a date range

Contact Tools:
- contacts.search: Search for contacts by name
- contacts.create: Create a new contact with name, phone, and email

File Tools:
- files.list: List files in a directory
- files.read: Read file contents
- files.write: Write content to a file
- files.search: Search for files by name

To use a tool, respond with JSON in this format:
{"action": "tool.method", "params": {"key": "value"}}

For example:
{"action": "calendar.createEvent", "params": {"title": "Meeting", "date": "2025-07-05T10:00:00Z", "duration": 3600}}`;
  }

  /**
   * Generate mock response (for demonstration - replace with actual LLM generation)
   */
  private async generateMockResponse(prompt: string, options: LocalLLMOptions): Promise<string> {
    // This is a simplified mock - in production, use the actual Core ML model
    const responses = [
      "I understand your request. Let me help you with that.",
      "Based on your question, here's what I found:",
      "I can assist you with that task. Here's my response:",
      "Thank you for your question. Here's the information you requested:",
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Add tool calls if appropriate
    if (this.toolsEnabled && prompt.toLowerCase().includes('calendar')) {
      return `${randomResponse}\n\n{"action": "calendar.getEvents", "params": {"startDate": "2025-07-04", "endDate": "2025-07-11"}}`;
    }
    
    return randomResponse;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.isInitialized = false;
    console.log('🧹 Local LLM Service cleaned up');
  }
}

/**
 * Mock VectorStore service to resolve compilation errors.
 * In a real application, this would be a full implementation
 * potentially using another TurboModule or a JS-based solution.
 */
class VectorStoreService {
  async addVectors(embeddings: number[][], metadata: any[]): Promise<void> {
    console.log('Mock VectorStore: adding vectors');
  }
  async search(embedding: number[], topK: number, threshold: number): Promise<any[]> {
    console.log('Mock VectorStore: searching');
    return [];
  }
}
const VectorStore = new VectorStoreService();

export const localLLMService = new LocalLLMService();
export default localLLMService;