import * as core from '@actions/core'
import * as github from '@actions/github'
import {Context} from '@actions/github/lib/context'

async function run(): Promise<void> {
  try {
    const context: Context = github.context
    const github_token: string = core.getInput('repo-token')    
    const pull_request_number: number = context.payload.pull_request?.number ?? 0    
    const pull_request_description: string = context.payload.pull_request?.body ?? ''    
    const ab_lookup_match: RegExpMatchArray | null = pull_request_description.match(/AB#([^ \]]+)/g) 
    const repository_owner: string = context.payload.repository?.owner.login ?? '' 
    const repository_name: string = context.payload.repository?.name ?? ''
    const sender_login: string = context.payload.sender?.login ?? ''
    
    let work_item_id = ''
    let last_comment_posted_by_action = ""  
    let last_comment_posted_by_action_id = 0

    const octokit = github.getOctokit(github_token)        

    //console.log(`Repository owner: ${repository_owner}`)
    //console.log(`Repository name: ${repository_name}`)  
    //console.log(`Sender login: ${sender_login}`)
    //console.log(`Event name: ${context.eventName}`)
    //console.log(`Pull request number: ${pull_request_number}`)   
    //console.log(`Pull request description: ${pull_request_description}`)
    //console.log(`Comment: ${context.payload.comment?.body}`)

    // if the sender in the azure-boards bot or dependabot, then exit code
    // nothing needs to be done
    if (sender_login === "dependabot[bot]") {
      console.log(`dependabot[bot] sender, exiting action.`)
      return
    }

    //azure-boards[bot]

    if (context.eventName === 'pull_request') {   
      
      // get all comments for the pull request
      try {
        const response = await octokit.rest.issues.listComments({
          owner: repository_owner,
          repo: repository_name,
          issue_number:  pull_request_number,
        })

        // check for comments
        if (response.data.length > 0) {
          const comments: IComments[] = response.data.map((comment) => {
            return {
              id: comment.id, 
              created_at: new Date(comment.created_at),
              body: comment.body
            }
          })  

          // sort comments by date descending
          comments.sort((a, b) => b.created_at?.getTime()! - a.created_at?.getTime()!) 
          
          // loop through comments and grab the most recent comment posted by this action
          // we want to use this to check later so we don't post duplicate comments
          for (const comment of comments) { 
            
            last_comment_posted_by_action_id = comment.id ?? 0
            
            if (comment.body?.includes('lcc-404')) { 
              last_comment_posted_by_action = "lcc-404"
              break
            }

            if (comment.body?.includes('lcc-416')) { 
              last_comment_posted_by_action = "lcc-416"
              break
            }        
            
            if (comment.body?.includes('lcc-200')) {
              last_comment_posted_by_action = "lcc-200"
              break
            }
          }          
        }
        
      } catch (error) {
        console.log(error)
      }    

      // check if pull request description contains a AB#<work item number>
      console.log(`Checking description for AB#{ID} ...`)
     
      if (ab_lookup_match) {        
        
        for (const match of ab_lookup_match) {
          work_item_id = match.substring(3)
          break    
        }

        console.log(`AB#${work_item_id} found in pull request description.`)
        console.log(`Checking to see if bot created link ...`)    
        
        // check if the description contains a link to the work item
        if (pull_request_description?.includes('[AB#') && pull_request_description?.includes('/_workitems/edit/')) {
          console.log(`Success: AB#${work_item_id} link found.`)
          console.log('Done.')

          // if the last check failed, then the azure-boards[bot ran and passed, we can delete the last comment
          //if (last_comment_posted_by_action === "lcc-416" && sender_login === "azure-boards[bot]") {
          //  console.log(`Deleting last comment posted by action: ${last_comment_posted_by_action_id}`)
            
          //  await octokit.rest.issues.deleteComment({
          //    owner: repository_owner,
          //    repo: repository_name,
          //    comment_id: last_comment_posted_by_action_id
          //  })
          //}
          
          // if the last comment is the check failed, now it passed and we can post a new comment
          if (last_comment_posted_by_action !== "lcc-200" && sender_login === "azure-boards[bot]") { 
            await octokit.rest.issues.createComment({
              ...context.repo,
              issue_number: pull_request_number,
              body: `✅ Work item link check complete. Description contains link AB#${work_item_id} to an Azure Boards work item.\n\n<!-- code: lcc-200 -->`
            })
          }

          return
        }
        else {
          // check if the description contains a link to the work item
          console.log(`Bot did not create a link from AB#${work_item_id}`)
          
          if (last_comment_posted_by_action !== "lcc-416") {
            await octokit.rest.issues.createComment({
              ...context.repo,
              issue_number: pull_request_number,
              body: `❌ Work item link check failed. Description contains AB#${work_item_id} but the Bot could not link it to an Azure Boards work item. [Click here](https://learn.microsoft.com/en-us/azure/devops/boards/github/link-to-from-github?view=azure-devops#use-ab-mention-to-link-from-github-to-azure-boards-work-items) to learn more.\n\n<!--code: lcc-416-->`
            }) 
          }
          
          core.setFailed(`Description contains AB#${work_item_id} but the Bot could not link it to an Azure Boards work item`)
        }    
        
        core.warning(`Description contains AB#${work_item_id} and waiting for the azure-boards[bot] to validate the link`)
        return
      }   
      else {   
          if (last_comment_posted_by_action !== "lcc-404") {
            await octokit.rest.issues.createComment({
              ...context.repo,
              issue_number: pull_request_number,
              body: `❌ Work item link check failed. Description does not contain AB#{ID}. [Click here](https://learn.microsoft.com/en-us/azure/devops/boards/github/link-to-from-github?view=azure-devops#use-ab-mention-to-link-from-github-to-azure-boards-work-items) to Learn more.\n\n<!-- code: lcc-404 -->`
            }) 
          }

          core.setFailed('Description does not contain AB#{ID}')
      }    
    } 

    octokit == null
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

interface IComments {
  id: number | undefined,
  created_at: Date | undefined,
  body: string | undefined,
}

run()