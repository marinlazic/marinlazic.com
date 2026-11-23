---
name: content
description: Turn one idea from Marin into a full set of content for his channels, in his voice and the marinlazic.com style guide. Use when Marin gives an idea, thought, note, quote, article or transcript and wants posts, newsletters, carousels or video scripts made from it, or says /content. Produces LinkedIn posts and articles, Substack newsletters and Notes, Instagram carousels and Reels, X posts and articles, Kit newsletters, YouTube Shorts and YouTube video scripts.
---

# Content from one idea

One idea goes in. One folder comes out with the same message shaped for every channel Marin publishes on. The message stays constant. Only the shape changes.

Read `style-guide.md` in this folder before writing anything. Then read the file in `formats/` for each channel you produce. The style guide wins over anything in a format file, and anything Marin says in the request wins over both.

## Input

The argument is the idea. It can be a sentence, a paragraph of rough notes, a voice note transcript, a link to one of his articles in `client/src/data/articlesData.ts`, or a quote he liked. If there is no argument, ask for the idea in one line and stop.

Optional flags in the request:
- `only: linkedin-post, x-post` produces only the channels named. Channel names are the file names in `formats/` without `.md`.
- `skip: youtube-video` produces everything except the channels named.
- `cta: library` forces the call to action. Values: assessment, resources, library, apply, or an article slug.
- `voice: louder` allows the older, funnier LinkedIn voice for that run. Default is the site voice.

## Output

A folder `content/YYYY-MM-DD-<slug>/` where the date is today and the slug is 2 to 4 words from the idea. Inside:

```
00-core.md                 the idea, pinned down. Everything else is made from this
01-linkedin-post.md
02-linkedin-article.md
03-substack-newsletter.md
04-substack-note.md
05-instagram-carousel.md
06-x-post.md
07-x-article.md
08-kit-newsletter.md
09-youtube-short.md
10-youtube-video.md
11-instagram-reel.md
README.md                  the index: each piece, its channel, its first line, status
```

Each piece is one file so Marin can open one, copy it, and post. Each file starts with a short block: channel, where to paste it, what to attach, and the one check Marin should do before posting. Then the content, ready to paste, with nothing to edit except any `[MARIN: ...]` placeholders.

## Steps

1. Read `style-guide.md`. Read the idea. If the idea points at an article slug, read that article's content from `client/src/data/articlesData.ts` and treat it as the source.

2. Write `00-core.md` first. This is the whole job. Get it right and the channels are easy.
   - The idea in one sentence, in Marin's words.
   - The claim: what Marin says is true that the reader may not believe yet.
   - Why it is true: the mechanism, in two or three plain sentences.
   - The proof: one fact from Marin's work that is on record (see the style guide). If the piece needs a story that is not on record, write `[MARIN: add a real example]` and say what kind of example would fit.
   - What the reader should do this week. One action, specific, small enough to do in the worst week.
   - The objection: the most likely pushback, and the one line answer.
   - The call to action: one destination from the style guide table, with the wording.
   - Three hooks: three different first lines, each under 12 words. Pick one as the default and say why.
   - Five facts the pieces may use, and nothing else. No new facts get introduced in a channel file.

3. For each channel, read its file in `formats/`, then write the piece from `00-core.md`. Write it as Marin would say it on that channel. Written channels get written language. Video channels get spoken language: shorter sentences, contractions, no lists read aloud.

4. Run the checker on the folder and fix every hit before you finish:
   ```
   node .claude/skills/content/check.mjs content/<folder>
   ```
   It flags banned words, dashes, exclamation marks, emoji, hashtags, US spellings, Title Case headings and length limits. A clean run prints `OK`. Do not finish with hits unless Marin has asked for the thing it flags.

5. Write `README.md` in the folder: a table of piece, channel, first line, length, status (`ready` or `needs Marin` with the reason). Put the `00-core.md` one sentence idea at the top.

6. Report in chat: the folder path, the one sentence idea, which pieces need something from Marin, and anything in the idea you disagreed with and how you handled it.

## Rules that apply to every piece

- Same idea, same claim, same action, same facts in every piece. If a channel needs less, cut. Never add.
- One call to action per piece, from the style guide table.
- First line does the work. On every channel the first line is seen before the rest. Lead with the claim or the moment, never with "I".
- No placeholders except `[MARIN: ...]`. No lorem ipsum, no "insert story here".
- Speak to one reader. "You", not "leaders" or "people like you".
- Where Marin is wrong or the idea is weak, say so in chat and in a short note at the top of `00-core.md`. Still produce the content, with the weakest claim softened to what the evidence supports.
- Do not invent research, numbers, client results or quotes. If a number would help and none is on record, leave it out.

## Reuse

The same folder can be rerun. `/content rerun content/<folder> only: x-post` rewrites the named pieces from the existing `00-core.md` without touching the rest. If Marin edits `00-core.md` by hand, a rerun picks up his changes.
