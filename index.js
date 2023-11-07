const core = require('@actions/core');
const github = require('@actions/github');
const YAML = require('yaml');
const filtrex = require('filtrex');

async function run() {
  const ghToken = core.getInput('ghToken', { required: true });
  // const openAIToken = core.getInput('openAI', { required: true });
  let variables, logic;

  try{
    variables = YAML.parse(core.getInput('variables', { required: true }));
  }catch(e){
    console.log(`Cannot parse "variables": ${e}`)
    process.exit(1);
  }

  try{
    logic = YAML.parse(core.getInput('logic', { required: true }));
  }catch(e){
    console.log(`Cannot parse "logic": ${e}`)
    process.exit(1);
  }

  // const octokit = github.getOctokit(ghToken);

  const payload = {
    "action": "opened",
    "issue": {
      "active_lock_reason": null,
      "assignee": null,
      "assignees": [],
      "author_association": "OWNER",
      "body": "abc",
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

  const { issue } = payload;
  const { body, comments, labels } = issue;

  if (comments > 0) return;
  if (labels.length > 0) return;

  console.log(variables, logic);
try{
  let expr = filtrex.compileExpression("A and B");
  console.log(expr({A: true, B: false}));
}catch(e){
  console.log(`Cannot evaluate expression: ${e}. See https://github.com/joewalnes/filtrex#expressions`);
}


  // const { data } = await octokit.rest.issues.get({
  //     owner: 'pierotofy',
  //     repo: 'test',
  //     issue_number: 1
  // });

}

run();
