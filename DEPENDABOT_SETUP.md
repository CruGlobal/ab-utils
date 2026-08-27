# Triggering Dependabot Updates in Dependent Repositories

This document explains how to set up automatic Dependabot updates when a new version of `@digiserve/ab-utils` is published.

## How It Works

When a new version of this package is published (after a PR merge), the publish workflow automatically sends `repository_dispatch` events to all configured dependent repositories. These repositories can then listen for these events and trigger Dependabot updates immediately, rather than waiting for the daily Dependabot run.

## Setup in This Repository (ab-utils)

1. **Configure Dependent Repositories**
   - Go to your repository settings → Secrets and variables → Actions → Variables
   - Add a new variable named `DEPENDENT_REPOS`
   - Set the value to a comma-separated list of repositories in the format: `owner/repo1,owner/repo2,owner/repo3`
   - Example: `CruGlobal/service1,CruGlobal/service2,CruGlobal/service3`

2. **Verify Workflow**
   - The workflow is already configured in `.github/workflows/npm-publish.yml`
   - It will automatically trigger after a successful NPM publish

## Setup in Dependent Repositories

To receive and process these update notifications, each dependent repository needs a workflow that listens for `repository_dispatch` events.

### Recommended: Automated PR Creation

This approach automatically creates a pull request with the updated package version, similar to what Dependabot would do.

1. Copy the template workflow from `.github/workflows/trigger-dependabot-template.yml` to your dependent repository
2. Place it in `.github/workflows/update-package-on-notification.yml`
3. The workflow will automatically:
   - Listen for `repository_dispatch` events from ab-utils
   - Update the package version in `package.json`
   - Create a pull request with the update

**Note:** This creates PRs immediately, which is faster than waiting for Dependabot's daily run. If you prefer to let Dependabot handle the PR creation (for consistency with other dependency updates), you can use the alternative approach below.

### Alternative: Trigger Existing Workflow

If you already have a workflow in your dependent repository that handles dependency updates, you can modify it to listen for `repository_dispatch` events:

```yaml
on:
   workflow_dispatch:  # existing trigger
   repository_dispatch:  # add this
      types: [dependabot-update]
```

Then your existing workflow logic will run when the event is received.

## Event Payload

The `repository_dispatch` event includes the following payload:

```json
{
   "event_type": "dependabot-update",
   "client_payload": {
      "package": "@digiserve/ab-utils",
      "version": "1.9.1",
      "source_repo": "CruGlobal/ab-utils"
   }
}
```

## Permissions Required

The GitHub App token used in the publish workflow needs the following permissions:
- `actions: write` - to trigger repository_dispatch events
- Access to all dependent repositories (either through organization membership or repository access)

## Troubleshooting

- **No updates triggered**: Check that `DEPENDENT_REPOS` variable is set correctly
- **Permission denied**: Ensure the GitHub App has access to dependent repositories
- **Workflow not running in dependent repo**: Verify the workflow file exists and is listening for `repository_dispatch` events
- **Dependabot not creating PRs**: Ensure Dependabot is enabled in the dependent repository settings

## Manual Trigger

If you need to manually trigger updates for a specific version, you can use the GitHub CLI:

```bash
gh api repos/OWNER/REPO/dispatches \
   -X POST \
   -f event_type='dependabot-update' \
   -f client_payload='{"package":"@digiserve/ab-utils","version":"1.9.1","source_repo":"CruGlobal/ab-utils"}'
```

