# A2UI Studio — Prompt Cookbook

Copy-paste any of these into the **Playground** chat (or the **Arena** to race two models). Each one is written to exercise specific parts of the A2UI v0.9.1 protocol — bindings, templates, validation, actions — so you learn the protocol while getting beautiful surfaces.

> Tip: after any surface renders, toggle **Inspect** on the canvas and click components to see their JSON and live bindings. Open the **Data** tab and type into fields to watch two-way binding.

---

## 🎬 Video & media

**Video player with sound** *(these URLs are verified reachable AND have audio tracks — many "sample video" sites ship silent files)*

```
                                                                                      
```

**Video playlist with data-bound switching** — press Play on a library item and watch the agent swap the video with a single `updateDataModel`:

```
A video library surface with Tabs: tab "Now playing" shows a Video component with url bound to
{"path":"/player/currentUrl"} and a Text title bound to /player/currentTitle; tab "Library" shows
a templated List over /videos where each item shows its title, a caption, and a "Play" button whose
action sends the item's url and title in context. Seed /videos with exactly these three:
Big Buck Bunny — https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4,
Sintel Trailer — https://media.w3.org/2010/05/sintel/trailer.mp4,
Bunny Clip — https://www.w3schools.com/html/mov_bbb.mp4.
Set /player/currentUrl and /player/currentTitle to the first video. Use these URLs verbatim.
```

Known-good direct media URLs (https, H.264 + AAC audio):

| File | URL |
| --- | --- |
| Big Buck Bunny (full, 9:56) | `https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4` |
| Sintel trailer (0:52) | `https://media.w3.org/2010/05/sintel/trailer.mp4` |
| Bunny clip (0:10) | `https://www.w3schools.com/html/mov_bbb.mp4` |
| Big Buck Bunny (W3C mirror) | `https://media.w3.org/2010/05/bunny/movie.mp4` |
| Flower (CC0, MDN) | `https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4` |

