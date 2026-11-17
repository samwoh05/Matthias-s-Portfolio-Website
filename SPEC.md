# Matthias Luc Ang · "Show your working" — a drafting-desk portfolio

## 0. Brief
A 6-sheet one-page portfolio for **Matthias Luc Ang**, Engineering Science student at Ngee Ann Polytechnic who wants to do product design/development (engineering-led objects: hair dryers, vacuums, furniture). Visitor: admissions panels, studios and internship leads who need to see creativity + engineering rigour + team attitude in under a minute.
Aesthetic: drafting desk, inked, precise, warm.
Mood board: sepia ink gear sketches (Da Vinci notebook), a green self-healing cutting mat with printed construction circles/rulers, annotated tech sketches with leader lines, a blue-pencil exploded axonometric.
Signature: **The gear train.** Four hand-inked gears on a cream sheet laid on the mat — CREATIVITY (z32) and HELPING OTHERS (z26) both mesh with PRODUCT DESIGN (z20), which drives THE DETAILS (z12). Drag or flick any gear: the whole train turns at exact tooth ratios with live rpm readouts; page scroll turns it too. It is the client's own reasoning ("put these two together and I get product design") as a working mechanism.
Supporting: draw-on ink (stroke-dashoffset) for every sketch, a CAD layer (left mm ruler, crosshair hairlines, live X/Y mm readout), two live physics bench tests (large-angle pendulum, brachistochrone race), a vernier-caliper tolerance toy.

## 1. Stack & files
Plain `index.html` + `styles.css` + `script.js`, no build, no libraries. Inline SVG icons only.

## 2. Fonts
| Role | Family | Weights | Used on |
|---|---|---|---|
| Display + body | Fraunces (opsz 9–144) | 300–600, italic 300–500 | H1, H2, card titles, body copy |
| Hand | Caveat | 500–700 | annotations, equation, margin notes |
| Labels | IBM Plex Mono | 400/500 | kickers, title blocks, readouts, buttons; uppercase +0.12–0.16em |
Load: `https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500&family=IBM+Plex+Mono:wght@400;500&display=swap`

## 3. Colour tokens
```css
--mat:#1d5a3c; --mat-deep:#174a31; --mat-line:143 198 161;      /* grid: minor 24px @ .08, major 120px @ .20 */
--mat-ink:#e9f2e4 (7.1:1); --mat-ink-2:#c3d9c6 (5.5:1); --mat-ink-3:#a9c9b2 (4.5:1)
--paper:#f1e7d2; --paper-2:#e7d9bb; --ink:#2a2118; --ink-2:#5b4632 (7.2:1); --ink-3:#8a7356 (decor only)
--pencil:#3d52b8 (5.5:1 on paper) — the one accent: construction/dimension lines, active states on paper
html,body{background:var(--mat)} first rule.
```
Depth: paper sheets carry `0 1px 1px rgba(6,24,14,.25), 0 8px 18px rgba(6,24,14,.28), 0 26px 50px rgba(6,24,14,.22)` + inset paper vignette; mat gets a fixed grain (fractal noise, .07) and a soft edge falloff. No gradients as "the visual", no glow.

## 4. Layout & chrome
- Container max 1320px, gutters clamp(20px, 4vw, 56px); sections clamp(96px, 12vw, 168px) vertical.
- Nav fixed 64px: monogram "MLA" in a hand-drawn circle + name; links About · Work · Lab · Spec · Contact (mono 12px); "Résumé ↗" pill. Transparent at top → mat-deep 88% + blur(8px) after 40px. Mobile (<900px): burger → full-screen mat menu, links Fraunces 40px, stagger 50ms, closes on link/Esc/resize, body scroll locked.
- CAD layer (≥1100px, fine pointer only): 28px left ruler spanning the page (mm ticks 3.78px, 5mm, cm labels), pointer marker on the ruler, 1px crosshair hairlines at 10% under the sheets, status pill bottom-left "X 108.2 · Y 1 344.6 mm" (px × 0.2646).

