/* blog-audio.js
 * Custom audio player for blog posts — play/pause, scrub, skip, speed.
 *
 * Discovers its recording from  window.BLOG_NAME  — the same identifier
 * blog-loader.js uses for content/<BLOG_NAME>.docx — by probing
 *   audio/<BLOG_NAME>.mp3   then   audio/<BLOG_NAME>.m4a
 * with a HEAD request. If neither exists the whole bar stays hidden.
 *
 * The player markup lives OUTSIDE #blog-content, because blog-loader.js
 * replaces that element's innerHTML wholesale on window.load. Moving the
 * bar inside the article would make it vanish on every post.
 */
(function () {
    'use strict';

    const AUDIO_DIR  = 'audio';
    const AUDIO_EXTS = ['mp3', 'm4a'];
    const SKIP       = 15;                  // seconds
    const RATES      = [1, 1.25, 1.5, 2];

    /* ── helpers ─────────────────────────────────────────────────────────── */

    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

    function fmt(sec) {
        if (!isFinite(sec) || sec < 0) return '--:--';
        const s = Math.floor(sec % 60);
        const m = Math.floor(sec / 60) % 60;
        const h = Math.floor(sec / 3600);
        const mm = h ? String(m).padStart(2, '0') : String(m);
        return (h ? h + ':' : '') + mm + ':' + String(s).padStart(2, '0');
    }

    /* Screen readers get words, not a percentage. */
    function spoken(sec) {
        if (!isFinite(sec) || sec < 0) return 'unknown';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        const parts = [];
        if (m) parts.push(m + (m === 1 ? ' minute' : ' minutes'));
        parts.push(s + (s === 1 ? ' second' : ' seconds'));
        return parts.join(' ');
    }

    /* HEAD-probe the extension chain; resolve to a URL or null.
       A probe rather than the <audio> error event, because iOS Safari
       defers preload="metadata" until a user gesture and would never fire. */
    async function findAudio(name) {
        for (const ext of AUDIO_EXTS) {
            const url = `${AUDIO_DIR}/${encodeURIComponent(name)}.${ext}`;
            try {
                const res = await fetch(url, { method: 'HEAD' });
                if (!res.ok) continue;
                // Sanity-check the type when the host sends one; trust the 200 otherwise.
                const type = res.headers.get('content-type') || '';
                if (type && !/^audio\/|^video\/mp4|^application\/octet-stream/i.test(type)) continue;
                return url;
            } catch (err) {
                console.warn('[blog-audio] probe failed for', url, err);
            }
        }
        return null;
    }

    /* ── main ────────────────────────────────────────────────────────────── */

    function initAudioPlayer() {
        const bar = document.querySelector('[data-audio-player]');
        if (!bar) return;

        const name = window.BLOG_NAME;
        if (!name) return;

        const q = (sel) => bar.querySelector(sel);

        const audio     = q('[data-audio-el]');
        const toggleBtn = q('[data-audio-toggle]');
        const backBtn   = q('[data-audio-back]');
        const fwdBtn    = q('[data-audio-fwd]');
        const track     = q('[data-audio-track]');
        const played    = q('[data-audio-played]');
        const buffered  = q('[data-audio-buffered]');
        const handle    = q('[data-audio-handle]');
        const curEl     = q('[data-audio-current]');
        const durEl     = q('[data-audio-duration]');
        const rateBtns  = Array.from(bar.querySelectorAll('[data-audio-rate]'));

        if (!audio || !toggleBtn || !track) return;

        let scrubbing   = false;
        let rafId       = 0;
        let lastPainted = -1;     // whole seconds, throttles the text readout
        let pendingPlay = false;  // user hit play before the media was ready

        const dur = () => (isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0);

        /* ── painting ────────────────────────────────────────────────────── */

        function paintProgress(time) {
            const d   = dur();
            const pct = d ? clamp(time / d, 0, 1) * 100 : 0;
            played.style.width = pct + '%';
            handle.style.left  = pct + '%';
            track.setAttribute('aria-valuenow', String(Math.round(pct)));
        }

        function paintText(time) {
            const whole = Math.floor(time);
            if (whole === lastPainted) return;
            lastPainted = whole;
            curEl.textContent = fmt(time);
            track.setAttribute(
                'aria-valuetext',
                `${spoken(time)} of ${dur() ? spoken(dur()) : 'unknown duration'}`
            );
        }

        function paintBuffered() {
            const d = dur();
            if (!d || !audio.buffered.length) return;
            let end = 0;
            for (let i = 0; i < audio.buffered.length; i++) {
                if (audio.buffered.start(i) <= audio.currentTime) {
                    end = Math.max(end, audio.buffered.end(i));
                }
            }
            buffered.style.width = clamp(end / d, 0, 1) * 100 + '%';
        }

        function paint() {
            if (!scrubbing) {
                paintProgress(audio.currentTime);
                paintText(audio.currentTime);
            }
            paintBuffered();
        }

        /* rAF drives the bar while playing (smooth); timeupdate is the
           fallback for background tabs, where rAF is throttled to a halt. */
        function tick() {
            paint();
            rafId = requestAnimationFrame(tick);
        }
        function startTicking() { if (!rafId) rafId = requestAnimationFrame(tick); }
        function stopTicking()  { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } }

        function setEnabled(on) {
            track.setAttribute('aria-disabled', on ? 'false' : 'true');
            track.tabIndex = on ? 0 : -1;
            [backBtn, fwdBtn].forEach((b) => { if (b) b.disabled = !on; });
        }

        /* ── transport ───────────────────────────────────────────────────── */

        function play() {
            const p = audio.play();
            if (p && typeof p.catch === 'function') {
                p.catch((err) => {
                    // Autoplay policy, decode error, or not-yet-loaded.
                    console.warn('[blog-audio] play rejected:', err);
                    pendingPlay = false;
                    reflectPaused();
                });
            }
        }

        function togglePlay() {
            if (audio.paused) {
                if (audio.readyState < 2) pendingPlay = true;   // canplay will retry
                play();
            } else {
                pendingPlay = false;
                audio.pause();
            }
        }

        function reflectPlaying() {
            bar.classList.add('is-playing');
            toggleBtn.setAttribute('aria-label', 'Pause');
            toggleBtn.setAttribute('aria-pressed', 'true');
            startTicking();
        }

        function reflectPaused() {
            bar.classList.remove('is-playing');
            toggleBtn.setAttribute('aria-label', 'Play');
            toggleBtn.setAttribute('aria-pressed', 'false');
            stopTicking();
            paint();
        }

        function seekTo(t) {
            const d = dur();
            if (!d) return;
            audio.currentTime = clamp(t, 0, d);
            paintProgress(audio.currentTime);
            paintText(audio.currentTime);
        }

        function nudge(delta) { seekTo(audio.currentTime + delta); }

        /* ── scrubbing: click and drag share one code path ───────────────── */

        function ratioFromEvent(e) {
            const r = track.getBoundingClientRect();
            if (!r.width) return 0;
            return clamp((e.clientX - r.left) / r.width, 0, 1);
        }

        function previewAt(ratio) {
            const d = dur();
            played.style.width = ratio * 100 + '%';
            handle.style.left  = ratio * 100 + '%';
            track.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
            if (d) curEl.textContent = fmt(ratio * d);
        }

        track.addEventListener('pointerdown', (e) => {
            if (!dur()) return;
            if (e.button !== undefined && e.button !== 0) return;
            scrubbing = true;
            bar.classList.add('is-scrubbing');
            track.setPointerCapture(e.pointerId);
            previewAt(ratioFromEvent(e));
            e.preventDefault();
        });

        track.addEventListener('pointermove', (e) => {
            if (!scrubbing) return;
            previewAt(ratioFromEvent(e));
        });

        track.addEventListener('pointerup', (e) => {
            if (!scrubbing) return;
            scrubbing = false;
            bar.classList.remove('is-scrubbing');
            try { track.releasePointerCapture(e.pointerId); } catch (_) {}
            seekTo(ratioFromEvent(e) * dur());
        });

        track.addEventListener('pointercancel', () => {
            scrubbing = false;
            bar.classList.remove('is-scrubbing');
            paint();
        });

        /* ── keyboard ────────────────────────────────────────────────────── */

        track.addEventListener('keydown', (e) => {
            const d = dur();
            let handled = true;
            switch (e.key) {
                case 'ArrowRight': nudge(e.shiftKey ? SKIP : 5);   break;
                case 'ArrowLeft':  nudge(e.shiftKey ? -SKIP : -5); break;
                case 'ArrowUp':    nudge(SKIP);  break;
                case 'ArrowDown':  nudge(-SKIP); break;
                case 'PageUp':     nudge(60);    break;
                case 'PageDown':   nudge(-60);   break;
                case 'Home':       seekTo(0);    break;
                case 'End':        if (d) seekTo(d - 0.05); break;
                case ' ':
                case 'Enter':      togglePlay(); break;
                default:           handled = false;
            }
            if (handled) e.preventDefault();
        });

        /* Space anywhere in the bar toggles playback — except on a real button,
           where the browser's own Space-to-click must be left alone. */
        bar.addEventListener('keydown', (e) => {
            if (e.key !== ' ' && e.code !== 'Space') return;
            if (e.target.closest('button')) return;
            if (e.target === track) return;                 // handled above
            e.preventDefault();
            togglePlay();
        });

        /* ── speed ───────────────────────────────────────────────────────── */

        function setRate(rate) {
            audio.playbackRate = rate;
            // Keep pitch natural; the prefixes still matter on older engines.
            audio.preservesPitch = true;
            audio.mozPreservesPitch = true;
            audio.webkitPreservesPitch = true;
            rateBtns.forEach((b) => {
                const on = parseFloat(b.dataset.audioRate) === rate;
                b.classList.toggle('is-active', on);
                b.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
        }

        rateBtns.forEach((b) => {
            b.addEventListener('click', () => setRate(parseFloat(b.dataset.audioRate)));
        });

        /* ── wiring ──────────────────────────────────────────────────────── */

        toggleBtn.addEventListener('click', togglePlay);
        if (backBtn) backBtn.addEventListener('click', () => nudge(-SKIP));
        if (fwdBtn)  fwdBtn.addEventListener('click',  () => nudge(SKIP));

        audio.addEventListener('play',       reflectPlaying);
        audio.addEventListener('pause',      reflectPaused);
        audio.addEventListener('ended',      () => { reflectPaused(); seekTo(0); });
        audio.addEventListener('timeupdate', paint);
        audio.addEventListener('progress',   paintBuffered);
        audio.addEventListener('seeked',     paint);
        audio.addEventListener('ratechange', () => setRate(audio.playbackRate));

        audio.addEventListener('loadedmetadata', () => {
            durEl.textContent = fmt(audio.duration);
            setEnabled(dur() > 0);
            paint();
        });

        /* iOS defers metadata until first play, so duration can arrive late. */
        audio.addEventListener('durationchange', () => {
            durEl.textContent = fmt(audio.duration);
            setEnabled(dur() > 0);
        });

        audio.addEventListener('canplay', () => {
            if (pendingPlay) { pendingPlay = false; play(); }
        });

        /* Probe said the file was there but the media pipeline disagrees
           (corrupt, wrong codec, truncated) — remove the bar rather than
           leave a dead control sitting on the page. */
        audio.addEventListener('error', () => {
            console.warn('[blog-audio] media error, hiding player', audio.error);
            bar.hidden = true;
            stopTicking();
        });

        setEnabled(false);   // disabled until we know a duration

        findAudio(name).then((url) => {
            if (!url) return;                    // no recording — bar stays hidden
            audio.src = url;
            bar.hidden = false;
            setRate(1);                          // some browsers reset rate on src change
            audio.load();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAudioPlayer);
    } else {
        initAudioPlayer();
    }
})();
