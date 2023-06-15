import * as core from '@actions/core'
import * as github from '@actions/github'
import {Context} from '@actions/github/lib/context'

//import {wait} from './wait'

// async function run(): Promise<void> {
//   try {
//     const ms: string = core.getInput('milliseconds')
//     core.debug(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

//     core.debug(new Date().toTimeString())
//     await wait(parseInt(ms, 10))
//     core.debug(new Date().toTimeString())

//     core.setOutput('time', new Date().toTimeString())
//   } catch (error) {
//     if (error instanceof Error) core.setFailed(error.message)
//   }
// }

async function run(): Promise<void> {
  try {
    const context: Context = github.context
    const pull_request_number = context.payload.pull_request?.number ?? 0
    const pull_request_description = context.payload.pull_request?.body
    const github_token: string = core.getInput('repo-token')

    const octokit = github.getOctokit(github_token)

    // check if pull request description contains a link to an Azure Boards work item
    if (
      pull_request_description?.includes('[AB#') &&
      pull_request_description?.includes('/_workitems/edit/')
    ) {
      await octokit.rest.issues.createComment({
        ...context.repo,
        issue_number: pull_request_number,
        body: 'Pull request description contains a link to an Azure Boards work item.'
      })
    } else {
      await octokit.rest.issues.createComment({
        ...context.repo,
        issue_number: pull_request_number,
        body: 'Pull request does not contain a link to an Azure Boards work item. Use AB#<work item number> in the pull request description or comment.'
      })

      core.setFailed(
        'Pull request does not contain a link to an Azure Boards work item.'
      )
    }

    octokit == null
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
