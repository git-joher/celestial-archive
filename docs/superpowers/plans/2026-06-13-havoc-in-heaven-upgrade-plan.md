# Havoc in Heaven — 全面升级实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 对大闹天宫游戏进行视觉和音频全面升级 — 玩家头像、敌人五行造型、跳跃系统、Web Audio 音效引擎、升级庆祝、死亡画面

**Architecture:** 新增 `audio.js` 作为独立音效引擎（Web Audio API 合成全部音频），修改 `game.js` 的渲染系统（Canvas 2D 绘制天兵天将 + 五行元素 + 玩家头像图片），修改 `index.html` 和 `game.css` 增强死亡/庆祝 overlay

**Tech Stack:** Vanilla JS + Canvas 2D + Web Audio API + CSS，零依赖

---

### Task 1: 创建 Audio Engine (`js/audio.js`)

**Files:**
- Create: `games/havoc-in-heaven/js/audio.js`

- [ ] **Step 1: 编写 audio.js — 完整的 Web Audio API 音效引擎**

```js
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

    var bandpass = ctx.createBypassFilter ? ctx.createBypassFilter() : ctx.createBiquadFilter();
    try { bandpass = ctx.createBiquadFilter(); } catch(e) {}
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
```

- [ ] **Step 2: Commit**

```bash
git add games/havoc-in-heaven/js/audio.js
git commit -m "feat: add Web Audio API sound engine for Havoc in Heaven"
```

---

### Task 2: 更新 index.html — DOM + 引入 audio.js

**Files:**
- Modify: `games/havoc-in-heaven/index.html`

- [ ] **Step 1: 添加死亡画面的图片和文字元素**

在 `#death-overlay` 内，`death-stats` 之前插入图片和标题：

```html
<!-- Death Screen -->
<div id="death-overlay">
  <img id="death-img" src="" alt="Sun Wukong" class="death-img" />
  <div class="death-title-main" id="death-title-main">天命不公！</div>
  <div class="death-title-sub">俺老孙不服！再战三百回合！</div>
  <div class="death-stats">
    ...existing stats...
  </div>
  <button class="btn-start" id="btn-restart" style="font-size:1rem;padding:14px 40px;">再战天宫</button>
</div>
```

完整修改后的 HTML（只替换 death-overlay 部分，从 `<!-- Death Screen -->` 到 `</div>` 结束）：

```html
<!-- Death Screen -->
<div id="death-overlay">
  <img id="death-img" src="" alt="Sun Wukong Angry" class="death-img" />
  <div class="death-title-main">天命不公！</div>
  <div class="death-title-sub">俺老孙不服！再战三百回合！</div>
  <div class="death-stats">
    <div class="death-stat"><div class="death-stat-val" id="death-time">0:00</div><div class="death-stat-label">Survival Time</div></div>
    <div class="death-stat"><div class="death-stat-val" id="death-wave">1</div><div class="death-stat-label">Highest Wave</div></div>
    <div class="death-stat"><div class="death-stat-val" id="death-kills">0</div><div class="death-stat-label">Kills</div></div>
    <div class="death-stat"><div class="death-stat-val" id="death-score">0</div><div class="death-stat-label">Score</div></div>
  </div>
  <button class="btn-start" id="btn-restart" style="font-size:1rem;padding:14px 40px;">再战天宫</button>
</div>
```

- [ ] **Step 2: 添加升级庆祝 DOM**

在 `#upgrade-overlay` 前插入：

```html
<!-- Level-Up Celebration -->
<div id="celebrate-overlay">
  <img id="celebrate-img" src="" alt="Sun Wukong Triumphant" class="celebrate-img" />
  <div class="celebrate-text">神通大成！</div>
  <div class="celebrate-sparkles"></div>
</div>
```

- [ ] **Step 3: 更新 script 加载顺序，引入 audio.js**

```html
<script src="../../js/deities.js?v=2"></script>
<script src="../../js/main.js?v=2"></script>
<script src="../../js/config.js?v=2"></script>
<script src="js/audio.js?v=2"></script>
<script src="js/game.js?v=2"></script>
```

- [ ] **Step 4: Commit**

```bash
git add games/havoc-in-heaven/index.html
git commit -m "feat: add death/celebration DOM and audio.js to Havoc in Heaven"
```

---

### Task 3: 更新 game.css — 新 overlay 样式

**Files:**
- Modify: `games/havoc-in-heaven/css/game.css`

- [ ] **Step 1: 在文件末尾追加新样式**

