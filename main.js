/* ═══════════════════════════════════════════════════════════════════════════
   KEPCO — MAIN SCRIPT
   ─────────────────────────────────────────────────────────────────────────
   Section map:
     1. Business Slider        — infinite marquee + prev/next
     2. GSAP + ScrollTrigger   — plugin registration
     3. Challenge Section      — canvas frame sequence with its own dedicated
                                 spring-physics inertia engine (the key change)
     3b. Vision Final Section  — lightweight getBoundingClientRect progress,
                                 continues the Leader section's earth zoom
     4. ESG Section            — scroll-driven rAF animation
     5. Service Slider         — click-driven carousel
═══════════════════════════════════════════════════════════════════════════ */


/* ── 1. BUSINESS SLIDER ───────────────────────────────────────────────── */

(function () {

    const slider = document.querySelector(".business_slider");
    if (!slider) return;

    /*  Mobile/Tablet (≤768px): the CSS layer stacks .business_area_item to
        width:100% in a vertical list (see res.css §7, both the 480px block
        and the 768px block) — no horizontal track exists to marquee along
        at either width; the 768px reference recording confirms the same
        stacked-list treatment as 480px, not a narrower version of the
        desktop marquee. Cloning cards for the infinite-loop illusion and
        continuously writing translateX would both actively break that
        layout (duplicated rows; sideways offset under
        flex-direction:column). Bail out before either happens, same
        early-return pattern already used for prefers-reduced-motion
        elsewhere in this file. Desktop path below is untouched above
        768px. */
    const isMobileOrTablet = () => window.matchMedia('(max-width: 768px)').matches;

    /* BUG FIX — root cause: the breakpoint above used to be checked exactly
       once, at script-load time. If the page loads (or this script first
       runs) above 768px, the clone step a few lines below ran
       unconditionally and permanently duplicated every .business_area_item
       into the DOM. Resizing or rotating down to ≤768px afterward never
       undid that clone — there was no resize listener at all — so the
       stacked mobile/tablet list then rendered both the originals and the
       leftover clones (10 cards instead of 5). The fix keeps the exact
       same desktop marquee logic below, but makes the desktop-only setup
       (a) idempotent — it can only ever clone once, tracked by
       `desktopInitDone` — and (b) re-checked on resize, so crossing the
       breakpoint in either direction is handled instead of only being
       decided once at load. */
    let desktopInitDone = false;
    let position = 0;
    const speed  = 1;
    let autoPlay = true;

    function getCardWidth() {
        const card = document.querySelector(".business_area_item");
        return card ? card.offsetWidth + 18 : 0;
    }

    function loop() {
        /* Stops scheduling itself once we've left desktop mode (see
           restoreMobileLayout, which sets desktopInitDone = false). This
           is what makes it safe for initDesktopMarquee() to call loop()
           again on every desktop re-entry: the previous chain, if any,
           has already stopped itself rather than continuing to run
           alongside a newly started one. */
        if (!desktopInitDone) return;
        if (autoPlay) {
            position -= speed;
            const cw = getCardWidth();
            if (cw && Math.abs(position) >= cw) {
                slider.appendChild(slider.firstElementChild);
                position += cw;
            }
        }
        slider.style.transform = `translateX(${position}px)`;
        requestAnimationFrame(loop);
    }

    const prevBtn = document.querySelector(".business .prev");
    const nextBtn = document.querySelector(".business .next");

    function moveRight() {
        const cw = getCardWidth();
        slider.insertBefore(slider.lastElementChild, slider.firstElementChild);
        position -= cw;
        slider.style.transition = "none";
        slider.style.transform  = `translateX(${position}px)`;
        requestAnimationFrame(() => requestAnimationFrame(() => {
            position += cw;
            slider.style.transition = "transform .7s ease";
            slider.style.transform  = `translateX(${position}px)`;
        }));
    }

    function moveLeft() {
        const cw = getCardWidth();
        position -= cw;
        slider.style.transition = "transform .7s ease";
        slider.style.transform  = `translateX(${position}px)`;
        slider.addEventListener("transitionend", () => {
            slider.appendChild(slider.firstElementChild);
            position += cw;
            slider.style.transition = "none";
            slider.style.transform  = `translateX(${position}px)`;
        }, { once: true });
    }

    /* One-time desktop setup: clones for the infinite-marquee illusion,
       starts the rAF loop, and binds prev/next. Guarded by
       `desktopInitDone` so calling this more than once (e.g. on repeated
       resize events while staying above 768px) can never clone twice.
       prev/next binding is additionally guarded by its own
       `listenersBound` flag, separate from `desktopInitDone`: cloning is
       meant to redo every time the viewport re-enters desktop mode (after
       restoreMobileLayout() has stripped the previous clones back out),
       but the click listeners themselves must only ever be attached once
       for the lifetime of the page, or each mobile→desktop round trip
       would stack another duplicate listener onto the same buttons. */
    let listenersBound = false;

    function initDesktopMarquee() {
        if (desktopInitDone) return;
        desktopInitDone = true;

        [...slider.children].forEach(card => {
            slider.appendChild(card.cloneNode(true));
        });

        loop();

        if (!listenersBound) {
            listenersBound = true;
            if (prevBtn) prevBtn.addEventListener("click", () => { autoPlay = false; moveRight(); });
            if (nextBtn) nextBtn.addEventListener("click", () => { autoPlay = false; moveLeft();  });
        }
    }

    /* Self-healing teardown: if the marquee was already initialized
       (clones exist) and the viewport is now ≤768px, strip the clones
       back out so exactly the original 5 cards remain for the stacked
       mobile/tablet list — instead of just preventing future duplication,
       this also repairs a slider that was already duplicated before this
       fix (or before this resize) ran. Real cards are identified by
       reference against `originalCards` (captured once below, before any
       cloning), rather than an attribute — cloneNode(true) would copy any
       attribute-based marker onto the clones too, making them
       indistinguishable from the originals. */
    function restoreMobileLayout() {
        if (!desktopInitDone) return;
        [...slider.querySelectorAll(".business_area_item")].forEach(card => {
            if (!originalCards.includes(card)) {
                card.remove();
            }
        });
        desktopInitDone = false;
        autoPlay = true;
        position = 0;
        slider.style.transition = "none";
        slider.style.transform  = "translateX(0px)";
    }

    /* Captured once, before any cloning can happen, so restoreMobileLayout()
       can always tell a real card from a clone by reference. */
    const originalCards = [...slider.children];

    function evaluateBreakpoint() {
        if (isMobileOrTablet()) {
            restoreMobileLayout();
        } else {
            initDesktopMarquee();
        }
    }

    evaluateBreakpoint();
    window.addEventListener("resize", evaluateBreakpoint);

}());


/* ── 2. GSAP + ScrollTrigger ─────────────────────────────────────────── */

gsap.registerPlugin(ScrollTrigger);


/* ═══════════════════════════════════════════════════════════════════════════
   2b. SHARED TEXT-FILL SWEEP — activateWordSweep
   ─────────────────────────────────────────────────────────────────────────
   Single shared implementation, called by three sections: Challenge
   ("끊임없는 도전과 혁신으로"), Leader ("글로벌 에너지 리더로 나아갑니다"),
   and Vision ("새로운 에너지 대전환 시대") — see section 3 below for the
   Challenge/Leader call sites and section 2c just below this one for
   Vision's. Previously lived as a private function inside the Challenge
   IIFE; hoisted to this shared top-level scope so all three sections call
   the exact same code rather than each keeping their own copy.

   This is a TWO-PASS WAVE across the whole `words` array, not each word
   independently cycling through pale→blue→white before the next word
   starts. Per the reference:

     Pass 1 (first half of `progress`): a BLUE wave fills left to right
       until the ENTIRE sentence is blue. Earlier words reach blue and
       then WAIT there — they do not move on until the wave has finished
       filling every word.
     Pass 2 (second half of `progress`): only after the whole sentence is
       blue does a wave to the final color begin, also left to right,
       converting blue → endColor one word at a time until the whole
       sentence has reached it.

   So at any instant, words are partitioned into (at most) three groups:
   already-resolved (pass 2 has passed them), currently transitioning
   (the single word at whichever wave-front is active), and not-yet-blue/
   still-blue-waiting. This keeps the sentence visually unified — it's
   never "some words resolved, some still pale" the way independent
   per-word cycles would produce.

   endColor (optional 3rd argument): pass 2 sweeps to this color instead
   of white when supplied — this is the ONLY thing Vision's call changes
   (black instead of the default white). Timing, easing, the pale/blue
   colors, and the two-pass wave structure are all identical regardless
   of which caller invokes it. */

function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
function lerp(a, b, t)    { return a + (b - a) * t; }

