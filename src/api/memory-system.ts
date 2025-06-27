import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  MemoryEntry, 
  MemoryCluster, 
  UserProfile, 
  MemorySearchQuery, 
  MemorySearchResult,
  LearningPattern,
  LearningInsight
} from '../types/memory';
import { getOpenAIClient } from './openai';

export class MemorySystem {
  private memories: Map<string, MemoryEntry> = new Map();
  private clusters: Map<string, MemoryCluster> = new Map();
  private userProfile: UserProfile | null = null;
  private patterns: Map<string, LearningPattern> = new Map();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.loadFromStorage();
      this.isInitialized = true;
      console.log('ARIA: Memory system initialized');
    } catch (error) {
      console.error('Memory system initialization error:', error);
    }
  }

  // Memory Storage and Retrieval
  async storeMemory(
    type: MemoryEntry['type'],
    category: string,
    content: string,
    source: MemoryEntry['metadata']['source'] = 'user',
    metadata: Partial<MemoryEntry['metadata']> = {}
  ): Promise<string> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate embedding for semantic search
    const embedding = await this.generateEmbedding(content);
    
    // Extract keywords
    const keywords = await this.extractKeywords(content);
    
    const memory: MemoryEntry = {
      id,
      type,
      category,
      content,
      metadata: {
        timestamp: new Date(),
        source,
        confidence: metadata.confidence || 0.8,
        relevance: metadata.relevance || 0.5,
        associations: metadata.associations || [],
        embedding,
        keywords,
        ...metadata,
      },
      access: {
        lastAccessed: new Date(),
        accessCount: 0,
        importance: this.calculateImportance(type, source, content),
        decay: 1.0,
      },
      validation: {
        verified: false,
        contradictions: [],
        supporting: [],
      },
    };

    this.memories.set(id, memory);
    
    // Update clusters
    await this.updateClusters(memory);
    
    // Store persistently
    await this.saveToStorage();
    
    console.log(`ARIA: Stored memory [${type}]: ${content.substring(0, 50)}...`);
    return id;
  }

  async retrieveMemories(query: MemorySearchQuery): Promise<MemorySearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(query.query);
    const results: MemorySearchResult[] = [];

    for (const memory of this.memories.values()) {
      // Filter by type and category
      if (query.type && memory.type !== query.type) continue;
      if (query.category && memory.category !== query.category) continue;
      
      // Filter by time range
      if (query.timeRange) {
        const memTime = memory.metadata.timestamp;
        if (memTime < query.timeRange.start || memTime > query.timeRange.end) continue;
      }

      // Calculate relevance score
      const relevanceScore = this.calculateRelevance(memory, query, queryEmbedding);
      
      if (relevanceScore >= (query.relevanceThreshold || 0.3)) {
        // Update access patterns
        memory.access.lastAccessed = new Date();
        memory.access.accessCount++;
        
        // Find related memories
        const related = query.includeRelated 
          ? await this.findRelatedMemories(memory, 3)
          : [];

        results.push({
          entry: memory,
          relevanceScore,
          reasoning: this.generateRelevanceReasoning(memory, query, relevanceScore),
          related,
        });
      }
    }

    // Sort by relevance and limit results
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return results.slice(0, query.maxResults || 10);
  }

  // User Profile Management
  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!this.userProfile) {
      this.userProfile = this.createDefaultUserProfile();
    }

    this.userProfile = { ...this.userProfile, ...updates };
    await this.saveToStorage();
    
    console.log('ARIA: User profile updated');
  }

  async learnFromInteraction(
    userInput: string,
    aiResponse: string,
    feedback: 'positive' | 'negative' | 'neutral',
    context: any
  ): Promise<void> {
    // Store interaction memory
    await this.storeMemory(
      'conversation',
      'interaction',
      `User: ${userInput}\nAI: ${aiResponse}\nFeedback: ${feedback}`,
      'user',
      { confidence: feedback === 'positive' ? 0.9 : 0.6 }
    );

    // Update user preferences based on feedback
    if (feedback === 'positive') {
      await this.reinforceSuccessfulPattern(userInput, aiResponse, context);
    } else if (feedback === 'negative') {
      await this.learnFromFailure(userInput, aiResponse, context);
    }

    // Update patterns
    await this.updateLearningPatterns(userInput, aiResponse, feedback, context);
  }

  // Advanced Learning Capabilities
  async generatePersonalizedResponse(
    query: string,
    baseResponse: string,
    context: any
  ): Promise<string> {
    if (!this.userProfile) return baseResponse;

    // Retrieve relevant memories
    const memories = await this.retrieveMemories({
      query,
      type: 'preference',
      maxResults: 5,
      includeRelated: true,
    });

    // Get communication preferences
    const { communication } = this.userProfile.preferences;
    
    // Adapt response based on learned preferences
    let personalizedResponse = baseResponse;

    // Adjust verbosity
    if (communication.verbosity === 'concise') {
      personalizedResponse = await this.makeResponseConcise(personalizedResponse);
    } else if (communication.verbosity === 'comprehensive') {
      personalizedResponse = await this.expandResponse(personalizedResponse, memories);
    }

    // Add examples if preferred
    if (communication.examples) {
      personalizedResponse = await this.addRelevantExamples(personalizedResponse, memories);
    }

    // Adjust tone based on learned style
    personalizedResponse = await this.adjustTone(personalizedResponse, communication.style);

    return personalizedResponse;
  }

  async generateLearningInsights(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Analyze usage patterns
    const usageInsights = await this.analyzeUsagePatterns();
    insights.push(...usageInsights);

    // Analyze preference evolution
    const preferenceInsights = await this.analyzePreferenceEvolution();
    insights.push(...preferenceInsights);

    // Analyze success patterns
    const successInsights = await this.analyzeSuccessPatterns();
    insights.push(...successInsights);

    // Generate improvement suggestions
    const improvementInsights = await this.generateImprovementSuggestions();
    insights.push(...improvementInsights);

    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  // Memory Clustering and Organization
  private async updateClusters(memory: MemoryEntry): Promise<void> {
    if (!memory.metadata.embedding) return;

    let bestCluster: MemoryCluster | null = null;
    let bestSimilarity = 0;

    // Find best matching cluster
    for (const cluster of this.clusters.values()) {
      const similarity = this.calculateCosineSimilarity(
        memory.metadata.embedding,
        cluster.centroid
      );

      if (similarity > bestSimilarity && similarity > 0.7) {
        bestSimilarity = similarity;
        bestCluster = cluster;
      }
    }

    if (bestCluster) {
      // Add to existing cluster
      bestCluster.entries.push(memory.id);
      bestCluster.updatedAt = new Date();
      bestCluster.strength += 0.1;
      
      // Update centroid
      await this.updateClusterCentroid(bestCluster);
    } else {
      // Create new cluster
      const clusterId = `cluster_${Date.now()}`;
      const newCluster: MemoryCluster = {
        id: clusterId,
        name: await this.generateClusterName(memory),
        description: await this.generateClusterDescription(memory),
        entries: [memory.id],
        centroid: memory.metadata.embedding,
        createdAt: new Date(),
        updatedAt: new Date(),
        strength: 1.0,
      };

      this.clusters.set(clusterId, newCluster);
    }
  }

  // Utility Methods
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const openaiClient = getOpenAIClient();
      const response = await openaiClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      // Return a simple hash-based embedding as fallback
      return this.generateSimpleEmbedding(text);
    }
  }

  private generateSimpleEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      embedding[hash % 384] += 1;
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private async extractKeywords(text: string): Promise<string[]> {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const stopWords = new Set(['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'said', 'each', 'which', 'their', 'time', 'more', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were']);
    
    return words.filter(word => !stopWords.has(word)).slice(0, 10);
  }

  private calculateImportance(
    type: MemoryEntry['type'],
    source: MemoryEntry['metadata']['source'],
    content: string
  ): number {
    let importance = 0.5;

    // Type-based importance
    switch (type) {
      case 'preference': importance += 0.3; break;
      case 'fact': importance += 0.2; break;
      case 'skill': importance += 0.25; break;
      case 'pattern': importance += 0.15; break;
      default: importance += 0.1;
    }

    // Source-based importance
    switch (source) {
      case 'user': importance += 0.2; break;
      case 'ai': importance += 0.1; break;
      case 'context': importance += 0.05; break;
      default: importance += 0.0;
    }

    // Content-based importance
    if (content.length > 100) importance += 0.1;
    if (content.includes('important') || content.includes('remember')) importance += 0.2;

    return Math.min(importance, 1.0);
  }

  private calculateRelevance(
    memory: MemoryEntry,
    query: MemorySearchQuery,
    queryEmbedding: number[]
  ): number {
    let relevance = 0;

    // Semantic similarity
    if (memory.metadata.embedding && queryEmbedding) {
      relevance += this.calculateCosineSimilarity(memory.metadata.embedding, queryEmbedding) * 0.4;
    }

    // Keyword matching
    const queryKeywords = query.query.toLowerCase().split(/\s+/);
    const matchingKeywords = memory.metadata.keywords.filter(keyword =>
      queryKeywords.some(qk => keyword.includes(qk) || qk.includes(keyword))
    );
    relevance += (matchingKeywords.length / Math.max(memory.metadata.keywords.length, 1)) * 0.3;

    // Recency and access patterns
    const daysSinceCreated = (Date.now() - memory.metadata.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    relevance += Math.max(0, (1 - daysSinceCreated / 30)) * 0.1; // Favor recent memories

    relevance += Math.min(memory.access.accessCount / 10, 0.1); // Favor frequently accessed

    // Importance and confidence
    relevance += memory.access.importance * 0.1;
    relevance += memory.metadata.confidence * 0.1;

    return Math.min(relevance, 1.0);
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private generateRelevanceReasoning(
    memory: MemoryEntry,
    query: MemorySearchQuery,
    score: number
  ): string {
    const reasons = [];

    if (score > 0.8) reasons.push('High semantic similarity');
    if (memory.metadata.keywords.some(k => query.query.toLowerCase().includes(k))) {
      reasons.push('Keyword match');
    }
    if (memory.access.accessCount > 5) reasons.push('Frequently accessed');
    if (memory.access.importance > 0.7) reasons.push('High importance');

    return reasons.length > 0 ? reasons.join(', ') : 'Content relevance';
  }

  // Storage Management
  private async saveToStorage(): Promise<void> {
    try {
      const memoryData = {
        memories: Array.from(this.memories.entries()),
        clusters: Array.from(this.clusters.entries()),
        userProfile: this.userProfile,
        patterns: Array.from(this.patterns.entries()),
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem('aria_memory_system', JSON.stringify(memoryData));
    } catch (error) {
      console.error('Memory save error:', error);
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('aria_memory_system');
      if (!data) return;

      const parsed = JSON.parse(data);
      
      this.memories = new Map(parsed.memories || []);
      this.clusters = new Map(parsed.clusters || []);
      this.userProfile = parsed.userProfile;
      this.patterns = new Map(parsed.patterns || []);

      console.log(`ARIA: Loaded ${this.memories.size} memories and ${this.clusters.size} clusters`);
    } catch (error) {
      console.error('Memory load error:', error);
    }
  }

  private createDefaultUserProfile(): UserProfile {
    return {
      id: `user_${Date.now()}`,
      preferences: {
        communication: {
          style: 'adaptive',
          verbosity: 'detailed',
          examples: true,
          explanations: true,
        },
        ai: {
          preferredModel: 'adaptive',
          consensusThreshold: 0.8,
          creativityLevel: 0.7,
          factualityImportance: 0.8,
        },
        features: {
          voiceEnabled: true,
          cameraEnabled: true,
          sensorsEnabled: true,
          autonomousMode: true,
          proactiveMode: true,
        },
        topics: {
          interests: [],
          expertise: [],
          avoidance: [],
        },
      },
      patterns: {
        usage: {
          mostActiveHours: [],
          preferredFeatures: [],
          sessionDuration: 0,
          frequentQueries: [],
        },
        behavior: {
          responsiveness: 0.5,
          explorationLevel: 0.5,
          trustLevel: 0.5,
          feedbackFrequency: 0.1,
        },
      },
      learning: {
        strengths: [],
        weaknesses: [],
        improvementAreas: [],
        successfulInteractions: [],
      },
      context: {
        location: {
          frequentPlaces: [],
        },
        schedule: {
          routines: [],
        },
        devices: {
          primary: 'mobile',
          battery: { lowThreshold: 20, patterns: [] },
          connectivity: { preferred: 'wifi', patterns: [] },
        },
      },
    };
  }

  // Placeholder methods for advanced features
  private async findRelatedMemories(memory: MemoryEntry, limit: number): Promise<MemoryEntry[]> {
    // Implementation would find semantically related memories
    return [];
  }

  private async reinforceSuccessfulPattern(userInput: string, aiResponse: string, context: any): Promise<void> {
    // Implementation would reinforce successful interaction patterns
  }

  private async learnFromFailure(userInput: string, aiResponse: string, context: any): Promise<void> {
    // Implementation would learn from negative feedback
  }

  private async updateLearningPatterns(userInput: string, aiResponse: string, feedback: string, context: any): Promise<void> {
    // Implementation would update learning patterns
  }

  private async makeResponseConcise(response: string): Promise<string> {
    // Implementation would make responses more concise
    return response;
  }

  private async expandResponse(response: string, memories: MemorySearchResult[]): Promise<string> {
    // Implementation would expand responses with relevant context
    return response;
  }

  private async addRelevantExamples(response: string, memories: MemorySearchResult[]): Promise<string> {
    // Implementation would add relevant examples
    return response;
  }

  private async adjustTone(response: string, style: string): Promise<string> {
    // Implementation would adjust response tone
    return response;
  }

  private async analyzeUsagePatterns(): Promise<LearningInsight[]> {
    // Implementation would analyze usage patterns
    return [];
  }

  private async analyzePreferenceEvolution(): Promise<LearningInsight[]> {
    // Implementation would analyze how preferences change over time
    return [];
  }

  private async analyzeSuccessPatterns(): Promise<LearningInsight[]> {
    // Implementation would analyze successful interaction patterns
    return [];
  }

  private async generateImprovementSuggestions(): Promise<LearningInsight[]> {
    // Implementation would generate improvement suggestions
    return [];
  }

  private async updateClusterCentroid(cluster: MemoryCluster): Promise<void> {
    // Implementation would update cluster centroid
  }

  private async generateClusterName(memory: MemoryEntry): Promise<string> {
    return `Cluster_${memory.category}`;
  }

  private async generateClusterDescription(memory: MemoryEntry): Promise<string> {
    return `Cluster for ${memory.category} memories`;
  }

  // Public API
  getUserProfile(): UserProfile | null {
    return this.userProfile;
  }

  getMemoryCount(): number {
    return this.memories.size;
  }

  getClusterCount(): number {
    return this.clusters.size;
  }

  async clearMemories(): Promise<void> {
    this.memories.clear();
    this.clusters.clear();
    this.patterns.clear();
    await this.saveToStorage();
    console.log('ARIA: Memory system cleared');
  }
}

export const memorySystem = new MemorySystem();