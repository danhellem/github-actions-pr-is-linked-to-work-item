# Action, check for linked Azure DevOps work item

Use this action to check your pull request to make sure it is linked to a work item using ``AB#`` before you can merge.

[Click here](https://github.com/marketplace/actions/check-for-ab) to see the action in the GitHub marketplace

## 💁‍♂️ Usage

Make sure the GitHub repository is properly linked to an Azure DevOps project. The following docs will help you get started and setup:

- [Learn about the Azure Boards - GitHub integration](https://learn.microsoft.com/en-us/azure/devops/boards/github/?view=azure-devops)
- [Install the Azure Boards app](https://github.com/marketplace/azure-boards)
- [Connect a GitHub repository to Azure Boards](https://learn.microsoft.com/en-us/azure/devops/boards/github/add-remove-repositories?view=azure-devops)
- [Link GitHub commits and pull requests to work items in Azure Boards](https://learn.microsoft.com/en-us/azure/devops/boards/github/link-to-from-github?view=azure-devops)

## 👩‍🏫 How it works

The action will check the pull request description for ``AB#`` and a valid work item id. If it finds a valid work item id, it will pass. If it does not find a valid work item id, it will fail.

If the sender is ``dependabot[bot]`` the action will ignore the check.

## 🔑 Permissions

You might get an error whent the action is run. If you open the error log and see something like this:

``
"Error: Resource not accessible by integration" 
``

To fix this, go to ``https://github.com/{owner}/{repo}/settings/actions`` and in **Workflow Permissions** section give actions **Read and Write permissions**. That provides the token with rights to modify your repo and solves your problem.

## ✅ Codes

We use a series of code values to mark and check previous comments to ensure the actions does not get too chatty after each run. For example, if you don't add ``AB#{ID}`` to the description, we don't need to tell you every time you update the desciption. We will only tell you once untill something changes.

### lcc-200

Successfully found a valid work item id in the pull request description.

### lcc-404

Missing ``AB#`` in the pull request description.

### lcc-416

Found ``AB#`` but the work item id is not valid.

## 📄 validate-pr-ab.yml

This is the main workflow file. It will run on any pull request that is opened, reopened, or edited. It will only run on the ``main`` branch. This file needs to be added to the ``.github/workflows`` folder in your repository.

```yml
name: 'Description contains AB# with a valid work item id'
on: # rebuild any PRs for main branch changes
  pull_request:
    types: [opened, reopened, edited]
    branches:
      - main 
jobs:
  create-edit-comment:
    name: check   
    runs-on: ubuntu-latest
    steps:
      - uses: danhellem/github-actions-pr-is-linked-to-work-item@main
```

# 🪲 Known issues

- When you add AB# the ``azure-boards[bot]`` runs to link the AB#{ID} to the work item. However, the action is triggered first and fails becuase the work item is not linked yet. Then the bot runs to link. This creates an extra failed message to show up in the comments. This is a known issue and we are working on a way to fix it.
