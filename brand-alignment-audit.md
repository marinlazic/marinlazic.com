# Brand Alignment Audit: Stoke Recovery Site vs. Portfolio Site

**Prepared for:** Marin Lazic
**Date:** 4 March 2026

---

## Executive Summary

Your portfolio site (marinlazic.com) has a strong, distinctive brand identity rooted in the International Typographic Style: white canvas, bold red (#E53935) accents, DM Sans headings, Inter body text, sharp zero-radius edges, and a voice that blends Simon Sinek's purpose-driven depth with Chad and JT's irreverent energy. The Stoke Recovery protocol site shares some DNA but diverges significantly in colour, typography, tone consistency, and visual language. Below is a section-by-section breakdown with specific fixes.

---

## 1. Colour System

The portfolio site uses a strict three-colour palette: white, black, and a single red accent (#E53935). Every accent element, from the small squares to the CTA hover states, uses this exact red. The recovery site introduces purple/blue gradients and a green dot indicator that have no precedent in the portfolio brand.

| Element | Portfolio Site | Recovery Site | Aligned? |
|---|---|---|---|
| Background | White (#FFFFFF) | White (#FFFFFF) | Yes |
| Primary text | Black (#000000) | Black (#000000) | Yes |
| Accent colour | Red (#E53935) | Purple/blue gradient | **No** |
| Section label dot | Red square (2.5px) | Green circle | **No** |
| CTA button fill | Solid black | Purple gradient | **No** |
| CTA button text | White, uppercase, tracked | White, mixed case | **No** |
| Divider lines | Black, 1.5px | Not consistently used | **No** |

**Recommendation:** Replace all purple/blue gradients with #E53935 red. Replace the green dot with a red square. Make all CTA buttons solid black with white uppercase tracked text. Add fine black divider lines between sections to match the portfolio's Swiss grid structure.

---

## 2. Typography

The portfolio uses DM Sans (a geometric sans-serif) for all headings and Inter for body text. Both are loaded from Google Fonts. All headings are uppercase with tight negative tracking. The recovery site appears to use a serif or display font for its main heading ("The Stoke Tank Recovery System") and a different weight/size hierarchy.

| Element | Portfolio Site | Recovery Site | Aligned? |
|---|---|---|---|
| Heading font | DM Sans, bold, uppercase | Serif/display, mixed case | **No** |
| Body font | Inter, light/regular | Sans-serif (similar to Inter) | Partial |
| Heading tracking | -0.02em to -0.03em (tight) | Standard | **No** |
| Heading case | All uppercase | Title case | **No** |
| Section labels | 0.2em tracked, uppercase, xs | Similar but inconsistent | Partial |
| Section numbers | Used in timeline (01, 02...) | Used throughout (01, 02...) | Yes |

**Recommendation:** Switch the recovery site's heading font to DM Sans. Set all section headings to uppercase with tight tracking (-0.02em). Keep the numbered section labels (01, 02, 03) as they already match. Ensure body text uses Inter at the same weight scale (300 for light, 400 for regular).

---

## 3. Voice and Tone

This is the most important alignment issue. The portfolio site has a consistent voice: self-deprecating humour layered over genuine expertise. Lines like "Professional stoke tank filler. Currently losing Dad of the Year" and "Your brain is absolutely cooked" sit comfortably next to "Emotions drive performance more than any program ever will." The recovery site attempts this blend but is inconsistent, switching between formal academic language and casual asides without a clear pattern.

| Section | Recovery Site Tone | Portfolio Tone Match? |
|---|---|---|
| Hero/intro | Formal, educational | **No** (portfolio hero is punchy and personal) |
| Olympic vs Corporate framing | Clear, direct, good | Yes |
| Stress type intros | Casual, funny ("brain is cooked", "bro") | Yes |
| Stress type definitions | Formal, clinical | **No** (portfolio avoids clinical language) |
| Recovery strategies | Instructional, neutral | Partial |
| Nutrition section | Uses emoji, educational | **No** (portfolio uses no emoji) |
| About Marin section | Formal bio | **No** (portfolio bio is origin story with humour) |

**Recommendation:** Commit to one voice throughout. The portfolio voice works: direct, slightly irreverent, grounded in real expertise. Every section on the recovery site should sound like Marin talking to a client, not like a textbook. Remove all emoji from the nutrition section and replace with the red square icon pattern. Rewrite the About section to match the portfolio's origin story ("Four weeks before World Championships, I got dropped..."). Keep the casual intros for each stress type because they are already on brand. Rewrite the formal definitions to match: instead of "Stress applied to the nervous system" try "This is the stress nobody sees. Your brain and nerves are working overtime coordinating everything, and you can't feel it the way you feel sore muscles."

---

## 4. Navigation and Logo

The portfolio uses "ML" as the logo mark with four navigation links (About, Experience, Coaching, Contact) plus a "LET'S GO" CTA button. The recovery site uses "Marin Lazic" as the logo with different navigation links (The Model, About Marin, Book Marin to Speak, Contact).

| Element | Portfolio Site | Recovery Site | Aligned? |
|---|---|---|---|
| Logo | "ML" (bold, tracked) | "Marin Lazic" (bold) | **No** |
| Nav style | Uppercase, xs, tracked | Mixed case | **No** |
| CTA button in nav | "LET'S GO" (black fill) | None | **No** |
| Link naming | About, Experience, Coaching, Contact | The Model, About Marin, Book Marin to Speak, Contact | Different (acceptable for different content) |

**Recommendation:** Change the logo to "ML" to match the portfolio. Style all nav links as uppercase, xs size, with 0.15em tracking. Add a CTA button in the nav ("SEE THE MODEL" or "LET'S GO") with solid black fill and white uppercase text. The different link names are fine since the sites serve different purposes, but the visual treatment should be identical.

---

## 5. Layout and Grid

The portfolio uses a strict asymmetric grid (typically 3-column left label + 9-column right content on desktop) with generous negative space and fine black divider lines between sections. The recovery site uses a more centred, full-width layout without the same grid discipline.

**Recommendation:** Adopt the portfolio's asymmetric grid pattern where possible. Use the left-column label pattern (small red square + uppercase tracked label + section heading) for each major section. Add fine black horizontal dividers (1px, black/10 opacity) between sections. Maintain the same max-width container (1280px) with matching horizontal padding.

---

## 6. Key Definitions to Align

The "Stoke Tank" metaphor is central to both sites but is defined differently. The portfolio references it casually ("fill your stoke tank") while the recovery site provides a formal definition. Both sites should use the same definition.

| Term | Portfolio Usage | Recovery Site Usage | Recommendation |
|---|---|---|---|
| Stoke Tank | "Fill your stoke tank" (CTA, casual) | "Your personal reserve of energy, focus, and readiness" (formal definition) | Use the recovery site's definition on both, but deliver it in the portfolio voice |
| Functional State | Not mentioned | Formally defined | Add a brief reference on the portfolio's Services section |
| GET ready vs STAY ready | Referenced in services | Central framing in section 01 | Ensure identical wording on both |
| Biology, Not Physics | Section heading on portfolio | "The biology does not care which arena you perform in" on recovery | Align the phrasing: use "Biology, Not Physics" as a label on the recovery site too |
| Four stress types | Not on portfolio | Core content on recovery | Consider adding a brief teaser on the portfolio's services that links to the recovery protocol |

---

## 7. Specific Content Fixes Needed

The recovery site's About Marin section reads like a standard LinkedIn bio. It should be replaced with the same origin story from the portfolio: the national team drop, Eastern European parents, the lesson about stress and biology. This is the most powerful piece of content across both sites and it directly supports the recovery protocol's thesis.

The recovery site's contact/CTA section should use the same language as the portfolio: "Let's Go Deep" or "Fill Your Stoke Tank" rather than a generic contact form heading.

The "Book Marin to Speak" nav link suggests a speaker site connection. If this links to the speaker site (marinlazicspeaker.manus.space), ensure that site also follows the same brand guidelines.

---

## Summary Checklist

| Priority | Change | Impact |
|---|---|---|
| **High** | Replace all purple/blue with #E53935 red | Visual brand consistency |
| **High** | Switch headings to DM Sans, uppercase, tight tracking | Typography alignment |
| **High** | Rewrite About section with portfolio origin story | Voice consistency |
| **High** | Make all CTAs solid black with white uppercase text | Interactive element consistency |
| **Medium** | Replace green dot with red square accent | Detail consistency |
| **Medium** | Remove all emoji from nutrition section | Tone alignment |
| **Medium** | Change logo from "Marin Lazic" to "ML" | Brand mark consistency |
| **Medium** | Add fine black divider lines between sections | Grid/layout alignment |
| **Medium** | Standardise voice across all sections (casual expert, not textbook) | Tone consistency |
| **Low** | Adopt asymmetric grid layout where possible | Layout alignment |
| **Low** | Add "Biology, Not Physics" label to recovery site | Cross-site terminology |
| **Low** | Cross-link between portfolio services and recovery protocol | User journey |
