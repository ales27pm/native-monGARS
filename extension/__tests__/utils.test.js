import { extractPRDetails, mapDiffLineToFileLine } from '../utils.js';

describe('extractPRDetails', () => {
  it('should extract owner, repo and PR number', () => {
    const url = 'https://github.com/user/repo/pull/123';
    expect(extractPRDetails(url)).toEqual({ owner: 'user', repo: 'repo', prNumber: '123' });
  });

  it('should return null for invalid url', () => {
    expect(extractPRDetails('https://example.com')).toBeNull();
  });
});

describe('mapDiffLineToFileLine', () => {
  const patch = `@@ -1,2 +1,3 @@\n line1\n-line2\n+line2 updated\n line3`; 
  it('maps diff line to file line correctly', () => {
    expect(mapDiffLineToFileLine(patch, 2)).toBe(2); // line2 updated corresponds to file line 2
  });

  it('returns null for out of range line', () => {
    expect(mapDiffLineToFileLine(patch, 10)).toBeNull();
  });
});
