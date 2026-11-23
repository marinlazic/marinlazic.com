# Kit newsletter

Where it goes: Kit (ConvertKit), a broadcast to Marin's list. This list came through the free assessment, the Recovery Guide and the lead magnets, so these readers already know Marin and have told him something about their training.

Limits
- 350 to 700 words. Shorter than Substack. These people asked for the plain version in their inbox.
- Subject under 45 characters, sentence case, no punctuation tricks. Say what the email is about.
- Preview text under 90 characters, finishing the thought the subject started.
- One link, repeated at most twice: once in the body, once as the button or PS.

Shape
1. Greeting: `Hi {{ subscriber.first_name | default: "there" }},` on its own line. That is Kit's merge tag. Keep it exactly.
2. Open with the claim or a one line scene. No "Hope you are well".
3. The mechanism in 2 to 4 short paragraphs. Plain prose, like the emails the site already sends.
4. The action for this week, in prose or 3 short lines.
5. One line that invites a reply: "Reply and tell me which day you would drop first." Marin reads replies.
6. Sign off: "Marin" on its own line.
7. PS with the call to action and the link, or a button label in sentence case under the sign off.

Writing notes
- Match the site's emails: plain, warm, direct, short sentences, no bullet points unless the content is a list, no headings, no emoji.
- Mention the assessment or guide the reader took if it fits: "You scored lowest on recovery, most people on this list did."  Only when the tag is known; otherwise do not assume.
- Plain text look. Kit's plain template, or the site's ivory frame if Marin has built it in Kit.
- Note any Kit tag the email should apply or segment it should go to, in the header block, using the names in `server/kit.ts` and todo.md (for example `lead-recover`).

File header block
```
Channel: Kit newsletter
Paste into: Kit, new broadcast
Subject: <under 45 characters>
Preview: <under 90 characters>
Segment: <all subscribers, or a tag>
Check before sending: merge tag kept as written; send a test to yourself; one link
```
