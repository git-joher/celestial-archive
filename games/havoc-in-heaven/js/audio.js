/**
 * 大闹天宫 — Audio Engine
 * Web Audio API synthesizer: 3-tier BGM + SFX, zero external files
 */
var AudioEngine = (function () {
  'use strict';

  var ctx = null;
  var masterGain = null;
  var musicGain = null;
  var sfxGain = null;
  var muted = false;
  var started = false;
  var currentIntensity = 'calm'; // 'calm' | 'tense' | 'boss'
  var targetIntensity = 'calm';
  var transitionProgress = 1; // 0→1, 1 = fully at target

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

  // Intensity configs
  var CONFIG = {
    calm:  { bpm: 80,  bassVol: 0.12, droneVol: 0.06, melodyVol: 0.08, drumVol: 0.04, drumPattern: 'simple' },
    tense: { bpm: 120, bassVol: 0.18, droneVol: 0.10, melodyVol: 0.12, drumVol: 0.08, drumPattern: 'double' },
    boss:  { bpm: 160, bassVol: 0.25, droneVol: 0.14, melodyVol: 0.16, drumVol: 0.14, drumPattern: 'heavy' }
  };

  function init() {
    if (ctx) return; // already initialized
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

    // Set up persistent bass drone
    createBassDrone();
    createDrone();

    started = true;
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

  function resume() {
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function setIntensity(level) {
    if (!started) return;
    if (level !== currentIntensity && level !== targetIntensity) {
      targetIntensity = level;
      transitionProgress = 0;
    }
  }

  function setMuted(val) {
    muted = val;
    if (masterGain) {
      masterGain.gain.setTargetAtTime(val ? 0 : 0.35, ctx.currentTime, 0.1);
    }
  }

  // ── SFX ────────────────────────────────────────────

  function playSfx(name) {
    if (!started || muted) return;
    resume();

    switch (name) {
      case 'attack':
        playNoiseHit(0.08, 800, 200, 0.25);
        break;
      case 'hurt':
        playNoiseHit(0.12, 200, 60, 0.3);
        break;
      case 'kill_metal':
        playToneSweep(600, 200, 0.1, 'square', 0.15);
        break;
      case 'kill_wood':
        playNoiseHit(0.06, 400, 300, 0.12);
        break;
      case 'kill_water':
        playToneSweep(800, 100, 0.15, 'sine', 0.12);
        playNoiseHit(0.04, 1000, 200, 0.08);
        break;
      case 'kill_fire':
        playNoiseBurst(0.2, 0.18);
        break;
      case 'kill_earth':
        playNoiseHit(0.15, 100, 40, 0.25);
        break;
      case 'levelup':
        playLevelUp();
        break;
      case 'death':
        playDeath();
        break;
      case 'jump':
        playWindSweep(0.1);
        break;
      case 'fiery':
        playNoiseBurst(0.3, 0.25);
        playToneSweep(300, 100, 0.2, 'sawtooth', 0.15);
        break;
      case 'stun':
        playToneSweep(1000, 200, 0.3, 'sine', 0.2);
        playNoiseHit(0.05, 2000, 500, 0.1);
        break;
      case 'shockwave':
        playNoiseBurst(0.5, 0.4);
        playToneSweep(100, 40, 0.4, 'sawtooth', 0.35);
        break;
      default:
        break;
    }
  }

  // Short noise hit (attack, hurt, kills)
  function playNoiseHit(duration, freqHi, freqLo, vol) {
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
    bandpass.frequency.value = freqHi;
    bandpass.Q.value = 1;

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    // Frequency sweep
    bandpass.frequency.setValueAtTime(freqHi, ctx.currentTime);
    bandpass.frequency.exponentialRampToValueAtTime(freqLo, ctx.currentTime + duration);

    source.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(sfxGain);
    source.start(ctx.currentTime);
    source.stop(ctx.currentTime + duration);
  }

  // Tone sweep (kills, stun)
  function playToneSweep(freqStart, freqEnd, duration, waveType, vol) {
    var osc = ctx.createOscillator();
    osc.type = waveType;
    osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), ctx.currentTime + duration);

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  // Noise burst (fiery eyes, shockwave)
  function playNoiseBurst(duration, vol) {
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
    gain.gain.setValueAtTime(vol * 0.5, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(gain);
    gain.connect(sfxGain);
    source.start(ctx.currentTime);
    source.stop(ctx.currentTime + duration);
  }

  // Wind sweep for jump
  function playWindSweep(duration) {
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
    bandpass.frequency.setValueAtTime(1200, ctx.currentTime);
    bandpass.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + duration);
    bandpass.Q.value = 2;

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(sfxGain);
    source.start(ctx.currentTime);
    source.stop(ctx.currentTime + duration);
  }

  // Level up: ascending chime + arpeggio
  function playLevelUp() {
    var notes = [294, 370, 440, 587, 784]; // D4 F#4 A4 D5 G5
    var noteDuration = 0.1;
    var startTime = ctx.currentTime;

    for (var i = 0; i < notes.length; i++) {
      (function (idx) {
        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = notes[idx];

        var gain = ctx.createGain();
        gain.gain.setValueAtTime(0, startTime + idx * noteDuration);
        gain.gain.linearRampToValueAtTime(0.18, startTime + idx * noteDuration + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * noteDuration + noteDuration);

        // Add bell-like overtone
        var overtone = ctx.createOscillator();
        overtone.type = 'sine';
        overtone.frequency.value = notes[idx] * 2.76;
        var overtoneGain = ctx.createGain();
        overtoneGain.gain.setValueAtTime(0, startTime + idx * noteDuration);
        overtoneGain.gain.linearRampToValueAtTime(0.06, startTime + idx * noteDuration + 0.01);
        overtoneGain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * noteDuration + noteDuration * 0.8);

        osc.connect(gain);
        overtone.connect(overtoneGain);
        gain.connect(sfxGain);
        overtoneGain.connect(sfxGain);
        osc.start(startTime + idx * noteDuration);
        overtone.start(startTime + idx * noteDuration);
        osc.stop(startTime + idx * noteDuration + noteDuration);
        overtone.stop(startTime + idx * noteDuration + noteDuration * 0.8);
      })(i);
    }

    // Golden gong hit
    playToneSweep(200, 60, 0.6, 'triangle', 0.2);
  }

  // Death: heavy drum hit + descending tone
  function playDeath() {
    var now = ctx.currentTime;
    // Heavy thump
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.5);

    // Rumble
    playNoiseHit(0.4, 100, 30, 0.25);

    // Descending tone — "fate"
    setTimeout(function () {
      if (!ctx || ctx.state === 'closed') return;
      var osc2 = ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.8);
      var gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.1, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc2.connect(gain2);
      gain2.connect(sfxGain);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.8);
    }, 300);
  }

  // ── Background Music Update (called every frame) ──────

  function update(dt) {
    if (!started || muted) return;
    resume();

    // Transition between intensities
    if (transitionProgress < 1) {
      transitionProgress = Math.min(1, transitionProgress + dt / 2); // 2-second crossfade
      if (transitionProgress >= 1) {
        currentIntensity = targetIntensity;
      }
    }

    var cfg = CONFIG[currentIntensity];
    var tgt = CONFIG[targetIntensity];
    var t = transitionProgress;

    // Interpolate volumes
    var bVol = cfg.bassVol + (tgt.bassVol - cfg.bassVol) * t;
    var dVol = cfg.droneVol + (tgt.droneVol - cfg.droneVol) * t;
    var mVol = cfg.melodyVol + (tgt.melodyVol - cfg.melodyVol) * t;

    if (bassGain) bassGain.gain.setTargetAtTime(bVol, ctx.currentTime, 0.1);
    if (droneGain) droneGain.gain.setTargetAtTime(dVol, ctx.currentTime, 0.1);

    // Melody — play pentatonic notes at BPM
    var bpm = cfg.bpm + (tgt.bpm - cfg.bpm) * t;
    var beatInterval = 60 / bpm;
    melodyTimer += dt;

    if (melodyTimer >= beatInterval) {
      melodyTimer -= beatInterval;
      playMelodyNote(mVol);
    }

    // Drums
    drumTimer += dt;
    var drumInterval = getDrumInterval(cfg, tgt, t);
    if (drumTimer >= drumInterval) {
      drumTimer -= drumInterval;
      playDrumHit(cfg, tgt, t);
    }
  }

  function playMelodyNote(vol) {
    var note = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
    var osc = ctx.createOscillator();
    osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
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
    if (pattern === 'simple') return 60 / bpm;        // quarter notes
    if (pattern === 'double') return 60 / bpm / 2;    // eighth notes
    return 60 / bpm / 2;                               // eighth notes, louder
  }

  function playDrumHit(cfg, tgt, t) {
    var vol = 0.04;
    if (cfg.drumPattern === 'heavy') vol = 0.1;
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
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(bp);
    bp.connect(gain);
    gain.connect(musicGain);
    source.start(ctx.currentTime);
    source.stop(ctx.currentTime + duration + 0.01);
  }

  function stop() {
    started = false;
    // Fade out
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

  // ── Public API ───────────────────────────────────────

  return {
    init: init,
    setIntensity: setIntensity,
    playSfx: playSfx,
    update: update,
    setMuted: setMuted,
    start: function () { started = true; },
    stop: stop,
    resume: resume,
    isStarted: function () { return started; }
  };
})();
