import { useState, useCallback } from 'react';

// Mock implementation for the template environment
// In production, this would import from the actual RAG services

interface Document {
  id: string;
  content: string;
  metadata?: {
    source?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata?: any;
}

interface RAGStats {
  documentCount: number;
  totalSize: number;
}

export function useRAG() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stats: RAGStats = {
    documentCount: documents.length,
    totalSize: documents.reduce((acc, doc) => acc + doc.content.length, 0)
  };

  const indexDocument = useCallback(async (document: Document): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));

      setDocuments(prev => [...prev, document]);
      setIsProcessing(false);
      return true;
    } catch (err) {
      setError('Failed to index document');
      setIsProcessing(false);
      return false;
    }
  }, []);

  const search = useCallback(async (query: string): Promise<SearchResult[]> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock search logic - simple text matching
      const results = documents
        .map(doc => ({
          id: doc.id,
          content: doc.content,
          score: Math.random() * 0.5 + 0.5, // Random score between 0.5-1.0
          metadata: doc.metadata
        }))
        .filter(result => 
          result.content.toLowerCase().includes(query.toLowerCase()) ||
          query.toLowerCase().includes('sample') // Always include for demo
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      // Add a sample result if no matches
      if (results.length === 0) {
        results.push({
          id: 'sample',
          content: `Sample search result for "${query}". This demonstrates how semantic search would work with indexed documents.`,
          score: 0.85,
          metadata: { source: 'demo' }
        });
      }

      setSearchResults(results);
      setIsProcessing(false);
      return results;
    } catch (err) {
      setError('Failed to search documents');
      setIsProcessing(false);
      return [];
    }
  }, [documents]);

  const clearDatabase = useCallback(async (): Promise<boolean> => {
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setDocuments([]);
      setSearchResults([]);
      setIsProcessing(false);
      return true;
    } catch (err) {
      setError('Failed to clear database');
      setIsProcessing(false);
      return false;
    }
  }, []);

  const refreshStats = useCallback(async (): Promise<void> => {
    // Stats are computed in real-time, no need for async operation
    return Promise.resolve();
  }, []);

  return {
    documents,
    searchResults,
    stats,
    isProcessing,
    error,
    indexDocument,
    search,
    clearDatabase,
    refreshStats
  };
}