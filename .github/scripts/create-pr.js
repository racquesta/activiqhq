async function run() {
  // Check if PR already exists
  const existingPRs = await githubRequest(`/pulls?head=${owner}:${branch}&state=open`);
  console.log('Existing PRs response:', JSON.stringify(existingPRs));

  if (existingPRs.length > 0) {
    console.log(`PR already exists for branch: ${branch}`);
    return;
  }

  const repoData = await githubRequest('');
  console.log('Default branch:', repoData.default_branch);

  const defaultBranch = repoData.default_branch;

  const diff = execSync(
    `git diff origin/${defaultBranch}...HEAD -- . ':(exclude)package-lock.json' ':(exclude)*.lock'`
  ).toString().slice(0, 20000);
  console.log('Diff length:', diff.length);

  // ... rest of the function

  const claudeData = await claudeRes.json();
  console.log('Claude response:', JSON.stringify(claudeData));

  const body = claudeData.content[0].text;

  const prResponse = await githubRequest('/pulls', 'POST', {
    title,
    head: branch,
    base: defaultBranch,
    draft: true,
    body
  });
  console.log('PR creation response:', JSON.stringify(prResponse));