## 5. Sections (sheets)
1. **Hero (Sheet 01)** — grid 5fr / 7fr. Left: eyebrow "Engineering Science · Ngee Ann Polytechnic"; H1 "Matthias / *Luc Ang*" clamp(56px, 8vw, 128px)/0.9, −0.035em, italic line in mat-ink-2 weight 300; equation in Caveat clamp(26px, 2.4vw, 36px): "creativity + helping others = [product design]" with a drawn answer box; sub (18px/1.55, 30rem): "I design things that make someone's day a little easier — then calculate whether they'll last, and check every detail twice."; CTAs "See the work ↓" (cream pill) + "Get in touch" (ghost). Right: paper sheet (rotate −1.6°, aspect 700/620) with the gear train, blue construction (centre lines, pitch circles, "c = 169" dimension), Caveat annotations with leaders and mono rpm readouts, hint "grab a gear & spin it ↻". Background mat print: protractor circle r≈430 with 5° ticks + 15/30/45/60° rays from bottom-left at 12% cream.
2. **About (Sheet 02) "Show your working."** One wide sheet like a solved exam question: Given ① creativity, Given ② helping others, ∴ boxed answer "Product design." Right column of three margin notes: "Perfectionist, a little." (+ caliper toy: measure a 12.00 mm pin, ±0.02 tolerance, arrow keys step 0.01), "Team first.", "110%, promised." Da Vinci quote in blue pencil.
3. **Work (Sheet 03)** — filter tabs All 7 / Design 3 / Physics 2 / UI-UX 2 (View Transitions when available). 3-col grid of paper cards (tilts −1.2°/0.8°/−0.4°), each: mono "DWG 0n · CATEGORY" + year, an ink drawing (viewBox 400×260) that draws on in view and animates on hover (rising heat, flowing air, swinging bob, rolling ball, flapping wings), Fraunces 24px title, one-line brief, tag chips. A CTA tile fills the last row (JS sets its span).
4. **Lab (Sheet 04) "Bench tests."** Two sheets: (a) large-angle pendulum — RK4 θ''=−(g/L)sinθ, L=1 m, slider 5–170°, ghost small-angle pendulum in blue pencil drifting out of phase, readouts T₀=2.006 s, exact T = T₀·2K(sin θ₀/2)/π via AGM, error %, mini T/T₀ curve; (b) brachistochrone race — drag B, race cycloid vs straight line vs steep dive (energy method, first segment 2ds/v), ½ speed playback, finish-time table, winner circled.
5. **Spec (Sheet 05) "The spec sheet."** Drafting tables: Studies (NP — Engineering Science — GPA 3.6218 — cert; Zhenghua Secondary — cert) with note "4 d.p. — rounding felt wrong"; Bill of materials (C#, Figma, Excel, PowerPoint, Taekwondo, Drumming); "Next on the drawing board": hair dryer, stick vacuum, chair sketches.
6. **Contact (Sheet 06)** — H2 "Got something that / should be easier?" + Caveat "Let's draw it up."; rows: email (copy button), phone, résumé, portfolio; testimony note (opening line kept, rest to be filled). Footer title block "Drawn by M. L. Ang · Checked by M. L. Ang (twice) · Scale 1:1 · Sheet 06/06".

## 6. Motion
Default ease `cubic-bezier(.22,1,.36,1)`. Hero: nav fade 0s/.6s; eyebrow .15s; H1 lines masked rise from 105% at .25s + i×.12s, .9s; equation .55s; sub .7s; CTAs .85s. Sheet ink: construction draws .3–1.1s, gear outlines .6–1.8s (stagger .15s), hatch/labels fade 1.6–2.2s; gears idle at C≈3 rpm afterwards. Section heads/cards reveal once at 15% (y 24px→0, .8s, 90ms stagger) and their drawings draw on 0.9–1.4s. Hovers 200–300ms; cards straighten to 0° and lift 6px. NOT animated: mat, grid, rulers. Reduced motion: everything rendered final, no idle spin/inertia (drag still works), demos only run on button press.

## 7. Acceptance (first viewport, 1440×900)
Green mat grid edge to edge, left ruler. Left half: eyebrow, two-line name, the hand-written equation with "product design" boxed, a 2-line sub and two pills. Right: a slightly rotated cream sheet filling ~55% of the width with four inked, hatched gears turning slowly, blue construction lines and four handwritten labels with rpm readouts. Nothing overlaps; CTA visible without scrolling.