```css
/* ---- Death Screen Enhanced ---- */
.death-img {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center 20%;
  border: 3px solid rgba(196,77,52,0.6);
  box-shadow: 0 0 40px rgba(196,77,52,0.3), 0 0 80px rgba(196,77,52,0.1);
  margin-bottom: 16px;
  animation: death-img-pulse 2s ease-in-out infinite;
}
@keyframes death-img-pulse {
  0%, 100% { box-shadow: 0 0 40px rgba(196,77,52,0.3), 0 0 80px rgba(196,77,52,0.1); }
  50% { box-shadow: 0 0 60px rgba(196,77,52,0.5), 0 0 120px rgba(196,77,52,0.2); }
}
.death-title-main {
  font-family: var(--font-chinese-display);
  font-size: 2.6rem;
  color: #c44d34;
  text-shadow: 0 0 30px rgba(196,77,52,0.4);
  margin-bottom: 6px;
  animation: death-title-shake 0.6s ease-out;
}
@keyframes death-title-shake {
  0% { transform: translateX(-20px); opacity: 0; }
  30% { transform: translateX(12px); }
  60% { transform: translateX(-6px); }
  100% { transform: translateX(0); opacity: 1; }
}
.death-title-sub {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--accent-gold);
  text-shadow: 0 0 12px rgba(184,160,110,0.3);
  letter-spacing: 2px;
  margin-bottom: 24px;
}

/* ---- Level-Up Celebration ---- */
#celebrate-overlay {
  position: fixed;
  inset: 0;
  z-index: 55;
  background: rgba(10,6,4,0.8);
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
#celebrate-overlay.active { display: flex; }
.celebrate-img {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center 20%;
  border: 4px solid rgba(184,160,110,0.8);
  box-shadow: 0 0 60px rgba(184,160,110,0.5), 0 0 120px rgba(184,160,110,0.2);
  animation: celebrate-bounce 0.6s ease-out;
}
@keyframes celebrate-bounce {
  0% { transform: scale(0.3); opacity: 0; }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}
.celebrate-text {
  font-family: var(--font-chinese-display);
  font-size: 2.4rem;
  color: var(--accent-gold);
  text-shadow: 0 0 40px rgba(184,160,110,0.6), 0 0 80px rgba(184,160,110,0.3);
  margin-top: 20px;
  animation: celebrate-text-glow 0.8s ease-in-out infinite alternate;
}
@keyframes celebrate-text-glow {
  0% { text-shadow: 0 0 40px rgba(184,160,110,0.6); }
  100% { text-shadow: 0 0 80px rgba(255,215,0,0.9), 0 0 120px rgba(184,160,110,0.5); }
}
.celebrate-sparkles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

/* ---- Jump Cooldown Indicator ---- */
.jump-indicator {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 20;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(184,160,110,0.4);
  background: rgba(10,6,4,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: var(--accent-gold);
  pointer-events: none;
  transition: border-color 0.3s;
}
.jump-indicator.ready { border-color: rgba(184,160,110,0.8); box-shadow: 0 0 12px rgba(184,160,110,0.3); }
.jump-indicator .jump-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(184,160,110,0.2);
  border-radius: 0 0 50% 50%;
  transition: height 0.1s linear;
}

/* ---- Pause hint update ---- */
.pause-hint {
  bottom: 16px;
  left: 50%;
  z-index: 15;
  font-size: 0.65rem;
  color: rgba(200,180,140,0.25);
  letter-spacing: 2px;
  pointer-events: none;
}
```

- [ ] **Step 2: Commit**

```bash
git add games/havoc-in-heaven/css/game.css
git commit -m "feat: add enhanced death/celebration/jump styles for Havoc in Heaven"
```

---

### Task 4: game.js — 图片预加载 + 玩家头像渲染

**Files:**
- Modify: `games/havoc-in-heaven/js/game.js`

- [ ] **Step 1: 在 game.js 顶部 IIFE 开头，Canvas Setup 之前，添加图片预加载**

```js
/* ============================================================
   Image Preloading
   ============================================================ */
var IMG = {};
function preloadImages() {
  var images = {
    playerHead: '../../images/sun-wukong/sun-wukong-ice.jpg',
    celebrate: '../../images/sun-wukong/sun-wukong-hero3.jpg',
    death: '../../images/sun-wukong/sun-wukong-hero2.jpg',
    fieryEyes: '../../images/sun-wukong/fiery-eyes.jpg'
  };
  var count = 0;
  var total = Object.keys(images).length;
  for (var key in images) {
    IMG[key] = new Image();
    IMG[key].onload = function () {
      count++;
    };
    IMG[key].onerror = function () {
      count++; // proceed even if image fails
    };
    IMG[key].src = images[key];
  }
}
preloadImages();
```

- [ ] **Step 2: 替换玩家渲染（render 函数中 Player 部分）**

找到 `render()` 函数中绘制玩家的代码块（约 907-935 行），替换为：

```js
// Player
var px = player.x, py = player.y;

// Glow behind player
var glowGrad = ctx.createRadialGradient(px, py, 8, px, py, 34);
glowGrad.addColorStop(0, 'rgba(184,160,110,0.6)');
glowGrad.addColorStop(1, 'rgba(184,160,110,0)');
ctx.fillStyle = glowGrad;
ctx.beginPath();
ctx.arc(px, py, 34, 0, Math.PI * 2);
ctx.fill();

// Player head image (circular clip)
ctx.save();
ctx.beginPath();
ctx.arc(px, py, 16, 0, Math.PI * 2);
ctx.clip();

// Rotate slightly toward movement direction
var ix = getInputX();
var iy = getInputY();
var moveAngle = 0;
if (ix !== 0 || iy !== 0) {
  moveAngle = Math.atan2(iy, ix) * 0.25; // ±15° max rotation
}
ctx.translate(px, py);
ctx.rotate(moveAngle);
if (IMG.playerHead && IMG.playerHead.complete && IMG.playerHead.naturalWidth > 0) {
  ctx.drawImage(IMG.playerHead, -16, -16, 32, 32);
} else {
  // Fallback: gold circle
  ctx.fillStyle = '#d4b878';
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
}
ctx.restore();

// Golden ring border
ctx.strokeStyle = 'rgba(184,160,110,0.8)';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.arc(px, py, 16, 0, Math.PI * 2);
ctx.stroke();

// Damage flash (white overlay when recently hit)
if (player._damageFlash > 0) {
  ctx.fillStyle = 'rgba(255,255,255,' + (player._damageFlash / 0.2 * 0.5) + ')';
  ctx.beginPath();
  ctx.arc(px, py, 16, 0, Math.PI * 2);
  ctx.fill();
  player._damageFlash -= 0.016;
}
```

