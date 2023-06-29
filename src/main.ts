import * as core from '@actions/core'
import * as github from '@actions/github'
import {Context} from '@actions/github/lib/context'

async function run(): Promise<void> {
  try {
    const context: Context = github.context
    const github_token: string = core.getInput('repo-token')    
    const pull_request_number: number = context.payload.pull_request?.number ?? 0    
    const pull_request_description: string = context.payload.pull_request?.body ?? ''    
    const ab_lookup_match: RegExpMatchArray | null = pull_request_description.match(/\AB#\s*([^ ]*)/) 
    //const repository_owner: string = context.payload.repository?.owner.login ?? '' 
    //const repository_name: string = context.payload.repository?.name ?? ''
    const sender_login: string = context.payload.sender?.login ?? ''
    let work_item_id = ''

    const octokit = github.getOctokit(github_token)        

    //console.log(`Repository owner: ${repository_owner}`)
    //console.log(`Repository name: ${repository_name}`)  
    //console.log(`Sender login: ${sender_login}`)
    //console.log(`Event name: ${context.eventName}`)
    //console.log(`Pull request number: ${pull_request_number}`)   
    //console.log(`Pull request description: ${pull_request_description}`)
    //console.log(`Comment: ${context.payload.comment?.body}`)

    // if the sender in the azure-boards bot, then exit code
    // nothing needs to be done
    if (sender_login === "azure-boards[bot]") {
      console.log(`azure-boards[bot] sender, exiting action.`)
      return
    }

    if (context.eventName === 'pull_request') {     

      // check if pull request description contains a AB#<work item number>
      console.log(`Checking description for AB#{ID} ...`)

      if (ab_lookup_match && ab_lookup_match.length > 1) {
        work_item_id = ab_lookup_match[1].toString()    
        console.log(`AB#${work_item_id} found in pull request description.`)
        console.log(`Checking to see if bot created link ...`)    
          
        if (pull_request_description?.includes('[AB#') && pull_request_description?.includes('/_workitems/edit/')) {
          console.log(`Success: AB#${work_item_id} link found.`)
          console.log('Done.')
            
          //await octokit.rest.issues.createComment({
          //  ...context.repo,
          //  issue_number: pull_request_number,
          //  body: `Description contains link AB#${work_item_id} to an Azure Boards work item.`
          //})

          return
        }
        else {
          console.log(`Bot did not create a link from AB#${work_item_id}`)
          
          await octokit.rest.issues.createComment({
            ...context.repo,
            issue_number: pull_request_number,
            body: `Description contains AB#${work_item_id} but the Bot could not link it to an Azure Boards work item. [Learn more](https://learn.microsoft.com/en-us/azure/devops/boards/github/link-to-from-github?view=azure-devops#use-ab-mention-to-link-from-github-to-azure-boards-work-items).`
          }) 
          
          core.setFailed(`Description contains AB#${work_item_id} but the Bot could not link it to an Azure Boards work item`)
        }      
      }   
      else {    
          console.log(`Description does not contain AB#{ID}`)
                   
          await octokit.rest.issues.createComment({
            ...context.repo,
            issue_number: pull_request_number,
            body: `Description does not contain AB#{ID}. [Learn more](https://learn.microsoft.com/en-us/azure/devops/boards/github/link-to-from-github?view=azure-devops#use-ab-mention-to-link-from-github-to-azure-boards-work-items).`
          }) 
          
          core.setFailed('Description does not contain AB#{ID}')
      }    
    } 

    octokit == null
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