function activateWordSweep(words, progress, endColor) {
    if (!words || words.length === 0) return;
    const p = clamp(progress, 0, 1);
    const n = words.length;

    /*  TIMING — re-tuned for a slower, longer-held color fill.
        This only reshapes how the pale→blue→endColor transition plays
        out WITHIN the progress window each caller already hands in
        (sweepP / leaderSweepP / Vision's own getProgress()) — it does
        not change when that window starts or how wide it is in scroll
        terms (see SWEEP_START/SWEEP_END and LEADER_SWEEP_START/END at
        the Challenge/Leader call sites, both untouched).

        Shape, in order along `progress`:
          0.00 → 0.55   BLUE_WAVE_END   pass 1: pale → blue sweep.
          0.55 → 0.75   HOLD_END        blue hold: every word sits at
                        solid blue, nothing moving.
          0.75 → 1.00   pass 2: blue → endColor sweep. */
    const BLUE_WAVE_END  = 0.55;  /* pass 1 (pale→blue) occupies 0→0.55 */
    const HOLD_END       = 0.75;  /* 0.55→0.75: blue hold, no movement */
    const WHITE_WAVE_END = 1.00;  /* pass 2 (blue→endColor) occupies 0.75→1 */

    const pale  = [255, 255, 255, 0.55];
    const blue  = [0,   84,  255, 1];   /* #0054FF — was [0,122,255,1] */
    /* endColor: pass 2 sweeps to this instead of white when the caller
       supplies one — Vision's title needs to land on black rather than
       white (everything else about the sweep is untouched). Defaults to
       white so the Challenge/Leader call sites resolve exactly as
       before. */
    const white = endColor || [255, 255, 255, 1];

    /* blueP: how far the BLUE wave has filled, 0→1 across the whole
       sentence (1 = every word is fully blue). Reaches 1 at
       BLUE_WAVE_END and then simply stays at 1 through the hold —
       lerp(blue, endColor, 0) below keeps every word locked at solid
       blue with no further change until whiteP starts moving.
       whiteP: how far the pass-2 wave has filled, 0→1 — clamped to 0
       until `progress` passes HOLD_END, which is what creates the
       perceptible gap between the blue wave finishing and pass 2
       beginning. */
    const blueP  = clamp(p / BLUE_WAVE_END, 0, 1);
    const whiteP = clamp((p - HOLD_END) / (WHITE_WAVE_END - HOLD_END), 0, 1);

    for (let i = 0; i < n; i++) {
        const sliceStart = i / n;
        const sliceLen   = 1 / n;

        /* This word's own local progress through the blue wave (0→1)
           and through pass 2 (0→1) — each wave is itself a left-to-right
           sweep across the n words, driven by blueP/whiteP instead of
           the raw overall progress. */
        const wordBlueP  = clamp((blueP  - sliceStart) / sliceLen, 0, 1);
        const wordWhiteP = clamp((whiteP - sliceStart) / sliceLen, 0, 1);

        /* Color = lerp(pale, blue, wordBlueP), THEN lerp(that, endColor, wordWhiteP).
           wordWhiteP is 0 until pass 2 reaches this word (since whiteP
           itself is 0 until pass 1 fully finishes), so a word sits at
           solid blue (wordBlueP=1, wordWhiteP=0) for the whole time
           pass 1 is still filling later words. */
        const r1 = lerp(pale[0], blue[0], wordBlueP);
        const g1 = lerp(pale[1], blue[1], wordBlueP);
        const b1 = lerp(pale[2], blue[2], wordBlueP);
        const a1 = lerp(pale[3], blue[3], wordBlueP);

        const r = lerp(r1, white[0], wordWhiteP);
        const g = lerp(g1, white[1], wordWhiteP);
        const b = lerp(b1, white[2], wordWhiteP);
        const a = lerp(a1, white[3], wordWhiteP);

        words[i].style.color = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a.toFixed(2)})`;
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   2c. VISION SECTION — title text-fill sweep
   ─────────────────────────────────────────────────────────────────────────
   .vision_title previously had no animation at all — plain static text.
   This calls the shared activateWordSweep above exactly as Challenge and
   Leader do (section 3) — same BLUE_WAVE_END/HOLD_END/WHITE_WAVE_END
   timing, same pale/blue colors, same per-word two-pass wave math. The
   only difference is the pass-2 target color: black ([0,0,0,1]) passed
   as the optional third argument, instead of activateWordSweep's own
   default white.

   PROGRESS SOURCE: .vision is a plain `height: 100vh` section with no
   pinned/tall scroll-through runway of its own (unlike .challenge's
   550vh or .vision_final's 200vh, whose getRawProgress divides by
   `offsetHeight - innerHeight`) — that denominator would be 0 here, so
   that exact formula can't be reused unmodified. Progress is instead
   measured the same way this file already measures simple entrance
   progress elsewhere (e.g. section 8.5's isPastHero rect checks): how
   far .vision's top has travelled from the bottom of the viewport (entry)
   to the top of the viewport (fully scrolled past), via
   getBoundingClientRect — same primitive, adapted to a section that's
   exactly one viewport tall instead of several.

   Additive only — no other section's code or call sites are touched. */

(function () {

    const section = document.querySelector('.vision');
    if (!section) return;

    const words = Array.from(section.querySelectorAll('.vw-word'));
    if (words.length === 0) return;

    const black = [0, 0, 0, 1];

    /* 0 the instant .vision's top reaches the viewport bottom (section
       just starting to enter), 1 the instant its top reaches the
       viewport top (section fully scrolled into place) — one viewport
       height of scroll travel, matching how a single-viewport section
       is entered in one continuous scroll motion. */
    function getProgress() {
        const rect = section.getBoundingClientRect();
        return clamp(1 - rect.top / window.innerHeight, 0, 1);
    }

    function render(p) {
        activateWordSweep(words, p, black);
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        render(1);
        return;
    }

    render(getProgress());
    window.addEventListener('scroll', () => render(getProgress()), { passive: true });
    window.addEventListener('resize', () => render(getProgress()));

}());


/* ═══════════════════════════════════════════════════════════════════════════
   3. CHALLENGE SECTION
   ─────────────────────────────────────────────────────────────────────────
   The cinematic "heavy camera" feel comes from a dedicated spring-physics
   engine that runs completely independently of the scroll event tick.

   HOW IT WORKS:
   ─────────────
   a) A scroll listener reads the section's raw progress (0→1) and stores
      it in `targetProgress`. This is the "destination."

   b) A rAF loop lerps `smoothProgress` toward `targetProgress` every frame
      using LERP (linear interpolation). Because lerp closes a *fraction* of
      the remaining gap each frame, the closer it gets the slower it moves —
      this is the natural deceleration / momentum feel.

   c) Both the frame index AND the canvas wrapper transform are driven purely
      from `smoothProgress`, NOT from the raw scroll position. This means:
        • Scroll input → instant target update (responsiveness)
        • Visual output → always lagging behind, catching up smoothly
        • When scroll stops → smoothProgress keeps ticking toward target,
          giving the "continues moving after you stop" feel
        • When scroll accelerates → gap between target and smooth widens,
          making the animation appear to "respond with weight"

   d) The canvas wrapper gets a simultaneous scale + Y drift driven by the
      same smoothProgress — so frame changes, zoom, and lift are all in
      perfect lockstep with each other, feeling like one unified camera move.

   e) The text overlay uses a separate, slightly lighter lerp (TEXT_LERP)
      so it "floats up" with its own momentum, slightly different from the
      turbine — giving depth layers.

   TUNING:
   ───────
   LERP            — main spring coefficient. Lower = heavier momentum.
                     0.04 = very heavy/cinematic, 0.10 = responsive.
                     KEPCO reference feel: 0.055
   TEXT_LERP       — text overlay spring. Slightly higher = text is a
                     little snappier than the turbine, giving parallax depth.
   SCALE_START/END — canvas wrapper zoom range across full scroll travel.
   Y_START/END     — vertical camera drift (negative = lifts upward).
   TEXT_Y_START    — how far below final position the text begins (vh).
   TEXT_START_FRAC — fraction of scroll progress before text starts rising.
═══════════════════════════════════════════════════════════════════════════ */

(function () {

    const challengeSection = document.querySelector('.challenge');
    if (!challengeSection) return;

    const wrap     = challengeSection.querySelector('.challenge_canvas_wrap');
    const canvas   = challengeSection.querySelector('.challenge_canvas');
    const textWrap = challengeSection.querySelector('.vision_text_wrap_2');
    const challengeTitleEl = challengeSection.querySelector('.vision_text_wrap_2 h2');
    const cwWords   = Array.from(challengeSection.querySelectorAll('.cw-word'));
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d');

    /* ── Tuning ─────────────────────────────────────────────────────────── */

    /*  Main spring — this single value controls the "weight" of the turbine.
        Lower = heavier, more cinematic, longer coast after scroll stops.
        0.055 matches the KEPCO reference: noticeable lag, smooth deceleration. */
    const LERP         = 0.08;

    /*  Text spring — slightly faster so the title floats up with its own
        rhythm, creating a parallax separation from the turbine.             */
    const TEXT_LERP    = 0.12;

    /*  Canvas wrapper transform — what the "camera" does across the section. */
    const SCALE_START  = 1.00;
    const SCALE_END    = 1.28;   /* zoom in as turbine spins */
    const Y_START      =  0;     /* px — start position */
    const Y_END        = -68;    /* px — camera lifts upward */

    /*  Text overlay motion.
        TEXT_Y_START — px below center where Challenge text begins rising.
        TEXT_Y_END   — px above center where Challenge text finishes.
                       Negative = above the translate(-50%,-50%) anchor.
                       0.30 × vh = 30vh above center = ~20% from viewport top.
                       challenge_sticky overflow:hidden clips naturally if
                       the text travels beyond 50vh above center. */
    const TEXT_Y_START = window.innerHeight * 0.55;
    const TEXT_Y_END   = -(window.innerHeight * 0.12);
    const TEXT_START_FRAC = 0.05;   /* scroll fraction before text begins */

    /* ── Utilities ───────────────────────────────────────────────────────── */

    function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
    function lerp(a, b, t)    { return a + (b - a) * t; }

    /* ── Frame list ──────────────────────────────────────────────────────── */

    const framePath = canvas.dataset.framePath  || 'images/turbine/';
    const frameList = (canvas.dataset.frameList || '')
        .split(',').map(s => s.trim()).filter(Boolean);

    if (frameList.length === 0) {
        console.warn('challenge canvas: no data-frame-list attribute');
        return;
    }

    const URLS = frameList.map(n => `${framePath}${n}.jpg`);

    /* ── Canvas sizing ───────────────────────────────────────────────────── */


    function resizeCanvas() {
        const dpr    = window.devicePixelRatio || 1;
        const sticky = challengeSection.querySelector('.challenge_sticky');
        canvas.width  = sticky.offsetWidth  * dpr;
        canvas.height = sticky.offsetHeight * dpr;
        ctx.scale(dpr, dpr);
        if (bitmaps[lastDrawnIndex]) drawFrame(lastDrawnIndex);
    }

    /* ── Frame drawing ───────────────────────────────────────────────────── */

    let lastDrawnIndex = 0;

    function drawFrame(index) {
        const bmp = bitmaps[index];
        if (!bmp) return;
        const dpr = window.devicePixelRatio || 1;
        const cw  = canvas.width  / dpr;
        const ch  = canvas.height / dpr;
        const iw  = bmp.naturalWidth  || bmp.width;
        const ih  = bmp.naturalHeight || bmp.height;
        const s   = Math.max(cw / iw, ch / ih);
        const dw  = iw * s,  dh = ih * s;
        const dx  = (cw - dw) / 2, dy = (ch - dh) / 2;
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(bmp, dx, dy, dw, dh);
        lastDrawnIndex = index;
    }

    /* ── Preload ─────────────────────────────────────────────────────────── */

    const bitmaps   = new Array(URLS.length).fill(null);
    let   firstDone = false;

    resizeCanvas();

    const preloadPromises = URLS.map((url, i) =>
        fetch(url)
            .then(r  => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.blob(); })
            .then(b  => createImageBitmap(b))
            .then(bmp => {
                bitmaps[i] = bmp;
                if (!firstDone) { firstDone = true; drawFrame(0); }
            })
            .catch(err => console.warn('Turbine frame load failed:', err))
    );

    /* ── Spring-physics inertia engine ──────────────────────────────────────
       targetProgress  — updated instantly on every scroll event (0→1)
       smoothProgress  — lerps toward target each rAF tick (the spring)
       textProgress    — independent lerp for the text overlay
    ─────────────────────────────────────────────────────────────────────── */

    let targetProgress = 0;
    let smoothProgress = 0;
    let textProgress   = 0;
    let curtainProgress = 0;

    let rafId = null;

    /*  getRawProgress: section scroll position as 0→1 fraction.
        Uses getBoundingClientRect so it works with any page scroll. */
    function getRawProgress() {
        const rect       = challengeSection.getBoundingClientRect();
        const scrollable = challengeSection.offsetHeight - window.innerHeight;
        if (scrollable <= 0) return 0;
        return clamp(-rect.top / scrollable, 0, 1);
    }

    /*  applyFrame: select and draw the correct bitmap for a given progress.
        Uses a fractional "virtual position" between frames — the rendered
        frame is always the floor, but the transform fills the gap visually. */
    function applyFrame(p) {
        const raw   = p * (bitmaps.length - 1);
        const index = clamp(Math.round(raw), 0, bitmaps.length - 1);
        if (index !== lastDrawnIndex) drawFrame(index);
    }

    const stickyEl = challengeSection.querySelector('.challenge_sticky');

    /*  applyCurtainLift: in the FINAL phase of the challenge scroll, push
        the sticky panel upward with translateY — this is the "curtain being
        lifted" moment. The leader section is already visible underneath.

        CURTAIN_START: 0.60 → lift begins when 60% of challenge is scrolled.
                       Earth starts peeking while turbine still dominates.

        CURTAIN_LERP:  0.22 → slightly faster spring so the curtain tracks
                       scroll more closely, preventing lag-induced compression.

        EASING: deliberately LINEAR (no localP^n curve).
        The spring (lerp) already supplies smooth feel. Adding a curve on top
        creates double-easing: progress crawls at the start and then
        compresses into a sudden rush at the end. With linear mapping, each
        unit of scroll produces exactly the same amount of reveal — the even,
        consistent progression the transition needs.                          */
    const CURTAIN_START = 0.50;   /* was 0.60 — earlier start reclaims 10% more
                                     total scroll budget for the curtain + text */
    const CURTAIN_LERP  = 0.20;

    const leaderText  = document.querySelector('.leader .vision_text_wrap_3 h2');
    const lwWords     = Array.from(document.querySelectorAll('.leader .vision_text_wrap_3 h2 .lw-word'));
    const leaderEarth = document.querySelector('.leader .leader_earth');

    /*  Leader earth: a subtle, cinematic scale-up across the WHOLE Challenge
        scroll (uses raw `p`, not localP/CURTAIN_START) — the earth is sitting
        there under the curtain from the very start, so the "camera moving
        slightly closer" feeling should be continuous through the whole
        section, not something that only starts once the curtain begins
        lifting. Deliberately small (1.00→1.06) so it reads as ambient drift,
        never as an obvious "image scaling" effect. This is Leader's own
        earth.jpg only — Vision Final uses a separate image (earth-planet.jpg)
        and is not driven by this value. */
    const LEADER_EARTH_SCALE_START = 1.00;
    const LEADER_EARTH_SCALE_END   = 1.06;

    function applyCurtainLift(p) {
        /* Local progress: 0 at CURTAIN_START, 1 when p=1 */
        const localP = clamp((p - CURTAIN_START) / (1 - CURTAIN_START), 0, 1);

        /* LINEAR — no easing curve. The spring's own lag is all the
           smoothing needed. Produces a perfectly even +1.4% per scroll step. */
        const easedP =
            1 - Math.pow(1 - localP, 2);

        const yVh =
            lerp(0, -100, easedP);
        if (stickyEl) stickyEl.style.transform = `translateY(${yVh}vh)`;

        if (leaderEarth) {
            const earthScale = lerp(LEADER_EARTH_SCALE_START, LEADER_EARTH_SCALE_END, p);
            leaderEarth.style.transform = `scale(${earthScale})`;
        }

        /* Leader text: rises in a single, continuous, linear motion that
           shares the SAME localP budget as the curtain itself (0→1 across
           the curtain's full travel) — so text speed and curtain speed are
           locked together by construction, not by retuned constants.

           Curtain:  100vh   over localP 0→1  → 100 vh per unit of localP
           Text:      70vh   over localP 0→1  →  70 vh per unit of localP
           (70vh total = 35vh below-center descent-to-zero + 35vh above-
           center continuation — comfortably less than the curtain's
           100vh, satisfying "never travels farther than the curtain.")

           No phase split, no easing curve: textY is a single lerp across
           the entire localP range, so there is no boundary where the rate
           of motion changes — this is what removes the "rushed after
           center" acceleration. The spring (CURTAIN_LERP) already supplies
           all the deceleration/weight feel; a second curve here would
           double-ease, which is the exact failure mode being fixed.

           A short opacity-only gate (TEXT_FADE_IN_END) lets the text fade
           in near the start without delaying or distorting its position —
           it stays glued to the same linear track from localP 0 to 1.    */
        if (leaderText) {

            const TEXT_TRAVEL_VH      = window.innerHeight * 0.55; /* below-center distance */
            const TEXT_FADE_IN_END    = 0.12;  /* localP fraction: fully opaque by here */
            const TEXT_FADE_OUT_START = 0.92;  /* localP fraction: starts fading late, near the very top */

            /* Single continuous linear track: +35vh (below center) → -35vh (above center)
               mapped directly across the FULL localP range (0→1), matching the
               curtain's own scroll budget exactly. */
            const LEADER_TEXT_START = 0.35;

            const leaderP = clamp(
                (localP - LEADER_TEXT_START) /
                (1 - LEADER_TEXT_START),
                0,
                1
            );

            const textY =
                lerp(TEXT_TRAVEL_VH, -TEXT_TRAVEL_VH, leaderP);

            let opacity;
            if (localP < TEXT_FADE_IN_END) {
                opacity = localP / TEXT_FADE_IN_END;
            } else if (localP > TEXT_FADE_OUT_START) {
                opacity = 1 - (localP - TEXT_FADE_OUT_START) / (1 - TEXT_FADE_OUT_START);
            } else {
                opacity = 1;
            }

            leaderText.style.opacity = clamp(opacity, 0, 1);

            leaderText.style.transform =
                `translate(-50%, calc(-50% + ${textY}px))`;

            /*  Two-pass blue/white wave (same mechanism as the Challenge
                title, see that call site for the full explanation, which
                also has the frame-count measurements behind these
                numbers). Uses leaderP directly. Sized to ~30vh of real
                scroll — 1.5x the Challenge wave's ~20vh — matching the
                ~1.5x-longer on-screen duration measured directly from a
                fresh reference capture (Leader's wave: ~18 frames/~1.2s
                vs Challenge's ~12 frames/~0.8s at 15fps). leaderP is a
                sub-range of localP (~277.9vh per unit vs localP's
                ~427.5vh), so this needs a proportionally WIDER fraction
                than the Challenge window to land on the wider real-vh
                target. */
            const LEADER_SWEEP_START = 0.08;
            const LEADER_SWEEP_END   = 0.40;
            const leaderSweepP =
                (leaderP - LEADER_SWEEP_START) / (LEADER_SWEEP_END - LEADER_SWEEP_START);
            activateWordSweep(lwWords, leaderSweepP);
        }
    }

    /*  applyTransform: drive the canvas wrapper transform from smoothProgress.
        Scale and Y move together — unified "camera" motion. */
    function applyTransform(p) {
        const scale = lerp(SCALE_START, SCALE_END, p);
        const y     = lerp(Y_START,     Y_END,     p);
        wrap.style.transform = `scale(${scale}) translateY(${y}px)`;
    }

    /*  applyText: drive the text overlay from its own textProgress.
        Text only begins moving after TEXT_START_FRAC of total scroll.
        Uses linear localP (no easing curve) so motion is 1:1 with scroll —
        identical model to the Leader text. The TEXT_LERP spring (0.07)
        supplies all the deceleration feel without a double-easing problem. */
    function applyText(p) {

        const localP = clamp(
            (p - TEXT_START_FRAC) / (1 - TEXT_START_FRAC),
            0,
            1
        );

        const TEXT_ENTER_END = 0.35;

        let y;
        let opacity;

        if (localP < TEXT_ENTER_END) {

            const enterP = localP / TEXT_ENTER_END;

            y = lerp(
                TEXT_Y_START,
                0,
                enterP
            );

            opacity = clamp(enterP * 3, 0, 1);

        } else {

            y = 0;
            opacity = 1;

        }

        textWrap.style.opacity = opacity;

        textWrap.style.transform =
            `translate(-50%, calc(-50% + ${y}px))`;

        textWrap.style.pointerEvents =
            localP > 0.01 ? 'auto' : 'none';

        /*  Two-pass blue/white wave (see activateWordSweep): a blue wave
            fills the whole sentence left to right first, THEN a white
            wave fills left to right — the sentence stays visually
            unified throughout rather than resolving word-by-word.

            WIDTH CALIBRATION: re-measured directly from a fresh reference
            capture by frame-counting the wave's actual on-screen duration
            (15fps capture): the Challenge wave (first appearance → fully
            resolved to white) spans ~12 frames (~0.8s); the Leader wave
            spans ~18 frames (~1.2s) — Leader's wave is genuinely ~1.5x
            LONGER than Challenge's in the reference, not equal. Because
            localP (Challenge's own progress, ~427.5vh per unit) and
            leaderP (a sub-range of localP, ~277.9vh per unit) represent
            different real scroll distances per unit, matching that 1.5x
            ratio in on-screen duration requires DIFFERENT fractional
            widths at the two call sites — equal fractions would not
            produce equal-feeling durations. This window targets ~20vh of
            real scroll for the Challenge wave (see the Leader call site
            for its ~30vh / 1.5x-wider counterpart). */
        const SWEEP_START = 0.10;
        const SWEEP_END   = 0.25;
        const sweepP = (localP - SWEEP_START) / (SWEEP_END - SWEEP_START);
        activateWordSweep(cwWords, sweepP);
    }

    /*  tick: the rAF loop. Runs until both springs have converged.
        Important: the loop *keeps running* after scroll stops, which is
        exactly what gives the "continues moving after you stop" feel. */
    function tick() {
        rafId = null;

        /* Spring step — lerp closes a fraction of the gap each frame */
        const diffMain    = targetProgress - smoothProgress;
        const diffText    = targetProgress - textProgress;
        const diffCurtain = targetProgress - curtainProgress;

        smoothProgress  += diffMain    * LERP;
        textProgress    += diffText    * TEXT_LERP;
        curtainProgress += diffCurtain * CURTAIN_LERP;

        /* Snap when close enough to avoid infinite micro-movement */
        if (Math.abs(diffMain)    < 0.00015) smoothProgress  = targetProgress;
        if (Math.abs(diffText)    < 0.00015) textProgress    = targetProgress;
        if (Math.abs(diffCurtain) < 0.00015) curtainProgress = targetProgress;

        /* Apply all outputs from their respective smoothed values */
        applyFrame(smoothProgress);
        applyTransform(smoothProgress);
        applyText(textProgress);
        applyCurtainLift(curtainProgress);

        /* Keep ticking until all springs are settled */
        const converged =
            Math.abs(targetProgress - smoothProgress)  < 0.00015 &&
            Math.abs(targetProgress - textProgress)    < 0.00015 &&
            Math.abs(targetProgress - curtainProgress) < 0.00015;

        if (!converged) {
            rafId = requestAnimationFrame(tick);
        }
    }

    function kickRaf() {
        if (!rafId) rafId = requestAnimationFrame(tick);
    }

    /* ── Layout architecture note ──────────────────────────────────────────
       No ScrollTrigger is created for this section. Pinning is handled
       entirely by .challenge_sticky's own CSS (position: sticky; top: 0;
       inside .challenge's 550vh box). Physics (this spring engine) only
       ever touches transform/opacity on its own elements — it no longer
       shares an element with any GSAP-managed pin, which is what removed
       the curtain-lift blank-space bug (full explanation a few lines
       below, where the pin used to be created). */

    Promise.all(preloadPromises).then(() => {

        /* Reduced-motion: skip all animation, snap to final state */
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            drawFrame(bitmaps.length - 1);
            wrap.style.transform = `scale(${SCALE_END}) translateY(${Y_END}px)`;
            if (stickyEl) stickyEl.style.transform = 'translateY(-100vh)';
            if (leaderText) {
                leaderText.style.opacity = 1;
                leaderText.style.transform = 'translate(-50%, -50%)';
                activateWordSweep(lwWords, 1);
            }
            textWrap.style.opacity   = 1;
            textWrap.style.transform = 'translate(-50%, -50%)';
            textWrap.style.pointerEvents = 'auto';
            activateWordSweep(cwWords, 1);
            return;
        }

        /* Initial visual state */
        wrap.style.transform     = `scale(${SCALE_START}) translateY(${Y_START}px)`;
        textWrap.style.opacity   = 0;
        textWrap.style.transform = `translate(-50%, calc(-50% + ${TEXT_Y_START}px))`;
        textWrap.style.pointerEvents = 'none';
        if (leaderText) { leaderText.style.opacity = 0; leaderText.style.transform = 'translate(-50%, calc(-50% + 60px))'; }

        /*  NO ScrollTrigger pin here — removed.
            .challenge_sticky already pins itself via native CSS
            (position: sticky; top: 0; height: 100vh;) inside .challenge
            (height: 550vh) — that alone holds it fixed in the viewport for
            the entire 450vh scrollable range, with zero JS required.

            The GSAP pin used to ALSO target this exact element. GSAP pins
            by writing position/transform on the pinned element each scroll
            tick — directly colliding with applyCurtainLift() below, which
            writes stickyEl.style.transform on this same node every rAF
            frame from CURTAIN_START onward. Two systems fighting over the
            same inline transform is what produced the large blank-space
            bug during the curtain-lift phase: whichever system's write won
            on a given frame left the panel positioned somewhere other than
            a clean 0/-100vh, so it stopped covering the full viewport and
            the page's plain white background showed through underneath it.

            Removing the pin entirely resolves this — sticky positioning
            handles the "stay fixed while scrolling" part on its own, and
            applyCurtainLift's translateY is now the ONLY thing ever
            writing to stickyEl.style.transform, so there's nothing left
            to fight it. */

        /* Initial draw */
        targetProgress  = getRawProgress();
        smoothProgress  = targetProgress;
        textProgress    = targetProgress;
        curtainProgress = targetProgress;
        applyFrame(smoothProgress);
        applyTransform(smoothProgress);
        applyText(textProgress);
        applyCurtainLift(curtainProgress);

    });

    /* ── Scroll listener — updates target, kicks spring loop ────────────── */
    window.addEventListener('scroll', function () {
        targetProgress = getRawProgress();
        kickRaf();
    }, { passive: true });

    /* ── Resize ──────────────────────────────────────────────────────────── */
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            resizeCanvas();
            /* Snap both springs to current position on resize */
            targetProgress  = getRawProgress();
            smoothProgress  = targetProgress;
            textProgress    = targetProgress;
            curtainProgress = targetProgress;
            applyFrame(smoothProgress);
            applyTransform(smoothProgress);
            applyText(textProgress);
            applyCurtainLift(curtainProgress);
        }, 150);
    });

}());


/* ═══════════════════════════════════════════════════════════════════════════
   3b. VISION FINAL SECTION
   ─────────────────────────────────────────────────────────────────────────
   Independent of the Challenge/Leader spring engine above — deliberately
   simple, matching the "smallest possible patch" approach already used
   elsewhere on this page (e.g. the ESG section's own dedicated loop).

   Uses ONLY earth-planet.jpg — a deliberately different image from
   Leader's earth.jpg, not a shared/unified Earth. The smoother handoff
   comes from matching scale/timing at the boundary (Leader's own subtle
   zoom finishes right as this section begins), not from carrying
   earth.jpg's element into this section at all.

   No ScrollTrigger pin here. A plain rAF loop reads the section's own
   getBoundingClientRect() every frame to compute a 0→1 progress as it
   scrolls through .vision_final (200vh outer / 100vh sticky inner — sized
   so there's no leftover unstuck scroll distance, which is what was
   previously leaving a blank gap before .business). That progress drives:

     - a subtle continued scale on earth-planet.jpg (its own independent
       range — NOT chained to Leader's earth.jpg scale value)
     - the text building up progressively, word by word/line by line, in
       sequence (Our Vision → Global → Energy → & → Solution → Leader) —
       opacity only, each word locked in its final layout position the
       whole time, no slide-up or fade-up motion
     - an EXIT: the whole text block fades back out before this section
       ends, so it doesn't just sit static until Business Area cuts in
═══════════════════════════════════════════════════════════════════════════ */

(function () {

    const section = document.querySelector('.vision_final');
    if (!section) return;

    const earthImg  = section.querySelector('.vision_earth');   /* earth-planet.jpg only */
    const words     = Array.from(section.querySelectorAll('.vf-word'));

    function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
    function lerp(a, b, t)    { return a + (b - a) * t; }

    /* Subtle, independent scale — same "ambient drift" feeling as Leader's
       earth.jpg, but its own range on its own image. Not derived from or
       matched to Leader's scale value; the two Earths are intentionally
       different images, not one continuous object. */
    const EARTH_SCALE_START = 1.00;
    const EARTH_SCALE_END   = 1.08;

    /* Each word gets a slice of the 0→1 progress range to fade in during,
       in order, with slices overlapping slightly so it reads as a build-up
       rather than a strict one-at-a-time slideshow. All six slices finish
       well before EXIT_START so the full phrase gets to hold completely
       assembled for a beat before fading out. */
    const BUILD_START = 0.08;
    const BUILD_END   = 0.95;
    const WORD_OVERLAP = 0.7;   /* fraction of a slice that overlaps the next */

    const EXIT_START = 0.70;   /* whole block begins fading out */
    const EXIT_END   = 1.00;   /* fully gone by the time this section ends */

    function getProgress() {
        const rect = section.getBoundingClientRect();
        const total = section.offsetHeight - window.innerHeight;
        if (total <= 0) return 0;
        /* progress 0 right as the section's top reaches the viewport top,
           1 right as its bottom reaches the viewport bottom */
        return clamp(-rect.top / total, 0, 1);
    }

    function render(p) {
        if (earthImg) {
            earthImg.style.transform = `scale(${lerp(EARTH_SCALE_START, EARTH_SCALE_END, p)})`;
        }

        /* Exit factor: 1 normally, ramping down to 0 across EXIT_START→END.
           Multiplied into every word's opacity so the whole assembled
           phrase fades out together at the end, rather than staying static
           until the section boundary cuts it off.
           Eased (ease-out-cubic shape applied to the exit fraction) rather
           than linear: holds near full opacity through most of the window,
           then drops sharply only near EXIT_END — matching the slower,
           more gradual-looking fade in the reference recording instead of
           a constant-rate decline. Note the exponent goes on (1 - exitLinear),
           not on exitLinear directly — cubing exitLinear itself would shrink
           it everywhere in (0,1) and make the fade drop earlier, not later. */
        const exitLinear = 1 - clamp((p - EXIT_START) / (EXIT_END - EXIT_START), 0, 1);
        const exitP = 1 - Math.pow(1 - exitLinear, 3);

        if (words.length > 0) {
            const n = words.length;
            const sliceLen = (BUILD_END - BUILD_START) / n;
            const fadeLen  = sliceLen * (1 + WORD_OVERLAP);
            words.forEach((w, i) => {
                const start = BUILD_START + i * sliceLen;
                const enterP = clamp((p - start) / fadeLen, 0, 1);
                w.style.opacity = enterP * exitP;
            });
        }
    }

    /* ── TEMP EXPERIMENT: progress smoothing — same architecture as the
       ESG section's rAF loop, SMOOTHING=0.07 to match exactly.
       To revert: delete this block and restore onScroll()/the
       prefers-reduced-motion else-branch to call render(getProgress())
       directly, as marked below. ── */
    const SMOOTHING = 0.07;
    let targetProgress = 0;
    let smoothProgress = 0;
    let rafId = null;
    function tick() {
        rafId = null;
        const diff = targetProgress - smoothProgress;
        smoothProgress = Math.abs(diff) < 0.0001 ? targetProgress : lerp(smoothProgress, targetProgress, SMOOTHING);
        render(smoothProgress);
        if (Math.abs(targetProgress - smoothProgress) > 0.0001) {
            rafId = requestAnimationFrame(tick);
        }
    }
    function kickRaf() { if (!rafId) rafId = requestAnimationFrame(tick); }
    /* ── END TEMP EXPERIMENT setup ── */

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        if (earthImg) earthImg.style.transform = `scale(${EARTH_SCALE_END})`;
        words.forEach(w => { w.style.opacity = 1; });
    } else {
        /* TEMP: was render(getProgress()); window.addEventListener('scroll', onScroll, {passive:true}); window.addEventListener('resize', onScroll); */
        targetProgress = getProgress();
        smoothProgress = targetProgress;
        render(smoothProgress);
        window.addEventListener('scroll', () => { targetProgress = getProgress(); kickRaf(); }, { passive: true });
        window.addEventListener('resize', () => { targetProgress = getProgress(); smoothProgress = targetProgress; render(smoothProgress); });
    }

}());


/* ═══════════════════════════════════════════════════════════════════════════
   4. ESG SECTION — scroll-driven animation
   ─────────────────────────────────────────────────────────────────────────
   Uses its own dedicated rAF lerp loop (SMOOTHING = 0.07) — independent
   of the Challenge spring, so each section has its own weight and feel.
═══════════════════════════════════════════════════════════════════════════ */

(function () {

    const esgSection = document.getElementById('esgSection');
    if (!esgSection) return;

    const bgBase    = esgSection.querySelector('.esg_bg_base');
    const bgColor   = esgSection.querySelector('.esg_bg_color');
    const whiteMask = esgSection.querySelector('#esgWhiteMask');
    const leftHole  = esgSection.querySelector('#esgLeftHole');
    const rightHole = esgSection.querySelector('#esgRightHole');
    const winLeft   = esgSection.querySelector('#esgWindowLeft');
    const winRight  = esgSection.querySelector('#esgWindowRight');
    const titleEl   = esgSection.querySelector('.esg_title');
    const statsEl   = esgSection.querySelector('.esg_stats');
    const textWrap  = esgSection.querySelector('.esg_text_wrap');
    const cardsEl   = esgSection.querySelector('.esg_cards');
    const cards     = esgSection.querySelectorAll('.esg_card');
    const statGas   = esgSection.querySelector('#esgStatGas');
    const statVol   = esgSection.querySelector('#esgStatVol');

    /* Graph/text lockstep rise (below) is a 768px/480px-only correction —
       desktop's existing layout is untouched and must stay exactly as it
       was, so this flag gates that one piece of motion off at desktop
       widths without changing any static position anywhere. */
    let isCompact = window.matchMedia('(max-width: 768px)').matches;
    window.addEventListener('resize', () => {
        isCompact = window.matchMedia('(max-width: 768px)').matches;
    });

    function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
    function lerp(a, b, t)    { return a + (b - a) * t; }
    function easeOut(t)        { return 1 - Math.pow(1 - t, 3); }
    function stagger(p, s, e)  { return clamp((p - s) / (e - s), 0, 1); }

    function revealUp(el, prog, dist, riseVh) {
        const e = easeOut(prog);
        el.style.opacity   = e;
        const riseStyle = riseVh ? ` translateY(${-riseVh}vh)` : '';
        el.style.transform = `translateY(${lerp(dist, 0, e)}px)${riseStyle}`;
    }

    function barPath(x, topY, w, r) {
        const L = x, R = x + w, T = topY;
        return `M${L} ${T+r} Q${L} ${T} ${L+r} ${T} L${R-r} ${T} Q${R} ${T} ${R} ${T+r} L${R} 100 L${L} 100 Z`;
    }

    const SMOOTHING = 0.07;
    let targetProgress = 0;
    let smoothProgress = 0;

    function getRawProgress() {
        const rect       = esgSection.getBoundingClientRect();
        const scrollable = esgSection.offsetHeight - window.innerHeight;
        return clamp(-rect.top / scrollable, 0, 1);
    }

    function draw(progress) {
        const boxPhase   = clamp( progress         / 0.25, 0, 1);
        const colorPhase = clamp((progress - 0.20) / 0.54, 0, 1);
        const finalPhase = clamp((progress - 0.68) / 0.32, 0, 1);
        const boxEase    = easeOut(boxPhase);
        const colorEase  = easeOut(colorPhase);

        // 임직원 봉사활동 (stat_right / statVol) reveals+counts first;
        // 온실가스 배출량 (stat_left / statGas) follows after more scroll.
        // Kept inside the same 0–0.25 scroll budget as the original boxPhase,
        // just split into two staggered sub-windows instead of one shared one.
        const rightPhase = stagger(progress, 0.00, 0.18);
        const leftPhase  = stagger(progress, 0.04, 0.22);
        const rightEase  = easeOut(rightPhase);
        const leftEase   = easeOut(leftPhase);

        const leftX  = 5.6,  leftW  = 44, leftR  = 2;
        const rightX = 50.4, rightW = 44, rightR = 2;
        const LEFT_TOP_START  = 85, LEFT_TOP_END  = 50;
        const RIGHT_TOP_START = 68, RIGHT_TOP_END  = 38;
        const leftTop  = lerp(LEFT_TOP_START,  LEFT_TOP_END,  boxEase);
        const rightTop = lerp(RIGHT_TOP_START, RIGHT_TOP_END, boxEase);

        if (leftHole && rightHole) {
            leftHole .setAttribute('d', barPath(leftX,  leftTop,  leftW,  leftR));
            rightHole.setAttribute('d', barPath(rightX, rightTop, rightW, rightR));
        }
        if (winLeft)  { winLeft.style.top  = `${leftTop}%`;  winLeft.style.height  = `${100 - leftTop}%`;  }
        if (winRight) { winRight.style.top = `${rightTop}%`; winRight.style.height = `${100 - rightTop}%`; }

        // How far each window's top edge has risen so far, in the same
        // % units as its top value (esg_sticky is 100vh, so 1% = 1vh).
        // Each stat card's own text rides along with this exact delta,
        // on top of its existing revealUp() entrance transform below —
        // keeping graph and text at a constant relative offset instead
        // of the text sitting fixed while only the window moves.
        // Gated to compact widths only — zero on desktop, so revealUp's
        // added transform there is a no-op and desktop stays unchanged.
        const leftRiseVh  = isCompact ? LEFT_TOP_START  - leftTop  : 0;
        const rightRiseVh = isCompact ? RIGHT_TOP_START - rightTop : 0;

        bgColor.style.setProperty('--reveal', `${lerp(0, 115, colorEase)}%`);
        const sc = lerp(1.08, 1, colorEase);
        bgBase .style.transform = `scale(${sc})`;
        bgColor.style.transform = `scale(${sc})`;

        const maskFade = clamp((colorEase - 0.28) / 0.72, 0, 1);
        whiteMask.style.opacity = lerp(1, 0, maskFade);
        if (winLeft)  winLeft.style.opacity  = lerp(1, 0, maskFade);
        if (winRight) winRight.style.opacity = lerp(1, 0, maskFade);
        statsEl.style.opacity = lerp(1, 0, maskFade);
        titleEl.style.color   = maskFade > 0.5 ? '#fff' : '#111';

        // Entrance: stat_right (임직원) fades/rises in on rightPhase, stat_left
        // (온실가스) on leftPhase — same revealUp() idiom already used below
        // for esg_desc/esg_btn/esg_card. Each also carries its window's
        // own rightRiseVh/leftRiseVh so the stat text rises in lockstep
        // with its corresponding graph instead of staying fixed while
        // only the window moves — graph and text keep one constant
        // relative offset throughout, never drifting apart.
        const statRightEl = statsEl.querySelector('.stat_right');
        const statLeftEl  = statsEl.querySelector('.stat_left');
        if (statRightEl) revealUp(statRightEl, rightPhase, 28, rightRiseVh);
        if (statLeftEl)  revealUp(statLeftEl,  leftPhase,  28, leftRiseVh);

        // Counters no longer start from 0 — they start from a baseline value
        // (already-counted-so-far) and count up to the final figure, matching
        // the original. NOTE: 41,000 / 12% are approximations from the
        // reported reference values ("around 41,000+ hours", "around 12%");
        // swap in the exact baseline figures if you have them.
        if (statVol) statVol.textContent = Math.round(lerp(41000, 45279, rightEase)).toLocaleString();
        if (statGas) statGas.textContent = Math.round(lerp(12,    22,    leftEase))  + '%';

        const tText  = stagger(finalPhase, 0.00, 0.30);
        const tBtn   = stagger(finalPhase, 0.18, 0.46);
        const tCard1 = stagger(finalPhase, 0.34, 0.62);
        const tCard2 = stagger(finalPhase, 0.46, 0.74);
        const tCard3 = stagger(finalPhase, 0.58, 0.86);
        const descEl = textWrap ? textWrap.querySelector('.esg_desc') : null;
        const btnEl  = textWrap ? textWrap.querySelector('.esg_btn')  : null;

        if (descEl)   revealUp(descEl,   tText,  54);
        if (btnEl)    revealUp(btnEl,     tBtn,   46);
        if (cards[0]) revealUp(cards[0], tCard1, 70);
        if (cards[1]) revealUp(cards[1], tCard2, 70);
        if (cards[2]) revealUp(cards[2], tCard3, 70);
        if (cardsEl)  cardsEl.style.opacity  = tCard1 > 0 ? 1 : 0;
        if (textWrap) textWrap.style.opacity = tText  > 0 ? 1 : 0;
    }

    let rafId = null;

    function tick() {
        rafId = null;
        const diff = targetProgress - smoothProgress;
        smoothProgress = Math.abs(diff) < 0.0001 ? targetProgress : lerp(smoothProgress, targetProgress, SMOOTHING);
        draw(smoothProgress);
        if (Math.abs(targetProgress - smoothProgress) > 0.0001) {
            rafId = requestAnimationFrame(tick);
        }
    }

    function kickRaf() { if (!rafId) rafId = requestAnimationFrame(tick); }

    window.addEventListener('scroll', () => { targetProgress = getRawProgress(); kickRaf(); }, { passive: true });
    window.addEventListener('resize', () => { targetProgress = getRawProgress(); smoothProgress = targetProgress; draw(smoothProgress); });

    targetProgress = getRawProgress();
    smoothProgress = targetProgress;
    draw(smoothProgress);

}());


/* ── 5. SERVICE SLIDER ────────────────────────────────────────────────── */

(function () {

    const serviceSlider = document.querySelector(".service_contents");
    if (!serviceSlider) return;

    /*  Mobile (≤480px) ONLY — deliberately NOT widened to 768px. style.css
        §9 turns this into a native overflow-x:auto / scroll-snap container
        at 480px. The desktop clone-shuffle transform carousel below would
        conflict with native scroll-snap, so it does not run there.
        Instead, the prev/next buttons drive the same native scroll
        position directly via scrollBy — one card width per click, letting
        the browser's own scroll-snap settle it, consistent with res.css's
        `transform: none !important` on this container at that breakpoint.

        At 768px the reference recording shows the OPPOSITE choice: the
        desktop click-driven carousel keeps running unchanged (multiple
        ~280px cards with prev/next-driven movement, not native swipe) —
        desktop's own `.service_contents article { width: clamp(280px,
        24vw, 380px) }` already resolves to its 280px floor at this
        viewport width, matching the reference's card size with no CSS
        override needed either. So this guard intentionally stays scoped to
        max-width:480px only; widening it to 768px would silently break
        the working desktop carousel at a width where the reference shows
        it should keep running. */
    if (window.matchMedia('(max-width: 480px)').matches) {
        const mobilePrev = document.querySelector(".service .prev");
        const mobileNext = document.querySelector(".service .next");

        function mobileCardStep() {
            const card = serviceSlider.querySelector("article");
            if (!card) return 0;
            const gap = parseFloat(getComputedStyle(serviceSlider).gap) || 0;
            return card.getBoundingClientRect().width + gap;
        }

        if (mobileNext) {
            mobileNext.addEventListener("click", () => {
                serviceSlider.scrollBy({ left: mobileCardStep(), behavior: "smooth" });
            });
        }
        if (mobilePrev) {
            mobilePrev.addEventListener("click", () => {
                serviceSlider.scrollBy({ left: -mobileCardStep(), behavior: "smooth" });
            });
        }
        return;
    }

    serviceSlider.insertBefore(
        serviceSlider.lastElementChild,
        serviceSlider.firstElementChild
    );

    const originals = [...serviceSlider.children];
    originals.forEach(card => serviceSlider.appendChild(card.cloneNode(true)));

    const servicePrev = document.querySelector(".service .prev");
    const serviceNext = document.querySelector(".service .next");
    let currentIndex  = 0;

    function getMoveWidth() {
        const card = serviceSlider.querySelector("article");
        const gap  = parseFloat(getComputedStyle(serviceSlider).gap);
        return card.offsetWidth + gap;
    }

    function moveSlider() {
        serviceSlider.style.transition = "transform .8s cubic-bezier(.22,.61,.36,1)";
        serviceSlider.style.transform  = `translateX(-${currentIndex * getMoveWidth()}px)`;
    }

    if (serviceNext) {
        serviceNext.addEventListener("click", () => {
            currentIndex++;
            moveSlider();
            if (currentIndex >= originals.length) {
                serviceSlider.addEventListener("transitionend", function reset() {
                    serviceSlider.style.transition = "none";
                    currentIndex = 0;
                    serviceSlider.style.transform  = "translateX(0px)";
                    serviceSlider.removeEventListener("transitionend", reset);
                }, { once: true });
            }
        });
    }

}());


/* ═══════════════════════════════════════════════════════════════════════════
   6. MOBILE NAV — hamburger panel + accordion (header + footer)
   ─────────────────────────────────────────────────────────────────────────
   New, additive only. Does not touch any existing function, constant, or
   DOM node used by the Challenge/Leader/Vision-Final/ESG/Service code
   above. Purely toggles classes; all visual states live in CSS.
═══════════════════════════════════════════════════════════════════════════ */

(function () {

    const toggleBtn = document.getElementById('mobileNavToggle');
    const panel      = document.getElementById('mobileNavPanel');
    const closeBtn   = document.getElementById('mobileNavClose');

    if (toggleBtn && panel) {
        function openPanel() {
            panel.classList.add('is-open');
            panel.setAttribute('aria-hidden', 'false');
            toggleBtn.setAttribute('aria-expanded', 'true');
            document.body.classList.add('mobile_nav_open');
        }
        function closePanel() {
            panel.classList.remove('is-open');
            panel.setAttribute('aria-hidden', 'true');
            toggleBtn.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('mobile_nav_open');
        }

        toggleBtn.addEventListener('click', () => {
            const isOpen = panel.classList.contains('is-open');
            isOpen ? closePanel() : openPanel();
        });
        if (closeBtn) closeBtn.addEventListener('click', closePanel);
    }

    /*  Accordion behaviour for the header's mobile nav panel
        (.mobile_nav_panel > .mobile_nav_item). No footer accordion exists —
        the header panel already gives complete access to every section via
        the always-reachable hamburger button, so a second nav tree was not
        introduced (see style.css §11 for the corresponding decision). */
    const accordionTriggers = document.querySelectorAll('.mobile_nav_trigger');
    accordionTriggers.forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.mobile_nav_item');
            if (item) item.classList.toggle('is-open');
        });
    });

}());


/* ═══════════════════════════════════════════════════════════════════════════
   7. GO-TOP BUTTON — scroll-triggered visibility (mobile)
   ─────────────────────────────────────────────────────────────────────────
   New, additive only. On desktop this button is always rendered (its CSS
   is position:absolute relative to .main_stat_inner, with no show/hide
   logic at all — that behavior is untouched here). On mobile it becomes
   position:fixed (style.css §10) so it can stay pinned to the viewport
   corner regardless of scroll position, which needs a visibility toggle
   since "fixed" alone would otherwise render it at the top of the page on
   load. This listener only adds/removes a class; .go_top_btn's mobile CSS
   defaults to hidden (opacity:0/visibility:hidden) until this class is
   present, so nothing changes for desktop where this rule doesn't apply.
═══════════════════════════════════════════════════════════════════════════ */

const goTopBtn = document.querySelector('.go_top_btn');

if (goTopBtn) {
    goTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}


/* ═══════════════════════════════════════════════════════════════════════════
   8. SECTION NAV — persistent up/down navigator (768px tablet layout only)
   ─────────────────────────────────────────────────────────────────────────
   New, additive only. Confirmed against the reference recording to be a
   SEPARATE component from .hero_scroll, not a restyled version of it:
     - .hero_scroll (desktop's animated triple-chevron) lives only inside
       .hero and is completely untouched by this block.
     - This component is absent while Hero is on screen, then appears from
       the section directly below Hero onward and stays fixed on screen
       through the rest of the page, showing only the directions that are
       actually available (no up button at the very top of that range, no
       down button once there's no further section below).
   CSS hides this entirely outside the 768px breakpoint (res.css), so this
   script is a no-op at any other width — it only ever toggles classes,
   all visual states live in CSS.
═══════════════════════════════════════════════════════════════════════════ */

(function () {

    const nav     = document.getElementById('sectionNav');
    const upBtn   = nav ? nav.querySelector('.section_nav_up')   : null;
    const downBtn = nav ? nav.querySelector('.section_nav_down') : null;
    if (!nav || !upBtn || !downBtn) return;

    /* Section list: every major top-level block AFTER Hero, in DOM order.
       Hero itself is intentionally excluded — the reference shows no nav
       control while Hero is on screen, and the first entry here is the
       first section the control can land on/return to. */
    const sectionSelectors = [
        '.vision',
        '.curtain-group',
        '.vision_final',
        '.business',
        '.newsroom',
        '#esgSection',
        '.service',
        '.main_stat',
        'footer'
    ];

    const sections = sectionSelectors
        .map(sel => document.querySelector(sel))
        .filter(Boolean);

    const heroSection = document.querySelector('.hero');

    function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

    /* currentIndex: which entry in `sections` the viewport is presently
       considered "in" — the last section whose top has scrolled to/past
       the viewport top. -1 means still above the first tracked section
       (i.e. still within Hero), which is also when the whole control
       stays hidden. */
    function getCurrentIndex() {
        let idx = -1;
        for (let i = 0; i < sections.length; i++) {
            const rect = sections[i].getBoundingClientRect();
            if (rect.top <= window.innerHeight * 0.5) {
                idx = i;
            }
        }
        return idx;
    }

    function update() {
        const idx = getCurrentIndex();

        /* Still within Hero (or above the first tracked section) — the
           reference shows no control at all here; .hero_scroll alone
           covers this range. */
        if (idx < 0) {
            nav.classList.remove('is-active');
            nav.setAttribute('aria-hidden', 'true');
            return;
        }

        nav.classList.add('is-active');
        nav.setAttribute('aria-hidden', 'false');

        const atTop    = idx <= 0;
        const atBottom = idx >= sections.length - 1;

        upBtn.classList.toggle('is-hidden', atTop);
        downBtn.classList.toggle('is-hidden', atBottom);

        upBtn.dataset.targetIndex   = atTop    ? '' : String(idx - 1);
        downBtn.dataset.targetIndex = atBottom ? '' : String(idx + 1);
    }

    function scrollToSection(index) {
        if (index < 0) {
            if (heroSection) {
                heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            return;
        }
        const target = sections[clamp(index, 0, sections.length - 1)];
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    upBtn.addEventListener('click', () => {
        if (upBtn.classList.contains('is-hidden')) return;
        const idx = getCurrentIndex();
        scrollToSection(idx - 1);
    });

    downBtn.addEventListener('click', () => {
        if (downBtn.classList.contains('is-hidden')) return;
        const idx = getCurrentIndex();
        scrollToSection(idx + 1);
    });

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

}());


/* ═══════════════════════════════════════════════════════════════════════════
   8.5 DESKTOP SECTION NAV — persistent six-dot indicator (desktop layout
       only). Separate component from .hero_pagination (Hero's own
       carousel dots — left completely untouched, still only doing the
       Hero-slide job they always did) and from #sectionNav above (the
       768px up/down control).
   ─────────────────────────────────────────────────────────────────────────
   New markup, new component: #desktopSectionNav with six .desktop_section_dot
   buttons (index.html), already display:none by default and forced
   display:none at 768px/480px (res.css) — so it only ever renders at
   desktop width, same gating strategy as #sectionNav uses for its own
   breakpoint.

   Confirmed against the reference recording:
     - Invisible while Hero is on screen (no control here — .hero_scroll
       alone covers that range, same logic #sectionNav already uses for
       Hero on its own breakpoint).
     - From the moment scroll passes Hero, the six dots become fixed at
       one screen position and stay there through every section down to
       Service.
     - The active dot switches to whichever section the viewport is
       currently in; a text-label pill appears beside the active dot
       (each label's text is static markup already in index.html, never
       generated here — this script only toggles which one is visible).
     - Six dots cover Hero + five sections below it: Vision (also
       covering the curtain-group and vision_final sequence that
       follows it — they read as one continuous "Vision" passage in the
       recording, never getting their own dot), Business, Newsroom,
       ESG, Service.
     - Each non-Hero dot is a real <button> with a single, unambiguous
       purpose once visible, so clicking it scrolls to that section —
       the same scrollIntoView pattern already used by #sectionNav
       immediately above and by the newsroom pagination later in this
       file.
═══════════════════════════════════════════════════════════════════════════ */

(function () {

    const nav  = document.getElementById('desktopSectionNav');
    const dots = nav ? Array.from(nav.querySelectorAll('.desktop_section_dot')) : [];
    if (!nav || dots.length !== 6) return;

    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

    /* Dot 0 = Hero (no scroll target of its own needed for detection,
       only for its click handler). Dots 1-5 each track one group of
       section(s); group 1 covers three elements that all read as the
       same "Vision" dot in the recording. */
    const dotSelectors = [
        null,
        ['.vision', '.curtain-group', '.vision_final'],
        ['.business'],
        ['.newsroom'],
        ['#esgSection'],
        ['.service']
    ];

    const dotElements = dotSelectors.map(selectors =>
        selectors ? selectors.map(sel => document.querySelector(sel)).filter(Boolean) : []
    );

    function isPastHero() {
        const rect = heroSection.getBoundingClientRect();
        return rect.bottom <= window.innerHeight * 0.5;
    }

    function getActiveDotIndex() {
        let active = dots.length - 1; // once past every tracked section, the last dot (Service) stays active
        for (let i = 1; i < dotElements.length; i++) {
            const inView = dotElements[i].some(el => {
                const rect = el.getBoundingClientRect();
                return rect.top <= window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.1;
            });
            if (inView) active = i;
        }
        return active;
    }

    function update() {
        const pastHero = isPastHero();
        nav.classList.toggle('is-active', pastHero);
        nav.setAttribute('aria-hidden', pastHero ? 'false' : 'true');

        if (!pastHero) return;

        const activeIndex = getActiveDotIndex();
        dots.forEach((dot, i) => dot.classList.toggle('active', i === activeIndex));
    }

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            if (i === 0) {
                /* Not heroSection.scrollIntoView(...): .hero's height is
                   calc(100vh - 70px) (style.css), calibrated for the page
                   sitting at scrollY 0 with the fixed 70px header (body's
                   own padding-top: 70px) overlapping its first 70px.
                   scrollIntoView({block:'start'}) aligns .hero's top edge
                   with the viewport's top edge — it has no awareness of
                   the fixed header sitting in that same top strip, so it
                   leaves a 70px gap at the bottom of Hero where Vision
                   shows through. Scrolling the page to its actual top
                   reproduces the exact scrollY=0 layout Hero's height was
                   already calibrated for, with no extra offset needed. */
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            const target = dotElements[i][0];
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

}());


/* ═══════════════════════════════════════════════════════════════════════════
   8.6 HERO PAGINATION — page-section navigation (desktop)
   ─────────────────────────────────────────────────────────────────────────
   Correction to section 8.5's own comment: .hero_pagination is not a
   Hero-video carousel control — the Hero only ever has one video, so
   there was never slide content for it to switch. Confirmed against the
   reference recording: clicking a dot here is meant to do the exact same
   job as #desktopSectionNav's dots below it — scroll to Hero / Vision /
   Business / Newsroom / ESG / Service — which is consistent with
   .hero_pagination sharing #desktopSectionNav's exact dot size and left
   position (style.css), the two simply being the same nav's "on Hero" vs
   "past Hero" costume, swapping at the same boundary #desktopSectionNav
   already detects.

   Additive only — markup and CSS untouched. Dot 1 (index 0) scrolls back
   to the page's actual top — see the matching comment on #desktopSectionNav's
   own dot 0 handler in section 8.5 above for why this is window.scrollTo
   ({top:0}) rather than heroSection.scrollIntoView(...). Already gated
   to desktop-only by existing CSS (.hero_pagination is display:none at
   768px/480px in res.css), so no extra width check is needed here, same
   reasoning already documented in section 8.5 for #desktopSectionNav.
═══════════════════════════════════════════════════════════════════════════ */

(function () {

    const pagination = document.querySelector('.hero_pagination');
    const dots = pagination ? Array.from(pagination.querySelectorAll('button')) : [];
    if (!pagination || dots.length !== 6) return;

    /* Same targets #desktopSectionNav uses, in the same order: Hero,
       Vision (covers the curtain-group/vision_final passage too, same
       single-dot grouping as 8.5), Business, Newsroom, ESG, Service. */
    const sectionSelectors = [
        null, // Hero — handled separately below, same pattern as 8.5's dot 0
        '.vision',
        '.business',
        '.newsroom',
        '#esgSection',
        '.service'
    ];

    dots.forEach((dot, i) => {
        if (i === 0) {
            dot.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            return;
        }
        const selector = sectionSelectors[i];
        const target = selector ? document.querySelector(selector) : null;
        if (!target) return;
        dot.addEventListener('click', () => {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

}());


/* ═══════════════════════════════════════════════════════════════════════════
   9. HERO VIDEO — playback control (progress bar + pause/play toggle)
   ─────────────────────────────────────────────────────────────────────────
   Restored. .hero_video, .hero_progress_fill, and .hero_pause exist in the
   markup and in style.css at every breakpoint (desktop/768px/480px — res.css
   only ever repositions/resizes .hero_control, it never adds behavior), but
   no script currently drives them, so the bar never fills and the button
   never does anything. This block reconnects that contract without touching
   markup, CSS, or the video's own autoplay/muted/loop/playsinline attributes:

     - .hero_progress_fill scales (transform: scaleX) from 0 to 1 as the
       video plays, resetting on each loop.
     - .hero_pause toggles play/pause on click. style.css already defines
       its two visual states purely via the `is_play` class (no class =
       pause-bars icon, shown while playing; `is_play` = play-triangle icon,
       shown while paused) — this script only ever toggles that class, same
       additive pattern as section 8 above.
     - Works at every breakpoint: nothing here is width-gated, since the
       control is present and positioned at all three layouts; only its
       CSS position changes per breakpoint, which this script never reads.
     - Single set of listeners attached once on load; resize does not
       re-bind anything, so there's no duplicate-listener or leak risk.
═══════════════════════════════════════════════════════════════════════════ */

(function () {

    const video    = document.querySelector('.hero_video');
    const fill     = document.querySelector('.hero_progress_fill');
    const pauseBtn = document.querySelector('.hero_pause');
    if (!video) return;

    function setFill(ratio) {
        if (!fill) return;
        fill.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 1)})`;
    }

    function updateProgress() {
        if (video.duration) {
            setFill(video.currentTime / video.duration);
        }
        if (!video.paused && !video.ended) {
            requestAnimationFrame(updateProgress);
        }
    }

    function syncButton() {
        if (!pauseBtn) return;
        pauseBtn.classList.toggle('is_play', video.paused);
    }

    video.addEventListener('play', () => {
        syncButton();
        requestAnimationFrame(updateProgress);
    });

    video.addEventListener('pause', syncButton);

    video.addEventListener('loadedmetadata', () => setFill(0));

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        });
    }

    /* Initial state on load: video autoplays via its own HTML attribute
       (untouched), so reflect "playing" immediately rather than waiting
       for the first 'play' event, which some browsers fire before this
       script attaches its listener. */
    syncButton();
    if (!video.paused) {
        requestAnimationFrame(updateProgress);
    }

}());


