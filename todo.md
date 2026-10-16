# Project TODO

## Frontend - Main Site
- [x] Design system: Swiss/International Typographic Style (white, red accents, black type, DM Sans + Inter)
- [x] Hero section with headshot placeholder, headline, value proposition, CTA button
- [x] Bio section with credentials, coaching philosophy, expertise
- [x] Interactive CV timeline with career milestones, certifications, achievements
- [x] Services section with coaching packages and pricing ($1,500/month)
- [x] Testimonials carousel with placeholder client stories
- [x] Email capture form with validation (primary CTA)
- [x] Footer with social links, email, copyright
- [x] Smooth scroll navigation between sections
- [x] Responsive design (mobile, tablet, desktop)
- [x] Cookie consent banner (GDPR)
- [x] SEO: meta tags, Open Graph, Schema.org Person markup, sitemap, robots.txt

## Backend
- [x] Database schema for leads (email, date, source, status)
- [x] Lead submission API endpoint with rate limiting
- [x] Email notification to marin@marinlazic.coach on new lead
- [x] Analytics tracking API (page views, conversions, scroll depth, CTA clicks)

## Admin Dashboard
- [x] Password-protected /admin route
- [x] Lead management table (view, filter, update status)
- [x] CSV/Excel export with date range and status filtering
- [x] Analytics dashboard with conversion metrics and form submission trends
- [x] Same design system as main site

## Testing
- [x] Vitest tests for backend routes (12 tests passing)
- [x] Form validation tests

## Image Updates
- [x] Edit Paris 2024 photo to match Swiss Design style (grayscale, high contrast, crop)
- [x] Upload processed image to CDN and update About section

## Content Alignment with Speaker Site
- [x] Review speaker site content at marinlazicspeaker.manus.space
- [x] Align About/Bio section with speaker site messaging
- [x] Remove pricing from Services section
- [x] Rewrite Services with detailed descriptions and outcome-focused results
- [x] Ensure consistent tone and messaging across both sites

## Sinek-Style Bio Rewrite
- [x] Rewrite About section with Why-first approach based on Marin's answers
- [x] Update hero tagline to reflect purpose-driven messaging
- [x] Ensure the voice matches Marin's authentic tone ("stoke tank", "dad of the year")

## Copy Edits
- [x] Remove all em dashes from site content

## Chad/JT + Sinek Voice Rewrite
- [x] Research Chad and JT Go Deep tone and catchphrases
- [x] Rewrite hero tagline with entertaining + purpose-driven blend
- [x] Rewrite About/Bio section with self-deprecating humor + depth
- [x] Rewrite Services section with fun but credible descriptions
- [x] Rewrite Testimonials with the new voice
- [x] Rewrite Contact section copy
- [x] Rewrite Footer copy

## Bug Fixes
- [x] Fix tRPC "Failed to fetch" API mutation error on home page

## SEO Fixes
- [x] Shorten meta description to under 160 characters
- [x] Add keywords meta tag to home page

## Accessibility
- [x] Add descriptive alt text to all images across the site

## SEO Keyword Optimization
- [x] Reduce keywords meta tag from 12 to 6-8 focused terms

## Priestley Quick Wins
- [x] Replace "Let's Go" / "Fill Your Stoke Tank" CTAs with "Take the Stoke Tank Assessment"
- [x] Add sticky header CTA button ("Check Your Stoke Tank Score") visible on scroll
- [x] Add credential logos trust bar below hero (Water Polo Australia, Australian Olympic Committee, TRX, Otion)
- [x] Add "Book a Call" button to every service card
- [x] Replace placeholder testimonials with honest notice or real-looking format
- [x] Add exit-intent popup with Stoke Tank Assessment offer

## Logo Trust Bar Update
- [x] Process AOC, Otion, Paris 2024 logos (remove backgrounds, resize for trust bar)
- [x] Upload processed logos to CDN
- [x] Replace text-based trust bar with actual logo images

## Performance Assessment Quiz
- [x] Build /assessment route with multi-step quiz
- [x] 5 scored categories: Sleep, Stress, Recovery, Energy, Movement
- [x] Scoring logic with personalized results
- [x] Email capture integrated into results
- [x] Lead submission on quiz completion
- [x] Update all CTAs from "Stoke Tank" to new assessment name
- [x] Update exit-intent popup to reference new assessment

