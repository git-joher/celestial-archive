# Golden Inscriptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an animated "send a message to Sun Wukong" section with localStorage persistence to the Sun Wukong hub page.

**Architecture:** Single-file change to `deities/sun-wukong/index.html`. New section block (#6) inserted between the related-deities section and footer, with inline CSS in `<style>` and an inline `<script>` at page bottom. Reuses the project's CSS custom property system.

**Tech Stack:** Vanilla HTML/CSS/JS, CSS @keyframes, localStorage, Intersection Observer (already present in main.js)

**Files:**
- Modify: `D:\project\celestial-archive\deities\sun-wukong\index.html`

---

### Task 1: Add inscription section CSS

**Files:**
- Modify: `D:\project\celestial-archive\deities\sun-wukong\index.html` (inside `<style>` block, before closing `</style>`)

- [ ] **Step 1: Insert CSS before the responsive block's closing `}` and `</style>`**

Insert the following CSS rules before the line `</style>` (after line 414's `}`). This adds styles for the inscription input, animation overlay, and gallery cards.

```css

    /* ============================================================
       区块6：金石铭文 —— 给孙悟空留言
       ============================================================ */
    .inscription-section {
      padding: var(--space-xxl) 0;
      background: var(--bg-dark);
      border-top: 1px solid rgba(232,220,200,0.08);
    }
    .inscription-title {
      color: var(--text-on-dark);
      margin-bottom: var(--space-xs);
    }
    .inscription-subtitle {
      text-align: center;
      font-size: 0.95rem;
      color: var(--text-secondary);
      margin-bottom: var(--space-xl);
    }

    /* 输入区 */
    .inscription-form {
      max-width: 600px;
      margin: 0 auto var(--space-xl);
    }
    .inscription-input-wrap {
      display: flex;
      gap: var(--space-sm);
    }
    .inscription-input {
      flex: 1;
      background: #3d3428;
      border: 1px solid rgba(184,160,110,0.3);
      border-radius: var(--radius-sm);
      padding: 14px 18px;
      font-family: var(--font-body);
      font-size: 1rem;
      color: var(--text-on-dark);
      resize: none;
      min-height: 56px;
      transition: border-color 0.3s, box-shadow 0.3s;
      outline: none;
    }
    .inscription-input::placeholder {
      color: rgba(232,220,200,0.35);
      font-style: italic;
    }
    .inscription-input:focus {
      border-color: var(--accent-gold);
      box-shadow: 0 0 16px rgba(184,160,110,0.15);
    }
    .inscription-submit {
      flex-shrink: 0;
      font-family: var(--font-display);
      font-size: 0.9rem;
      color: var(--bg-dark);
      background: var(--accent-gold);
      border: none;
      padding: 14px 28px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      letter-spacing: 1px;
      text-transform: uppercase;
      transition: background 0.3s, box-shadow 0.3s;
      white-space: nowrap;
    }
    .inscription-submit:hover {
      background: #c9b380;
      box-shadow: var(--shadow-glow);
    }
    .inscription-submit:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* 输入框云纹装饰 */
    .inscription-input-wrap {
      position: relative;
    }
    .inscription-input-wrap::before {
      content: '';
      position: absolute;
      top: -6px;
      left: 12px;
      width: 24px;
      height: 18px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='18' viewBox='0 0 24 18'%3E%3Cpath d='M6 14c-3 0-5-2-5-5s2-5 5-5c1-4 4-7 8-7 3 0 6 2 8 5 1 0 2-1 3-1 4 0 6 3 6 7s-3 6-6 6' fill='none' stroke='rgba(184,160,110,0.2)' stroke-width='1'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      pointer-events: none;
    }

    /* 动画遮罩 */
    .inscription-overlay {
      position: fixed;
      inset: 0;
      z-index: 200;
      background: rgba(45,36,24,0.92);
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: all;
      opacity: 0;
      transition: opacity 0.4s ease;
    }
    .inscription-overlay.active {
      opacity: 1;
    }
    .inscription-overlay-text {
      font-family: var(--font-display);
      font-size: clamp(1.2rem, 3vw, 2rem);
      color: #fff;
      text-align: center;
      max-width: 600px;
      padding: var(--space-lg);
      transition: color 0.6s ease, text-shadow 0.6s ease;
    }
    .inscription-overlay-text.golden {
      color: var(--accent-gold);
      text-shadow: 0 0 30px rgba(184,160,110,0.6), 0 0 80px rgba(184,160,110,0.3);
    }
    /* 金箍棒光柱 */
    .jingu-beam {
      position: absolute;
      top: -100%;
      left: 50%;
      width: 4px;
      height: 200%;
      background: linear-gradient(to bottom, transparent, rgba(184,160,110,0.8), rgba(255,220,140,0.9), rgba(184,160,110,0.6), transparent);
      transform: translateX(-50%);
      animation: beam-strike 0.6s ease-out forwards;
      pointer-events: none;
    }
    @keyframes beam-strike {
      0% { top: -100%; opacity: 0; }
      30% { opacity: 1; }
      100% { top: 100%; opacity: 0; }
    }
    /* 云烟粒子 */
    .cloud-particle {
      position: absolute;
      width: 18px;
      height: 12px;
      background: radial-gradient(ellipse, rgba(232,220,200,0.5), transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      animation: cloud-drift 2.5s ease-in-out forwards;
    }
    @keyframes cloud-drift {
      0% { transform: translate(0, 0) scale(0); opacity: 0; }
      20% { transform: translate(20px, -30px) scale(1); opacity: 0.6; }
      60% { transform: translate(80px, -180px) scale(1.4); opacity: 0.3; }
      100% { transform: translate(120px, -320px) scale(0.2); opacity: 0; }
    }

    /* 金石铭文列表 */
    .inscription-gallery {
      max-width: 640px;
      margin: 0 auto;
    }
    .inscription-card {
      background: #3a3028;
      border: 1px solid rgba(184,160,110,0.15);
      border-radius: var(--radius-sm);
      padding: var(--space-md);
      margin-bottom: var(--space-sm);
      position: relative;
      overflow: hidden;
      animation: card-fade-in 0.6s ease forwards;
    }
    .inscription-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M10 40c-4 0-7-3-7-7s3-7 7-7c1-5 6-10 11-10 4 0 9 3 10 7 1 0 2-1 3-1 5 0 8 4 8 9s-4 9-8 9H10z' fill='rgba(184,160,110,0.03)'/%3E%3C/svg%3E");
      pointer-events: none;
    }
    @keyframes card-fade-in {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .inscription-card-text {
      font-family: var(--font-body);
      font-size: 1.05rem;
      color: var(--accent-gold);
      line-height: 1.7;
      margin-bottom: var(--space-xs);
      position: relative;
      z-index: 1;
    }
    .inscription-card-text::before {
      content: '金石 ';
      font-family: var(--font-chinese-display);
      font-size: 0.8rem;
      opacity: 0.3;
      margin-right: 4px;
    }
    .inscription-card-time {
      font-size: 0.78rem;
      color: var(--text-secondary);
      text-align: right;
      position: relative;
      z-index: 1;
    }
    .inscription-empty {
      text-align: center;
      font-size: 0.95rem;
      color: var(--text-secondary);
      font-style: italic;
      padding: var(--space-lg);
    }

    /* 响应式 */
    @media (max-width: 767px) {
      .inscription-input-wrap {
        flex-direction: column;
      }
      .inscription-submit {
        width: 100%;
        text-align: center;
      }
    }
```

- [ ] **Step 2: Commit**

```bash
git add deities/sun-wukong/index.html
git commit -m "style: add golden inscriptions section CSS"
```

---

### Task 2: Add inscription section HTML

**Files:**
- Modify: `D:\project\celestial-archive\deities\sun-wukong\index.html` (insert between the related-deities `</section>` and the footer `<footer>`)

- [ ] **Step 1: Insert the section HTML**

Insert after the line `</section>` that closes the related-deities section (currently line 576) and before `<!-- 区块6：页脚 -->`. The comment label for the footer will become "区块7".

```html

  <!-- ============================================================ -->
  <!-- 区块6：金石铭文 —— 给孙悟空留言 -->
  <!-- ============================================================ -->
  <section class="inscription-section" aria-label="Send a message to Sun Wukong">
    <div class="container">
      <h2 class="section-title inscription-title">
        <span class="title-ornament"></span>
        A Message for the Great Sage
      </h2>
      <p class="inscription-subtitle">Send your words to the Monkey King. They will be transformed into golden inscriptions, preserved forever in the stone of Flower-Fruit Mountain.</p>

      <div class="inscription-form">
        <div class="inscription-input-wrap">
          <textarea
            class="inscription-input"
            id="inscription-input"
            placeholder="Write your message to the Monkey King..."
            maxlength="500"
            rows="2"
            aria-label="Your message to Sun Wukong"
          ></textarea>
          <button class="inscription-submit" id="inscription-submit" type="button">Send to the Great Sage</button>
        </div>
      </div>

      <div class="inscription-gallery" id="inscription-gallery" aria-label="Previous messages">
        <!-- Rendered by JS -->
      </div>
    </div>
  </section>

  <!-- 动画遮罩层 -->
  <div class="inscription-overlay" id="inscription-overlay" aria-hidden="true">
    <div class="inscription-overlay-text" id="inscription-overlay-text"></div>
  </div>
```

- [ ] **Step 2: Update the footer comment from "区块6" to "区块7"**

Change:
```
  <!-- 区块6：页脚 -->
```
to:
```
  <!-- 区块7：页脚 -->
```

- [ ] **Step 3: Commit**

```bash
git add deities/sun-wukong/index.html
git commit -m "feat: add golden inscriptions section HTML"
```

---

### Task 3: Add inline JavaScript for localStorage and animation

**Files:**
- Modify: `D:\project\celestial-archive\deities\sun-wukong\index.html` (insert before `</body>`)

- [ ] **Step 1: Insert the inline script**

Insert after the line `<script src="../../js/main.js"></script>` and before `</body>`:

```html
  <script>
  /**
   * Golden Inscriptions — localStorage persistence + send animation
   */
  (function () {
    'use strict';

    var STORAGE_KEY = 'celestial-archive-messages';

    var input = document.getElementById('inscription-input');
    var submitBtn = document.getElementById('inscription-submit');
    var gallery = document.getElementById('inscription-gallery');
    var overlay = document.getElementById('inscription-overlay');
    var overlayText = document.getElementById('inscription-overlay-text');

    /* ============================================================
       localStorage 读写
       ============================================================ */
    function loadMessages() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    function saveMessages(messages) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (e) {
        /* localStorage full — silently ignore */
      }
    }

    /* ============================================================
       渲染铭文列表
       ============================================================ */
    function renderGallery() {
      var messages = loadMessages();
      if (!gallery) return;

      if (messages.length === 0) {
        gallery.innerHTML = '<p class="inscription-empty">No inscriptions yet. Be the first to write to the Monkey King.</p>';
        return;
      }

      /* 最新在前 */
      var sorted = messages.slice().sort(function (a, b) { return b.timestamp - a.timestamp; });

      var html = '';
      sorted.forEach(function (msg) {
        var date = new Date(msg.timestamp);
        var timeStr = date.toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
        var escapedText = msg.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        html += '<div class="inscription-card">'
          + '<p class="inscription-card-text">' + escapedText + '</p>'
          + '<p class="inscription-card-time">' + timeStr + '</p>'
          + '</div>';
      });
      gallery.innerHTML = html;
    }

    /* ============================================================
       发送消息 + 触发动画
       ============================================================ */
    function sendMessage() {
      var text = input.value.trim();
      if (!text) return;

      /* 禁用交互 */
      submitBtn.disabled = true;
      input.disabled = true;

      /* 显示遮罩 */
      overlay.classList.add('active');
      overlayText.textContent = text;
      overlayText.classList.remove('golden');

      /* 生成云烟粒子 */
      spawnCloudParticles();

      /* 阶段1→2：点金（1.8s后） */
      setTimeout(function () {
        overlayText.classList.add('golden');
        spawnBeam();
      }, 1800);

      /* 阶段3：完成，保存并刷新列表（3s后） */
      setTimeout(function () {
        /* 存储 */
        var messages = loadMessages();
        messages.push({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
          text: text,
          timestamp: Date.now()
        });
        saveMessages(messages);

        /* 隐藏遮罩 */
        overlay.classList.remove('active');
        overlayText.textContent = '';
        overlayText.classList.remove('golden');

        /* 清理粒子 */
        clearParticles();

        /* 重置表单 */
        input.value = '';
        submitBtn.disabled = false;
        input.disabled = false;
        input.focus();

        /* 刷新列表 */
        renderGallery();
        /* 滚动到新卡片 */
        var firstCard = gallery.querySelector('.inscription-card');
        if (firstCard) {
          firstCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 3000);
    }

    /* ============================================================
       动画效果
       ============================================================ */
    function spawnCloudParticles() {
      var count = 8;
      var inputRect = input.getBoundingClientRect();
      var startX = inputRect.left + inputRect.width / 2;
      var startY = inputRect.top;

      for (var i = 0; i < count; i++) {
        var particle = document.createElement('div');
        particle.className = 'cloud-particle';
        particle.style.left = (startX + (Math.random() - 0.5) * 60) + 'px';
        particle.style.top = (startY + Math.random() * 20) + 'px';
        particle.style.animationDelay = (i * 0.12) + 's';
        particle.style.animationDuration = (2 + Math.random() * 1.5) + 's';
        overlay.appendChild(particle);
      }
    }

    function spawnBeam() {
      var beam = document.createElement('div');
      beam.className = 'jingu-beam';
      overlay.appendChild(beam);
      setTimeout(function () {
        if (beam.parentNode) beam.parentNode.removeChild(beam);
      }, 700);
    }

    function clearParticles() {
      var particles = overlay.querySelectorAll('.cloud-particle, .jingu-beam');
      particles.forEach(function (p) { p.parentNode.removeChild(p); });
    }

    /* ============================================================
       事件绑定
       ============================================================ */
    submitBtn.addEventListener('click', sendMessage);

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    /* 页面加载时渲染历史消息 */
    renderGallery();
  })();
  </script>
```

- [ ] **Step 2: Commit**

```bash
git add deities/sun-wukong/index.html
git commit -m "feat: add golden inscriptions JS — localStorage + send animation"
```

---

### Task 4: Verify

- [ ] **Step 1: Open the page in a browser**

Open `deities/sun-wukong/index.html` in a browser (serve from root):

```bash
python -m http.server 8000
# Navigate to http://localhost:8000/deities/sun-wukong/index.html
```

- [ ] **Step 2: Test the golden path**

1. Scroll to the "A Message for the Great Sage" section
2. Type a message and click "Send to the Great Sage"
3. Verify the animation overlay appears with the message text
4. Verify the text turns gold after ~1.8s
5. After animation, verify the message appears as a gold card in the gallery
6. Refresh the page — verify the message persists
7. Type a message and press Enter — verify it sends

- [ ] **Step 3: Test edge cases**

1. Click send with empty input — nothing should happen
2. Send a message with special characters (`<script>`, `&`, quotes) — should be escaped
3. Send multiple messages — newest should appear at top
4. Disable JavaScript — the section should still be visible but non-functional

- [ ] **Step 4: Commit any fixes if needed**

```bash
git add deities/sun-wukong/index.html
git commit -m "fix: golden inscriptions edge case handling"
```
