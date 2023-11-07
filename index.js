const core = require('@actions/core');
const github = require('@actions/github');
const YAML = require('yaml');
const filtrex = require('filtrex');
const OpenAI = require('openai');

function parseYaml(v){
  if (v === "") return v;

  try{
    return YAML.parse(v);
  }catch(e){
    console.log(`Cannot parse ${v}: ${e}`)
    process.exit(1);
  }
}

function extractJSONArray(str) {
  var open, close, candidate;
  open = str.indexOf('[', open + 1);
  do {
      close = str.lastIndexOf(']');
      if(close <= open) {
          return [];
      }
      do {
          candidate = str.substring(open, close + 1);
          try {
            return JSON.parse(candidate);
          }catch(e){
             // Continue
          }
          close = str.substr(0, close).lastIndexOf(']');
      } while(close > open);
      open = str.indexOf('[', open + 1);
  } while(open != -1);
}

async function run() {
  const ghToken = core.getInput('ghToken', { required: true });
  const openAIToken = core.getInput('openAI');
  const model = core.getInput('model') || 'gpt-3.5-turbo';
  const filter = parseYaml(core.getInput('filter'));
  const variables = parseYaml(core.getInput('variables', { required: true }));
  const logic = parseYaml(core.getInput('logic', { required: true }));
  const signature = core.getInput('signature');

  let openai;
  if (openAIToken){
    openai = new OpenAI({apiKey: openAIToken});
  }
  const octokit = github.getOctokit(ghToken);

  function getComment(text){
    if (signature){
      return `${text.trimRight()}\n\n${signature}`;
    }else return text;
  }

  const payload = {
    "action": "opened",
    "issue": {
      "active_lock_reason": null,
      "assignee": null,
      "assignees": [],
      "author_association": "OWNER",
      "body": "abc\nhere it is: https://github.com\n\ndone",
      "closed_at": null,
      "comments": 0,
      "comments_url": "https://api.github.com/repos/pierotofy/test/issues/3/comments",
      "created_at": "2023-11-07T03:11:42Z",
      "events_url": "https://api.github.com/repos/pierotofy/test/issues/3/events",
      "html_url": "https://github.com/pierotofy/test/issues/3",
      "id": 1980457827,
      "labels": [],
      "labels_url": "https://api.github.com/repos/pierotofy/test/issues/3/labels{/name}",
      "locked": false,
      "milestone": null,
      "node_id": "I_kwDOBl_3Cc52C2Nj",
      "number": 3,
      "performed_via_github_app": null,
      "reactions": {
        "+1": 0,
        "-1": 0,
        "confused": 0,
        "eyes": 0,
        "heart": 0,
        "hooray": 0,
        "laugh": 0,
        "rocket": 0,
        "total_count": 0,
        "url": "https://api.github.com/repos/pierotofy/test/issues/3/reactions"
      },
      "repository_url": "https://api.github.com/repos/pierotofy/test",
      "state": "open",
      "state_reason": null,
      "timeline_url": "https://api.github.com/repos/pierotofy/test/issues/3/timeline",
      "title": "test3",
      "updated_at": "2023-11-07T03:11:42Z",
      "url": "https://api.github.com/repos/pierotofy/test/issues/3",
      "user": {
        "avatar_url": "https://avatars.githubusercontent.com/u/1951843?v=4",
        "events_url": "https://api.github.com/users/pierotofy/events{/privacy}",
        "followers_url": "https://api.github.com/users/pierotofy/followers",
        "following_url": "https://api.github.com/users/pierotofy/following{/other_user}",
        "gists_url": "https://api.github.com/users/pierotofy/gists{/gist_id}",
        "gravatar_id": "",
        "html_url": "https://github.com/pierotofy",
        "id": 1951843,
        "login": "pierotofy",
        "node_id": "MDQ6VXNlcjE5NTE4NDM=",
        "organizations_url": "https://api.github.com/users/pierotofy/orgs",
        "received_events_url": "https://api.github.com/users/pierotofy/received_events",
        "repos_url": "https://api.github.com/users/pierotofy/repos",
        "site_admin": false,
        "starred_url": "https://api.github.com/users/pierotofy/starred{/owner}{/repo}",
        "subscriptions_url": "https://api.github.com/users/pierotofy/subscriptions",
        "type": "User",
        "url": "https://api.github.com/users/pierotofy"
      }
    },
    "repository": {
      "allow_forking": true,
      "archive_url": "https://api.github.com/repos/pierotofy/test/{archive_format}{/ref}",
      "archived": false,
      "assignees_url": "https://api.github.com/repos/pierotofy/test/assignees{/user}",
      "blobs_url": "https://api.github.com/repos/pierotofy/test/git/blobs{/sha}",
      "branches_url": "https://api.github.com/repos/pierotofy/test/branches{/branch}",
      "clone_url": "https://github.com/pierotofy/test.git",
      "collaborators_url": "https://api.github.com/repos/pierotofy/test/collaborators{/collaborator}",
      "comments_url": "https://api.github.com/repos/pierotofy/test/comments{/number}",
      "commits_url": "https://api.github.com/repos/pierotofy/test/commits{/sha}",
      "compare_url": "https://api.github.com/repos/pierotofy/test/compare/{base}...{head}",
      "contents_url": "https://api.github.com/repos/pierotofy/test/contents/{+path}",
      "contributors_url": "https://api.github.com/repos/pierotofy/test/contributors",
      "created_at": "2017-10-14T18:29:19Z",
      "default_branch": "master",
      "deployments_url": "https://api.github.com/repos/pierotofy/test/deployments",
      "description": null,
      "disabled": false,
      "downloads_url": "https://api.github.com/repos/pierotofy/test/downloads",
      "events_url": "https://api.github.com/repos/pierotofy/test/events",
      "fork": false,
      "forks": 0,
      "forks_count": 0,
      "forks_url": "https://api.github.com/repos/pierotofy/test/forks",
      "full_name": "pierotofy/test",
      "git_commits_url": "https://api.github.com/repos/pierotofy/test/git/commits{/sha}",
      "git_refs_url": "https://api.github.com/repos/pierotofy/test/git/refs{/sha}",
      "git_tags_url": "https://api.github.com/repos/pierotofy/test/git/tags{/sha}",
      "git_url": "git://github.com/pierotofy/test.git",
      "has_discussions": false,
      "has_downloads": true,
      "has_issues": true,
      "has_pages": false,
      "has_projects": true,
      "has_wiki": true,
      "homepage": null,
      "hooks_url": "https://api.github.com/repos/pierotofy/test/hooks",
      "html_url": "https://github.com/pierotofy/test",
      "id": 106952457,
      "is_template": false,
      "issue_comment_url": "https://api.github.com/repos/pierotofy/test/issues/comments{/number}",
      "issue_events_url": "https://api.github.com/repos/pierotofy/test/issues/events{/number}",
      "issues_url": "https://api.github.com/repos/pierotofy/test/issues{/number}",
      "keys_url": "https://api.github.com/repos/pierotofy/test/keys{/key_id}",
      "labels_url": "https://api.github.com/repos/pierotofy/test/labels{/name}",
      "language": null,
      "languages_url": "https://api.github.com/repos/pierotofy/test/languages",
      "license": null,
      "merges_url": "https://api.github.com/repos/pierotofy/test/merges",
      "milestones_url": "https://api.github.com/repos/pierotofy/test/milestones{/number}",
      "mirror_url": null,
      "name": "test",
      "node_id": "MDEwOlJlcG9zaXRvcnkxMDY5NTI0NTc=",
      "notifications_url": "https://api.github.com/repos/pierotofy/test/notifications{?since,all,participating}",
      "open_issues": 2,
      "open_issues_count": 2,
      "owner": {
        "avatar_url": "https://avatars.githubusercontent.com/u/1951843?v=4",
        "events_url": "https://api.github.com/users/pierotofy/events{/privacy}",
        "followers_url": "https://api.github.com/users/pierotofy/followers",
        "following_url": "https://api.github.com/users/pierotofy/following{/other_user}",
        "gists_url": "https://api.github.com/users/pierotofy/gists{/gist_id}",
        "gravatar_id": "",
        "html_url": "https://github.com/pierotofy",
        "id": 1951843,
        "login": "pierotofy",
        "node_id": "MDQ6VXNlcjE5NTE4NDM=",
        "organizations_url": "https://api.github.com/users/pierotofy/orgs",
        "received_events_url": "https://api.github.com/users/pierotofy/received_events",
        "repos_url": "https://api.github.com/users/pierotofy/repos",
        "site_admin": false,
        "starred_url": "https://api.github.com/users/pierotofy/starred{/owner}{/repo}",
        "subscriptions_url": "https://api.github.com/users/pierotofy/subscriptions",
        "type": "User",
        "url": "https://api.github.com/users/pierotofy"
      },
      "private": false,
      "pulls_url": "https://api.github.com/repos/pierotofy/test/pulls{/number}",
      "pushed_at": "2023-11-07T03:11:24Z",
      "releases_url": "https://api.github.com/repos/pierotofy/test/releases{/id}",
      "size": 2,
      "ssh_url": "git@github.com:pierotofy/test.git",
      "stargazers_count": 0,
      "stargazers_url": "https://api.github.com/repos/pierotofy/test/stargazers",
      "statuses_url": "https://api.github.com/repos/pierotofy/test/statuses/{sha}",
      "subscribers_url": "https://api.github.com/repos/pierotofy/test/subscribers",
      "subscription_url": "https://api.github.com/repos/pierotofy/test/subscription",
      "svn_url": "https://github.com/pierotofy/test",
      "tags_url": "https://api.github.com/repos/pierotofy/test/tags",
      "teams_url": "https://api.github.com/repos/pierotofy/test/teams",
      "topics": [],
      "trees_url": "https://api.github.com/repos/pierotofy/test/git/trees{/sha}",
      "updated_at": "2023-11-07T03:09:20Z",
      "url": "https://api.github.com/repos/pierotofy/test",
      "visibility": "public",
      "watchers": 0,
      "watchers_count": 0,
      "web_commit_signoff_required": false
    },
    "sender": {
      "avatar_url": "https://avatars.githubusercontent.com/u/1951843?v=4",
      "events_url": "https://api.github.com/users/pierotofy/events{/privacy}",
      "followers_url": "https://api.github.com/users/pierotofy/followers",
      "following_url": "https://api.github.com/users/pierotofy/following{/other_user}",
      "gists_url": "https://api.github.com/users/pierotofy/gists{/gist_id}",
      "gravatar_id": "",
      "html_url": "https://github.com/pierotofy",
      "id": 1951843,
      "login": "pierotofy",
      "node_id": "MDQ6VXNlcjE5NTE4NDM=",
      "organizations_url": "https://api.github.com/users/pierotofy/orgs",
      "received_events_url": "https://api.github.com/users/pierotofy/received_events",
      "repos_url": "https://api.github.com/users/pierotofy/repos",
      "site_admin": false,
      "starred_url": "https://api.github.com/users/pierotofy/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/pierotofy/subscriptions",
      "type": "User",
      "url": "https://api.github.com/users/pierotofy"
    }
  };

  // const payload = github.context.payload;

  const { issue, repository } = payload;
  let { body, comments, labels } = issue;

  if (comments > 0) return;
  if (labels.length > 0) return;

  // Compile expressions
  let expressions = [];

  for (let i = 0; i < logic.length; i++){
    let l = logic[i];
    let expr = Object.keys(l)[0];
    let actions = l[expr];
    try{
      let evaluate = filtrex.compileExpression(expr);
      expressions.push({evaluate, actions});
    }catch(e){
      console.log(`Cannot evaluate expression: ${e}. See https://github.com/joewalnes/filtrex#expressions`);
      process.exit(1);
    }
  }

  let evalContext = {};
  let llmQuestions = [];

  for (let i = 0; i < variables.length; i++){
    let v = variables[i];
    let vid = Object.keys(v)[0];
    let vexpr = v[vid];

    llmQuestions.push({vid, vexpr});
  }

  if (false && llmQuestions && openai){
    let llmPrompt = `Your job is to answer each of the following QUESTIONS about TEXT with a 0 (NO) or 1 (YES). Your output should be a JSON array with 0s or 1s, one number for each question. ONLY ANSWER WITH JSON.

QUESTIONS:

>>QUESTIONS<<

TEXT:

>>TEXT<<
`;

    body = `
Currently ODM's Snapcraft build is broken. We are looking for somebody to fix and take over the task of maintaining the Snapcraft build.

## What is the problem?

To install and older version of ODM from the Snap Store (available itself as a Snap Package) or from the command line:

sudo snap 

To run:

opendronemap

`;

    llmPrompt = llmPrompt.replace(">>QUESTIONS<<", llmQuestions.map(q => `- ${q.vexpr}`).join("\n"));
    if (filter){
      body = body.split("\n").map(line => {
        filter.forEach(f => {
          line = line.replace(new RegExp(`^${f}.*`, 'g'), "");
        });
        return line;
      }).join("\n");
    }
    llmPrompt = llmPrompt.replace(">>TEXT<<", body);

    // Ask
    try{
      const chatCompletion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: llmPrompt }],
        model,
      });
      if (!chatCompletion.choices) throw new Error("Invalid response");
      let content = extractJSONArray(chatCompletion.choices[0].message.content);

      // Should match the number of questions
      if (content.length !== llmQuestions.length) throw new Error(`Cannot evaluate questions (LLM replied: ${content})`);

      for (let i = 0; i < content.length; i++){
        let vid = llmQuestions[i].vid;
        let result = Boolean(parseInt(content[i]));
        evalContext[vid] = result;
      }
    }catch(e){
      console.log(`Cannot evaluate LLM questions: ${e}`);
      process.exit(1);
    }
  }

  evalContext["body"] = body;

  evalContext["A"] = true;
  evalContext["B"] = false;

  for (let i = 0; i < expressions.length; i++){
    let e = expressions[i];

    if (e.evaluate(evalContext)){
      // Execute actions
      for (let j = 0; j < e.actions.length; j++){
        let action = e.actions[j];
        
        if (action.stop){
          process.exit(0);
        }else if (action.comment){
          try{
            await octokit.rest.issues.createComment({
              owner: repository.owner.login,
              repo: repository.name,
              issue_number: issue.number,
              body: getComment(action.comment)
            });
          }catch(e){
            console.log(`Cannot comment: ${e}`);
          }
        }else if (action.close){
          try{
            await octokit.rest.issues.update({
              owner: repository.owner.login,
              repo: repository.name,
              issue_number: issue.number,
              state: 'closed'
            });
          }catch(e){
            console.log(`Cannot close issue: ${e}`);
          }
        }else if (action.label){
          try{
            await octokit.rest.issues.addLabels({
              owner: repository.owner.login,
              repo: repository.name,
              issue_number: issue.number,
              labels: [action.label]
            });
          }catch(e){
            console.log(`Cannot label issue: ${e}`);
          }
        }else{
          console.log(`Invalid action: ${action}`);
          process.exit(1);
        }
      }
    }
  }
}

run();
