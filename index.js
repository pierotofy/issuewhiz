const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  // This should be a token with access to your repository scoped in as a secret.
  // The YML workflow will need to set ghToken with the GitHub Secret Token
  // ghToken: ${{ secrets.GITHUB_TOKEN }}
  // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
  const ghToken = core.getInput('ghToken', { required: true });

  const octokit = github.getOctokit(ghToken);

  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);

  const { data } = await octokit.rest.issues.get({
      owner: 'pierotofy',
      repo: 'test',
      issue_number: 1
  });

  console.log(data);
}

run();
