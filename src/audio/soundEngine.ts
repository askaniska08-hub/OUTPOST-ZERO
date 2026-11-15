// 100% Procedural Web Audio API Sound Synthesizer for OUTPOST ZERO
// Soft, futuristic aerospace audio with separate Ambience, Effects & Alerts channels

import { AudioVolumes, WorldId } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;
  private alertsGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;

  private muted = false;
  private volume = 0.65;
  private channelVolumes: AudioVolumes = {
    ambience: 0.45,
    effects: 0.75,
    alerts: 0.6,
  };

  private roverOsc: OscillatorNode | null = null;
  private roverGain: GainNode | null = null;

  private ambOsc: OscillatorNode | null = null;
  private ambWorld: WorldId | null = null;

  private lastFootstep = 0;
  private lastAlertTime = 0;
  private lastNotifTime = 0;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);

      this.effectsGain = this.ctx.createGain();
      this.effectsGain.gain.value = this.channelVolumes.effects;
      this.effectsGain.connect(this.masterGain);

      this.alertsGain = this.ctx.createGain();
      this.alertsGain.gain.value = this.channelVolumes.alerts;
      this.alertsGain.connect(this.masterGain);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.value = this.channelVolumes.ambience * 0.08;
      this.ambienceGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.04);
    }
    if (muted) {
      this.stopRoverEngine();
      this.stopAmbience();
    }
  }

  public isMuted() {
    return this.muted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.04);
    }
  }

  public getVolume() {
    return this.volume;
  }

  public setChannelVolume(channel: keyof AudioVolumes, val: number) {
    const clamped = Math.max(0, Math.min(1, val));
    this.channelVolumes[channel] = clamped;
    if (!this.ctx) return;
    if (channel === 'effects' && this.effectsGain) {
      this.effectsGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.04);
    } else if (channel === 'alerts' && this.alertsGain) {
      this.alertsGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.04);
    } else if (channel === 'ambience' && this.ambienceGain) {
      this.ambienceGain.gain.setTargetAtTime(clamped * 0.08, this.ctx.currentTime, 0.08);
    }
  }

  public getChannelVolumes(): AudioVolumes {
    return { ...this.channelVolumes };
  }

  public updateWorldAmbience(world: WorldId, active: boolean) {
    if (!active || this.muted) {
      this.stopAmbience();
      return;
    }
    if (this.ambWorld === world && this.ambOsc) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.ambienceGain) return;
    this.stopAmbience();

    this.ambWorld = world;
    this.ambOsc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';

    if (world === 'mars') {
      // Gentle thin-air Martian atmospheric wind tone
      this.ambOsc.type = 'triangle';
      this.ambOsc.frequency.value = 72;
      filter.frequency.value = 180;
    } else {
      // Soft Earth cleanroom lab hum
      this.ambOsc.type = 'sine';
      this.ambOsc.frequency.value = 110;
      filter.frequency.value = 260;
    }

    this.ambOsc.connect(filter);
    filter.connect(this.ambienceGain);
    this.ambOsc.start();
  }

  public stopAmbience() {
    if (this.ambOsc) {
      try {
        this.ambOsc.stop();
        this.ambOsc.disconnect();
      } catch {
        // ignore
      }
      this.ambOsc = null;
      this.ambWorld = null;
    }
  }

  public playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal = 0.16,
    endFreq?: number,
    channel: 'effects' | 'alerts' = 'effects'
  ) {
    const ctx = this.ensureContext();
    const dest = channel === 'alerts' ? this.alertsGain : this.effectsGain;
    if (!ctx || !dest) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  public playNoiseBurst(duration: number, filterFreq = 800, gainVal = 0.12, bandpass = false) {
    const ctx = this.ensureContext();
    if (!ctx || !this.effectsGain) return;
    const sampleRate = ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = bandpass ? 'bandpass' : 'lowpass';
    filter.frequency.value = filterFreq;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsGain);
    src.start(now);
  }

  public playFootstep(surface: 'mars' | 'earth', running = false) {
    const now = performance.now();
    const minInterval = running ? 250 : 380;
    if (now - this.lastFootstep < minInterval) return;
    this.lastFootstep = now;

    if (surface === 'mars') {
      this.playNoiseBurst(0.08, 620 + Math.random() * 220, 0.07, true);
      this.playTone(90 + Math.random() * 18, 0.06, 'triangle', 0.05, 55);
    } else {
      this.playTone(210 + Math.random() * 30, 0.045, 'sine', 0.05, 130);
    }
  }

  public playJump() {
    this.playTone(210, 0.16, 'sine', 0.12, 390);
  }

  public playPickup() {
    this.playTone(460, 0.09, 'sine', 0.11, 660);
    setTimeout(() => this.playTone(660, 0.11, 'sine', 0.1, 880), 65);
  }

  public playUiHover() {
    this.playTone(580, 0.035, 'sine', 0.04, 640);
  }

  public playUiClick() {
    this.playTone(520, 0.055, 'sine', 0.09, 700);
  }

  public playPurchase() {
    this.playTone(523.25, 0.1, 'sine', 0.11);
    setTimeout(() => this.playTone(659.25, 0.1, 'sine', 0.11), 80);
    setTimeout(() => this.playTone(783.99, 0.16, 'sine', 0.13), 160);
  }

  public playDoor() {
    this.playNoiseBurst(0.24, 1100, 0.07, true);
    this.playTone(190, 0.18, 'sine', 0.07, 290);
  }

  public playDeconShower() {
    this.playNoiseBurst(1.4, 2000, 0.09, true);
    this.playTone(340, 0.35, 'sine', 0.06, 510);
  }

  // Gentle notification chime for ordinary updates (with overlap cooldown)
  public playGentleNotif() {
    const now = performance.now();
    if (now - this.lastNotifTime < 1200) return;
    this.lastNotifTime = now;
    this.playTone(587.33, 0.16, 'sine', 0.09, undefined, 'alerts'); // D5
    setTimeout(() => this.playTone(880, 0.22, 'sine', 0.08, undefined, 'alerts'), 110); // A5
  }

  // Soft, professional futuristic mission-alert chime (replaces harsh sawtooth alarm!)
  public playSoftMissionAlert() {
    const now = performance.now();
    if (now - this.lastAlertTime < 3500) return;
    this.lastAlertTime = now;

    // Warm aerospace two-tone harmonic pulse (calm, clear, non-aggressive)
    this.playTone(440, 0.28, 'sine', 0.11, 523.25, 'alerts');
    setTimeout(() => this.playTone(659.25, 0.34, 'sine', 0.11, 587.33, 'alerts'), 240);
  }

  public playDustStormAlert() {
    const now = performance.now();
    if (now - this.lastAlertTime < 3500) return;
    this.lastAlertTime = now;
    this.playTone(329.63, 0.35, 'triangle', 0.09, 261.63, 'alerts');
    setTimeout(() => this.playTone(293.66, 0.38, 'sine', 0.09, 246.94, 'alerts'), 260);
  }

  public playRadiationAlert() {
    const now = performance.now();
    if (now - this.lastAlertTime < 3500) return;
    this.lastAlertTime = now;
    [0, 180, 360].forEach((delay, idx) => {
      setTimeout(
        () => this.playTone(idx === 2 ? 784 : 659.25, 0.14, 'sine', 0.1, undefined, 'alerts'),
        delay
      );
    });
  }

  public playPetChirp(species: 'dog' | 'cat') {
    if (species === 'dog') {
      this.playTone(420, 0.09, 'triangle', 0.11, 580);
      setTimeout(() => this.playTone(460, 0.11, 'triangle', 0.1, 360), 110);
    } else {
      this.playTone(760, 0.16, 'sine', 0.1, 960);
      setTimeout(() => this.playTone(860, 0.14, 'sine', 0.08, 680), 130);
    }
  }

  public playChargingHum() {
    this.playTone(280, 0.32, 'sine', 0.06, 420);
  }

  public playConstruction() {
    this.playTone(150, 0.11, 'triangle', 0.1, 100);
    setTimeout(() => this.playNoiseBurst(0.12, 850, 0.09), 75);
    setTimeout(() => this.playTone(330, 0.15, 'sine', 0.1, 480), 160);
  }

  public playMicroscopeClick() {
    this.playTone(880, 0.03, 'sine', 0.06, 700);
  }

  public playTestTick() {
    this.playTone(620, 0.05, 'sine', 0.045);
  }

  public playLevelComplete() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 0.24, 'sine', 0.13, undefined, 'alerts'), i * 110);
    });
  }

  public playRocketLaunch() {
    this.playNoiseBurst(3.2, 380, 0.2, false);
    this.playTone(72, 2.5, 'triangle', 0.13, 45);
  }

  public updateRoverEngine(active: boolean, speed: number) {
    if (!active || this.muted) {
      this.stopRoverEngine();
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx || !this.effectsGain) return;
    if (!this.roverOsc || !this.roverGain) {
      this.roverOsc = ctx.createOscillator();
      this.roverGain = ctx.createGain();
      this.roverOsc.type = 'triangle';
      this.roverOsc.frequency.value = 65;
      this.roverGain.gain.value = 0.025;
      this.roverOsc.connect(this.roverGain);
      this.roverGain.connect(this.effectsGain);
      this.roverOsc.start();
    }
    const targetFreq = 58 + Math.min(18, Math.abs(speed)) * 5.5;
    const targetGain = 0.025 + Math.min(1, Math.abs(speed) / 14) * 0.045;
    this.roverOsc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.08);
    this.roverGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.08);
  }

  public stopRoverEngine() {
    if (this.roverOsc) {
      try {
        this.roverOsc.stop();
        this.roverOsc.disconnect();
      } catch {
        // ignore
      }
      this.roverOsc = null;
    }
    if (this.roverGain) {
      try {
        this.roverGain.disconnect();
      } catch {
        // ignore
      }
      this.roverGain = null;
    }
  }
}

export const soundEngine = new SoundEngine();
