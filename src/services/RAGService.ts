import { getAnthropicTextResponse } from '../api/chat-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Document {
  id: string;
  title: string;
  content: string;
  metadata: {
    source: string;
    type: 'text' | 'pdf' | 'web' | 'note';
    tags: string[];
    created: Date;
    modified: Date;
  };
  embedding?: number[];
}

export interface SearchResult {
  document: Document;
  score: number;
  relevantChunks: string[];
}

export interface RAGStats {
  documentCount: number;
  totalTokens: number;
  indexSize: number;
  lastIndexed: Date | null;
}

export class RAGService {
  private static instance: RAGService;
  private documents: Map<string, Document> = new Map();
  private initialized = false;
  private readonly STORAGE_KEY = 'monGARS_RAG_Documents';
  private readonly CHUNK_SIZE = 512;
  private readonly OVERLAP_SIZE = 50;

  static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        const documents = JSON.parse(storedData);
        this.documents = new Map(
          documents.map((doc: any) => [
            doc.id,
            {
              ...doc,
              metadata: {
                ...doc.metadata,
                created: new Date(doc.metadata.created),
                modified: new Date(doc.metadata.modified),
              },
            },
          ])
        );
      }
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing RAG service:', error);
      // Initialize with empty state
      this.documents = new Map();
      this.initialized = true;
    }
  }

  private async persistDocuments(): Promise<void> {
    try {
      const documentsArray = Array.from(this.documents.values());
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(documentsArray));
    } catch (error) {
      console.error('Error persisting documents:', error);
    }
  }

  private chunkText(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + this.CHUNK_SIZE, text.length);
      const chunk = text.slice(start, end);
      chunks.push(chunk);
      start = end - this.OVERLAP_SIZE;
    }

    return chunks;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Simple text-based similarity for now
    // In a real implementation, you'd use a proper embedding model
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(100).fill(0);

    // Simple hash-based embedding
    for (const word of words) {
      const hash = this.simpleHash(word);
      embedding[hash % 100] += 1;
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
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

  async addDocument(
    title: string,
    content: string,
    metadata: Partial<Document['metadata']> = {}
  ): Promise<string> {
    await this.initialize();

    const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const document: Document = {
      id,
      title,
      content,
      metadata: {
        source: metadata.source || 'manual',
        type: metadata.type || 'text',
        tags: metadata.tags || [],
        created: now,
        modified: now,
      },
      embedding: await this.generateEmbedding(content),
    };

    this.documents.set(id, document);
    await this.persistDocuments();
    return id;
  }

  async updateDocument(
    id: string,
    updates: Partial<Pick<Document, 'title' | 'content' | 'metadata'>>
  ): Promise<void> {
    await this.initialize();

    const document = this.documents.get(id);
    if (!document) {
      throw new Error(`Document with ID ${id} not found`);
    }

    const updatedDocument: Document = {
      ...document,
      ...updates,
      metadata: {
        ...document.metadata,
        ...updates.metadata,
        modified: new Date(),
      },
    };

    // Regenerate embedding if content changed
    if (updates.content) {
      updatedDocument.embedding = await this.generateEmbedding(updates.content);
    }

    this.documents.set(id, updatedDocument);
    await this.persistDocuments();
  }

  async deleteDocument(id: string): Promise<void> {
    await this.initialize();

    if (!this.documents.has(id)) {
      throw new Error(`Document with ID ${id} not found`);
    }

    this.documents.delete(id);
    await this.persistDocuments();
  }

  async searchDocuments(
    query: string,
    options: {
      limit?: number;
      minScore?: number;
      type?: Document['metadata']['type'];
      tags?: string[];
    } = {}
  ): Promise<SearchResult[]> {
    await this.initialize();

    const { limit = 10, minScore = 0.1, type, tags } = options;

    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    const results: SearchResult[] = [];

    for (const document of this.documents.values()) {
      // Filter by type if specified
      if (type && document.metadata.type !== type) continue;

      // Filter by tags if specified
      if (tags && tags.length > 0) {
        const hasMatchingTag = tags.some(tag => 
          document.metadata.tags.includes(tag)
        );
        if (!hasMatchingTag) continue;
      }

      // Calculate similarity
      const score = document.embedding
        ? this.cosineSimilarity(queryEmbedding, document.embedding)
        : 0;

      if (score >= minScore) {
        // Find relevant chunks
        const chunks = this.chunkText(document.content);
        const relevantChunks = chunks.filter(chunk =>
          chunk.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 3);

        results.push({
          document,
          score,
          relevantChunks,
        });
      }
    }

    // Sort by score (descending) and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getDocument(id: string): Promise<Document | null> {
    await this.initialize();
    return this.documents.get(id) || null;
  }

  async getAllDocuments(): Promise<Document[]> {
    await this.initialize();
    return Array.from(this.documents.values());
  }

  async getDocumentsByTag(tag: string): Promise<Document[]> {
    await this.initialize();
    return Array.from(this.documents.values()).filter(doc =>
      doc.metadata.tags.includes(tag)
    );
  }

  async getStats(): Promise<RAGStats> {
    await this.initialize();

    const documents = Array.from(this.documents.values());
    const totalTokens = documents.reduce((sum, doc) => 
      sum + doc.content.split(/\s+/).length, 0
    );

    const lastIndexed = documents.length > 0
      ? documents.reduce((latest, doc) => 
          doc.metadata.modified > latest ? doc.metadata.modified : latest,
          documents[0].metadata.modified
        )
      : null;

    return {
      documentCount: documents.length,
      totalTokens,
      indexSize: documents.length * 100, // Approximate embedding size
      lastIndexed,
    };
  }

  async generateContextualResponse(
    query: string,
    maxContextLength: number = 2000
  ): Promise<string> {
    await this.initialize();

    // Search for relevant documents
    const searchResults = await this.searchDocuments(query, { limit: 5 });

    if (searchResults.length === 0) {
      return "I don't have any relevant information in my knowledge base to answer your question.";
    }

    // Build context from search results
    let context = '';
    let contextLength = 0;

    for (const result of searchResults) {
      const docContext = `Document: ${result.document.title}\n${result.document.content}\n\n`;
      if (contextLength + docContext.length <= maxContextLength) {
        context += docContext;
        contextLength += docContext.length;
      } else {
        break;
      }
    }

    // Generate response using AI with context
    const prompt = `Based on the following context, please answer the question: "${query}"

Context:
${context}

Please provide a helpful and accurate response based on the information provided. If the context doesn't contain enough information to fully answer the question, please indicate that.`;

    try {
      const response = await getAnthropicTextResponse([
        { role: 'user', content: prompt }
      ]);
      return response.content;
    } catch (error) {
      console.error('Error generating contextual response:', error);
      return "I found relevant information but encountered an error while generating a response. Please try again.";
    }
  }

  async clearAllDocuments(): Promise<void> {
    await this.initialize();
    this.documents.clear();
    await this.persistDocuments();
  }
}