- [ ] **Step 3: 在 damagePlayer 函数中添加伤害闪烁状态**

找到 `damagePlayer` 函数（约 562 行），在 `player.hp -= actualDmg;` 后面添加：

```js
player._damageFlash = 0.2;
```

- [ ] **Step 4: 在 initState 中初始化 _damageFlash**

找到 `initState` 函数中的 player 对象（约 165 行），添加字段：

```js
_damageFlash: 0
```

- [ ] **Step 5: Commit**

```bash
git add games/havoc-in-heaven/js/game.js
git commit -m "feat: replace player circle with Sun Wukong head image"
```

---

### Task 5: game.js — 敌人五行元素视觉重绘

**Files:**
- Modify: `games/havoc-in-heaven/js/game.js`

- [ ] **Step 1: 更新敌人类型配置，添加 element 字段**

找到 `getWaveConfig` 函数（约 276 行），替换其中返回的 configs：

```js
function getWaveConfig(w) {
  var configs = {
    // Wave 1-4 — 金（Metal）: square shape, damage resist
    soldier: { hp: 20, speed: 80, damage: 10, radius: 10, color: '#d4b878', element: 'metal', name: '天兵', isRanged: false },
    general: { hp: 50, speed: 100, damage: 15, radius: 14, color: '#e8c860', element: 'metal', name: '天将', isRanged: false },
    // Wave 3+ — 火（Fire）: triangle, fast, burn DOT
    cavalry: { hp: 30, speed: 170, damage: 12, radius: 11, color: '#ff6040', element: 'fire', name: '火骑兵', isRanged: false },
    // Wave 4+ — 水（Water）: diamond, ranged ice arrows, slow player
    archer: { hp: 25, speed: 55, damage: 18, radius: 11, color: '#5ab8e0', element: 'water', name: '冰弓手', isRanged: true, shootCooldown: 2.5 },
    // Wave 6+ — 土（Earth）: large circle, high HP
    giant: { hp: 180, speed: 80, damage: 28, radius: 25, color: '#c8a850', element: 'earth', name: '巨灵神', isBoss: false },
    // Wave 7+ — 木（Wood）: polygon, regen
    hound: { hp: 60, speed: 210, damage: 16, radius: 12, color: '#5a9a4a', element: 'wood', name: '藤甲兽', isBoss: false },
    // Boss wave 5 — 金 Boss
    king: { hp: 250, speed: 55, damage: 25, radius: 28, color: '#e0c040', element: 'metal', name: '四大天王', isBoss: true, spawnTimer: 4 },
    // Boss wave 10 — 火 Boss
    nezha: { hp: 350, speed: 110, damage: 30, radius: 30, color: '#ff4040', element: 'fire', name: '哪吒', isBoss: true, isRanged: true, shootCooldown: 1.8 },
    // Boss wave 15 — 全元素
    erlang: { hp: 550, speed: 100, damage: 38, radius: 34, color: '#ffd700', element: 'all', name: '二郎神', isBoss: true, isRanged: true, shootCooldown: 1.2 }
  };
  return configs;
}
```

- [ ] **Step 2: 更新 spawnEnemy 函数，传递 element 字段**

找到 `spawnEnemy` 函数（约 248 行），在 enemy 对象中添加 `element`：

```js
function spawnEnemy(type) {
  var side = randInt(0, 3);
  var x, y;
  var margin = 40;
  if (side === 0) { x = rand(margin, W - margin); y = -margin; }
  else if (side === 1) { x = W + margin; y = rand(margin, H - margin); }
  else if (side === 2) { x = rand(margin, W - margin); y = H + margin; }
  else { x = -margin; y = rand(margin, H - margin); }

  var e = {
    x: x, y: y,
    type: type,
    hp: type.hp, maxHp: type.hp,
    speed: rand(type.speed * 0.85, type.speed * 1.15),
    damage: type.damage,
    radius: type.radius,
    color: type.color,
    element: type.element || 'metal',
    name: type.name,
    isBoss: type.isBoss || false,
    isRanged: type.isRanged || false,
    shootTimer: type.shootTimer || 0,
    shootCooldown: type.shootCooldown || 2,
    spawnTimer: type.spawnTimer || 0,
    burnTimer: 0
  };
  enemies.push(e);
}
```

- [ ] **Step 3: 替换 render 函数中的敌人绘制**

找到 `render()` 函数中的敌人绘制块（约 879-905 行），替换为：

