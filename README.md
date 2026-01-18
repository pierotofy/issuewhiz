# IssueWhiz - Automated Issue Triaging

[![License](https://img.shields.io/github/license/pierotofy/issuewhiz)](https://github.com/pierotofy/issuewhiz/blob/main/LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/pierotofy/issuewhiz)](https://github.com/pierotofy/issuewhiz/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/pierotofy/issuewhiz)](https://github.com/pierotofy/issuewhiz/pulls)
[![GitHub Stars](https://img.shields.io/github/stars/pierotofy/issuewhiz)](https://github.com/pierotofy/issuewhiz/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/pierotofy/issuewhiz)](https://github.com/pierotofy/issuewhiz/network/members)
[![GitHub Release](https://img.shields.io/github/v/release/pierotofy/issuewhiz)](https://github.com/pierotofy/issuewhiz/releases)

<img width="373" height="347" alt="IssueWhiz" src="https://github.com/user-attachments/assets/822a481e-7c20-401f-b547-9fd8fe3a7441" />

IssueWhiz automates the triaging of issues in your repositories. It helps streamline the process of categorizing issues and enforcing project's guidelines using customizable and flexible rules.

**New**: Added support for Google Gemini.

## Features

- Automatically label, close and comment on newly opened issues.
- Rules defined using boolean logic coupled with variables computed with LLM-based text classification.
- Save time and reduce manual triaging efforts.
- Easily customizable to fit specific needs.

In a nutshell, you can define boolean questions using natural language, such as:

 * A: Does this text look like a software bug report?
 * B: Is this about a frontend problem?
 * C: Is this about a backend problem?

And define rules to act on such questions:

 * if `A and B` --> Add label `bug frontend`
 * if `A and C` --> Add label `bug backend`
 * if `A` --> Add label `bug`
 * else --> Add comment `Thanks for opening an issue! We will triage this shortly.`

## Usage
 
 * Create a `.github/workflows/issuewhiz.yml` in your repository:

```yaml
name: Issue Triage
on:
  issues:
    types:
      - opened
jobs:
  issue_triage:
    runs-on: ubuntu-latest
    permissions:
      issues: write
    steps:
      - uses: pierotofy/issuewhiz@v2
        with:
          # Your Gemini API token (https://aistudio.google.com/app/api-keys)
          # Added to : https://github.com/<repo>/<name>/settings/secrets actions
          gemini: ${{ secrets.GEMINI_TOKEN }}
          model: 'gemini-2.5-flash'

          # - OR - your OpenAI token (https://platform.openai.com/api-keys)
          # Added to : https://github.com/<repo>/<name>/settings/secrets actions
          # openAI: ${{ secrets.OPENAI_TOKEN }}
          # model: 'gpt-3.5-turbo-1106'

          # GitHub Token with write access to repository issues
          # (you can leave this unless you want to use a different user that "github-actions")
          ghToken: ${{ secrets.GITHUB_TOKEN }}

          # Optional filter, any line in an issue that begins with "#" 
          # will be discarded prior to LLM evaluation 
          filter: |
            - "#"
          
          # Define your boolean questions, which must evaluate to yes/no or true/false
          # <VAR>: <QUESTION>
          variables: |
            - A: "A question about using a software or seeking guidance on doing something?"
            - B: "Contains a suggestion for an improvement or a feature request?"
          
          # Boolean expressions evaluating to true will execute the actions listed next to it
          # Evaluation continues until there are no more expressions, or a "stop: true" action is found
          logic: |
            - "A and (not B)": [label: question, stop: true]
            - "B and (not A)": [label: enhancement, stop: true]
            - "(not A) and (not B)": [comment: "I'm not sure how to classify this one! I will close the issue", close: true]

          # Optional signature to append to each message posted by the bot
          signature: "p.s. I'm just an automated script, not a human being."
```

## Expressions

You can reference all of your variables in the boolean expressions, as well as the special `body`, `title` and `title_lowercase` variables, which contains the text of the issue body and title respectively. This can be useful for doing classical regex matches alongside LLM evaluation.

For example, to match the substring "bug:" in the issue title:

```yaml
logic: |
  - 'title ~= "bug:"': [stop: true]
```

You can use all the expressions supported by [Filtrex](https://github.com/joewalnes/filtrex):

There are only 2 types: numbers and strings. Numbers may be floating point or integers. Boolean logic is applied on the truthy value of values (e.g. any non-zero number is true, any non-empty string is true, otherwise false).

| Values                  | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| 43, -1.234              | Numbers                                                |
| "hello"                 | String                                                 |
| foo, a.b.c, 'foo-bar'   | External data variable defined by application (may be numbers or strings) |

| Numeric arithmetic | Description |
| ------------------ | ----------- |
| x + y              | Add         |
| x - y              | Subtract    |
| x * y              | Multiply    |
| x / y              | Divide      |
| x % y              | Modulo      |
| x ^ y              | Power       |

| Comparisons     | Description                                     |
| --------------- | ----------------------------------------------- |
| x == y          | Equals                                          |
| x < y           | Less than                                       |
| x <= y          | Less than or equal to                          |
| x > y           | Greater than                                    |
| x >= y          | Greater than or equal to                       |
| x ~= y          | Regular expression match                       |
| x in (a, b, c)  | Equivalent to (x == a or x == b or x == c)     |
| x not in (a, b, c) | Equivalent to (x != a and x != b and x != c) |

| Boolean logic | Description           |
| -------------- | --------------------- |
| x or y        | Boolean or            |
| x and y       | Boolean and           |
| not x         | Boolean not           |
| x ? y : z     | If boolean x, value y, else z |
| ( x )         | Explicit operator precedence |

| Built-in functions | Description                                      |
| ------------------ | -------------------------------------------- |
| abs(x)             | Absolute value                                |
| ceil(x)            | Round floating point up                       |
| floor(x)           | Round floating point down                     |
| log(x)             | Natural logarithm                             |
| max(a, b, c...)    | Max value (variable length of args)           |
| min(a, b, c...)    | Min value (variable length of args)           |
| random()           | Random floating point from 0.0 to 1.0        |
| round(x)           | Round floating point                           |
| sqrt(x)            | Square root                                   |

## Actions

| Action  | Description                 |
| ------- | --------------------------- |
| comment | Add a comment to the issue  |
| close   | Close the issue             |
| stop    | Stop executing actions      |
| label   | Assign a label to the issue |

Need more? Help us.

## Roadmap

We welcome contributions!

Here's some ideas:

 * Adding support for more LLM backend APIs like LLAMA
 * Add support for more actions

Or propose something by opening a pull request!

## License

AGPLv3

## Build

```bash
npm i -g @vercel/ncc
ncc build index.js
```
