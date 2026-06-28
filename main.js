(function () {

    const slider = document.querySelector(".business_slider");
    if (!slider) return;

    const isMobileOrTablet = () => window.matchMedia('(max-width: 768px)').matches;

    let desktopInitDone = false;
    let position = 0;
    const speed  = 1;
    let autoPlay = true;

    function getCardWidth() {
        const card = document.querySelector(".business_area_item");
        return card ? card.offsetWidth + 18 : 0;
    }

    function loop() {
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

gsap.registerPlugin(ScrollTrigger);

function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
function lerp(a, b, t)    { return a + (b - a) * t; }

function activateWordSweep(words, progress, endColor) {
    if (!words || words.length === 0) return;
    const p = clamp(progress, 0, 1);
    const n = words.length;

    const BLUE_WAVE_END  = 0.55;
    const HOLD_END       = 0.75;
    const WHITE_WAVE_END = 1.00;

    const pale  = [255, 255, 255, 0.55];
    const blue  = [0,   84,  255, 1];
    const white = endColor || [255, 255, 255, 1];

    const blueP  = clamp(p / BLUE_WAVE_END, 0, 1);
    const whiteP = clamp((p - HOLD_END) / (WHITE_WAVE_END - HOLD_END), 0, 1);

    for (let i = 0; i < n; i++) {
        const sliceStart = i / n;
        const sliceLen   = 1 / n;

        const wordBlueP  = clamp((blueP  - sliceStart) / sliceLen, 0, 1);
        const wordWhiteP = clamp((whiteP - sliceStart) / sliceLen, 0, 1);

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


(function () {

    const section = document.querySelector('.vision');
    if (!section) return;

    const words = Array.from(section.querySelectorAll('.vw-word'));
    if (words.length === 0) return;

    const black = [0, 0, 0, 1];

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

    const LERP         = 0.08;

    const TEXT_LERP    = 0.12;

    const SCALE_START  = 1.00;
    const SCALE_END    = 1.28;
    const Y_START      =  0;
    const Y_END        = -68;

    const TEXT_Y_START = window.innerHeight * 0.55;
    const TEXT_Y_END   = -(window.innerHeight * 0.12);
    const TEXT_START_FRAC = 0.05;

    function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
    function lerp(a, b, t)    { return a + (b - a) * t; }

    const framePath = canvas.dataset.framePath  || 'images/turbine/';
    const frameList = (canvas.dataset.frameList || '')
        .split(',').map(s => s.trim()).filter(Boolean);

    if (frameList.length === 0) {
        console.warn('challenge canvas: no data-frame-list attribute');
        return;
    }

    const URLS = frameList.map(n => `${framePath}${n}.jpg`);

    function resizeCanvas() {
        const dpr    = window.devicePixelRatio || 1;
        const sticky = challengeSection.querySelector('.challenge_sticky');
        canvas.width  = sticky.offsetWidth  * dpr;
        canvas.height = sticky.offsetHeight * dpr;
        ctx.scale(dpr, dpr);
        if (bitmaps[lastDrawnIndex]) drawFrame(lastDrawnIndex);
    }

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

    let targetProgress = 0;
    let smoothProgress = 0;
    let textProgress   = 0;
    let curtainProgress = 0;

    let rafId = null;

    function getRawProgress() {
        const rect       = challengeSection.getBoundingClientRect();
        const scrollable = challengeSection.offsetHeight - window.innerHeight;
        if (scrollable <= 0) return 0;
        return clamp(-rect.top / scrollable, 0, 1);
    }

    function applyFrame(p) {
        const raw   = p * (bitmaps.length - 1);
        const index = clamp(Math.round(raw), 0, bitmaps.length - 1);
        if (index !== lastDrawnIndex) drawFrame(index);
    }

    const stickyEl = challengeSection.querySelector('.challenge_sticky');

    const CURTAIN_START = 0.50;
    const CURTAIN_LERP  = 0.20;

    const leaderText  = document.querySelector('.leader .vision_text_wrap_3 h2');
    const lwWords     = Array.from(document.querySelectorAll('.leader .vision_text_wrap_3 h2 .lw-word'));
    const leaderEarth = document.querySelector('.leader .leader_earth');

    const LEADER_EARTH_SCALE_START = 1.00;
    const LEADER_EARTH_SCALE_END   = 1.06;

    function applyCurtainLift(p) {
        const localP = clamp((p - CURTAIN_START) / (1 - CURTAIN_START), 0, 1);

        const easedP =
            1 - Math.pow(1 - localP, 2);

        const yVh =
            lerp(0, -100, easedP);
        if (stickyEl) stickyEl.style.transform = `translateY(${yVh}vh)`;

        if (leaderEarth) {
            const earthScale = lerp(LEADER_EARTH_SCALE_START, LEADER_EARTH_SCALE_END, p);
            leaderEarth.style.transform = `scale(${earthScale})`;
        }

        if (leaderText) {

            const TEXT_TRAVEL_VH      = window.innerHeight * 0.55;
            const TEXT_FADE_IN_END    = 0.12;
            const TEXT_FADE_OUT_START = 0.92;

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

            const LEADER_SWEEP_START = 0.08;
            const LEADER_SWEEP_END   = 0.40;
            const leaderSweepP =
                (leaderP - LEADER_SWEEP_START) / (LEADER_SWEEP_END - LEADER_SWEEP_START);
            activateWordSweep(lwWords, leaderSweepP);
        }
    }

    function applyTransform(p) {
        const scale = lerp(SCALE_START, SCALE_END, p);
        const y     = lerp(Y_START,     Y_END,     p);
        wrap.style.transform = `scale(${scale}) translateY(${y}px)`;
    }

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

        const SWEEP_START = 0.10;
        const SWEEP_END   = 0.25;
        const sweepP = (localP - SWEEP_START) / (SWEEP_END - SWEEP_START);
        activateWordSweep(cwWords, sweepP);
    }

    function tick() {
        rafId = null;

        const diffMain    = targetProgress - smoothProgress;
        const diffText    = targetProgress - textProgress;
        const diffCurtain = targetProgress - curtainProgress;

        smoothProgress  += diffMain    * LERP;
        textProgress    += diffText    * TEXT_LERP;
        curtainProgress += diffCurtain * CURTAIN_LERP;

        if (Math.abs(diffMain)    < 0.00015) smoothProgress  = targetProgress;
        if (Math.abs(diffText)    < 0.00015) textProgress    = targetProgress;
        if (Math.abs(diffCurtain) < 0.00015) curtainProgress = targetProgress;

        applyFrame(smoothProgress);
        applyTransform(smoothProgress);
        applyText(textProgress);
        applyCurtainLift(curtainProgress);

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

    Promise.all(preloadPromises).then(() => {

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

        wrap.style.transform     = `scale(${SCALE_START}) translateY(${Y_START}px)`;
        textWrap.style.opacity   = 0;
        textWrap.style.transform = `translate(-50%, calc(-50% + ${TEXT_Y_START}px))`;
        textWrap.style.pointerEvents = 'none';
        if (leaderText) { leaderText.style.opacity = 0; leaderText.style.transform = 'translate(-50%, calc(-50% + 60px))'; }

        targetProgress  = getRawProgress();
        smoothProgress  = targetProgress;
        textProgress    = targetProgress;
        curtainProgress = targetProgress;
        applyFrame(smoothProgress);
        applyTransform(smoothProgress);
        applyText(textProgress);
        applyCurtainLift(curtainProgress);

    });

    window.addEventListener('scroll', function () {
        targetProgress = getRawProgress();
        kickRaf();
    }, { passive: true });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            resizeCanvas();
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

(function () {

    const section = document.querySelector('.vision_final');
    if (!section) return;

    const earthImg  = section.querySelector('.vision_earth');
    const words     = Array.from(section.querySelectorAll('.vf-word'));

    function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
    function lerp(a, b, t)    { return a + (b - a) * t; }

    const EARTH_SCALE_START = 1.00;
    const EARTH_SCALE_END   = 1.08;

    const BUILD_START = 0.08;
    const BUILD_END   = 0.95;
    const WORD_OVERLAP = 0.7;

    const EXIT_START = 0.70;
    const EXIT_END   = 1.00;

    function getProgress() {
        const rect = section.getBoundingClientRect();
        const total = section.offsetHeight - window.innerHeight;
        if (total <= 0) return 0;
        return clamp(-rect.top / total, 0, 1);
    }

    function render(p) {
        if (earthImg) {
            earthImg.style.transform = `scale(${lerp(EARTH_SCALE_START, EARTH_SCALE_END, p)})`;
        }

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

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        if (earthImg) earthImg.style.transform = `scale(${EARTH_SCALE_END})`;
        words.forEach(w => { w.style.opacity = 1; });
    } else {
        targetProgress = getProgress();
        smoothProgress = targetProgress;
        render(smoothProgress);
        window.addEventListener('scroll', () => { targetProgress = getProgress(); kickRaf(); }, { passive: true });
        window.addEventListener('resize', () => { targetProgress = getProgress(); smoothProgress = targetProgress; render(smoothProgress); });
    }

}());

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

        const statRightEl = statsEl.querySelector('.stat_right');
        const statLeftEl  = statsEl.querySelector('.stat_left');
        if (statRightEl) revealUp(statRightEl, rightPhase, 28, rightRiseVh);
        if (statLeftEl)  revealUp(statLeftEl,  leftPhase,  28, leftRiseVh);

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

(function () {

    const serviceSlider = document.querySelector(".service_contents");
    if (!serviceSlider) return;

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

    const accordionTriggers = document.querySelectorAll('.mobile_nav_trigger');
    accordionTriggers.forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.mobile_nav_item');
            if (item) item.classList.toggle('is-open');
        });
    });

}());

const goTopBtn = document.querySelector('.go_top_btn');

if (goTopBtn) {
    goTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

(function () {

    const nav     = document.getElementById('sectionNav');
    const upBtn   = nav ? nav.querySelector('.section_nav_up')   : null;
    const downBtn = nav ? nav.querySelector('.section_nav_down') : null;
    if (!nav || !upBtn || !downBtn) return;

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

(function () {

    const nav  = document.getElementById('desktopSectionNav');
    const dots = nav ? Array.from(nav.querySelectorAll('.desktop_section_dot')) : [];
    if (!nav || dots.length !== 6) return;

    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

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
        let active = dots.length - 1;
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

(function () {

    const pagination = document.querySelector('.hero_pagination');
    const dots = pagination ? Array.from(pagination.querySelectorAll('button')) : [];
    if (!pagination || dots.length !== 6) return;

    const sectionSelectors = [
        null,
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

    syncButton();
    if (!video.paused) {
        requestAnimationFrame(updateProgress);
    }

}());

(function () {

    const scrollBtn  = document.querySelector('.hero_scroll');
    const visionNext = document.querySelector('.vision');
    if (!scrollBtn || !visionNext) return;

    scrollBtn.addEventListener('click', () => {
        visionNext.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

}());

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