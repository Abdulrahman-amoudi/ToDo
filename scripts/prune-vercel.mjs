/**
 * Vercel Deployment Pruner
 * Deletes old preview deployments to free up Vercel Deployment Storage (10 GB limit).
 * 
 * Usage:
 *   node scripts/prune-vercel.mjs <VERCEL_TOKEN> [PROJECT_NAME]
 * Or with env var:
 *   VERCEL_TOKEN=your_token node scripts/prune-vercel.mjs
 */

const token = process.argv[2] || process.env.VERCEL_TOKEN;
const projectName = process.argv[3] || process.env.VERCEL_PROJECT || 'vibe-todos';

if (!token) {
  console.log(`
======================================================
  VERCEL DEPLOYMENT PRUNER (FREE UP STORAGE)
======================================================
To prune old deployments and bring storage below 10GB:
1. Create a Personal Access Token on Vercel:
   https://vercel.com/account/tokens
2. Run this command:
   node scripts/prune-vercel.mjs <YOUR_TOKEN>
======================================================
  `);
  process.exit(1);
}

async function fetchVercel(path, options = {}) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  console.log(`🔍 Fetching deployments for project: ${projectName}...`);
  try {
    const data = await fetchVercel(`/v6/deployments?projectId=${projectName}&limit=100`);
    const deployments = data.deployments || [];
    console.log(`Found ${deployments.length} total deployments.`);

    // Filter to preview deployments or all except the current production deployment
    const targets = deployments.filter(d => d.target !== 'production' && d.state !== 'BUILDING');
    console.log(`Found ${targets.length} non-production deployments eligible for deletion.`);

    if (targets.length === 0) {
      console.log('No old preview deployments found to delete.');
      return;
    }

    let deleted = 0;
    for (const dep of targets) {
      try {
        console.log(`Deleting deployment ${dep.uid} (${dep.url} - created ${new Date(dep.created).toISOString()})...`);
        await fetchVercel(`/v13/deployments/${dep.uid}`, { method: 'DELETE' });
        deleted++;
      } catch (err) {
        console.error(`Failed to delete ${dep.uid}:`, err.message);
      }
    }
    console.log(`\n✅ Successfully deleted ${deleted} old deployments! Storage will update on Vercel.`);
  } catch (err) {
    console.error('Error pruning deployments:', err.message);
  }
}

main();