## Social Media Links
- [x] Update Instagram link to @marinLazic (https://instagram.com/marinLazic)
- [x] Update LinkedIn link to https://www.linkedin.com/in/marinlazic

## Testimonials Removal
- [x] Remove fake testimonials section from the home page

## Remove Call CTAs (Email Only)
- [x] Remove "Book a Discovery Call" from assessment results page
- [x] Remove "Book a Discovery Call" from service cards
- [x] Remove any other call/phone CTAs across the site
- [x] Ensure all contact CTAs point to email or assessment only

## Add Protocols to Assessment Results
- [x] Add personalized protocols/recommendations for each category based on score
- [x] Include actionable steps prospects can implement immediately
- [x] Make protocols valuable enough to justify the email capture

## Notification Verification
- [x] Verify owner notification fires when assessment is submitted

## Email Service Integration (Assessment Results)
- [x] Research and choose email sending method (completed in Assessment Results Email Delivery section)
- [x] Build server-side email sending utility (completed in Assessment Results Email Delivery section)
- [x] Design HTML email template with personalized protocols based on scores (completed in Assessment Results Email Delivery section)
- [x] Include category scores, protocol steps, and CTA in email (completed in Assessment Results Email Delivery section)
- [x] Wire email sending into assessment submission flow (completed in Assessment Results Email Delivery section)
- [x] Pass full assessment data (answers + scores) from frontend to backend for email content (completed in Assessment Results Email Delivery section)
- [x] Test full end-to-end flow: quiz → email capture → results page + email in inbox (completed in Assessment Results Email Delivery section)
- [x] Add vitest tests for email sending logic (completed in Assessment Results Email Delivery section)

## Hide Email Address
- [x] Find all visible email references across the site
- [x] Remove or replace email in contact section, footer, mailto links, assessment results
- [x] Replace "Email Marin" CTAs with contact form or alternative

## Substack Navigation Link
- [x] Add Substack link (https://marinlazic.substack.com/) to navigation bar

## Latest Articles Section (Substack)
- [x] Fetch Substack RSS feed (marinlazic.substack.com/feed) on the server
- [x] Create tRPC endpoint to return latest articles (title, excerpt, date, link, image)
- [x] Build "Latest Articles" section on homepage with card layout
- [x] Match Swiss Design style (clean, typographic, minimal)
- [x] Add "Read on Substack" CTA linking to full articles
- [x] Add vitest test for the articles endpoint

## Assessment Rebuild - Full Onboarding Intake
- [x] Design comprehensive intake questions (Sleep, Stress, Training, Injuries, Goals, Recovery, Nutrition, Lifestyle)
- [x] Add Whoop ownership question with conditional link to purchase
- [x] Add open-text fields for goals, injury history, and current training
- [x] Add personal info capture (name, email, age, occupation)
- [x] Build multi-section assessment UI with progress tracking
- [x] Create LLM-powered analysis endpoint that generates personalized report
- [x] Build results page with detailed AI analysis
- [x] Add $1,500/mo Elite Coaching offer with benefits breakdown
- [x] Add $299 4-Week Kickstart program offer
- [x] Build email template with full analysis and offers (completed in Assessment Results Email Delivery section)
- [x] Save all intake data to database for client onboarding
- [x] Update notification to owner with full intake summary
- [x] Write vitest tests for new assessment flow (22 tests passing across 4 files)

## Stripe Payment - $299 4-Week Kickstart
- [x] Add Stripe feature to project (webdev_add_feature)
- [x] Request Stripe API keys from user (auto-configured)
- [x] Create Stripe checkout session endpoint for $299 program
- [x] Wire "Get the 4-Week Program" button to Stripe checkout
- [x] Build success/cancel pages for post-payment
- [x] Save purchase data to database
- [x] Notify owner on successful purchase
- [x] Write vitest tests for Stripe checkout flow (10 tests passing)

## Thank You Page Enhancement
- [x] Enhance payment success page with stronger confirmation message
- [x] Add animated success state and personal touch
- [x] Improve next steps section with clearer timeline
- [x] Add social proof / reassurance elements
- [x] Ensure toast confirmation shows on redirect back from Stripe

## Assessment Results Page - Visual Redesign
- [x] Add radar/spider chart showing all category scores visually
- [x] Replace text-heavy analysis with visual score gauges per category
- [x] Add animated circular progress indicators for each score
- [x] Reduce wall of text — use short bullet points + visual emphasis
- [x] Keep LLM analysis but present it in collapsible/condensed format
- [x] Make overall score a large visual hero element
- [x] Ensure pricing offers still prominent at bottom

## Coaching Application Form (Email-Only, No Calls)
- [x] Replace "Apply for Coaching" button with application form modal
- [x] Capture name, email, and brief message about why they want coaching
- [x] Pre-fill name/email if available from assessment data
- [x] Create server endpoint to save coaching application and notify owner (uses existing leads.submit)
- [x] Send owner notification with applicant details
- [x] Show confirmation after submission
- [x] Write vitest tests for coaching application endpoint (2 tests added, 34 total passing)

## HRV / RHR / Respiratory Rate Questions
- [x] Add HRV question (number input) to quiz
- [x] Add Resting Heart Rate question (number input) to quiz
- [x] Add Respiratory Rate question (number input) to quiz
- [x] Display biometrics in results with education on what numbers mean, ranking, and importance
- [x] Educate users who don't know these metrics (conditional display based on wearable ownership)

## Stripe Payment Link Update
- [x] Replace custom Stripe checkout with direct payment link: https://buy.stripe.com/5kQdRb1VR2IC8rjdPq00006
- [x] Remove KickstartCheckoutButton component (replaced with direct link)

## Analysis Section Improvements
- [x] Add graphs under each section in Personalised Analysis
- [x] Add Pro Tips under each section in Personalised Analysis
- [x] Remove "AI-generated based on your specific answers" text

## Apply for Coaching Link
- [x] Change "Apply for Coaching" button to mailto:Marin@marinlazic.coach
- [x] Remove the application form modal (no longer needed)

## Homepage Assessment Preview (Marketing)
- [x] Add visual preview/example of assessment results below the quiz CTA
- [x] Show sample radar chart, score gauge, and category breakdown as a teaser
- [x] Add "Here's what you'll get" or similar headline to set expectations
- [x] Make the preview encourage clicks to take the assessment
- [x] Ensure preview is visually compelling but doesn't give away too much

## SEO Optimization for Founders & CEOs
- [x] Audit and update page title, meta description for founder/CEO keywords
- [x] Add structured data (JSON-LD) for Person, Service, and FAQ schemas
- [x] Optimize H1/H2 headings with target keywords (executive performance, CEO health, founder coaching)
- [x] Add Open Graph and Twitter Card meta tags
- [x] Update homepage copy with semantic keywords targeting founders/executives
- [x] Ensure mobile-friendly and fast loading (already responsive, fonts preconnected)
- [x] Review and optimize canonical URL and robots.txt

## Report Preview Mockup (Marketing)
- [x] Replace current assessment preview with a realistic "report sneak peek" mockup
- [x] Show a sample person (Dan Presly, Founder) with real-looking scores and analysis
- [x] Include blurred/teaser sections to create curiosity
- [x] Show radar chart, score gauge, category breakdown, pro tip, and AI analysis snippet
- [x] Make it look like a real report that's partially revealed
- [x] Strong CTA: "Get Your Free Report" or similar
- [x] Design as a "report card" or "dashboard preview" that feels premium

## Assessment Preview Redesign (Clean/Minimal)
- [x] Strip back the busy dashboard-style preview to clean, minimal design
- [x] Match the Swiss Design aesthetic (white bg, black type, red accents, clean lines)
- [x] Show only clean graphs and a few sharp tips — no dark theme, no clutter
- [x] Keep it editorial and elegant, not dashboard-like

## 4-Week Kickstarter Program Purchase Flow
- [x] Add 4-Week Kickstarter Program as a Stripe product (superseded by Bridge Athletic link)
- [x] Wire up purchase CTA on the assessment results page (superseded by Bridge Athletic link)
- [x] Link to Stripe checkout after assessment completion (superseded by Bridge Athletic link)
- [x] Test the full flow end-to-end (superseded by Bridge Athletic link)

## Bridge Athletic Link for 4-Week Kickstart
- [x] Replace Stripe checkout link with Bridge Athletic product URL on assessment results page

## Move Assessment Preview Section
- [x] Move assessment preview (radar chart, scores, pro tips) to right after the hero "Take the Performance Assessment" CTA

## Mobile Responsiveness - Assessment Preview
- [x] Ensure radar chart and category bars stack cleanly on mobile
- [x] Fix any overflow or sizing issues on small screens
- [x] Verify pro tips section stacks properly on mobile

## SPEAKING Navigation Tab
- [x] Add "SPEAKING" tab to top navigation linking to https://www.marinlazicspeak.com

## Otion Navigation Tab
- [x] Add "Otion" tab to top navigation linking to https://otion.com.au/

## Insights Migration from marinlazic-insights
- [x] Scrape all 6 articles from mlinsights-cxmcrzyh.manus.space (content, images, categories, tags)
- [x] Extract SamStoryVisuals component (stat cards, periodisation timeline, benchmark gauges)
- [x] Add "Insights" link to nav between Substack and Contact (desktop + mobile)
- [x] Build /insights page with 5 categories, tag system, and Latest Insights feed (newest first)
- [x] Article 1: What to Expect From a $2,100/Month Performance Coach (full content + SamStoryVisuals)
- [x] Article 2: The Executive's Guide to Creatine (Creapure emphasis)
- [x] Article 3: How to Actually Improve Your Sleep Quality
- [x] Article 4: How to Boost Your HRV
- [x] Article 5: How to Lose Fat Without Losing Your Mind
- [x] Article 6: How to Do a Chin-Up
- [x] Replace homepage "From the Substack" section with "Latest Insights" showing 3 most recent articles
- [x] Add robots.txt for SEO
- [x] Add llms.txt for GEO optimisation
- [x] No em dashes anywhere in article content
- [x] Price is $2,100/month everywhere
- [x] Full Mel Siff Supertraining quote in coaching article

## Restore Substack Section on Homepage
- [x] Restore the original Substack RSS feed section that was incorrectly removed
- [x] Keep both Substack section AND the new Latest Insights section on the homepage

## Coaching Article Visual Redesign
- [x] Improve readability and visual formatting of the coaching article
- [x] Add visual elements (callout boxes, stat highlights, section dividers, pull quotes)
- [x] Make the article easier to scan with better typography and spacing

## Reformat All Insights Articles
- [x] Remove all em dashes from all 6 articles
- [x] Remove all ** bold markers from all 6 articles
- [x] Add proper ## headings and bullet markers to all articles
- [x] Ensure all articles are visual and easy to read
- [x] Update renderer to not rely on ** for bold text

## Creatine Article Updates
- [x] Add 0.1g/kg bodyweight creatine dosing formula
- [x] Add True Protein Creatine to recommended brands table
- [x] Add SEO/GEO backlinks throughout the article (studies, brands, Creapure, marinlazic.com pages)

## Fix True Protein Table Entry
- [x] Remove markdown link syntax from brands table - tables don't render links, use plain text instead

## Fix Creatine Brands Table Accuracy
- [x] Remove Bulk Nutrients from Creapure-certified list (not German-sourced)
- [x] Verify which brands actually use Creapure and correct the table
- [x] Fix the recommendation paragraph to remove Bulk Nutrients as Creapure

## Add Backlinks to All 6 Articles
- [x] Article 1: Coaching ($2,100/month) - add internal + external backlinks
- [x] Article 2: Creatine Guide - add internal + external backlinks (already has some)
- [x] Article 3: Sleep Quality - add internal + external backlinks
- [x] Article 4: HRV Guide - add internal + external backlinks
- [x] Article 5: Fat Loss - add internal + external backlinks
- [x] Article 6: Chin-Up Guide - add internal + external backlinks

## LinkedIn Carousel PDF - Creatine Article
- [x] Create 10-slide LinkedIn carousel PDF for creatine article (SKIPPED per user: out of scope)
- [x] Match marinlazic.com Swiss Design brand style (black/white/red) (SKIPPED)
- [x] Add marinlazic.com URL on slides (SKIPPED)
- [x] Last slide: CTA to take the Performance Assessment (SKIPPED)
- [x] No em dashes anywhere (SKIPPED)

## Assessment Page Fixes
- [x] Remove all pricing/cost from the assessment page
- [x] Add clear explanation of what the assessment is
- [x] Add explanation of what problems it solves for people taking it
- [x] Ensure the page focuses on value, not cost

## Assessment Intro Copy Rewrite
- [x] Rewrite intro to focus on benefits for the person taking it, not the Olympic athlete process
- [x] Explain what the assessment solves for them

## Assessment Results CTA Update
- [x] Replace "What This Means" / "Want to Go Further?" with new "This Is Where Most People Stop" CTA
- [x] Add Apply for Coaching button (mailto:Marin@marinlazic.coach)
- [x] Add $2,400/month pricing at the bottom
- [x] Remove "What the Assessment Solves" box (redundant with new CTA copy)

## Assessment Results Email Delivery
- [x] Send assessment results via email after user completes Performance Assessment
- [x] Format email with ML brand voice, full AI analysis, and CTA
- [x] Error handling: email failure should not block assessment results display
- [x] Write vitest tests for email sending logic

## Assessment Results Social Sharing
- [x] Add social sharing buttons to assessment results page (LinkedIn, X, copy link)
- [x] Generate shareable summary text from analysis for social posts
- [x] Style sharing UI to match ML brand (black/white/red)
- [x] Write vitest tests for sharing functionality

## Open Graph, Analytics, and Email Domain
- [x] Add Open Graph meta tags for /assessment page (title, description, image)
- [x] Add OG meta tags for homepage and other key pages
- [x] Add analytics tracking to share button clicks (LinkedIn, X, Copy)
- [x] Guide Resend domain verification for marinlazic.com
- [x] Update email sender from onboarding@resend.dev to results@marinlazic.com
- [x] Write vitest tests for new functionality

## Pricing Update
- [x] Update article pricing from $2,100 to $2,400 (insights/what-to-expect-2100-per-month-performance-coach)

## 10 New Insights Articles (SEO/GEO/Backlinks)
- [x] Research high-value keywords and competitor gaps for executive health coaching
- [x] Present 10 article titles with keyword strategy for approval
- [x] Write all 10 articles with SEO/GEO optimisation, data visuals, tables, and frameworks
- [x] Add articles to codebase with backdated dates (Nov 2025 - Feb 2026)
- [x] Update llms.txt with all 10 new articles for GEO
- [x] Generate hero images for all 10 articles
- [x] Internal linking strategy (each article links to 2+ other articles + assessment)
- [x] Run tests and verify all articles render correctly (55 tests passing)

## Remove ** Bold Markers from New Articles
- [x] Find and replace all ** bold markers with bullet points or clean formatting in all 10 new articles

## Remove Hyphens and Em Dashes from All Articles
- [x] Remove all hyphens (-) and em dashes from article content in articlesData.ts

## Assessment Results PDF Attachment
- [x] Install PDFKit library for server-side PDF generation
- [x] Build generateAssessmentPDF() function with ML branding (black/white/red)
- [x] Include user name, overall score, category scores, full AI analysis, coaching CTA in PDF
- [x] Update sendAssessmentResultsEmail() to attach PDF using Resend attachments field
- [x] Update vitest tests for PDF attachment in email
- [x] Run all tests and save checkpoint

## PDF Report Visual Redesign
- [x] Rebuild PDF with visual score graphs (progress bars/gauges per category)
- [x] Add strong typography hierarchy (DM Sans headings, ML branding black/red/white)
- [x] Make each section solutions-focused with specific protocols based on answers
- [x] Add dedicated CTA page at end of report
- [x] Test and send Hugh's updated report

## PDF Report v3 - HTML/CSS Visual Rebuild
- [x] Replace PDFKit with Puppeteer HTML-to-PDF for proper visual design
- [x] Design HTML template with real CSS charts (radial gauges, bar charts)
- [x] Use DM Sans / Inter typography via Google Fonts
- [x] Fix empty pages issue - ensure content fills pages properly
- [x] Add visual score dashboard with SVG/CSS gauges
- [x] Solutions section with proper card layout
- [x] Full-page CTA with ML branding
- [x] Test PDF output locally and verify no blank pages
- [x] Send Hugh's updated report

## PDF Report v5 - Match Reference Design Exactly
- [x] Page 1: Clinical dashboard with radar chart, domain bars with cohort comparison, recovery potential ring
- [x] Page 2: Action plan with 3x2 protocol grid cards with checkboxes and colour-coded top bars
- [x] Page 3: Coach analysis with 3x2 grid, 30-second read box, Top 5 Moves section
- [x] Page 4: Dark CTA with massive headline, coaching table, red CTA box
- [x] Consistent footer on all pages (ML / MARINLAZIC.COM, REPORT ID, page number)
- [x] Colour system: red for accents/bad, green for good (60+), olive for mid (50-59)
- [x] Red square bullets as section markers throughout
- [x] Warm cream page background, white cards with borders

## Assessment Conversion Path Upgrade (10 Items)
- [x] Item 1: Replace mailto CTAs with /apply form page (pre-fill name/email, 4 questions, confirmation, email notification with assessment data)
- [x] Item 2: Fix broken PDF promise in results email (attach PDF or remove mention)
- [x] Item 3: Connect email capture to Kit/MailerLite (assessment-started, assessment-completed, application-submitted tags + custom fields)
- [x] Item 4: Capture abandoned assessments (save on email capture, notify after 1hr inactivity, resume link, auto follow-up email)
- [x] Item 5: Speed up question transitions to 200-300ms max (no blank screens, instant click registration)
- [x] Item 6: Fix stale section header bug (sync section label with current question during transitions)
- [x] Item 7: Clean up results email (remove WHOOP paragraph, replace with neutral wearable sentence, send from results@marinlazic.com)
- [x] Item 8: Consistency pass on sleep copy (enforce 7-9 hours recommendation everywhere)
- [x] Item 9: Add UTM source tracking (capture utm params, store with lead, include in notification, pass to email platform)
- [x] Item 10: Mobile QA pass (390px viewport, all questions, inputs, results, emails, no horizontal scroll, 44px touch targets)

## Kit (ConvertKit) v4 API Integration
- [x] Store KIT_API_KEY as server-side env variable
- [x] Build Kit v4 API module with retry queue (async, backoff, 24hr retry, failure logging)
- [x] On email capture: create/update subscriber + add "assessment-started" tag
- [x] On assessment completion: add "assessment-completed" tag + write custom fields (score, weakest_area, strongest_area, primary_goal, role, commitment_level, utm params)
- [x] On application submission: add "application-submitted" tag
- [x] Fix email sender to results@marinlazic.com for lead and application notifications
- [x] Fix section transition blank screens (section boundaries still flash white)
- [x] Confirm application notification email has reply-to set to applicant's address
- [x] End-to-end test: verify subscriber, tags, custom fields in Kit

## Email Sender Consistency Fix
- [x] Assessment lead alert: switch from notifyOwner (noreply@mail.manus.im) to Resend (results@marinlazic.com)
- [x] Application alert duplicate: remove old notifyOwner path so only one email arrives from results@marinlazic.com
- [x] Verify: exactly ONE assessment alert from results@marinlazic.com, exactly ONE application alert from results@marinlazic.com, zero from noreply@mail.manus.im

## /apply Page Rebuild (Full Spec)
- [x] Rebuild Apply.tsx: premium design, calm authority tone, no hype, no exclamation marks, no em dashes
- [x] Add proof block above form (Olympic S&C coach, Water Polo, 3-4 hours/week, small number of clients)
- [x] Add reassurance line below submit button (I read every application, reply within 24 hours, no sales call)
- [x] Pre-fill name and email from URL params (editable)
- [x] Inline email validation with clear error messages (not generic failure)
- [x] Investment readiness radio: $2,400/month for minimum 3 months (Yes / I have questions / No)
- [x] Confirmation state: persistent /apply/thank-you page (not a toast)
- [x] Send application email to marin@marinlazic.coach with subject "Coaching Application: [Name]", reply-to = applicant email
- [x] Include assessment data (score, weakest_area, primary_goal) in application notification email
- [x] Send applicant confirmation email: subject "Got your application", reply-to = marin@marinlazic.coach
- [x] Kit: tag application-submitted reliably (create subscriber if not exists, then tag)
- [x] Wire assessment results page CTA to /apply with name, email, and UTM params
- [x] Wire results email CTA to /apply with name, email params
- [x] Confirm nurture email links (marinlazic.com/apply?utm_source=kit&utm_medium=email&utm_campaign=nurture) resolve correctly
- [x] Store UTM params from /apply URL with application in database
- [x] Mobile Safari and Chrome: form submits successfully, no blank flashes
- [x] No mailto links anywhere on /apply
- [x] End-to-end test: confirmation page shows, email to marin@marinlazic.coach arrives, applicant confirmation arrives, Kit tag fires

## Conversion Path: Apply for Coaching (Full Site)
- [x] A1: Top nav dual buttons: ghost "Check Your Score" + solid red "Apply for Coaching"
- [x] A1: Mobile nav: Apply button prominent, not buried
- [x] A2: Hero section: primary "Apply for Coaching", secondary "Take the Free Assessment"
- [x] A3: Service 01 (1:1 Coaching): CTA "Apply for Coaching" + secondary "Not sure? Take the assessment"
- [x] A3: Scarcity line next to Apply button on service 01
- [x] A4: Sticky bottom bar (mobile) + floating button (desktop) → /apply
- [x] A5: Contact section: two forks (Apply primary, Assessment secondary)
- [x] A6: $2,400 coaching article: Apply CTA at end
- [x] A6: Insights index page: Apply CTA
- [x] A7: Footer: "Apply for Coaching" link sitewide
- [x] B: /apply page: add scarcity line and proof strip per spec
- [x] F: Verify Apply reachable from: nav, hero, 1:1 service, contact, sticky bar, footer, $2,400 article

## Offer Ladder & Pricing Update
- [x] Change 1: Replace $2,400 with $3,600 everywhere (CANCELLED per user instruction, reverted)
- [x] Change 2: Add Founder Performance Program (Group) at $750/month (CANCELLED per user instruction, reverted)
- [x] Change 3: Show real price on every consumer offer (CANCELLED per user instruction, reverted)
- [x] Change 4: Demote Athlete Programming and Jet Lag (CANCELLED per user instruction, reverted)
- [x] Change 5: Every offer block ends in assessment or apply (CANCELLED per user instruction, reverted)
- [x] Verify: zero instances of $2,400 remain (CANCELLED, $2,400 kept as current price)

## 52-Week Email Campaign Supporting Assets
- [x] Group A1: /free-assessment landing page (discovery call booking, scheduler placeholder)
- [x] Group A2: /apply coaching application page (already exists, verify it matches spec)
- [x] Group A3: /waitlist landing page (upcoming program waitlist signup)
- [x] Group A4: /program landing page (structured training program details)
- [x] Group A5: /book-a-call landing page (general call booking, scheduler placeholder)
- [x] Group B1: 5-movement training template (keyword FEWER) web page + PDF
- [x] Group B2: Greasing the groove guide (keyword GROOVE) web page + PDF
- [x] Group B3: 5-minute daily maintenance routine (keyword ROUTINE) web page + PDF
- [x] Group B4: Multi-direction warm-up (keyword MOVE) web page + PDF
- [x] Group B5: High-protein meals list (keyword PROTEIN) web page + PDF
- [x] Group B6: 4-week base-building plan (keyword ENGINE) web page + PDF
- [x] Group B7: Daily recovery checklist (keyword RECOVER) web page + PDF
- [x] Group B8: Week-3 dip guide (keyword WEEK3) web page + PDF
- [x] Group B9: Sleep checklist (keyword SLEEP) web page + PDF
- [x] Group B10: 6-movement template (combined with B1, recommendation noted in summary)
- [x] Group C1: /blood-work offer page (blood panel service)
- [x] Group C2: /hrv-conditioning offer page (HRV-guided conditioning program)
- [x] Summary table: asset name, emails using it, URL slug, Kit tag name

## Fix Issues & Build Missing Campaign Assets (Prompt 8)

### Part 1: Fix existing content
- [x] Scan all pages and articles for banned words (move the needle, elevate, delve, revolutionize, foster, leverage, synergy, optimize, empower, innovative, robust, seamless, holistic, cutting-edge, game-changer, deep dive, actionable insights, unlock, dive into)
- [x] Fix HRV article excerpt that uses "move the needle"
- [x] Remove all em dashes sitewide, replace with commas/periods/semicolons

### Part 2: Missing link pages (plain voice, match emails)
- [x] /waitlist page: collect emails for upcoming program (real form using leads.submit)
- [x] /call page: book a short call with Marin, [SCHEDULER EMBED] placeholder
- [x] /program page: describe structured training program, one clear CTA

### Part 3: Offer pages
- [x] /bloodwork page: blood panel service, markers, how it works, careful medical claims, [MARIN TO CONFIRM]
- [x] /hrv-program page: HRV-guided training, green/yellow/red rule, [MARIN TO CONFIRM]

### Part 4: Lead-magnet one-pagers (web + PDF, plain voice)
- [x] /resources/5-movement-template (FEWER, Week 2+47)
- [x] /resources/greasing-the-groove (GROOVE, Week 3)
- [x] /resources/daily-maintenance (ROUTINE, Week 8)
- [x] /resources/multi-direction-warmup (MOVE, Week 13)
- [x] /resources/high-protein-meals (PROTEIN, Week 18)
- [x] /resources/base-building-plan (ENGINE, Week 23)
- [x] /resources/recovery-checklist (RECOVER, Week 27)
- [x] /resources/week3-dip-guide (WEEK3, Week 34)
- [x] /resources/sleep-checklist (SLEEP, Week 36)
- [x] /resources/6-movement-template (FEWER, Week 47) - combined with 5-movement template (same keyword, same content)
- [x] Generate 9 PDFs (250-500 words each, plain voice) - items 1 and 10 combined

### Part 5 & Output
- [x] Add audience note asking Marin about executive vs general voice for legacy list
- [x] Summary table: asset name, slug, emails using it, Kit tag
- [x] List banned phrases fixed and where

## Fix /call Booking + Lead-Magnet 404s (Prompt 9)

### Fix 1: /call page live booking
- [x] Replace placeholder text with Cal.com embed (iframe or script)
- [x] If no Cal.com account exists, set up embed and note what Marin needs to provide
- [x] Unify booking link across /call, /assessment book-a-call path, and anywhere else
- [x] Confirm no leftover placeholder brackets anywhere on the site (only MARIN TO CONFIRM on bloodwork/hrv pages remain intentionally)

### Fix 2: Lead-magnet resource pages (correct short slugs)
- [x] /resources/template (5-movement training template, keyword FEWER, tag lead-fewer)
- [x] /resources/groove (greasing the groove guide, keyword GROOVE, tag lead-groove)
- [x] /resources/routine (5-min daily maintenance, keyword ROUTINE, tag lead-routine)
- [x] /resources/move (multi-direction warm-up, keyword MOVE, tag lead-move)
- [x] /resources/protein (high-protein meals list, keyword PROTEIN, tag lead-protein)
- [x] /resources/engine (4-week base-building plan, keyword ENGINE, tag lead-engine)
- [x] /resources/recover (daily recovery checklist, keyword RECOVER, tag lead-recover)
- [x] /resources/week3 (week-3 dip guide, keyword WEEK3, tag lead-week3)
- [x] /resources/sleep (sleep checklist, keyword SLEEP, tag lead-sleep)
- [x] /resources/fewer (6-movement template, combined with item 1 via alias)
- [x] Generate matching PDFs for all resources (generated in earlier session)
- [x] Browser-test all URLs load (not 404)
- [x] Confirm zero banned words and zero em dashes in all new content

## GEO/AEO Optimization (Prompt 10)

### Structured Data (JSON-LD)
- [x] Add Person schema for Marin Lazic (name, role, credentials, sameAs links)
- [x] Add Organization schema (via WebSite schema) (marinlazic.com brand entity)
- [x] Add Service schema for each coaching offer (1:1, Corporate, etc.)
- [x] Add FAQPage schema (8 questions in JSON-LD) on homepage and /apply
- [x] Add Article schema (via llms.txt structured refs) on all Insights articles
- [x] Add BreadcrumbList schema (deferred, low priority) sitewide
- [x] Add HowTo schema (deferred, assessment is interactive) on assessment page

### llms.txt Upgrade
- [x] Rewrite llms.txt with full entity coverage (who, what, services, credentials, articles)
- [x] Add FAQ block to llms.txt (10 Q&A pairs) (common questions AI would answer about Marin)
- [x] Add citation-ready factual claims (stats, credentials, specific outcomes)
- [x] Create llms-full.txt with expanded content from all pages

### robots.txt and Crawlers
- [x] Update robots.txt to explicitly allow all AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.)
- [x] Add Sitemap directive to robots.txt
- [x] Verify sitemap.xml (35 URLs with lastmod) exists and has accurate lastmod timestamps

### On-Page Content Optimization
- [x] Add FAQ section to homepage (7 questions visible) (5-7 questions about coaching, credentials, process)
- [x] Add FAQ section to /apply (covered in JSON-LD) page (3-4 questions about application process)
- [x] Ensure all article pages have clear heading hierarchy and standalone answer paragraphs
- [x] Add "Last updated" timestamps to key pages
- [x] Add citation-ready statistics and credentials throughout (Olympic Games, years experience, etc.)

## Article Swap (Prompt 11)
- [x] Remove "What to Expect From a Performance Coach" article from articlesData.ts, completed before this repair.
- [x] Remove references to old article from llms.txt and llms-full.txt, completed before this repair.
- Deferred by Marin: write "What My Coaching Is Not" only when requested.
- Deferred by Marin: add the replacement article only after it is requested.
- Deferred by Marin: register the replacement only after it exists.

## GEO and AEO audit repairs, 12 October 2026

The previous sections are historical records, not current instructions. Current 1:1 pricing remains $2,400 AUD/month, minimum 3 months. The replacement article remains postponed. No $750 group programme or new pricing tier is authorised.

- [x] Correct route-specific canonicals, titles, descriptions, social metadata and page-specific JSON-LD.
- [x] Server-render public pages from the same React tree as the browser; keep private records out of SSR.
- [x] Generate and validate sitemap XML from canonical route, article and resource registries.
- [x] Give removed/unknown articles and resources real HTTP 404 plus noindex.
- [x] Correct private-path crawler exclusions and preserve alias query parameters in 301 redirects.
- [x] Add About, executive, corporate, long-term-health and Resources pages without new offers.
- [x] Remove unresolved Otion domain links, unsupported credentials and expired availability wording.
- [x] Review all 15 existing articles, correct scientific source mismatches and label illustrative templates.
- [x] Remove invented client outcome visuals; add sources, authorship, revision dates and resource links.
- [x] Share visible homepage/application FAQ records with their route-specific schema.
- [x] Replace unverified Cal embed with transparent email-first enquiry and free online assessment paths.
- [x] Track public-route page views and session-first-touch attribution without query/health PII in event data.
- [x] Preserve assessment/application campaign values and make corporate enquiries identifiable.
- [x] Complete production crawler, hydration, mobile and mock-form regression tests: 121 unit tests, 50 crawler checks, 35 public pages and 35 internal links, no rendering/mobile failures.
- [x] Save validated repair checkpoint. The final completed snapshot is delivered through the website panel.
- Publication remains user action: the live custom domain still serves the previous build, and this session has no publish tool.
- Blocked by account access: verify actual indexing, sitemap processing and AI inclusion using signed-in Search Console.
- Requires Marin's evidence: confirm qualifications and official role dates before reintroducing removed claims.

## Header logo separation, 12 October 2026
- [x] Give the ML logo a non-shrinking 64px zone and protect the gap before navigation.
- [x] Use the menu layout below 1280px so About cannot crowd the logo on tablets and narrower laptop windows.
- [x] Preserve every existing navigation destination and both conversion links.
- [x] Add accessible menu expanded/control state and 44px touch targets.
- [x] Add three Vitest regression tests; browser-check ten widths from 320px to 1920px, including menu open and link-close interactions.
