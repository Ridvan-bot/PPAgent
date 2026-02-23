"use strict";

/**
 * Semantic Release config. Uses .cjs so we can set writerOpts.transform with a
 * safe committerDate – några commits (t.ex. Initial commit med Co-authored-by)
 * kan ha ogiltigt datum och ger annars "RangeError: Invalid time value".
 */
function safeDate(date) {
  if (date == null) return undefined;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

function formatDate(date) {
  const d = safeDate(date);
  if (!d) return undefined;
  return d.toISOString().slice(0, 10);
}

module.exports = {
  branches: ["main"],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          { type: "feat", release: "minor" },
          { type: "fix", release: "patch" },
          { type: "perf", release: "patch" },
        ],
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: {
          types: [
            { type: "feat", section: "Features" },
            { type: "fix", section: "Bug Fixes" },
            { type: "docs", section: "Documentation" },
            { type: "perf", section: "Performance" },
            { type: "chore", section: "Maintenance", hidden: true },
            { type: "ci", section: "CI", hidden: true },
          ],
        },
        writerOpts: {
          transform: {
            committerDate: (date) => {
              const d = safeDate(date);
              return d ? formatDate(d) : undefined;
            },
          },
        },
      },
    ],
    ["@semantic-release/changelog", { changelogFile: "CHANGELOG.md" }],
    ["@semantic-release/npm", { npmPublish: false }],
    [
      "@semantic-release/git",
      {
        assets: ["package.json", "CHANGELOG.md"],
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ],
};
