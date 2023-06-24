/**
 * @summary Commit Message에 대한 규칙을 정의합니다.
 * @see https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional
 *
 * 아래는 Commit Message의 형식을 정의한 것입니다.
 * - Type(필수): Commit의 종류. commit을 할 때, type에 상응하는 이모지가 자동으로 붙습니다.
 *              (Feat, Fix, Style, Refactor, File, Design, Comment, Chore, Docs, Hotfix)
 * - Scope(선택): Commit의 범위. 기능, 함수, 페이지, API 등 자유롭게 선택할 수 있습니다.
 * - Subject(필수): Commit의 제목. 되도록 간결하게 작성하고, 명사형 어미로 끝나도록 합니다.
 * - Body(선택): Commit의 내용. 어떤 이유로, 어떻게 변경했는지 작성합니다.
 * - Footer(자동): Issue Tracker ID가 자동으로 삽입됩니다. Branch 이름이 issue<id>- 형식이어야 합니다.
 *
 * @example
 * - ✨Feat: 로그인 기능 추가
 * - ✨Feat(login/SignUp): 회원가입 기능 추가
 * - 🧠Fix: 로그인 기능 수정
 * - ⭐️Style: 로그인 페이지 디자인 변경
 */

/* 
<type>(optional scope): <subject>

[optional body]

[optional footer(s)]
*/

const Configuration = {
  extends: ['git-commit-emoji'],
  rules: {
    //* Type
    'type-enum': [
      2,
      'always',
      [
        '✨ Feat',
        '⚡️ Update',
        '🔨 Fix',
        '💥 Break',
        '🌈 Style',
        '🌀 Refactor',
        '📁 File',
        '🎨 Design',
        '🔖 Comment',
        '🍎 Chore',
        '📝 Docs',
        '🧪 Test',
      ],
    ],
    'type-case': [2, 'always', 'start-case'],
    'type-empty': [2, 'never'],

    //* Scope
    'scope-case': [2, 'never', []],

    //* Subject
    'subject-full-stop': [2, 'never', '.'],
    'subject-exclamation-mark': [2, 'never', '!'],
    'subject-case': [2, 'never', []],
    'subject-empty': [2, 'never'],

    //* Body & Footer
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [2, 'always', 100],
  },

  prompt: {},
  ignores: [
    (message: string) =>
      message.startsWith('Merge') ||
      message.startsWith('Revert') ||
      message.startsWith('Amend') ||
      message.startsWith('Reset') ||
      message.startsWith('Rebase') ||
      message.startsWith('Tag'),
  ],
};

module.exports = Configuration;