```js
// Enemies
for (var ei = 0; ei < enemies.length; ei++) {
  var e = enemies[ei];
  ctx.save();
  ctx.globalAlpha = e.stunned > 0 ? 0.5 + 0.5 * Math.sin(gameTime * 20) : 1;

  drawEnemyShape(e);

  // Elemental particles
  drawElementParticles(e);

  // Burn effect
  if (e.burnTimer > 0) {
    ctx.fillStyle = 'rgba(255,100,20,0.4)';
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // HP bar for bosses
  if (e.isBoss) {
    var barW = e.radius * 2;
    var barH = 6;
    var barY = e.y - e.radius - 12;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(e.x - barW / 2, barY, barW, barH);
    ctx.fillStyle = '#c44d34';
    ctx.fillRect(e.x - barW / 2, barY, barW * (e.hp / e.maxHp), barH);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(e.x - barW / 2, barY, barW, barH);
    // Name
    ctx.fillStyle = '#e8dcc8';
    ctx.font = 'bold 11px Cinzel, "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.fillText(e.name, e.x, barY - 5);
  }
  ctx.restore();
}
```

- [ ] **Step 4: 添加 drawEnemyShape 和 drawElementParticles 函数**

在 `render()` 函数之前插入以下绘制函数（约 818 行之前）：

```js
/* ============================================================
   Enemy Drawing Functions
   ============================================================ */

function drawElementParticles(e) {
  var t = gameTime;
  if (e.element === 'fire') {
    // Flame sparks
    for (var fi = 0; fi < 2; fi++) {
      var fx = e.x + rand(-e.radius, e.radius);
      var fy = e.y + rand(-e.radius, e.radius) - 4;
      ctx.fillStyle = 'rgba(255,140,20,' + (0.4 + Math.sin(t * 10 + fi) * 0.3) + ')';
      ctx.beginPath();
      ctx.arc(fx, fy, rand(1, 3), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (e.element === 'water') {
    // Ice crystal shimmer
    ctx.strokeStyle = 'rgba(150,210,255,0.3)';
    ctx.lineWidth = 1;
    var iceAngle = t * 2;
    for (var wi = 0; wi < 3; wi++) {
      var wx = e.x + Math.cos(iceAngle + wi * 2.1) * e.radius * 0.8;
      var wy = e.y + Math.sin(iceAngle + wi * 2.1) * e.radius * 0.8;
      ctx.beginPath();
      ctx.moveTo(wx - 3, wy);
      ctx.lineTo(wx + 3, wy);
      ctx.moveTo(wx, wy - 3);
      ctx.lineTo(wx, wy + 3);
      ctx.stroke();
    }
  } else if (e.element === 'wood') {
    // Regen sparkles
    if (e.hp < e.maxHp && Math.random() < 0.5) {
      ctx.fillStyle = 'rgba(120,220,80,0.5)';
      ctx.beginPath();
      ctx.arc(e.x + rand(-e.radius, e.radius), e.y - e.radius + rand(-4, 2), 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (e.element === 'earth') {
    // Dust motes
    ctx.fillStyle = 'rgba(200,170,100,0.3)';
    var dustOff = Math.sin(t * 3 + e.x * 0.1) * 3;
    ctx.beginPath();
    ctx.arc(e.x + dustOff, e.y - e.radius + dustOff, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.element === 'all') {
    // Boss cycles all elements
    var cycle = Math.floor(t * 2) % 5;
    var colors = ['rgba(212,184,120,0.5)', 'rgba(120,220,80,0.5)', 'rgba(100,180,240,0.5)', 'rgba(255,100,30,0.5)', 'rgba(200,170,80,0.5)'];
    ctx.fillStyle = colors[cycle];
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius + 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEnemyShape(e) {
  var r = e.radius;
  var x = e.x, y = e.y;

  if (e.element === 'metal') {
    // Square with helmet ornament
    ctx.fillStyle = e.color;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(gameTime * 0.5 + (e.x * 0.01));
    ctx.fillRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);
    // Inner metallic sheen
    ctx.fillStyle = 'rgba(255,240,200,0.4)';
    ctx.fillRect(-r * 0.4, -r * 0.7, r * 0.8, r * 0.5);
    ctx.restore();
    // Helmet plume
    ctx.fillStyle = '#c44d34';
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r * 0.5, y - r * 1.6);
    ctx.lineTo(x - r * 0.5, y - r * 1.6);
    ctx.closePath();
    ctx.fill();
  } else if (e.element === 'fire') {
    // Upward triangle (fast cavalry)
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.moveTo(x, y - r * 1.2);
    ctx.lineTo(x + r * 0.9, y + r * 0.6);
    ctx.lineTo(x - r * 0.9, y + r * 0.6);
    ctx.closePath();
    ctx.fill();
    // Inner glow
    ctx.fillStyle = 'rgba(255,200,100,0.5)';
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.7);
    ctx.lineTo(x + r * 0.5, y + r * 0.3);
    ctx.lineTo(x - r * 0.5, y + r * 0.3);
    ctx.closePath();
    ctx.fill();
  } else if (e.element === 'water') {
    // Diamond shape with ice shimmer
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.moveTo(x, y - r * 1.1);
    ctx.lineTo(x + r * 0.9, y);
    ctx.lineTo(x, y + r * 1.1);
    ctx.lineTo(x - r * 0.9, y);
    ctx.closePath();
    ctx.fill();
    // Ice inner glow
    ctx.fillStyle = 'rgba(200,230,255,0.4)';
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.5);
    ctx.lineTo(x + r * 0.4, y);
    ctx.lineTo(x, y + r * 0.5);
    ctx.lineTo(x - r * 0.4, y);
    ctx.closePath();
    ctx.fill();
  } else if (e.element === 'wood') {
    // Hexagonal with vine texture
    ctx.fillStyle = e.color;
    ctx.beginPath();
    for (var h = 0; h < 6; h++) {
      var hx = x + Math.cos(h * Math.PI / 3 - Math.PI / 6) * r;
      var hy = y + Math.sin(h * Math.PI / 3 - Math.PI / 6) * r;
      if (h === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
    // Vine lines
    ctx.strokeStyle = 'rgba(40,100,20,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var v = 0; v < 3; v++) {
      ctx.moveTo(x, y);
      var vx = x + Math.cos(v * 2.1) * r * 0.7;
      var vy = y + Math.sin(v * 2.1) * r * 0.7;
      ctx.lineTo(vx, vy);
    }
    ctx.stroke();
  } else if (e.element === 'earth') {
    // Large circle with rock texture
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // Rock cracks
    ctx.strokeStyle = 'rgba(100,70,20,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.4, y - r * 0.3);
    ctx.lineTo(x + r * 0.1, y + r * 0.1);
    ctx.lineTo(x + r * 0.5, y - r * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + r * 0.2, y + r * 0.4);
    ctx.lineTo(x - r * 0.3, y - r * 0.1);
    ctx.stroke();
  } else {
    // Fallback: simple circle
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Common: bright center dot
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.25, 0, Math.PI * 2);
  ctx.fill();
}
```

