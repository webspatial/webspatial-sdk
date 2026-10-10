/**
 * Commit message linting configuration.
 *
 * Enforces:
 *   1. Conventional Commits format (https://www.conventionalcommits.org/)
 *   2. A `ticket:` trailer in every commit message, referencing the Meego
 *      work item ID. Use `ticket: 0` for trivial changes that have no
 *      associated work item.
 *
 * Both the local `commit-msg` git hook (via simple-git-hooks) and the CI
 * workflow (`.github/workflows/commitlint.yml`) run this configuration.
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // The custom rule below is registered via the plugin; keep it at
    // level 2 (error) so missing `ticket:` blocks the commit.
    'ticket-trailer': [2, 'always'],
    'header-max-length': [2, 'always', 72],
  },
  plugins: [
    {
      rules: {
        'ticket-trailer': ({ raw }) => {
          if (!raw) {
            return [false, 'commit message is empty']
          }
          // Match "ticket: 123456" or "ticket:0" (case-insensitive),
          // allowing it to appear anywhere in the message body/footer.
          const match = raw.match(/^ticket:[\t ]*(\d+)[\t ]*\r?$/im)
          if (!match) {
            return [
              false,
              'commit message must contain a "ticket: <ID>" line; ' +
                'use the Meego work item ID, or "ticket: 0" for trivial changes with no work item',
            ]
          }
          return [true]
        },
      },
    },
  ],
}
