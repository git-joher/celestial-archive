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
    if (!started || muted || !ctx) return;
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
    bandpass.frequency.exponentialRampToValueAtTime(Math.max(freqLo, 20), ctx.currentTime + duration);

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

  // Death: tragic + defiant two-phase music
  function playDeath() {
    var now = ctx.currentTime;

    // ═══════ Phase 1: 悲壮 (Tragic & Heroic) 0–3s ═══════

    // Deep war drum — three heavy strikes
    for (var d = 0; d < 3; d++) {
      var drumTime = now + d * 0.9;
      var drumOsc = ctx.createOscillator();
      drumOsc.type = 'sine';
      drumOsc.frequency.setValueAtTime(80, drumTime);
      drumOsc.frequency.exponentialRampToValueAtTime(30, drumTime + 0.4);
      var drumGain = ctx.createGain();
      drumGain.gain.setValueAtTime(0.35, drumTime);
      drumGain.gain.exponentialRampToValueAtTime(0.001, drumTime + 0.5);
      drumOsc.connect(drumGain);
      drumGain.connect(sfxGain);
      drumOsc.start(drumTime);
      drumOsc.stop(drumTime + 0.5);

      // Drum rumble layer
      playNoiseHitAt(0.35, 80, 25, 0.2, drumTime);
    }

    // Minor pentatonic lament — descending melody (D minor: D C A F D)
    var lamentNotes = [587, 523, 440, 349, 294]; // D5 C5 A4 F4 D4
    for (var ln = 0; ln < lamentNotes.length; ln++) {
      (function(idx) {
        var lamentTime = now + 0.3 + idx * 0.55;
        var lamentOsc = ctx.createOscillator();
        lamentOsc.type = 'sine';
        lamentOsc.frequency.value = lamentNotes[idx];
        var lamentGain = ctx.createGain();
        lamentGain.gain.setValueAtTime(0, lamentTime);
        lamentGain.gain.linearRampToValueAtTime(0.1, lamentTime + 0.05);
        lamentGain.gain.exponentialRampToValueAtTime(0.001, lamentTime + 0.5);
        lamentOsc.connect(lamentGain);
        lamentGain.connect(sfxGain);
        lamentOsc.start(lamentTime);
        lamentOsc.stop(lamentTime + 0.5);

        // Low string drone beneath each note
        var lowOsc = ctx.createOscillator();
        lowOsc.type = 'triangle';
        lowOsc.frequency.value = lamentNotes[idx] / 2;
        var lowGain = ctx.createGain();
        lowGain.gain.setValueAtTime(0, lamentTime);
        lowGain.gain.linearRampToValueAtTime(0.06, lamentTime + 0.05);
        lowGain.gain.exponentialRampToValueAtTime(0.001, lamentTime + 0.45);
        lowOsc.connect(lowGain);
        lowGain.connect(sfxGain);
        lowOsc.start(lamentTime);
        lowOsc.stop(lamentTime + 0.5);
      })(ln);
    }

    // Wind / distant horn — tragic atmosphere
    playNoiseHitAt(2.5, 400, 150, 0.12, now + 0.2);

    // Gong crash at the climax of tragedy
    playToneSweepAt(150, 40, 0.8, 'triangle', 0.18, now + 2.5);

    // ═══════ Phase 2: 不服输 (Defiant) 2.8–5s ═══════

    // Rising arpeggio — "I will rise again" (Dm → power: D F A D)
    var riseNotes = [294, 349, 440, 587]; // D4 F4 A4 D5 — ascending
    for (var rn = 0; rn < riseNotes.length; rn++) {
      (function(idx) {
        var riseTime = now + 2.8 + idx * 0.2;
        var riseOsc = ctx.createOscillator();
        riseOsc.type = 'sawtooth';
        riseOsc.frequency.value = riseNotes[idx];
        var riseGain = ctx.createGain();
        riseGain.gain.setValueAtTime(0, riseTime);
        riseGain.gain.linearRampToValueAtTime(0.12, riseTime + 0.02);
        riseGain.gain.exponentialRampToValueAtTime(0.001, riseTime + 0.18);

        // Bright overtone for defiance
        var brightOsc = ctx.createOscillator();
        brightOsc.type = 'sine';
        brightOsc.frequency.value = riseNotes[idx] * 2;
        var brightGain = ctx.createGain();
        brightGain.gain.setValueAtTime(0, riseTime);
        brightGain.gain.linearRampToValueAtTime(0.05, riseTime + 0.02);
        brightGain.gain.exponentialRampToValueAtTime(0.001, riseTime + 0.15);

        riseOsc.connect(riseGain);
        brightOsc.connect(brightGain);
        riseGain.connect(sfxGain);
        brightGain.connect(sfxGain);
        riseOsc.start(riseTime);
        brightOsc.start(riseTime);
        riseOsc.stop(riseTime + 0.2);
        brightOsc.stop(riseTime + 0.2);
      })(rn);
    }

    // Defiant war drums — faster, stronger
    for (var dd = 0; dd < 5; dd++) {
      var dTime = now + 3.0 + dd * 0.35;
      var dOsc = ctx.createOscillator();
      dOsc.type = 'triangle';
      dOsc.frequency.setValueAtTime(100, dTime);
      dOsc.frequency.exponentialRampToValueAtTime(40, dTime + 0.2);
      var dGain = ctx.createGain();
      dGain.gain.setValueAtTime(0.2, dTime);
      dGain.gain.exponentialRampToValueAtTime(0.001, dTime + 0.25);
      dOsc.connect(dGain);
      dGain.connect(sfxGain);
      dOsc.start(dTime);
      dOsc.stop(dTime + 0.25);
      playNoiseHitAt(0.15, 60, 20, 0.12, dTime);
    }

    // Final defiant chord — "I WILL fight again!" (D power chord: D A D)
    var finalTime = now + 4.2;
    [294, 440, 587].forEach(function(freq) {
      var fOsc = ctx.createOscillator();
      fOsc.type = freq === 440 ? 'sawtooth' : 'sine';
      fOsc.frequency.value = freq;
      var fGain = ctx.createGain();
      fGain.gain.setValueAtTime(0, finalTime);
      fGain.gain.linearRampToValueAtTime(freq === 440 ? 0.14 : 0.08, finalTime + 0.03);
      fGain.gain.exponentialRampToValueAtTime(0.001, finalTime + 0.8);
      fOsc.connect(fGain);
      fGain.connect(sfxGain);
      fOsc.start(finalTime);
      fOsc.stop(finalTime + 0.8);
    });

    // Final gong
    playToneSweepAt(100, 25, 1.0, 'triangle', 0.15, finalTime);
  }

  // Helper: noise hit at specific time
  function playNoiseHitAt(duration, freqHi, freqLo, vol, startTime) {
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
    bandpass.frequency.setValueAtTime(freqHi, startTime);
    bandpass.frequency.exponentialRampToValueAtTime(Math.max(freqLo, 20), startTime + duration);
    bandpass.Q.value = 1;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    source.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(sfxGain);
    source.start(startTime);
    source.stop(startTime + duration);
  }

  // Helper: tone sweep at specific time
  function playToneSweepAt(freqStart, freqEnd, duration, waveType, vol, startTime) {
    var osc = ctx.createOscillator();
    osc.type = waveType;
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
    start: function () { if (!ctx) init(); started = true; },
    stop: stop,
    resume: resume,
    isStarted: function () { return started; }
  };
})();