- [ ] **Step 5: 添加元素伤害和特殊效果到 updateEnemies**

找到 `updateEnemies` 函数（约 581 行），在移动逻辑后（碰撞检测后）添加火灼烧和木回血：

在 enemy 碰撞检测代码块（约 592-598 行的 `// Collision with player` 块）之后添加：

```js
// Fire element: burn DOT on collision
if (e.element === 'fire' && dist(e, player) < (e.radius + 16)) {
  if (!player._burnTimer) player._burnTimer = 0;
  player._burnTimer = 2; // reset burn duration
}

// Wood element: regenerate HP
if (e.element === 'wood' && e.hp < e.maxHp) {
  if (!e._regenTimer) e._regenTimer = 0;
  e._regenTimer -= dt;
  if (e._regenTimer <= 0) {
    e._regenTimer = 0.5;
    e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.02);
  }
}

// Metal element: damage reduction
if (e.element === 'metal') {
  e._metalDR = 0.20;
}

// Water element: ice arrow slows player
// (applied in damagePlayer when projectile hits)
```

- [ ] **Step 6: 更新 damagePlayer 添加冰箭减速和灼烧处理**

找到 `damagePlayer` 函数（约 562 行），在顶部添加：

```js
function damagePlayer(dmg, element) {
  // Water element slow
  if (element === 'water' && !player._slowed) {
    player._slowed = true;
    player._slowTimer = 2;
    player.speed *= 0.7;
  }
  // Dodge...
```

以及在 initState 的 player 对象中添加字段：

```js
_burnTimer: 0,
_slowed: false,
_slowTimer: 0
```

- [ ] **Step 7: 在 updatePlayer 中添加灼烧 DOT 和减速恢复**

找到 `updatePlayer` 函数的开头（约 390 行），在 `var mag` 行之后插入：

```js
// Burn DOT from fire enemies
if (player._burnTimer > 0) {
  player._burnTimer -= dt;
  if (!player._burnTick || player._burnTick <= 0) {
    player._burnTick = 0.3;
    player.hp -= 3;
    spawnDmgNumber(player.x, player.y - 16, 3, '#ff6040');
    spawnParticles(player.x, player.y, 2, '#ff6040', 0.3);
    if (player.hp <= 0) playerDied();
  }
  player._burnTick -= dt;
}

// Slow recovery from water/ice
if (player._slowed) {
  player._slowTimer -= dt;
  if (player._slowTimer <= 0) {
    player._slowed = false;
    player.speed = 200; // Reset to base speed (accounting for upgrades)
    if (activeUpgrades.indexOf('speed') !== -1) player.speed *= 1.3;
  }
}
```

- [ ] **Step 8: 更新 trickleSpawn 传给 spawnEnemy 的临时对象添加 element**

找到 `checkWave` 中的 trickle spawn（约 713-724 行），确保 element 被传入：

```js
spawnEnemy({
  hp: t.hp, speed: t.speed, damage: t.damage,
  radius: t.radius, color: t.color, element: t.element,
  name: t.name,
  isBoss: t.isBoss || false, isRanged: t.isRanged || false,
  shootCooldown: t.shootCooldown, spawnTimer: t.spawnTimer
});
```

- [ ] **Step 9: Commit**

```bash
git add games/havoc-in-heaven/js/game.js
git commit -m "feat: add 5-element celestial soldier enemy visuals and mechanics"
```

---

### Task 6: game.js — 跳跃系统

**Files:**
- Modify: `games/havoc-in-heaven/js/game.js`

- [ ] **Step 1: 在 initState 中添加跳跃相关状态**

在 `initState` 的 player 对象中添加：

```js
jumpCooldown: 0,
jumpAirTimer: 0,
jumpVx: 0,
jumpVy: 0,
_lastForwardPress: 0,
_isJumping: false
```

