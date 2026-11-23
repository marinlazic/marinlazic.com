# Content

One idea in, every channel out. Each folder here is one idea, made on one day, shaped for every channel Marin publishes on.

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
