# Action, check for linked Azure DevOps work item

Use this action to check your pull request to make sure it is linked to a work item using ``AB#`` before you can merge.

Click here to see the action in the GitHub marketplace.

## Usage

Make sure the GitHub repository is properly linked to an Azure DevOps project. The following docs will help you get started and setup:

- [Learn about the Azure Boards - GitHub integration](https://learn.microsoft.com/en-us/azure/devops/boards/github/?view=azure-devops)
- [Install the Azure Boards app](https://github.com/marketplace/azure-boards)
- [Connect a GitHub repository to Azure Boards](https://learn.microsoft.com/en-us/azure/devops/boards/github/add-remove-repositories?view=azure-devops)
- [Link GitHub commits and pull requests to work items in Azure Boards](https://learn.microsoft.com/en-us/azure/devops/boards/github/link-to-from-github?view=azure-devops)

## How it works

The action will check the pull request description for ``AB#`` and a valid work item id. If it finds a valid work item id, it will pass. If it does not find a valid work item id, it will fail.

## validate-pr-ab.yml

Create the following ``.yml`` file and place into the ``.github/workflows`` folder.

```yml
name: 'Contains AB# with a valid work item id'
on: # rebuild any PRs for main branch changes
  pull_request:
    types: [opened, reopened, edited]
    branches:
      - main 
jobs:
  create-edit-comment:
    name: Validate for AB#    
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: ./
```