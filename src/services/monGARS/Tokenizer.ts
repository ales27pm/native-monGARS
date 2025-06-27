// Tokenizer utilities for native-monGARS
// Simple tokenization for LLM caching

export function encodeTokens(text: string): string[] {
  // Simple word-based tokenization
  // In production, you might use a more sophisticated tokenizer
  return text.trim().split(/\s+/).filter(token => token.length > 0);
}

export function decodeTokens(tokens: string[]): string {
  return tokens.join(' ');
}

export function computeTolerance(tokens: string[]): number {
  // Compute tolerance score based on token diversity
  // Higher tolerance = more diverse content = less likely to be evicted
  if (tokens.length === 0) return 0;
  
  const uniqueTokens = new Set(tokens);
  const diversity = uniqueTokens.size / tokens.length;
  
  // Also consider token length distribution
  const avgLength = tokens.reduce((sum, token) => sum + token.length, 0) / tokens.length;
  const lengthBonus = Math.min(avgLength / 10, 0.3); // Bonus for longer tokens
  
  return Math.min(diversity + lengthBonus, 1.0);
}

// Advanced tokenization utilities
export function getTokenFrequency(tokens: string[]): Map<string, number> {
  const frequency = new Map<string, number>();
  
  for (const token of tokens) {
    frequency.set(token, (frequency.get(token) || 0) + 1);
  }
  
  return frequency;
}

export function computeSemanticScore(tokens: string[]): number {
  // Compute semantic importance score
  // Higher score for tokens that are likely to be semantically important
  const frequency = getTokenFrequency(tokens);
  const totalTokens = tokens.length;
  
  let score = 0;
  for (const [token, count] of frequency.entries()) {
    // Penalize very common words (stop words)
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
    
    if (!commonWords.has(token.toLowerCase())) {
      // Boost score for less frequent, potentially more important tokens
      const importance = Math.log(totalTokens / count);
      score += importance * (token.length / 10); // Length bonus
    }
  }
  
  return Math.min(score / totalTokens, 1.0);
}