- [ ] **Step 2: 在输入处理区域添加双击检测**

在 `getInputY()` 函数后（约 138 行后）插入：

```js
// Double-tap jump detection
var jumpTriggered = false;
var forwardPressed = keys['w'] || keys['arrowup'];

if (forwardPressed) {
  var now = performance.now() / 1000;
  if (player._lastForwardPress > 0 && (now - player._lastForwardPress) < 0.3 && player.jumpCooldown <= 0 && player.jumpAirTimer <= 0) {
    jumpTriggered = true;
    player._lastForwardPress = 0;
  } else if (player._lastForwardPress <= 0) {
    player._lastForwardPress = now;
  }
} else {
  player._lastForwardPress = 0;
}
```

- [ ] **Step 3: 在 updatePlayer 中处理跳跃逻辑**

找到 `updatePlayer` 函数中获取输入后的移动计算（约 391-397 行），替换为：

```js
var ix = getInputX();
var iy = getInputY();

// Jump state handling
if (player.jumpAirTimer > 0) {
  // In air — apply jump velocity
  player.x += player.jumpVx * dt;
  player.y += player.jumpVy * dt;
  player.jumpAirTimer -= dt;

  // Jump trail particles
  if (Math.random() < 0.7) {
    particles.push({
      x: player.x + rand(-4, 4), y: player.y + rand(-4, 4),
      vx: rand(-15, 15), vy: rand(-10, 5),
      life: 0.3, maxLife: 0.3,
      color: 'rgba(184,160,110,0.6)', radius: rand(2, 4)
    });
  }

  // Bounds during jump
  player.x = Math.max(20, Math.min(W - 20, player.x));
  player.y = Math.max(20, Math.min(H - 20, player.y));

  if (player.jumpAirTimer <= 0) {
    player._isJumping = false;
  }
} else {
  // Normal movement (only if not in air)
  if (!player.jumpAirTimer || player.jumpAirTimer <= 0) {
    var mag = Math.sqrt(ix * ix + iy * iy);
    if (mag > 1) { ix /= mag; iy /= mag; }
    player.x += ix * player.speed * dt;
    player.y += iy * player.speed * dt;
  }
}

// Jump trigger
if (jumpTriggered && player.jumpCooldown <= 0 && player.jumpAirTimer <= 0) {
  player._isJumping = true;
  player.jumpAirTimer = 0.15;
  player.jumpCooldown = 0.6;
  var jumpDir = { x: ix, y: iy };
  var jmag = Math.sqrt(jumpDir.x * jumpDir.x + jumpDir.y * jumpDir.y);
  if (jmag < 0.1) { jumpDir.x = 0; jumpDir.y = -1; jmag = 1; } // default forward if idle
  player.jumpVx = (jumpDir.x / jmag) * 80 / 0.15; // speed = distance/time
  player.jumpVy = (jumpDir.y / jmag) * 80 / 0.15;
  spawnParticles(player.x, player.y, 6, 'rgba(184,160,110,0.8)', 0.2);
  AudioEngine.playSfx('jump');
}

// Jump cooldown tick
if (player.jumpCooldown > 0) {
  player.jumpCooldown -= dt;
}
```

- [ ] **Step 4: 在 render 中绘制跳跃指示器**

找到 `render()` 函数末尾的 `ctx.globalAlpha = 1;`（约 1008 行）之前，添加跳跃冷却 UI：

```js
// Jump cooldown indicator
var jumpReady = player.jumpCooldown <= 0;
var jumpAlpha = jumpReady ? 0.8 : 0.4;
ctx.fillStyle = 'rgba(10,6,4,' + (jumpReady ? 0.6 : 0.3) + ')';
ctx.beginPath();
ctx.arc(W - 50, H - 50, 20, 0, Math.PI * 2);
ctx.fill();
ctx.strokeStyle = 'rgba(184,160,110,' + jumpAlpha + ')';
ctx.lineWidth = 2;
if (jumpReady) {
  ctx.setLineDash([]);
  ctx.shadowColor = 'rgba(184,160,110,0.4)';
  ctx.shadowBlur = 8;
}
ctx.beginPath();
ctx.arc(W - 50, H - 50, 20, 0, Math.PI * 2);
ctx.stroke();
ctx.shadowBlur = 0;

// Cooldown fill
if (!jumpReady) {
  var cdRatio = player.jumpCooldown / 0.6;
  ctx.fillStyle = 'rgba(184,160,110,0.3)';
  ctx.beginPath();
  ctx.moveTo(W - 50, H - 50);
  ctx.arc(W - 50, H - 50, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - cdRatio));
  ctx.closePath();
  ctx.fill();
}

// Jump icon text
ctx.fillStyle = 'rgba(184,160,110,' + jumpAlpha + ')';
ctx.font = 'bold 14px Cinzel, serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('跳', W - 50, H - 50);
ctx.setLineDash([]);
```

- [ ] **Step 5: Commit**

```bash
git add games/havoc-in-heaven/js/game.js
git commit -m "feat: add double-tap forward jump system"
```

---

### Task 7: game.js — 升级庆祝 + 死亡画面增强

**Files:**
- Modify: `games/havoc-in-heaven/js/game.js`

