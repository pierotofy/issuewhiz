/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 320:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 280:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 839:
/***/ ((module) => {

module.exports = eval("require")("@google/generative-ai");


/***/ }),

/***/ 897:
/***/ ((module) => {

module.exports = eval("require")("filtrex");


/***/ }),

/***/ 663:
/***/ ((module) => {

module.exports = eval("require")("openai");


/***/ }),

/***/ 24:
/***/ ((module) => {

module.exports = eval("require")("yaml");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(320);
const github = __nccwpck_require__(280);
const YAML = __nccwpck_require__(24);
const filtrex = __nccwpck_require__(897);
const OpenAI = __nccwpck_require__(663);
const { GoogleGenerativeAI } = __nccwpck_require__(839);

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
  const geminiToken = core.getInput('gemini');
  const model = core.getInput('model') || 'gpt-3.5-turbo-1106';
  const filter = parseYaml(core.getInput('filter'));
  const variables = parseYaml(core.getInput('variables', { required: true }));
  const logic = parseYaml(core.getInput('logic', { required: true }));
  const signature = core.getInput('signature');

  let openai;
  let genAI;
  if (openAIToken){
    openai = new OpenAI({apiKey: openAIToken});
  }
  if (geminiToken){
    genAI = new GoogleGenerativeAI(geminiToken);
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
      expressions.push({evaluate, actions, expr});
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

  if (llmQuestions && (openai || genAI)){
    let llmPrompt = `Your job is to answer each of the following QUESTIONS about TEXT with a 0 (NO) or 1 (YES). Your output should be a JSON array with 0s or 1s, one number for each question. ONLY ANSWER WITH JSON. DO NOT PROVIDE EXPLANATIONS FOR YOUR ANSWERS.

QUESTIONS:

>>QUESTIONS<<

TEXT:

>>TEXT<<
`;

    llmPrompt = llmPrompt.replace(">>QUESTIONS<<", llmQuestions.map(q => `- ${q.vexpr}`).join("\n"));
    body = title + "\n\n" + body.split("\n").map(line => {
      if (filter){
        filter.forEach(f => {
          line = line.replace(new RegExp(`^${f}.*`, 'g'), "");
        });
      }
      return line;
    }).join("\n");
    
    llmPrompt = llmPrompt.replace(">>TEXT<<", body);

    // Ask
    try{
      let content;
      
      if (geminiToken){
        // Use Gemini
        const geminiModel = genAI.getGenerativeModel({ model });
        const result = await geminiModel.generateContent(llmPrompt);
        const response = await result.response;
        const text = response.text();
        
        console.log("LLM prompt: ", llmPrompt);
        console.log("LLM reply: ", text);
        
        content = extractJSONArray(text);
      }else{
        // Use OpenAI
        const chatCompletion = await openai.chat.completions.create({
          messages: [{ role: 'user', content: llmPrompt }],
          model,
          temperature: 0
        });
        if (!chatCompletion.choices) throw new Error("Invalid response");
        
        console.log("LLM prompt: ", llmPrompt);
        console.log("LLM reply: ", chatCompletion.choices[0].message.content);

        content = extractJSONArray(chatCompletion.choices[0].message.content);
      }
      
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
  evalContext["title"] = title;
  evalContext["title_lowercase"] = title.toLowerCase();
  

  console.log("Evaluation context: ", evalContext);

  for (let i = 0; i < expressions.length; i++){
    let e = expressions[i];

    if (e.evaluate(evalContext)){
      console.log(`Evaluated ${e.expr}: true`);

      // Execute actions
      for (let j = 0; j < e.actions.length; j++){
        let action = e.actions[j];
        
        if (action.stop){
          console.log("Action: stop");
          process.exit(0);
        }else if (action.comment){
          console.log(`Action: comment ${action.comment}`);
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
          console.log(`Action: close`);
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
          console.log(`Action: label ${action.label}`);
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
    }else{
      console.log(`Evaluated ${e.expr}: false`);
    }
  }
}

run();

})();

module.exports = __webpack_exports__;
/******/ })()
;