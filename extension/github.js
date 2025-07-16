import { GITHUB_API_URL } from './config.js';

async function githubApiRequest(endpoint, token, options = {}) {
  const url = `${GITHUB_API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`GitHub API Error: ${response.status} - ${errorData.message}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const fetchPRFiles = (prDetails, token) =>
  githubApiRequest(`/repos/${prDetails.owner}/${prDetails.repo}/pulls/${prDetails.prNumber}/files`, token);

export const fetchPRData = (prDetails, token) =>
  githubApiRequest(`/repos/${prDetails.owner}/${prDetails.repo}/pulls/${prDetails.prNumber}`, token);

export const postPRComment = (token, prDetails, comment) =>
  githubApiRequest(
    `/repos/${prDetails.owner}/${prDetails.repo}/pulls/${prDetails.prNumber}/comments`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...comment, side: 'RIGHT' }),
    }
  );