- [ ] **Step 1: 替换 checkLevelUp 添加庆祝动画**

找到 `checkLevelUp` 函数（约 728 行），替换为：

```js
/* ---- Level Up ---- */
function checkLevelUp() {
  if (xp >= xpToNext) {
    xp -= xpToNext;
    level++;
    xpToNext = Math.floor(xpToNext * 1.4);
    triggerCelebrate();
  }
}

var celebrateTimer = 0;
function triggerCelebrate() {
  celebrateTimer = 1.5;
  setPaused(true);
  AudioEngine.playSfx('levelup');

  // Show celebrate overlay
  var celOverlay = document.getElementById('celebrate-overlay');
  celOverlay.classList.add('active');

  // Celebration sparkles via Canvas particles
  for (var i = 0; i < 40; i++) {
    var angle = rand(0, Math.PI * 2);
    var dist = rand(100, Math.max(W, H) * 0.6);
    particles.push({
      x: W / 2 + Math.cos(angle) * dist,
      y: H / 2 + Math.sin(angle) * dist,
      vx: -Math.cos(angle) * rand(80, 200),
      vy: -Math.sin(angle) * rand(80, 200),
      life: 1.5, maxLife: 1.5,
      color: '#ffd700', radius: rand(2, 5)
    });
  }
}
```

- [ ] **Step 2: 在 update 函数中添加庆祝倒计时处理**

找到 `update` 函数（约 370 行），在 `if (gameOver || paused) return;` 之后添加：

```js
// Celebration timer
if (celebrateTimer > 0) {
  celebrateTimer -= dtClamped;
  if (celebrateTimer <= 0) {
    document.getElementById('celebrate-overlay').classList.remove('active');
    setPaused(false);
    autoUpgrade();
  }
  // Still update HUD, particles, XP orbs during celebration
  updateParticles(dtClamped);
  updateXpOrbs(dtClamped);
  updateHUD();
  return;
}
```

修改开头的暂停检查为：

```js
var isCelebrating = celebrateTimer > 0;
if (gameOver || (paused && !isCelebrating)) return;
```

- [ ] **Step 3: 增强 playerDied 函数 — 图片、音效、文字**

找到 `playerDied` 函数（约 785 行），替换为：

```js
function playerDied() {
  gameOver = true;
  deathData = { time: gameTime, wave: wave, kills: kills };
  AudioEngine.playSfx('death');

  // Stop music
  AudioEngine.setIntensity('calm');

  var overlay = document.getElementById('death-overlay');

  // Set death image
  var deathImg = document.getElementById('death-img');
  if (deathImg && IMG.death && IMG.death.complete && IMG.death.naturalWidth > 0) {
    deathImg.src = IMG.death.src;
    deathImg.style.display = 'block';
  } else if (deathImg) {
    deathImg.style.display = 'none';
  }

  document.getElementById('death-time').textContent = formatTime(gameTime);
  document.getElementById('death-wave').textContent = wave;
  document.getElementById('death-kills').textContent = kills;
  document.getElementById('death-score').textContent = Math.floor(kills * 10 + wave * 200 + gameTime * 5);
  overlay.classList.add('active');
}
```

- [ ] **Step 4: 在 startGame 中重置庆祝状态**

找到 `startGame` 函数（约 1026 行），在 `initState()` 后添加：

```js
celebrateTimer = 0;
document.getElementById('celebrate-overlay').classList.remove('active');
```

- [ ] **Step 5: 在 initState 中添加 celebrateTimer 变量声明**

```js
celebrateTimer = 0;
```

- [ ] **Step 6: Commit**

```bash
git add games/havoc-in-heaven/js/game.js
git commit -m "feat: add level-up celebration and enhanced death screen"
```

---

### Task 8: game.js — 音频集成 (init + BGM 强度切换)

**Files:**
- Modify: `games/havoc-in-heaven/js/game.js`

- [ ] **Step 1: 在 startGame 中初始化音频**

找到 `startGame` 函数（约 1026 行），在函数开头添加：

```js
function startGame() {
  // Initialize audio on first user interaction
  AudioEngine.init();
  AudioEngine.start();
  AudioEngine.setIntensity('calm');

  // ... existing init code ...
  initState();
  ...
}
```

- [ ] **Step 2: 在 checkWave 后更新 BGM 强度**

找到 `checkWave` 函数（约 702 行），在 `spawnWave(wave)` 后添加强度更新：

```js
function checkWave() {
  if (waveTimer >= 30) {
    waveTimer = 0;
    wave++;
    spawnWave(wave);
    updateMusicIntensity();
  }
  // ... trickle code ...
}
```

- [ ] **Step 3: 添加 updateMusicIntensity 函数**

在 `checkWave` 函数后面插入：

```js
function updateMusicIntensity() {
  // Boss every 5 waves
  if (wave % 5 === 0 && wave > 0) {
    AudioEngine.setIntensity('boss');
  } else if (wave >= 8 || (player.hp / player.maxHp) <= 0.4) {
    AudioEngine.setIntensity('tense');
  } else {
    AudioEngine.setIntensity('calm');
  }
}
```

- [ ] **Step 4: 在 playerDied 中停止音乐强度变化**

在 `playerDied` 函数中已经有 `AudioEngine.setIntensity('calm')`，保持不变。添加在 `startGame` 中重置：

