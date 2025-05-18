# release-builder

A Node.js CLI tool to automate GitFlow release creation, versioning, and branch management for your repositories.

## Features

- Automatically increments release version tags (e.g., 1.9.0 → 2.0.0).
- Uses GitFlow to start and finish releases.
- Pushes release branches and tags to remote.
- Ensures master and development branches are up-to-date before release actions.
- Prompts to discard uncommitted changes if present.
- Optionally finishes (merges, tags, pushes) the release.

## Requirements

- Node.js (v14+ recommended)
- git and git-flow installed and initialized in your repository

## Usage

```sh
node release.js <repo-path> [--close]
```

- `<repo-path>`: Path to your local git repository.
- `--close`: (Optional) Finish the release (merge, tag, push).

### Examples

Start a new release:
```sh
node release.js ~/git/my-repo
```

Start and finish a release:
```sh
node release.js ~/git/my-repo --close
```

## How it works

1. Checks for uncommitted changes and prompts to discard or abort.
2. Pulls latest changes for master and development branches.
3. Determines the latest tag and calculates the next version.
4. Starts a new release branch with git-flow and pushes it to remote.
5. If `--close` is used, pulls latest changes for all relevant branches, finishes the release, merges, tags, and pushes to remote.

## Notes

- The development branch is assumed to be named `development`.
- The script will abort if you choose not to discard uncommitted changes.
- If a release branch already exists, it will not be recreated.
