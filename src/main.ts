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
    const pull_request_number = context.payload.pull_request?.number
    const github_token: string = core.getInput('repo-token')

    const octokit = github.getOctokit(github_token)

    console.log(`Hello World: ${pull_request_number} : ${github_token}`)
    core.setOutput('time', new Date().toTimeString())

    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: pull_request_number!,
      body: 'Hello World!'
    });

    octokit == null
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