/* ═══════════════════════════════════════════════════════════════════════════
   10. HERO SCROLL INDICATOR — click-to-advance (desktop)
   ─────────────────────────────────────────────────────────────────────────
   New, additive only. .hero_scroll had no click behavior before this —
   it was a purely decorative animated chevron (CSS-only, see style.css).
   This adds a single click listener that smoothly scrolls to the next
   section (.vision), reusing the same native scrollIntoView({behavior:
   'smooth'}) approach already used elsewhere in this file (see section 8,
   SECTION NAV's scrollToSection) rather than introducing a second scrolling
   technique. A plain native scroll doesn't drive GSAP/ScrollTrigger or
   Swiper directly, so it doesn't interfere with their own scroll-position
   reads — same as every other scrollIntoView call already in this file.

   No width/media-query gating is needed here: .hero_scroll is already
   display:none at 768px and below (res.css), so this listener is simply
   never reachable by a click outside desktop — consistent with how
   .hero_pagination/.section_nav already rely on CSS visibility alone
   rather than duplicating that gate in JS.
═══════════════════════════════════════════════════════════════════════════ */

(function () {

    const scrollBtn  = document.querySelector('.hero_scroll');
    const visionNext = document.querySelector('.vision');
    if (!scrollBtn || !visionNext) return;

    scrollBtn.addEventListener('click', () => {
        visionNext.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

}());


/* ═══════════════════════════════════════════════════════════════════════════
   11. NEWSROOM BANNER — autoplay rotation, pagination dots, pause/play
   ─────────────────────────────────────────────────────────────────────────
   Restored. .news_banner_slide (7 images), .news_banner_pagination (7
   buttons, first one pre-marked `active` in the HTML), and
   .news_banner_pause exist in the markup and in style.css at every
   breakpoint, but no script currently drives them — the slide never
   advances, the dots never sync, and the pause button never does
   anything. This block reconnects that contract without touching markup
   or CSS:

     - Autoplay: advances one slide every 4s via setInterval, translating
       .news_banner_slide by -100% per step (matches its existing
       `transition: transform .6s ease` in style.css — this script only
       ever sets the transform, never the transition itself). Loops back
       to the first slide after the last.
     - .news_banner_pagination button clicks jump straight to that slide
       and restart the autoplay timer (so manual navigation doesn't fight
       the next scheduled tick).
     - .news_banner_pause toggles autoplay on/off. style.css already
       defines its two visual states purely via the `play` class (no
       class = pause-bars icon, shown while autoplay is running; `play` =
       play-triangle icon, shown while paused) — this script only ever
       toggles that class, same additive pattern as the Hero video
       controller and Business Slider above.
     - Single interval, started once and only ever cleared/recreated by
       this script's own pause/resume and dot-click handlers — never left
       to run twice. Listeners are bound once at script load (this IIFE
       runs once), so resizing the window can't rebind or duplicate them;
       nothing here is width-gated since the banner is present and
       functional at every breakpoint.
═══════════════════════════════════════════════════════════════════════════ */

(function () {

    const banner    = document.querySelector('.news_banner');
    const slideTrack = banner ? banner.querySelector('.news_banner_slide') : null;
    const dots       = banner ? Array.from(banner.querySelectorAll('.news_banner_pagination button')) : [];
    const pauseBtn   = banner ? banner.querySelector('.news_banner_pause') : null;
    if (!banner || !slideTrack || !dots.length) return;

    const slideCount = slideTrack.children.length;
    let current = dots.findIndex(d => d.classList.contains('active'));
    if (current < 0) current = 0;
    let autoplay = true;
    let timer = null;

    function render() {
        slideTrack.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
    }

    function goTo(index) {
        current = ((index % slideCount) + slideCount) % slideCount;
        render();
    }

    function next() {
        goTo(current + 1);
    }

    function startAutoplay() {
        stopAutoplay();
        timer = setInterval(next, 4000);
    }

    function stopAutoplay() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    function syncPauseButton() {
        if (!pauseBtn) return;
        pauseBtn.classList.toggle('play', !autoplay);
    }

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            goTo(i);
            if (autoplay) startAutoplay();
        });
    });

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            autoplay = !autoplay;
            syncPauseButton();
            if (autoplay) {
                startAutoplay();
            } else {
                stopAutoplay();
            }
        });
    }

    render();
    syncPauseButton();
    if (autoplay) startAutoplay();

}());