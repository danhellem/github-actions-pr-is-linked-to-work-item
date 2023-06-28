import * as core from '@actions/core'
import * as github from '@actions/github'
import {Context} from '@actions/github/lib/context'
import { stringify } from 'querystring'

async function run(): Promise<void> {
  try {
    const context: Context = github.context
    const github_token: string = core.getInput('repo-token')    
    const pull_request_number: number = context.payload.pull_request?.number ?? 0
    const issue_number: number = context.payload.issue?.number ?? 0 
    const pull_request_description: string = context.payload.pull_request?.body ?? ''    
    const ab_lookup_match: RegExpMatchArray | null = pull_request_description.match(/\AB#\s*([^ ]*)/)  
    let work_item_id = ''

    const octokit = github.getOctokit(github_token)        
    
    console.log(stringify(context.payload))
    console.log(`Event name: ${context.eventName}`)
    console.log(`Pull request number: ${pull_request_number}`)
    console.log(`Issue number: ${issue_number}`)
    console.log(`Pull request description: ${pull_request_description}`)
    console.log(`Comment: ${context.payload.comment?.body}`)

    if (context.eventName === 'pull_request') {     

      // check if pull request description contains a AB#<work item number>
      console.log(`Checking description for AB#{work item id} ...`)

      if (ab_lookup_match && ab_lookup_match.length > 1) {
        work_item_id = ab_lookup_match[1].toString()    
        console.log(`AB#${work_item_id} found in pull request description.`)
        console.log(`Checking to see if bot created link ...`)    
          
        if (pull_request_description?.includes('[AB#') && pull_request_description?.includes('/_workitems/edit/')) {
          console.log(`AB#${work_item_id} link found.`)
          console.log('Logging message as comment and exit routine.')
            
          await octokit.rest.issues.createComment({
            ...context.repo,
            issue_number: pull_request_number,
            body: `Description contains link AB#${work_item_id} to an Azure Boards work item.`
          })

          return
        }
        else {
          console.log(`Bot did not create a link from AB#${work_item_id}`)
          
          await octokit.rest.issues.createComment({
            ...context.repo,
            issue_number: pull_request_number,
            body: `Description contains AB#${work_item_id} but the Bot could not link it to an Azure Boards work item.`
          }) 
          
          core.setFailed(`Description contains AB#${work_item_id} but the Bot could not link it to an Azure Boards work item`)
        }      
      }   
      else {    
          console.log(`Description does not contain AB#{work item id}`)
                   
          await octokit.rest.issues.createComment({
            ...context.repo,
            issue_number: pull_request_number,
            body: `Description does not contain AB#{work item id}.`
          }) 
          
          core.setFailed('Description does not contain AB#{work item id}')
      }    
    }  

    if (context.eventName === 'issue_comment') {  
      
      //await octokit.rest.issues.listComments()
      
      core.setFailed('Comment does not contain AB#')  
    }

    octokit == null
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
