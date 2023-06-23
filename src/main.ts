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
    let work_item_id = ''

    const octokit = github.getOctokit(github_token)         

    console.log(`Event name: ${context.eventName}`)

    if (context.eventName == 'pull_request') {     

      // check if pull request description contains a AB#<work item number>
      console.log(`Checking to see if text 'AB#<work item id>' is contained in pull request...`)

      if (ab_lookup_match && ab_lookup_match.length > 1) {
        work_item_id = ab_lookup_match[1].toString()    
        console.log(`AB#${work_item_id} found in pull request description.`)
        console.log(`Checking to see if bot created link from AB#${work_item_id} ...`)    
          
        if (pull_request_description?.includes('[AB#') && pull_request_description?.includes('/_workitems/edit/')) {
          console.log(`AB#${work_item_id} link found.`)
          console.log('Logging message in pull request comment and exit routine.')
            
          await octokit.rest.issues.createComment({
            ...context.repo,
            issue_number: pull_request_number,
            body: `Pull request description contains link AB#${work_item_id} to an Azure Boards work item.`
          })

          return
        }
        else {
          console.log(`Bot did not create a link from AB#${work_item_id}`)
          
          await octokit.rest.issues.createComment({
            ...context.repo,
            issue_number: pull_request_number,
            body: `Pull request description contains AB#${work_item_id} but the Bot could not link to an Azure Boards work item.`
          }) 
          
          core.setFailed('Pull request description contains AB#${work_item_id} but the Bot could not link to an Azure Boards work item')
        }      
      }   
      else {    
          console.log(`Pull request description does not contain AB#<work item id>`)
                   
          await octokit.rest.issues.createComment({
            ...context.repo,
            issue_number: pull_request_number,
            body: `Pull request description does not contain AB#<work item id>.`
          }) 
          
          core.setFailed('Pull request description does not contain AB#<work item id>')
      }    
    }  

    if (context.eventName == 'issues_comment') {  
      console.log(context.payload.pull_request?.comments)

      //context.payload.pull_request?.comments.forEach(async (comment: { body: string }) => {
      //   console.log("Checking comment: " + comment.body);
      //});
    }

    octokit == null
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
