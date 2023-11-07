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

  const payload = github.context.payload;

  const { issue, repository } = payload;
  let { body, title, comments, labels } = issue;

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

  if (llmQuestions && openai){
    let llmPrompt = `Your job is to answer each of the following QUESTIONS about TEXT with a 0 (NO) or 1 (YES). Your output should be a JSON array with 0s or 1s, one number for each question. ONLY ANSWER WITH JSON.

QUESTIONS:

>>QUESTIONS<<

TEXT:

>>TEXT<<
`;

    llmPrompt = llmPrompt.replace(">>QUESTIONS<<", llmQuestions.map(q => `- ${q.vexpr}`).join("\n"));
    if (filter){
      body = title + "\n\n" + body.split("\n").map(line => {
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

      console.log("LLM reply: ", chatCompletion.choices[0].message.content);

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