Avoid: YouTube/Vimeo page links (a `<video>` tag can't play web pages), `commondatastorage.googleapis.com` (dead bucket, 403), and `test-videos.co.uk` (files have **no audio track** — the player will show a "No audio track" badge).

---

## 📋 Forms & validation

**Job application form** — required fields, email/regex checks, disabled submit until valid:

```
A job application form: full name (required), email (required + email validation), phone
(regex ^\d{10}$ with message "10 digits"), a ChoicePicker for role (Engineer, Designer, PM),
years-of-experience slider 0-30, a longText cover letter, and a CheckBox "I can relocate".
The primary "Apply" button must have checks so it is disabled until name and email are valid,
and its action sends every field in context. Seed empty values.
```

**Multi-step checkout** — the agent builds step 2 when you submit step 1:

```
Step 1 of a checkout flow: a Card titled "Shipping" with name, address, city, zip
(regex ^[0-9]{5}$) fields and a "Continue to payment" primary button sending all values.
When I click it, replace this with a payment step (card number, expiry DateTimeInput,
CVC obscured field) and show my shipping summary as captions at the top.
```

---

## 📊 Dashboards & data

**Templated crypto watchlist** — template children + relative-path bindings:

```
A crypto watchlist card: a templated List over /coins where each row shows the coin name (h4),
its ticker as a caption, its price formatted with formatCurrency, and a favorite Icon.
Above the list put a Text bound with formatString: "Tracking ${/meta/count} assets · updated ${/meta/updated}".
Seed 5 realistic coins and the meta object. Add a "Refresh prices" button — when clicked,
respond by updating only the data model with slightly changed prices.
```

**Team standup board:**

```
A standup board with Tabs per teammate (3 people). Each tab shows their avatar Image
(https://i.pravatar.cc/100?img=N), yesterday/today Text sections, and a blockers TextField
bound per person. A "Submit standup" button sends the whole data model.
```

---

## 🎮 Playful & interactive

**Space quiz with scoring round-trip:**

```
A 3-question space exploration quiz using mutually-exclusive ChoicePickers, a progress caption
"Question scores appear after checking", and a "Check answers" primary button sending all
selections. When I click it, respond with updateDataModel adding a /result section and add a
score card component showing my score with a themed message.
```

**Choose-your-own-adventure** — every button generates the next scene:

```
Scene 1 of a text adventure set in a derelict space station: a Card with an atmospheric
description, an Image (https://picsum.photos/seed/station/640/300), and three choice Buttons
("Open the airlock", "Follow the noise", "Check the console"), each sending its choice in an
action. On each of my choices, delete the old surface and create the next scene the same way.
```

**Live character sheet:**

```
An RPG character builder: name field, class ChoicePicker (Warrior/Mage/Rogue), three stat
sliders (STR/INT/DEX, 1-18) and a Text bound via formatString showing
"Points used: ${/char/str} + ${/char/int} + ${/char/dex}". A "Roll character" button sends
everything; respond with a flavor-text summary card added below.
```

---

## 🏢 Enterprise patterns

**Approval workflow card:**

```
An expense approval card: requester row (avatar Image + name + date caption), an amount in
formatCurrency, a receipt Image (https://picsum.photos/seed/receipt/500/280), a comments
longText field, and Approve (primary) / Reject (borderless, with a required-comment check)
buttons that send the decision and comment. Theme primaryColor #0F62FE.
```

**Incident triage form** — good with a custom catalog / system prompt rules:

```
An incident triage surface: severity ChoicePicker (SEV1-SEV4), affected-service ChoicePicker,
impact longText, a DateTimeInput for when it started (date+time), an on-call CheckBox
"Page the on-call now", and a primary "Create incident" button disabled until severity and
impact are filled. Use a red #D64545 theme.
```

---

## 📱 Multi-page apps (Studio catalog)

These target the **Studio extended catalog** (`https://a2ui-studio.dev/catalogs/studio/v1`) — Pages, Stepper, Hero, StatCard, Chart, Table, Timeline, Accordion, Rating, ProgressBar, Avatar, Badge — on top of the basic components.

**SaaS metrics dashboard** — Pages navigation, StatCards, all three Chart variants and a Table:

```
A multi-page SaaS metrics app using the studio catalog. Root is a Pages component bound to
/nav/page with three pages: "Overview" (a Hero titled "Acme Metrics" with a one-line subtitle,
a Row of four StatCards — active users, MRR, conversion, churn — with realistic values and
+/- deltas, then a bar Chart of signups per day and a line Chart of weekly active users),
"Customers" (a Table over /customers with columns Customer, Plan, Seats, MRR and 5 seeded rows,
plus a ProgressBar for the quarterly revenue goal), and "Channels" (a donut Chart of acquisition
channels). Seed every bound path with believable data and set a blue theme primaryColor.
```

**Onboarding wizard** — Stepper with built-in Back/Next and a two-way Rating:

```
A 4-step onboarding wizard using the studio catalog Stepper bound to /wizard/step:
step "Profile" (name and email TextFields with validation), step "Workspace" (workspace name
field and a team-size ChoicePicker), step "Preferences" (three CheckBoxes and a theme
ChoicePicker), and step "Finish" (a Hero saying "You're all set!", a Rating bound to
/feedback/stars asking how easy setup was, and a primary "Launch workspace" button sending
the whole data model). Seed /wizard/step to 0 and give every field a sensible default.
```

**Team activity hub** — Pages + Timeline + Accordion + Avatar/Badge, agent-driven navigation:

```
A team activity hub using the studio catalog. Pages root bound to /nav/page with "Feed"
(a Row of an Avatar for the on-call engineer, their name and role, and a green "Live" Badge,
then a Timeline over /events with 4 realistic deploy/incident entries), "Metrics" (two
StatCards and a bar Chart of deploys per day), and "FAQ" (an Accordion with three
questions about the on-call process). After rendering, when I click any button you add,
navigate me to the Metrics page by writing 1 to /nav/page with updateDataModel.
```

---

## ⚔️ Arena-worthy prompts

These separate strong models from weak ones — try them in the **Arena** view:

```
An airline seat picker: a legend row (available/selected/taken), a 5-row × 6-column seat grid
built from nested Rows of Buttons with seat labels, a summary Text bound to /booking/seat,
and a "Confirm seat" button. Track the selected seat in the data model.
```

```
A kanban board with three Columns (To do / Doing / Done), each a Card with a templated List
of task cards from /board/todo, /board/doing, /board/done. Each task card shows title,
assignee caption, and a "Move →" button sending the task id and current column.
```

---

## 🔁 Round-trip experiments

The protocol shines when you *keep talking after the first render*. Try these as follow-up messages in the same session:

- `Make the theme dark purple and increase all headings one level.`
- `Add form validation so the email field is required.`
- `Translate every label to German but keep the data model keys unchanged.`
- `Delete that surface and rebuild it as a two-column layout.`
- `Add a confirmation modal triggered by the submit button.`

And after clicking any action button, watch the **Stream** tab — the best agents answer with a minimal `updateDataModel` instead of resending the whole component tree.
