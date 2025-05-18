#!/usr/bin/env node
// release.js
// Usage: node release.js <repo-path> [--close]

const { execSync } = require('child_process');
const path = require('path');
const readline = require('readline');

function run(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, stdio: 'pipe', shell: true }).toString().trim();
  } catch (err) {
    console.error(`Error running command: ${cmd}`);
    if (err.stdout) console.error('stdout:', err.stdout.toString());
    if (err.stderr) console.error('stderr:', err.stderr.toString());
    throw err;
  }
}

function getLastTag(repoPath) {
  try {
    return run('git describe --tags --abbrev=0', repoPath);
  } catch {
    return '0.0.0'; // No tags yet
  }
}

function incrementTag(tag) {
  let [major, minor, patch] = tag.split('.').map(Number);
  minor += 1;
  if (minor >= 10) {
    major += 1;
    minor = 0;
  }
  return `${major}.${minor}.0`;
}

function pullBranch(repoPath, branch) {
  run(`git checkout ${branch}`, repoPath);
  run(`git pull origin ${branch}`, repoPath);
}

function startRelease(repoPath, version) {
  // Pull latest master and development before starting release
  pullBranch(repoPath, 'master');
  pullBranch(repoPath, 'development');
  run(`git flow release start ${version}`, repoPath);
  // Push the new release branch to remote
  run(`git push origin release/${version}`, repoPath);
}

function finishRelease(repoPath, version) {
  // Pull latest master, development, and release branch before finishing
  pullBranch(repoPath, 'master');
  pullBranch(repoPath, 'development');
  pullBranch(repoPath, `release/${version}`);
  run(`git flow release finish -m "Release ${version}" ${version}`, repoPath);
  run('git checkout master', repoPath);
  run('git push origin master', repoPath);
  run('git checkout development', repoPath);
  run('git push origin development', repoPath);
  run(`git push origin refs/tags/${version}`, repoPath);
}

function releaseBranchExists(repoPath, version) {
  try {
    const branches = run(`git branch --list release/${version}`, repoPath);
    return branches.includes(`release/${version}`);
  } catch {
    return false;
  }
}

function hasUncommittedChanges(repoPath) {
  const status = run('git status --porcelain', repoPath);
  return status.length > 0;
}

function promptUser(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node release.js <repo-path> [--close]');
    process.exit(1);
  }
  const repoPath = path.resolve(args[0]);
  const closeRelease = args.includes('--close');

  if (hasUncommittedChanges(repoPath)) {
    const answer = await promptUser('There are uncommitted changes in the repository. Discard them and proceed? (y/n): ');
    if (answer === 'y' || answer === 'yes') {
      run('git reset --hard', repoPath);
      run('git clean -fd', repoPath);
      console.log('Uncommitted changes discarded.');
    } else {
      console.log('Aborting release process due to uncommitted changes.');
      process.exit(1);
    }
  }

  const lastTag = getLastTag(repoPath);
  const newTag = incrementTag(lastTag);
  console.log(`Last tag: ${lastTag}`);
  console.log(`New release version: ${newTag}`);

  const branchExists = releaseBranchExists(repoPath, newTag);

  if (!branchExists) {
    startRelease(repoPath, newTag);
    console.log(`Started release ${newTag}`);
  } else {
    console.log(`Release branch release/${newTag} already exists.`);
  }

  if (closeRelease) {
    finishRelease(repoPath, newTag);
    console.log(`Finished and pushed release ${newTag}`);
  } else {
    console.log('Release started but not finished. Use --close to finish and push.');
  }
}

main();
