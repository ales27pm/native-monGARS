/**
 * Extracts repository owner, name, and pull request number from a GitHub URL.
 * @param {string | undefined} url
 * @returns {{owner: string, repo: string, prNumber: string} | null}
 */
export function extractPRDetails(url) {
  if (!url) return null;
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2], prNumber: match[3] };
}

/**
 * Maps a line number from a diff patch to the corresponding line number in the file.
 * @param {string} patch
 * @param {number} diffLine
 * @returns {number | null}
 */
export function mapDiffLineToFileLine(patch, diffLine) {
  if (!patch) return null;

  const lines = patch.split('\n');
  let fileLineNumber = 0;
  let diffLineCounter = 0;
  let inHunk = false;

  for (const line of lines) {
    if (line.startsWith('@@')) {
      const match = line.match(/\+(\d+)/);
      if (match && match[1]) {
        fileLineNumber = parseInt(match[1], 10);
        diffLineCounter = 1;
        inHunk = true;
      }
      continue;
    }

    if (!inHunk) continue;

    if (line.startsWith('+') || line.startsWith(' ')) {
      if (diffLineCounter === diffLine) {
        return fileLineNumber;
      }
      fileLineNumber++;
      diffLineCounter++;
    } else if (line.startsWith('-')) {
      diffLineCounter++;
    }
  }

  return null;
}
