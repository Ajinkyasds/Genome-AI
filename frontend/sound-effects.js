/* GENOMEAI_SHARED_SOUND_ENGINE */

(() => {
    "use strict";

    const STORAGE_KEY = "genomeai_sound_enabled";

    let enabled = true;
    let audioContext = null;
    let masterGain = null;

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) enabled = saved === "true";
    } catch (_) {}

    function getContext() {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return null;

        if (!audioContext) {
            audioContext = new AudioContextClass();

            masterGain = audioContext.createGain();
            masterGain.gain.value = 0.65;
            masterGain.connect(audioContext.destination);
        }

        if (audioContext.state === "suspended") {
            audioContext.resume().catch(() => {});
        }

        return audioContext;
    }

    function tone(
        frequency,
        endingFrequency,
        delay,
        duration,
        volume,
        waveform = "sine"
    ) {
        if (!enabled) return;

        const ctx = getContext();
        if (!ctx) return;

        const start = ctx.currentTime + delay;

        const oscillator = ctx.createOscillator();
        const envelope = ctx.createGain();

        oscillator.type = waveform;

        oscillator.frequency.setValueAtTime(frequency, start);

        oscillator.frequency.exponentialRampToValueAtTime(
            endingFrequency,
            start + duration
        );

        envelope.gain.setValueAtTime(0.0001, start);

        envelope.gain.exponentialRampToValueAtTime(
            volume,
            start + 0.012
        );

        envelope.gain.exponentialRampToValueAtTime(
            0.0001,
            start + duration
        );

        oscillator.connect(envelope);
        envelope.connect(masterGain);

        oscillator.start(start);
        oscillator.stop(start + duration + 0.03);
    }

    const effects = {

        click() {
            tone(460, 390, 0, 0.045, 0.016);
            tone(920, 760, 0.004, 0.025, 0.004);
        },

        navigate() {
            tone(420, 760, 0, 0.15, 0.045);
            tone(760, 980, 0.07, 0.12, 0.025);
        },

        thinking() {
            tone(330, 490, 0, 0.17, 0.04);
        },

        listening() {
            tone(500, 760, 0, 0.15, 0.045);
        },

        speaking() {
            tone(620, 850, 0, 0.11, 0.025);
        },

        success() {
            tone(620, 790, 0, 0.12, 0.045);
            tone(820, 1050, 0.11, 0.17, 0.035);
        },

        error() {
            tone(320, 230, 0, 0.19, 0.035, "triangle");
        }
    };

    function play(name) {
        if (!enabled || !effects[name]) return;
        effects[name]();
    }

    function setEnabled(value) {
        enabled = Boolean(value);

        try {
            localStorage.setItem(STORAGE_KEY, String(enabled));
        } catch (_) {}

        updateToggle();

        if (enabled) play("success");

        return enabled;
    }

    /* SOUND CONTROL */

    const toggle = document.createElement("button");

    toggle.type = "button";
    toggle.className = "genome-sound-toggle";

    toggle.setAttribute("aria-label", "Toggle website sounds");

    const style = document.createElement("style");

    style.textContent = `
        .genome-sound-toggle {
            position: fixed !important;
            left: 18px !important;
            bottom: 18px !important;
            z-index: 99999 !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            padding: 11px 15px !important;
            border: 1px solid rgba(85,230,208,.4) !important;
            border-radius: 99px !important;
            background: rgba(4,19,31,.94) !important;
            color: #8cf7e8 !important;
            font: 700 10px monospace !important;
            letter-spacing: 1px !important;
            cursor: pointer !important;
            backdrop-filter: blur(12px);
            box-shadow: 0 0 22px rgba(35,220,225,.08);
            transition: .25s ease;
        }

        .genome-sound-toggle:hover {
            transform: translateY(-3px);
            border-color: #55e6d0 !important;
            box-shadow: 0 0 24px rgba(85,230,208,.2);
        }

        .genome-sound-toggle:focus-visible {
            outline: 2px solid #55e6d0;
            outline-offset: 3px;
        }

        @media(max-width:600px) {
            .genome-sound-toggle {
                left: 10px !important;
                bottom: 10px !important;
                padding: 9px 11px !important;
            }
        }
    `;

    document.head.appendChild(style);

    function updateToggle() {
        toggle.textContent = enabled
            ? "♫ SOUND ON"
            : "♫ SOUND OFF";

        toggle.setAttribute("aria-pressed", String(enabled));

        toggle.title = enabled
            ? "Turn website sounds off"
            : "Turn website sounds on";
    }

    updateToggle();

    toggle.addEventListener("click", () => {
        setEnabled(!enabled);
    });

    document.body.appendChild(toggle);

    /* AUTOMATIC INTERACTION SOUNDS */

    document.addEventListener("click", event => {

        const target = event.target;

        if (!(target instanceof Element)) return;

        const control = target.closest(
            'a[href], button, [role="button"], input[type="button"], input[type="submit"]'
        );

        if (!control || control === toggle || control.disabled) return;

        if (control.closest('[data-sound="off"]')) return;

        const customSound = control.getAttribute("data-sound");

        if (customSound && effects[customSound]) {
            play(customSound);
            return;
        }

        if (control.matches("a[href]")) {
            play("navigate");
            return;
        }

        if (control.matches(
            'button[type="submit"], button:not([type]), input[type="submit"]'
        )) {
            return;
        }

        play("click");

    }, true);

    document.addEventListener("submit", event => {
        if (event.target.id !== "form") {
            play("thinking");
        }
    }, true);

    /* VOICE ASSISTANT STATE SOUNDS */

    const voiceState = document.getElementById("state");

    if (voiceState && "MutationObserver" in window) {

        let previousState = voiceState.textContent.toLowerCase();

        new MutationObserver(() => {

            const currentState =
                voiceState.textContent.toLowerCase();

            if (currentState === previousState) return;

            previousState = currentState;

            if (currentState.includes("listening")) {
                play("listening");
            }

            else if (currentState.includes("thinking")) {
                play("thinking");
            }

            else if (currentState.includes("speaking")) {
                play("speaking");
            }

            else if (
                currentState.includes("system online") &&
                /speaking|thinking/.test(previousState)
            ) {
                play("success");
            }

        }).observe(voiceState, {
            childList: true,
            characterData: true,
            subtree: true
        });
    }

    /* PUBLIC SOUND API */

    window.GenomeSounds = Object.freeze({
        play,
        setEnabled,
        isEnabled: () => enabled
    });

    window.addEventListener("genomeai:sound", event => {
        const name = typeof event.detail === "string"
            ? event.detail
            : event.detail?.effect;

        if (name) play(name);
    });

    console.log("GENOMEAI SOUND ENGINE ONLINE");

})();