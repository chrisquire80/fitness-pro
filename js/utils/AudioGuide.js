export class AudioGuide {
    constructor() {
        this.synth = window.speechSynthesis;
        this.enabled = true;
        this.voice = null;

        // Try to load voices immediately
        this.loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
        }
    }

    loadVoices() {
        const voices = this.synth.getVoices();
        // Prefer Italian voice if available, otherwise default
        this.voice = voices.find(v => v.lang.includes('it')) || voices[0];
    }

    speak(text) {
        if (!this.enabled || !text) return;

        // Cancel previous speech to avoid queue buildup
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        if (this.voice) utterance.voice = this.voice;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        this.synth.speak(utterance);
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

export const audioGuide = new AudioGuide();
