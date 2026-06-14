/**
 * 蟠桃盛会 — Audio Engine
 * Web Audio API synthesis engine: 6-tier BGM + 16 SFX, zero external files
 */
var AudioEngine = (function () {
  'use strict';

  var ctx = null;
  var masterGain = null;
  var musicGain = null;
  var sfxGain = null;
  var muted = false;
  var started = false;
  var currentLevel = 0;
  var targetLevel = 0;
  var transitionProgress = 1; // 0→1, 1 = fully at target
  var lowHealth = false;

  // Music state
  var musicNodes = [];       // active oscillators/gains for cleanup
  var melodyTimer = 0;
  var drumTimer = 0;
  var bassOsc = null;
  var bassGain = null;
  var droneOsc = null;
  var droneGain = null;

  // Pentatonic scale on D3 (147 Hz) — 中国五声音阶 宫商角徵羽
  var PENTATONIC = [147, 165, 196, 220, 262, 294, 330, 392, 440, 524, 588, 660, 784, 880];

  // Level music configs
  var LEVEL_MUSIC = {
    0: { bpm: 75,  bassVol: 0.08, droneVol: 0.04, melodyVol: 0.06, drumVol: 0.02, drumPattern: 'simple',  waveType: 'sine' },      // title
    1: { bpm: 90,  bassVol: 0.12, droneVol: 0.06, melodyVol: 0.08, drumVol: 0.04, drumPattern: 'simple',  waveType: 'triangle' },  // garden
    2: { bpm: 75,  bassVol: 0.10, droneVol: 0.05, melodyVol: 0.07, drumVol: 0.03, drumPattern: 'simple',  waveType: 'sine' },      // pool
    3: { bpm: 110, bassVol: 0.18, droneVol: 0.10, melodyVol: 0.06, drumVol: 0.10, drumPattern: 'double',  waveType: 'sawtooth' },  // furnace
    4: { bpm: 140, bassVol: 0.25, droneVol: 0.14, melodyVol: 0.10, drumVol: 0.14, drumPattern: 'heavy',   waveType: 'square' },    // throne
    5: { bpm: 100, bassVol: 0.14, droneVol: 0.08, melodyVol: 0.12, drumVol: 0.06, drumPattern: 'double',  waveType: 'triangle' }   // victory
  };

  // ── Core setup ─────────────────────────────────────────

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not available');
      return;
    }

    masterGain = ctx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(ctx.destination);

    musicGain = ctx.createGain();
    musicGain.gain.value = 1;
    musicGain.connect(masterGain);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.7;
    sfxGain.connect(masterGain);

    started = true;

    _ensureResumed();
  }

  function _ensureResumed() {
    if (!ctx || ctx.state === 'closed') return;
    if (ctx.state === 'suspended') {
      ctx.resume().then(function () {
        createBassDrone();
        createDrone();
      }).catch(function () {});
    } else if (ctx.state === 'running') {
      createBassDrone();
      createDrone();
    }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function createBassDrone() {
    if (bassOsc) return;
    bassOsc = ctx.createOscillator();
    bassGain = ctx.createGain();
    bassOsc.type = 'triangle';
    bassOsc.frequency.value = 73; // D2 — low rumble
    bassGain.gain.value = 0;
    bassOsc.connect(bassGain);
    bassGain.connect(musicGain);
    bassOsc.start();
    musicNodes.push(bassOsc, bassGain);
  }

  function createDrone() {
    if (droneOsc) return;
    droneOsc = ctx.createOscillator();
    droneGain = ctx.createGain();
    droneOsc.type = 'sine';
    droneOsc.frequency.value = 147; // D3
    droneGain.gain.value = 0;
    droneOsc.connect(droneGain);
    droneGain.connect(musicGain);
    droneOsc.start();
    musicNodes.push(droneOsc, droneGain);
  }

  // ── Level / state control ──────────────────────────────

  function setMusicLevel(level) {
    if (!started) return;
    if (level !== currentLevel && level !== targetLevel) {
      targetLevel = level;
      transitionProgress = 0;
    }
  }

  function setMuted(val) {
    muted = val;
    if (masterGain) {
      masterGain.gain.setTargetAtTime(val ? 0 : 0.35, ctx.currentTime, 0.1);
    }
  }

  function setLowHealth(val) {
    lowHealth = !!val;
  }

  // ── Helper synth functions ──────────────────────────────

  // Single chime: sine + overtone at freq*2.76
  function playChime(freq, duration, vol) {
    if (!ctx) return;
    var now = ctx.currentTime;

    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + duration);

    // Overtone for bell shimmer
    var over = ctx.createOscillator();
    over.type = 'sine';
    over.frequency.value = freq * 2.76;
    var overGain = ctx.createGain();
    overGain.gain.setValueAtTime(0, now);
    overGain.gain.linearRampToValueAtTime(vol * 0.35, now + 0.005);
    overGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);
    over.connect(overGain);
    overGain.connect(sfxGain);
    over.start(now);
    over.stop(now + duration * 0.7);
  }

  // Rising arpeggio: sequential sine notes
  function playRisingArp(notes, noteDuration, vol) {
    if (!ctx) return;
    var now = ctx.currentTime;

    for (var i = 0; i < notes.length; i++) {
      (function (idx) {
        var startTime = now + idx * noteDuration;
        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = notes[idx];
        var gain = ctx.createGain();
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration * 0.9);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(startTime);
        osc.stop(startTime + noteDuration);
      })(i);
    }
  }

  // Golden bell: tone sweep 200→60Hz + noise
  function playGoldenBell(duration, vol) {
    if (!ctx) return;
    var now = ctx.currentTime;

    var osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + duration);
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.setValueAtTime(vol, now + duration * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + duration);

    // Noise layer for shimmer
    playNoiseBurstAtTime(duration * 0.8, vol * 0.3, now + 0.02);
  }

  // Slow-motion lowpass sweep: noise through filter 2000→200Hz, 0.5s
  function playSlowMotionSweep() {
    if (!ctx) return;
    var now = ctx.currentTime;
    var duration = 0.5;
    var bufferSize = Math.floor(ctx.sampleRate * duration);
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      var t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * 0.5;
    }
    var source = ctx.createBufferSource();
    source.buffer = buffer;

    var lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(2000, now);
    lowpass.frequency.exponentialRampToValueAtTime(200, now + duration);
    lowpass.Q.value = 2;

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(sfxGain);
    source.start(now);
    source.stop(now + duration);
  }

  // Noise hit: noise buffer through bandpass frequency sweep
  function playNoiseHit(duration, freqHi, freqLo, vol) {
    if (!ctx) return;
    var now = ctx.currentTime;
    var bufferSize = Math.floor(ctx.sampleRate * duration);
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      var t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * (1 - t) * (1 - t);
    }

    var source = ctx.createBufferSource();
    source.buffer = buffer;

    var bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(freqHi, now);
    bandpass.frequency.exponentialRampToValueAtTime(Math.max(freqLo, 20), now + duration);
    bandpass.Q.value = 1;

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(sfxGain);
    source.start(now);
    source.stop(now + duration);
  }

  // Tone sweep: oscillator with frequency ramp
  function playToneSweep(freqStart, freqEnd, duration, waveType, vol) {
    if (!ctx) return;
    var now = ctx.currentTime;

    var osc = ctx.createOscillator();
    osc.type = waveType || 'sine';
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), now + duration);

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  // Noise burst: noise buffer with attack-decay envelope
  function playNoiseBurst(duration, vol) {
    if (!ctx) return;
    var now = ctx.currentTime;
    var bufferSize = Math.floor(ctx.sampleRate * duration);
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      var t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * (1 - t);
    }

    var source = ctx.createBufferSource();
    source.buffer = buffer;

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.5, now);
    gain.gain.setValueAtTime(vol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(gain);
    gain.connect(sfxGain);
    source.start(now);
    source.stop(now + duration);
  }

  // Wind sweep: noise through bandpass filter sweep
  function playWindSweep(duration, freqStart, freqEnd, vol) {
    if (!ctx) return;
    var now = ctx.currentTime;
    var bufferSize = Math.floor(ctx.sampleRate * duration);
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      var t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * 0.6;
    }

    var source = ctx.createBufferSource();
    source.buffer = buffer;

    var bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(freqStart, now);
    bandpass.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), now + duration);
    bandpass.Q.value = 2;

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(vol || 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(sfxGain);
    source.start(now);
    source.stop(now + duration);
  }

  // Tone sweep at specified time
  function playToneSweepAtTime(freqStart, freqEnd, duration, waveType, vol, startTime) {
    if (!ctx) return;
    var osc = ctx.createOscillator();
    osc.type = waveType || 'sine';
    osc.frequency.setValueAtTime(freqStart, startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), startTime + duration);

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // Noise burst at specified time
  function playNoiseBurstAtTime(duration, vol, startTime) {
    if (!ctx) return;
    var bufferSize = Math.floor(ctx.sampleRate * duration);
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      var t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * (1 - t);
    }

    var source = ctx.createBufferSource();
    source.buffer = buffer;

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.5, startTime);
    gain.gain.setValueAtTime(vol, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    source.connect(gain);
    gain.connect(sfxGain);
    source.start(startTime);
    source.stop(startTime + duration);
  }

  // ── SFX dispatch ────────────────────────────────────────

  function playSfx(name) {
    if (!started || muted || !ctx) return;
    resume();
    _ensureResumed();

    switch (name) {
      case 'peach-small':
        playChime(880, 0.3, 0.12);
        break;

      case 'peach-medium':
        playChime(1047, 0.4, 0.14);
        playRisingArp([880, 1047], 0.08, 0.08);
        break;

      case 'peach-large':
        playChime(1319, 0.5, 0.18);
        playSlowMotionSweep();
        break;

      case 'hurt':
        playNoiseHit(0.1, 200, 60, 0.3);
        break;

      case 'dash':
        playWindSweep(0.15, 1200, 300, 0.12);
        break;

      case 'level-complete':
        playGoldenBell(0.6, 0.25);
        playRisingArp([440, 554, 659, 784, 1047], 0.12, 0.15);
        break;

      case 'dew-collect':
        playChime(1175, 0.25, 0.1);
        break;

      case 'elixir-collect':
        playGoldenBell(0.4, 0.2);
        playChime(1568, 0.5, 0.15);
        break;

      case 'lightning':
        playNoiseBurst(0.4, 0.3);
        playToneSweep(100, 30, 0.4, 'square', 0.25);
        break;

      case 'fire-jet':
        playNoiseBurst(0.3, 0.25);
        playToneSweep(400, 100, 0.3, 'sawtooth', 0.2);
        break;

      case 'pressure-blast':
        playNoiseBurst(0.6, 0.4);
        playToneSweep(60, 20, 0.6, 'sawtooth', 0.35);
        break;

      case 'wind-gust':
        playWindSweep(0.3, 800, 150, 0.15);
        break;

      case 'victory':
        playVictory();
        break;

      case 'death':
        playDeath();
        break;

      case 'boss-appear':
        playBossAppear();
        break;

      case 'snare':
        playToneSweep(200, 60, 0.1, 'triangle', 0.15);
        playNoiseHit(0.08, 300, 100, 0.1);
        break;

      default:
        break;
    }
  }

  // ── Special music sequences ────────────────────────────

  // Boss appear: 3 giant bell tolls with sub-bass rumble at 0.8s intervals
  function playBossAppear() {
    if (!ctx) return;
    var now = ctx.currentTime;

    for (var i = 0; i < 3; i++) {
      (function (idx) {
        var t = now + idx * 0.8;

        // Giant bell — deep triangle sweep
        var bellOsc = ctx.createOscillator();
        bellOsc.type = 'triangle';
        bellOsc.frequency.setValueAtTime(120 - idx * 20, t);
        bellOsc.frequency.exponentialRampToValueAtTime(40, t + 0.8);
        var bellGain = ctx.createGain();
        bellGain.gain.setValueAtTime(0.35 - idx * 0.05, t);
        bellGain.gain.setValueAtTime(0.3 - idx * 0.05, t + 0.1);
        bellGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        bellOsc.connect(bellGain);
        bellGain.connect(sfxGain);
        bellOsc.start(t);
        bellOsc.stop(t + 0.8);

        // Sub-bass rumble
        var subOsc = ctx.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.value = 40;
        var subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.2, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        subOsc.connect(subGain);
        subGain.connect(sfxGain);
        subOsc.start(t);
        subOsc.stop(t + 0.6);

        // Noise crash
        playNoiseBurstAtTime(0.4, 0.2, t);
      })(i);
    }
  }

  // Victory: grand fanfare — 6-note ascending + sustained power chord + drum roll
  function playVictory() {
    if (!ctx) return;
    var now = ctx.currentTime;

    // Grand opening bell
    playGoldenBell(1.2, 0.35);
    playNoiseBurstAtTime(0.8, 0.25, now);

    // 6-note ascending fanfare D4→C6
    var fanfareNotes = [294, 370, 440, 554, 659, 784]; // D4 F#4 A4 C#5 E5 G5
    var fnDuration = 0.15;
    for (var i = 0; i < fanfareNotes.length; i++) {
      (function (idx) {
        var t = now + 0.3 + idx * fnDuration;
        var osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = fanfareNotes[idx];
        var gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + fnDuration * 0.8);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + fnDuration);

        // Bright overtone
        var over = ctx.createOscillator();
        over.type = 'square';
        over.frequency.value = fanfareNotes[idx] * 2;
        var overGain = ctx.createGain();
        overGain.gain.setValueAtTime(0, t);
        overGain.gain.linearRampToValueAtTime(0.08, t + 0.015);
        overGain.gain.exponentialRampToValueAtTime(0.001, t + fnDuration * 0.6);
        over.connect(overGain);
        overGain.connect(sfxGain);
        over.start(t);
        over.stop(t + fnDuration);
      })(i);
    }

    // Sustained D5 power chord
    var chordTime = now + 1.3;
    var chordNotes = [294, 440, 587, 784]; // D4 A4 D5 G5
    for (var c = 0; c < chordNotes.length; c++) {
      (function (idx) {
        var osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = chordNotes[idx];
        var gain = ctx.createGain();
        gain.gain.setValueAtTime(0, chordTime);
        gain.gain.linearRampToValueAtTime(0.12, chordTime + 0.03);
        gain.gain.setValueAtTime(0.1, chordTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 1.5);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(chordTime);
        osc.stop(chordTime + 1.5);
      })(c);
    }

    // Drum roll — rapid snare hits
    for (var d = 0; d < 16; d++) {
      (function (idx) {
        var t = now + 1.0 + idx * 0.06;
        var rollOsc = ctx.createOscillator();
        rollOsc.type = 'triangle';
        rollOsc.frequency.setValueAtTime(200 - idx * 5, t);
        rollOsc.frequency.exponentialRampToValueAtTime(60, t + 0.05);
        var rollGain = ctx.createGain();
        rollGain.gain.setValueAtTime(0.15 - idx * 0.008, t);
        rollGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        rollOsc.connect(rollGain);
        rollGain.connect(sfxGain);
        rollOsc.start(t);
        rollOsc.stop(t + 0.05);

        // Noise layer for snare
        playNoiseBurstAtTime(0.04, 0.1 - idx * 0.005, t);
      })(d);
    }

    // Final triumphant crash at the end
    playNoiseBurstAtTime(0.6, 0.35, now + 1.5);
    playToneSweepAtTime(80, 20, 1.0, 'triangle', 0.3, now + 1.5);
  }

  // Death: two-phase — tragic descending lament → defiant rising arpeggio → power chord
  function playDeath() {
    if (!ctx) return;
    var now = ctx.currentTime;

    // ═══════ Phase 1: Tragic D minor lament (0–4s) ═══════

    // Opening gong — weight of fate
    playToneSweepAtTime(60, 20, 1.5, 'triangle', 0.45, now);
    playNoiseBurstAtTime(1.2, 0.35, now);

    // Funeral war drums — slow, heavy
    for (var d = 0; d < 5; d++) {
      (function (idx) {
        var drumTime = now + 0.5 + idx * 0.75;
        var drumOsc = ctx.createOscillator();
        drumOsc.type = 'sine';
        drumOsc.frequency.setValueAtTime(65, drumTime);
        drumOsc.frequency.exponentialRampToValueAtTime(20, drumTime + 0.5);
        var drumGain = ctx.createGain();
        drumGain.gain.setValueAtTime(0.45, drumTime);
        drumGain.gain.exponentialRampToValueAtTime(0.001, drumTime + 0.5);
        drumOsc.connect(drumGain);
        drumGain.connect(sfxGain);
        drumOsc.start(drumTime);
        drumOsc.stop(drumTime + 0.5);
        playNoiseBurstAtTime(0.4, 0.25, drumTime);
      })(d);
    }

    // Descending D minor lament: D5→C5→Bb4→A4→F4→D4
    var lamentNotes = [587, 554, 466, 440, 349, 294];
    for (var ln = 0; ln < lamentNotes.length; ln++) {
      (function (idx) {
        var t = now + 0.8 + idx * 0.55;
        var dur = idx === lamentNotes.length - 1 ? 1.0 : 0.5;

        // Main voice — rich sawtooth
        var osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = lamentNotes[idx];
        var gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.04);
        gain.gain.setValueAtTime(0.25, t + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + dur);

        // Octave below for weight
        var lowOsc = ctx.createOscillator();
        lowOsc.type = 'triangle';
        lowOsc.frequency.value = lamentNotes[idx] / 2;
        var lowGain = ctx.createGain();
        lowGain.gain.setValueAtTime(0, t);
        lowGain.gain.linearRampToValueAtTime(0.15, t + 0.04);
        lowGain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.8);
        lowOsc.connect(lowGain);
        lowGain.connect(sfxGain);
        lowOsc.start(t);
        lowOsc.stop(t + dur);

        // Overtone shimmer
        var over = ctx.createOscillator();
        over.type = 'sine';
        over.frequency.value = lamentNotes[idx] * 1.5;
        var overGain = ctx.createGain();
        overGain.gain.setValueAtTime(0, t);
        overGain.gain.linearRampToValueAtTime(0.06, t + 0.05);
        overGain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.5);
        over.connect(overGain);
        overGain.connect(sfxGain);
        over.start(t);
        over.stop(t + dur);
      })(ln);
    }

    // ═══════ Phase 2: Defiant rising arpeggio (3.8–6s) ═══════

    // Rising power arpeggio — D4→F#4→A4→C#5→E5→G5
    var riseNotes = [294, 370, 440, 554, 659, 784];
    for (var rn = 0; rn < riseNotes.length; rn++) {
      (function (idx) {
        var t = now + 3.8 + idx * 0.18;

        // Aggressive main voice
        var rOsc = ctx.createOscillator();
        rOsc.type = 'sawtooth';
        rOsc.frequency.value = riseNotes[idx];
        var rGain = ctx.createGain();
        rGain.gain.setValueAtTime(0, t);
        rGain.gain.linearRampToValueAtTime(0.3, t + 0.02);
        rGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        rOsc.connect(rGain);
        rGain.connect(sfxGain);
        rOsc.start(t);
        rOsc.stop(t + 0.2);

        // Bright overtone
        var bOsc = ctx.createOscillator();
        bOsc.type = 'square';
        bOsc.frequency.value = riseNotes[idx] * 2;
        var bGain = ctx.createGain();
        bGain.gain.setValueAtTime(0, t);
        bGain.gain.linearRampToValueAtTime(0.1, t + 0.02);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        bOsc.connect(bGain);
        bGain.connect(sfxGain);
        bOsc.start(t);
        bOsc.stop(t + 0.15);
      })(rn);
    }

    // Battle drums — fast, furious
    for (var dd = 0; dd < 10; dd++) {
      (function (idx) {
        var t = now + 4.0 + idx * 0.2;
        var dOsc = ctx.createOscillator();
        dOsc.type = 'triangle';
        dOsc.frequency.setValueAtTime(90, t);
        dOsc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
        var dGain = ctx.createGain();
        dGain.gain.setValueAtTime(0.3, t);
        dGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        dOsc.connect(dGain);
        dGain.connect(sfxGain);
        dOsc.start(t);
        dOsc.stop(t + 0.2);
        playNoiseBurstAtTime(0.1, 0.15, t);
      })(dd);
    }

    // CLIMAX: Final power chord D5
    var finalTime = now + 5.0;
    var powerChord = [294, 440, 587, 784]; // D4 A4 D5 G5
    for (var f = 0; f < powerChord.length; f++) {
      (function (idx) {
        var fOsc = ctx.createOscillator();
        fOsc.type = 'sawtooth';
        fOsc.frequency.value = powerChord[idx];
        var fGain = ctx.createGain();
        fGain.gain.setValueAtTime(0, finalTime);
        fGain.gain.linearRampToValueAtTime(idx === 1 ? 0.35 : 0.22, finalTime + 0.03);
        fGain.gain.setValueAtTime(idx === 1 ? 0.3 : 0.18, finalTime + 0.3);
        fGain.gain.exponentialRampToValueAtTime(0.001, finalTime + 1.2);
        fOsc.connect(fGain);
        fGain.connect(sfxGain);
        fOsc.start(finalTime);
        fOsc.stop(finalTime + 1.2);
      })(f);
    }

    // Final triumphant gong
    playToneSweepAtTime(80, 20, 1.5, 'triangle', 0.35, finalTime);
    playNoiseBurstAtTime(1.0, 0.25, finalTime);
  }

  // ── Background Music Update ────────────────────────────

  function update(dt) {
    if (!started || muted || !ctx) return;
    resume();
    _ensureResumed();

    // Transition between levels
    if (transitionProgress < 1) {
      transitionProgress = Math.min(1, transitionProgress + dt / 2); // 2-second crossfade
      if (transitionProgress >= 1) {
        currentLevel = targetLevel;
      }
    }

    var cfg = LEVEL_MUSIC[currentLevel];
    var tgt = LEVEL_MUSIC[targetLevel];
    var t = transitionProgress;

    // Interpolate volumes
    var bVol = cfg.bassVol + (tgt.bassVol - cfg.bassVol) * t;
    var dVol = cfg.droneVol + (tgt.droneVol - cfg.droneVol) * t;
    var mVol = cfg.melodyVol + (tgt.melodyVol - cfg.melodyVol) * t;
    var drVol = cfg.drumVol + (tgt.drumVol - cfg.drumVol) * t;

    // Apply low-health boost
    if (lowHealth) {
      bVol = Math.min(bVol * 2.0, 0.35);
      dVol = Math.min(dVol * 1.8, 0.25);
    }

    if (bassGain) bassGain.gain.setTargetAtTime(bVol, ctx.currentTime, 0.1);
    if (droneGain) droneGain.gain.setTargetAtTime(dVol, ctx.currentTime, 0.1);

    // Melody — play pentatonic notes at BPM
    var bpm = cfg.bpm + (tgt.bpm - cfg.bpm) * t;
    var beatInterval = 60 / bpm;
    melodyTimer += dt;

    if (melodyTimer >= beatInterval) {
      melodyTimer -= beatInterval;
      playMelodyNote(mVol, cfg.waveType);
    }

    // Drums
    drumTimer += dt;
    var drumInterval = getDrumInterval(cfg, tgt, t);
    if (drumTimer >= drumInterval) {
      drumTimer -= drumInterval;
      playDrumHit(drVol, cfg.drumPattern);
    }
  }

  function playMelodyNote(vol, waveType) {
    if (!ctx) return;
    var note = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
    var osc = ctx.createOscillator();
    osc.type = waveType || 'sine';
    osc.frequency.value = note;

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  function getDrumInterval(cfg, tgt, t) {
    var pattern = cfg.drumPattern;
    var bpm = cfg.bpm + (tgt.bpm - cfg.bpm) * t;
    var base = 60 / bpm;
    if (pattern === 'simple') return base;
    return base / 2; // 'double' and 'heavy' both play eighth notes
  }

  function playDrumHit(vol, drumPattern) {
    if (!ctx) return;
    var hitVol = drumPattern === 'heavy' ? vol * 1.5 : vol;
    var duration = 0.05;
    var bufferSize = Math.floor(ctx.sampleRate * duration);
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    var bp = ctx.createBiquadFilter();
    bp.type = 'lowpass';
    bp.frequency.value = 200;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(hitVol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(bp);
    bp.connect(gain);
    gain.connect(musicGain);
    source.start(ctx.currentTime);
    source.stop(ctx.currentTime + duration + 0.01);
  }

  // ── Mute / unmute ──────────────────────────────────────

  function muteMusic() {
    if (!ctx) return;
    // Fade out background music quickly
    if (musicGain) musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    // BOOST everything for epic death/victory music
    if (sfxGain) sfxGain.gain.setTargetAtTime(1.5, ctx.currentTime, 0.1);
    if (masterGain) masterGain.gain.setTargetAtTime(0.7, ctx.currentTime, 0.1);
  }

  function unmuteMusic() {
    if (!ctx) return;
    // Restore normal levels
    if (masterGain) masterGain.gain.setTargetAtTime(0.35, ctx.currentTime, 0.3);
    if (sfxGain) sfxGain.gain.setTargetAtTime(0.7, ctx.currentTime, 0.3);
    if (musicGain) musicGain.gain.setTargetAtTime(1, ctx.currentTime, 0.3);
  }

  // ── Stop / cleanup ─────────────────────────────────────

  function stop() {
    started = false;
    lowHealth = false;
    if (masterGain) {
      masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    }
    setTimeout(function () {
      if (ctx && ctx.state !== 'closed') {
        ctx.close();
        ctx = null;
        bassOsc = null;
        droneOsc = null;
        musicNodes = [];
      }
    }, 500);
  }

  // ── Public API ─────────────────────────────────────────

  return {
    init: init,
    setMusicLevel: setMusicLevel,
    playSfx: playSfx,
    update: update,
    setMuted: setMuted,
    start: function () { if (!ctx) init(); started = true; },
    stop: stop,
    resume: resume,
    isStarted: function () { return started; },
    muteMusic: muteMusic,
    unmuteMusic: unmuteMusic,
    setLowHealth: setLowHealth
  };
})();