```js
AudioEngine.setIntensity('calm');
```

（Step 1 已包含）

- [ ] **Step 5: 在 game loop 中调用 AudioEngine.update(dt)**

找到 `loop` 函数（约 1015 行），在 `update(dt)` 后添加：

```js
function loop(timestamp) {
  var dt = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
  lastTime = timestamp;
  update(dt);
  AudioEngine.update(dt);
  render();
  requestAnimationFrame(loop);
}
```

- [ ] **Step 6: 在 attack/kill 中添加音效调用**

找到 `performAttack` 函数（约 473 行），在伤害目标处添加音效：

```js
if (target) {
  var dmg = player.attackDamage;
  target.hp -= dmg;
  spawnDmgNumber(target.x, target.y, dmg, '#ffd700');
  spawnParticles(target.x, target.y, 5, '#d4b878', 0.4);
  AudioEngine.playSfx('attack');
  if (target.hp <= 0) {
    killEnemy(target);
  }
}
```

找到 `killEnemy` 函数（约 549 行），在删除敌人前添加元素音效：

```js
function killEnemy(enemy) {
  var idx = enemies.indexOf(enemy);
  if (idx === -1) return;
  kills++;
  spawnParticles(enemy.x, enemy.y, enemy.isBoss ? 30 : 8, enemy.color, 0.8);
  spawnXpOrb(enemy.x, enemy.y);
  if (enemy.isBoss) {
    for (var i = 0; i < 3; i++) spawnXpOrb(enemy.x + rand(-30, 30), enemy.y + rand(-30, 30));
  }
  // Element-specific kill SFX
  var elementSfx = {
    metal: 'kill_metal', wood: 'kill_wood', water: 'kill_water',
    fire: 'kill_fire', earth: 'kill_earth', all: 'kill_metal'
  };
  AudioEngine.playSfx(elementSfx[enemy.element] || 'kill_metal');
  enemies.splice(idx, 1);
}
```

找到 `damagePlayer` 函数（约 562 行），在受伤处添加音效：

```js
function damagePlayer(dmg, element) {
  // ...
  var actualDmg = Math.max(1, Math.floor(dmg * (1 - player.damageReduction)));
  player.hp -= actualDmg;
  player._damageFlash = 0.2;
  spawnParticles(player.x, player.y, 4, '#ff4040', 0.3);
  AudioEngine.playSfx('hurt');
  // ...
}
```

找到 `fieryEyesBurst` 函数（约 510 行），添加音效：

```js
function fieryEyesBurst() {
  AudioEngine.playSfx('fiery');
  // ... existing code ...
}
```

找到 `stunAll` 函数（约 531 行），添加音效：

```js
function stunAll() {
  AudioEngine.playSfx('stun');
  // ... existing code ...
}
```

找到 `shockwave` 函数（约 538 行），添加音效：

```js
function shockwave() {
  AudioEngine.playSfx('shockwave');
  // ... existing code ...
}
```

- [ ] **Step 7: 在 checkWave + update 中持续检查 HP 变化**

在 `update` 函数中，每次更新后检查音乐强度（HP 低于阈值时）：

在 `update` 函数的 `checkWave()` 调用后添加：

```js
// Re-check music on HP changes
if (player.hp / player.maxHp <= 0.4) {
  if (wave % 5 === 0 && wave > 0) {
    AudioEngine.setIntensity('boss');
  } else {
    AudioEngine.setIntensity('tense');
  }
} else if (wave < 8) {
  AudioEngine.setIntensity('calm');
} else if (wave % 5 !== 0) {
  AudioEngine.setIntensity('tense');
}
```

- [ ] **Step 8: Commit**

```bash
git add games/havoc-in-heaven/js/game.js
git commit -m "feat: integrate audio engine with game events and BGM intensity"
```

---

### Task 9: 最终集成测试 + 验证

**Files:**
- Verify all: `games/havoc-in-heaven/`

- [ ] **Step 1: 验证所有文件存在且路径正确**

```bash
ls games/havoc-in-heaven/js/audio.js games/havoc-in-heaven/js/game.js games/havoc-in-heaven/css/game.css games/havoc-in-heaven/index.html
```

- [ ] **Step 2: 验证图片引用存在**

```bash
ls images/sun-wukong/sun-wukong-ice.jpg images/sun-wukong/sun-wukong-hero2.jpg images/sun-wukong/sun-wukong-hero3.jpg
```

Expected: All three image files exist.

- [ ] **Step 3: 启动静态服务器并手动验证**

```bash
cd D:/project/celestial-archive && python -m http.server 8000
```

Open `http://localhost:8000/games/havoc-in-heaven/` and verify:
1. Player is Sun Wukong's head (circular with golden border)
2. Enemies are shapes (square=metal, triangle=fire, diamond=water, hexagon=wood, circle with cracks=earth)
3. Double-tap W/↑ triggers jump with trail particles
4. Kill enemies plays element-specific sounds
5. Level up pauses game, shows celebration image + "神通大成！"
6. Death shows angry Sun Wukong + "天命不公！"
7. Background music changes intensity (check Wave 8+ and HP < 40%)

- [ ] **Step 4: Commit final tweaks**

```bash
git add -A && git commit -m "chore: final integration tweaks for Havoc in Heaven upgrade"
```

---
