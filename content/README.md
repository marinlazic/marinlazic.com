# Content

One idea in, every channel out. There are two ways to run it.

## In the dashboard

Sign in at marinlazic.com/admin and open Studio. Type the idea, pick where it sends people and which channels, and press Write. The core is written first, then each piece, three at a time. Each piece has a preview in the site look, a copy button, a tracked link, an edit box, a rewrite box that takes a note, a Mark posted form and a Numbers form. The "What is working" tab adds up the numbers by platform and joins them to what the site recorded from the tracked links: visits, assessments and applications.

The dashboard uses the same rules as the command below. They live in `.claude/skills/content/` and are copied into `server/studioRules.generated.ts` at build time. After editing the style guide or a channel spec, run `pnpm studio:rules` and commit the result, or the test suite will tell you.

## In Claude Code

Each folder here is one idea, made on one day, shaped for every channel Marin publishes on.

How to make a new one, in Claude Code:

```
/content You don't get an off season, so the plan has to fit inside your week.
```

Or paste rough notes, a voice note transcript, or the slug of an article from `client/src/data/articlesData.ts`. Options:

```
/content <idea> only: linkedin-post, x-post
/content <idea> skip: youtube-video
/content <idea> cta: library
/content rerun content/2026-11-23-no-off-season only: substack-note
```

What comes out: a folder named by date and idea, with `00-core.md` (the idea pinned down), one file per channel, and a `README.md` index. Open a file, copy the part under the header block, post it. Anything marked `[MARIN: ...]` needs a line from Marin first.

The rules live in `.claude/skills/content/`:
- `SKILL.md` is the process.
- `style-guide.md` is the voice. Edit this file to change how everything sounds.
- `formats/` has one file per channel with lengths, shape and what to paste where. Edit a file to change one channel.
- `check.mjs` flags banned words, dashes, exclamation marks, emoji, hashtags, US spellings and length limits:

```
node .claude/skills/content/check.mjs content/<folder>
```

Channels: LinkedIn post, LinkedIn article, Substack newsletter, Substack Note, Instagram carousel, X post, X article, Kit newsletter, YouTube Short, YouTube video, Instagram Reel.
