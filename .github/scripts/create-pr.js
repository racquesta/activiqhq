const { execSync } = require('child_process');

const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
const branch = process.env.GITHUB_REF.replace('refs/heads/', '');
const token = process.env.GITHUB_TOKEN;
const apiKey = process.env.ANTHROPIC_API_KEY;

const title = branch
  .replace(/[-_]/g, ' ')
  .replace(/\b\w/g, c => c.toUpperCase());

async function githubRequest(path, method = 'GET', body = null) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    ...(body && { body: JSON.stringify(body) })
  });
  return res.json();
}

async function run() {
  // Check if PR already exists
  // Check if PR already exists
  const existingPRs = await githubRequest(`/pulls?head=${owner}:${branch}&state=open`);
  console.log('Existing PRs response:', JSON.stringify(existingPRs));
  if (existingPRs.length > 0) {
    console.log(`PR already exists for branch: ${branch}`);
    return;
  }

  // Get default branch
  const repoData = await githubRequest('');
  const defaultBranch = repoData.default_branch;
  console.log('Default branch:', repoData.default_branch);

  // Get the diff
  const diff = execSync(
    `git diff origin/${defaultBranch}...HEAD -- . ':(exclude)package-lock.json' ':(exclude)*.lock'`
  ).toString().slice(0, 20000);
  console.log('Diff length:', diff.length);

  // Call Claude API
  const prompt =
    'Generate a concise GitHub PR description for the following diff.\n\n' +
    'Use this markdown structure:\n' +
    '## What changed\n' +
    '(bullet points of key changes)\n\n' +
    '## Why\n' +
    '(inferred reason/purpose)\n\n' +
    '## Notes\n' +
    '(anything reviewers should pay attention to, or "None")\n\n' +
    '## Security\n' +
    '(security considerations, if any)\n\n' +
    'Diff:\n' + diff;

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const claudeData = await claudeRes.json();
  console.log('Claude response:', JSON.stringify(claudeData));
  const body = claudeData.content[0].text;

  // Create the PR
  const response = await githubRequest('/pulls', 'POST', {
    title,
    head: branch,
    base: defaultBranch,
    draft: true,
    body
  });

  console.log('PR creation response:', JSON.stringify(response));
  console.log(`Draft PR created with AI description for branch: ${branch}`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

// force change