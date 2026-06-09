// ==UserScript==
// @name         GoTop
// @namespace    https://github.com/REDDRAGON-HL
// @version      1.0.0
// @description  A scroll-to-top button with a customizable right-click menu.
// @description:zh-CN  一键滚到顶部/底部按钮，右键菜单可自定义。
// @author       RedDragon
// @homepageURL  https://dragonred.cn
// @supportURL   https://github.com/REDDRAGON-HL/GoTop/issues
// @updateURL    https://raw.githubusercontent.com/REDDRAGON-HL/GoTop/main/GoTop.user.js
// @downloadURL  https://raw.githubusercontent.com/REDDRAGON-HL/GoTop/main/GoTop.user.js
// @license      MIT
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    if (window.top !== window.self) return;
    if (/^(chrome|about|moz-extension|chrome-extension|file|data):/.test(location.protocol)) return;
    if (document.getElementById('sb-container')) return;

    const STORAGE_KEY = 'scroll_btn_config_v2';

    const DEFAULT_CONFIG = {
        position: { leftRatio: 0.85, topRatio: 0.80 },
        opacityIdle: 0.55,
        opacityHover: 0.9,
        showBottom: false,
        excludeList: [],
        customCss: '',
        lang: ''
    };

    const DEFAULT_EDITABLE_CSS = `#sb-container { gap: 6px; opacity: 0.55; }
#sb-container:hover { opacity: 0.9; }
#sb-container .sb-btn {
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(80,80,80,0.6); color: #101010;
  border: 0; font-size: 18px; font-weight: bold;
  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
}
#sb-container .sb-btn:active { transform: scale(0.95); }`;

    const BASE_CSS = `
#sb-container { position: fixed; z-index: 2147483646;
  display: flex; flex-direction: column; gap: 6px; opacity: 0.55;
  transition: opacity 0.2s ease; user-select: none; pointer-events: auto; }
#sb-container:hover, #sb-container:focus-within { opacity: 0.9; }
#sb-container.dragging { cursor: grabbing; }

#sb-container .sb-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; margin: 0; padding: 0; border: 0; border-radius: 50%;
  background: rgba(80,80,80,0.6); color: #101010;
  font-size: 18px; font-weight: bold; line-height: 1; cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
  transition: opacity 0.2s ease, transform 0.1s ease, background 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
}
#sb-container .sb-btn:active { transform: scale(0.95); }
#sb-container .sb-btn[hidden] { display: none !important; }

#sb-menu { position: fixed; z-index: 2147483647; width: 360px; min-width: 360px; max-width: 360px;
  height: 520px; min-height: 520px; max-height: 520px;
  display: flex; flex-direction: column;
  background: #2a2a2a; color: #e6e6e6;
  border: 1px solid #1a1a1a; border-radius: 10px;
  box-shadow: 0 14px 36px rgba(0,0,0,0.55);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 13px; line-height: 1.5; padding: 12px 14px 14px; overflow: hidden;
}

#sb-menu .sb-tabs { display: flex; align-items: center; gap: 4px;
  margin-bottom: 10px; border-bottom: 1px solid #3a3a3a; padding-bottom: 8px; }
#sb-menu .sb-tab { display: inline-block; padding: 5px 10px;
  background: rgba(255,255,255,0.06); color: #d8d8d8; border: 1px solid #4a4a4a;
  border-radius: 6px; font-size: 13px; cursor: pointer; text-align: center;
  font-family: inherit; line-height: 1.4;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease; }
#sb-menu .sb-tab:hover { background: rgba(255,255,255,0.12); color: #fff; border-color: #6a6a6a; }
#sb-menu .sb-tab.active { background: rgba(30,136,229,0.28); color: #fff; border-color: #1e88e5; }
#sb-menu .sb-tab-spacer { flex: 1 1 auto; }
#sb-menu .sb-tab#sb-close { margin-left: auto; width: 28px; padding: 3px 0;
  font-size: 14px; font-weight: bold; }

#sb-menu .sb-panel { display: none; flex: 1 1 auto; min-height: 0;
  flex-direction: column; overflow: hidden; }
#sb-menu .sb-panel.active { display: flex; }
#sb-menu .sb-panel h4 { margin: 2px 0 6px; color: #f5f5f5;
  font-size: 13px; font-weight: 600; font-family: inherit; }
#sb-menu .sb-panel .sb-tip { color: #aaa; font-size: 12px; margin-bottom: 6px; }
#sb-menu .sb-panel label { display: flex; align-items: center; gap: 6px;
  color: #e6e6e6; margin-bottom: 8px; font-size: 13px; cursor: pointer; }
#sb-menu .sb-panel label input { margin: 0; width: 14px; height: 14px; cursor: pointer; }

#sb-menu #sb-toggle-current { display: flex; width: 100%; text-align: left;
  background: rgba(255,255,255,0.06); color: #e6e6e6;
  border: 1px solid #4a4a4a; border-radius: 6px; padding: 8px 12px;
  font-size: 13px; cursor: pointer; margin-bottom: 10px;
  align-items: center; gap: 8px; font-family: inherit; line-height: 1.4;
  transition: background 0.15s ease, border-color 0.15s ease; }
#sb-menu #sb-toggle-current:hover { background: rgba(255,255,255,0.12); border-color: #6a6a6a; }
#sb-menu #sb-toggle-icon { display: inline-block; width: 18px; text-align: center;
  font-weight: bold; color: #ccc; }
#sb-menu #sb-toggle-text { flex: 1; word-break: break-all; }
#sb-menu #sb-toggle-hint { color: #999; font-size: 11px; }

#sb-menu .sb-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }

#sb-menu #sb-exclude-list { flex: 1 1 auto; min-height: 0; overflow-y: auto;
  border: 1px solid #3a3a3a; border-radius: 6px; padding: 4px;
  background: #1f1f1f; margin-bottom: 8px; }
#sb-menu .sb-item { display: flex; align-items: center; justify-content: space-between;
  padding: 5px 8px; border-radius: 4px; font-size: 12px; color: #e6e6e6; }
#sb-menu .sb-item:hover { background: #333; }
#sb-menu .sb-item .sb-del { display: inline-block;
  background: rgba(255,138,128,0.12); color: #ff8a80;
  border: 1px solid #6a3a3a; border-radius: 4px; padding: 2px 8px;
  font-size: 14px; cursor: pointer; font-family: inherit; line-height: 1;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease; }
#sb-menu .sb-item .sb-del:hover { background: rgba(255,82,82,0.22);
  color: #ff5252; border-color: #8a4a4a; }
#sb-menu #sb-exclude-empty { padding: 12px 8px; color: #999; font-size: 12px; text-align: center; }

#sb-menu textarea { width: 100%; box-sizing: border-box; background: #1f1f1f;
  color: #e6e6e6; border: 1px solid #3a3a3a; border-radius: 6px; padding: 8px;
  font-family: Consolas, Menlo, "Courier New", monospace; font-size: 12px;
  line-height: 1.4; resize: none; outline: none; flex: 1 1 auto; min-height: 0; display: block; }
#sb-menu textarea:focus { border-color: #1e88e5; }

#sb-menu .sb-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
#sb-menu .sb-mini { display: inline-block;
  background: rgba(255,255,255,0.06); color: #e6e6e6;
  border: 1px solid #4a4a4a; border-radius: 6px; padding: 5px 12px;
  font-size: 12px; cursor: pointer; font-family: inherit; line-height: 1.4;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease; }
#sb-menu .sb-mini:hover { background: rgba(255,255,255,0.12); border-color: #6a6a6a; color: #fff; }

#sb-menu .sb-save-row { display: flex; justify-content: flex-end; gap: 6px; margin-top: 10px; }
#sb-menu .sb-ghost { display: inline-block;
  background: rgba(255,255,255,0.06); color: #e6e6e6;
  border: 1px solid #4a4a4a; border-radius: 6px; padding: 6px 14px;
  font-size: 13px; cursor: pointer; font-family: inherit; line-height: 1.4;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease; }
#sb-menu .sb-ghost:hover { background: rgba(255,255,255,0.12); border-color: #6a6a6a; color: #fff; }
#sb-menu .sb-primary { display: inline-block;
  background: rgba(30,136,229,0.28); color: #fff; border: 1px solid #1e88e5;
  border-radius: 6px; padding: 6px 14px; font-size: 13px; cursor: pointer;
  font-family: inherit; line-height: 1.4; font-weight: 500;
  transition: background 0.15s ease, border-color 0.15s ease; }
#sb-menu .sb-primary:hover { background: rgba(30,136,229,0.48); border-color: #42a5f5; }

#sb-menu *::-webkit-scrollbar { width: 8px; height: 8px; }
#sb-menu *::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; }
#sb-menu *::-webkit-scrollbar-thumb:hover { background: #666; }
#sb-menu *::-webkit-scrollbar-track { background: transparent; }`;

    function hasGM(fn) { return typeof fn === 'function'; }

    const I18N = {
        en: {
            titleTop: 'Left-click: scroll to top / Right-click: menu',
            titleBottom: 'Scroll to bottom',
            tabExclude: 'Exclude list',
            tabStyle: 'Button & Style',
            excludeTip: 'The button is hidden on matched sites; click × on the right to remove.',
            excludeEmpty: 'No excluded sites',
            excludeClear: 'Clear',
            excludeEdit: 'Edit text',
            excludeBack: 'Back to list',
            excludeDel: 'Remove from exclude list',
            sectionBtn: 'Button',
            sectionStyle: 'Custom style',
            styleTip: 'Edit the CSS below and click Save; clear and save to restore defaults.',
            styleReset: 'Reset to default template',
            btnCancel: 'Close',
            btnSave: 'Save',
            toggleAdd: 'Not excluded · Click to add',
            toggleRemove: 'Excluded · Click to remove',
            toggleHostFail: 'Unable to read the current hostname',
            editingExcluded: 'Excluded',
            editingNot: 'Not excluded',
            langLabel: 'Language'
        },
        zh: {
            titleTop: '左键：滚到顶部 / 右键：菜单',
            titleBottom: '滚到底部',
            tabExclude: '排除列表',
            tabStyle: '按钮 & 样式',
            excludeTip: '命中后该网站不显示按钮；可点击右侧 × 移除。',
            excludeEmpty: '暂无排除的网站',
            excludeClear: '清空',
            excludeEdit: '编辑文本',
            excludeBack: '返回列表',
            excludeDel: '从排除列表中移除',
            sectionBtn: '按钮',
            sectionStyle: '自定义样式',
            styleTip: '修改下方 CSS 后点「保存」；手动清空并保存可恢复默认。',
            styleReset: '重置为默认模板',
            btnCancel: '关闭',
            btnSave: '保存',
            toggleAdd: '未排除 · 点击加入',
            toggleRemove: '已排除 · 点击移除',
            toggleHostFail: '无法读取当前网站域名',
            editingExcluded: '已排除',
            editingNot: '未排除',
            langLabel: '语言'
        }
    };

    function pickLang(cfg) {
        if (cfg && cfg.lang) return cfg.lang;
        try {
            const lang = (navigator.language || 'en').toLowerCase();
            return lang.startsWith('zh') ? 'zh' : 'en';
        } catch (e) { return 'en'; }
    }

    let uiLang = 'zh';
    function t(key) {
        const dict = I18N[uiLang] || I18N.zh || {};
        return dict[key] || key;
    }

    function parseExcludeList(raw) {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw.map((x) => String(x || '').trim()).filter(Boolean);
        if (typeof raw === 'string') {
            const trimmed = raw.trim();
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                try {
                    const arr = JSON.parse(trimmed);
                    if (Array.isArray(arr)) return arr.map((x) => String(x || '').trim()).filter(Boolean);
                } catch (e) { /* fallthrough */ }
            }
            return raw.split(/[\n,;]/).map((s) => s.trim()).filter(Boolean);
        }
        return [];
    }

    function loadConfig() {
        try {
            let raw = null;
            if (hasGM(GM_getValue)) raw = GM_getValue(STORAGE_KEY, null);
            if (!raw) { try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { /* noop */ } }
            if (!raw) return { ...DEFAULT_CONFIG };
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            const merged = { ...DEFAULT_CONFIG, ...parsed };
            merged.excludeList = parseExcludeList(parsed.excludeList);
            return merged;
        } catch (e) {
            return { ...DEFAULT_CONFIG, excludeList: [] };
        }
    }

    function saveConfig(cfg) {
        const payload = JSON.stringify(cfg);
        try {
            if (hasGM(GM_setValue)) GM_setValue(STORAGE_KEY, payload);
            localStorage.setItem(STORAGE_KEY, payload);
        } catch (e) { /* noop */ }
    }

    function currentHost() { try { return location.hostname || ''; } catch (e) { return ''; } }

    function matchExclude(host, list) {
        if (!host || !Array.isArray(list)) return false;
        const h = host.toLowerCase();
        return list.some((rule) => {
            if (!rule || typeof rule !== 'string') return false;
            const r = rule.trim().toLowerCase();
            return r && (h === r || h.endsWith('.' + r));
        });
    }

    let styleEl;
    function injectStyle(userCss) {
        try {
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'sb-style';
                (document.head || document.documentElement).appendChild(styleEl);
            }
            styleEl.textContent = BASE_CSS + '\n' + ((userCss && userCss.trim()) || DEFAULT_EDITABLE_CSS);
        } catch (e) { /* noop */ }
    }

    let container, topBtn, bottomBtn, menuEl;
    let menuOpen = false;
    let dragging = false;
    let currentCfg = { ...DEFAULT_CONFIG };

    function ensureMount(target) {
        const host = document.body || document.documentElement;
        if (!host || !target) return;
        if (target.parentNode !== host) host.appendChild(target);
    }

    function clampTo(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    function applyPositionToDom(pos) {
        const p = pos || {};
        container.style.right = '';
        container.style.bottom = '';
        const w = window.innerWidth;
        const h = window.innerHeight;
        const cw = container.offsetWidth || 48;
        const ch = container.offsetHeight || 48;
        const leftRatio = clampTo(typeof p.leftRatio === 'number' ? p.leftRatio : 0.85, 0, 1);
        const topRatio = clampTo(typeof p.topRatio === 'number' ? p.topRatio : 0.80, 0, 1);
        container.style.left = clampTo(Math.round(w * leftRatio), 4, Math.max(4, w - cw - 4)) + 'px';
        container.style.top = clampTo(Math.round(h * topRatio), 4, Math.max(4, h - ch - 4)) + 'px';
    }

    function buildButton(cfg) {
        currentCfg = { ...cfg };
        uiLang = pickLang(cfg);

        container = document.createElement('div');
        container.id = 'sb-container';
        container.style.transition = 'opacity .2s ease';
        applyPositionToDom(cfg.position);

        topBtn = document.createElement('button');
        topBtn.className = 'sb-btn';
        topBtn.type = 'button';
        topBtn.title = t('titleTop');
        topBtn.textContent = '▲';
        topBtn.addEventListener('click', (e) => { e.preventDefault(); scrollTop(); });

        bottomBtn = document.createElement('button');
        bottomBtn.className = 'sb-btn';
        bottomBtn.type = 'button';
        bottomBtn.title = t('titleBottom');
        bottomBtn.textContent = '▼';
        bottomBtn.addEventListener('click', (e) => { e.preventDefault(); scrollBottom(); });
        bottomBtn.hidden = !cfg.showBottom;

        container.appendChild(topBtn);
        container.appendChild(bottomBtn);

        container.addEventListener('mouseenter', () => {
            if (container) container.style.opacity = currentCfg.opacityHover;
        });
        container.addEventListener('mouseleave', () => {
            if (!menuOpen && container) container.style.opacity = currentCfg.opacityIdle;
        });
        container.addEventListener('contextmenu', (e) => {
            e.preventDefault(); e.stopPropagation();
            toggleMenu(e.clientX, e.clientY);
        });

        document.addEventListener('mousedown', onDocMouseDown, true);
        setupDrag();
        container.style.opacity = cfg.opacityIdle;

        ensureMount(container);
        setTimeout(() => ensureMount(container), 300);
        setTimeout(() => ensureMount(container), 1500);
    }

    function onDocMouseDown(e) {
        if (!menuOpen) return;
        if (menuEl && (menuEl === e.target || menuEl.contains(e.target))) return;
        if (container && (container === e.target || container.contains(e.target))) return;
        closeMenu();
    }

    function guessScrollTarget() {
        const se = document.scrollingElement;
        if (se && se.scrollHeight > se.clientHeight + 2) return se;

        const candidates = [];
        try {
            document.querySelectorAll('body div, body main, body article, body section, [role="main"]').forEach((el) => {
                try {
                    const oy = getComputedStyle(el).overflowY;
                    if (oy !== 'auto' && oy !== 'scroll') return;
                    if (el.scrollHeight <= el.clientHeight + 2) return;
                    candidates.push(el);
                } catch (e) { /* skip */ }
            });
        } catch (e) { /* skip */ }

        if (candidates.length > 0) {
            candidates.sort((a, b) => b.scrollHeight - a.scrollHeight);
            return candidates[0];
        }
        return document.documentElement;
    }

    function scrollTop() {
        try {
            const target = guessScrollTarget();
            if (target === document.documentElement || target === document.body) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                target.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (e) { try { window.scrollTo(0, 0); } catch (e2) { /* ignore */ } }
    }

    function scrollBottom() {
        try {
            const target = guessScrollTarget();
            const end = (target === document.documentElement || target === document.body)
                ? Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
                : target.scrollHeight;
            const scroller = (target === document.documentElement || target === document.body) ? window : target;
            scroller.scrollTo({ top: end, behavior: 'smooth' });
        } catch (e) {
            try {
                const end = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
                window.scrollTo(0, end);
            } catch (e2) { /* ignore */ }
        }
    }

    function setupDrag() {
        let startX, startY, origLeft, origTop, moved = false;

        container.addEventListener('mousedown', (e) => {
            if (!menuOpen || e.button !== 0) return;
            dragging = true;
            moved = false;
            startX = e.clientX; startY = e.clientY;
            const rect = container.getBoundingClientRect();
            origLeft = rect.left; origTop = rect.top;
            container.classList.add('dragging');
            e.preventDefault(); e.stopPropagation();
        });

        window.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
            const maxLeft = Math.max(4, window.innerWidth - container.offsetWidth - 4);
            const maxTop = Math.max(4, window.innerHeight - container.offsetHeight - 4);
            container.style.right = ''; container.style.bottom = '';
            container.style.left = clampTo(origLeft + dx, 4, maxLeft) + 'px';
            container.style.top = clampTo(origTop + dy, 4, maxTop) + 'px';
        }, { passive: true });

        window.addEventListener('mouseup', () => {
            if (!dragging) return;
            dragging = false;
            container.classList.remove('dragging');
            if (moved) {
                const cfg = loadConfig();
                const w = window.innerWidth;
                const h = window.innerHeight;
                const newLeft = parseFloat(container.style.left) || 0;
                const newTop = parseFloat(container.style.top) || 0;
                cfg.position = {
                    leftRatio: clampTo(newLeft / w, 0, 1),
                    topRatio: clampTo(newTop / h, 0, 1)
                };
                saveConfig(cfg);
                currentCfg.position = cfg.position;
            }
        });
    }

    function keepButtonInView() {
        if (!container) return;
        applyPositionToDom(currentCfg.position);
    }
    window.addEventListener('resize', keepButtonInView);
    window.addEventListener('orientationchange', keepButtonInView);

    function toggleMenu(x, y) {
        if (menuOpen) { closeMenu(); return; }
        openMenu(x, y);
    }

    function openMenu() {
        menuOpen = true;
        if (container) container.style.opacity = currentCfg.opacityHover;

        const cfg = loadConfig();
        currentCfg = { ...cfg };
        uiLang = pickLang(cfg);

        const host = currentHost() || '-';
        const excludeArr = Array.isArray(cfg.excludeList) ? cfg.excludeList.slice() : [];
        const initialCss = (cfg.customCss && cfg.customCss.trim()) ? cfg.customCss : DEFAULT_EDITABLE_CSS;

        menuEl = document.createElement('div');
        menuEl.id = 'sb-menu';
        menuEl.innerHTML = `
          <div class="sb-tabs">
            <button class="sb-tab active" data-tab="exclude">${t('tabExclude')}</button>
            <button class="sb-tab" data-tab="style">${t('tabStyle')}</button>
            <span class="sb-tab-spacer"></span>
            <button class="sb-tab" id="sb-close">✕</button>
          </div>

          <div class="sb-panel active" data-panel="exclude">
            <button id="sb-toggle-current">
              <span id="sb-toggle-icon"></span>
              <span id="sb-toggle-text"></span>
              <span id="sb-toggle-hint"></span>
            </button>
            <div class="sb-head"><h4>${t('tabExclude')}</h4></div>
            <div class="sb-tip">${t('excludeTip')}</div>
            <div id="sb-exclude-list"></div>
            <textarea id="sb-exclude" spellcheck="false" style="display:none;"></textarea>
            <div class="sb-row">
              <button class="sb-mini" id="sb-clear-exclude">${t('excludeClear')}</button>
              <button class="sb-mini" id="sb-toggle-edit">${t('excludeEdit')}</button>
            </div>
          </div>

          <div class="sb-panel" data-panel="style">
            <h4>${t('sectionBtn')}</h4>
            <label><input type="checkbox" id="sb-opt-bottom" ${cfg.showBottom ? 'checked' : ''}> ${t('titleBottom')}</label>
            <div class="sb-row">
              <label style="margin:0;display:flex;align-items:center;gap:8px;color:#ccc;font-size:12px;">
                <span>${t('langLabel')}</span>
                <select id="sb-lang" style="background:#1f1f1f;color:#eee;border:1px solid #3a3a3a;border-radius:4px;padding:2px 4px;font-size:12px;">
                  <option value="zh" ${uiLang === 'zh' ? 'selected' : ''}>中文</option>
                  <option value="en" ${uiLang === 'en' ? 'selected' : ''}>English</option>
                </select>
              </label>
            </div>
            <h4>${t('sectionStyle')}</h4>
            <div class="sb-tip">${t('styleTip')}</div>
            <textarea id="sb-css" spellcheck="false">${initialCss}</textarea>
            <div class="sb-row">
              <button class="sb-mini" id="sb-reset-css">${t('styleReset')}</button>
            </div>
          </div>

          <div class="sb-save-row">
            <button class="sb-ghost" id="sb-cancel">${t('btnCancel')}</button>
            <button class="sb-primary" id="sb-save">${t('btnSave')}</button>
          </div>`;
        ensureMount(menuEl);

        menuEl.querySelectorAll('.sb-tab').forEach((tab) => {
            tab.addEventListener('click', () => {
                menuEl.querySelectorAll('.sb-tab').forEach((t) => t.classList.remove('active'));
                tab.classList.add('active');
                const name = tab.getAttribute('data-tab');
                menuEl.querySelectorAll('.sb-panel').forEach((p) => {
                    p.classList.toggle('active', p.getAttribute('data-panel') === name);
                });
            });
        });

        const toggleBtn = menuEl.querySelector('#sb-toggle-current');
        const toggleIcon = menuEl.querySelector('#sb-toggle-icon');
        const toggleText = menuEl.querySelector('#sb-toggle-text');
        const toggleHint = menuEl.querySelector('#sb-toggle-hint');

        let currentExcludes = excludeArr.slice();
        const listEl = menuEl.querySelector('#sb-exclude-list');
        const ta = menuEl.querySelector('#sb-exclude');
        const editModeBtn = menuEl.querySelector('#sb-toggle-edit');

        function persistExcludes() {
            const cfg = loadConfig();
            cfg.excludeList = dedupe(currentExcludes);
            saveConfig(cfg);
            currentCfg.excludeList = cfg.excludeList;
        }
        function dedupe(arr) {
            const seen = new Set();
            const out = [];
            for (const h of arr) {
                const v = (h || '').trim();
                if (!v) continue;
                const key = v.toLowerCase();
                if (seen.has(key)) continue;
                seen.add(key);
                out.push(v);
            }
            return out;
        }

        function refreshList() {
            currentExcludes = dedupe(currentExcludes);
            listEl.innerHTML = '';
            if (currentExcludes.length === 0) {
                const empty = document.createElement('div');
                empty.id = 'sb-exclude-empty';
                empty.textContent = t('excludeEmpty');
                listEl.appendChild(empty);
            } else {
                currentExcludes.forEach((domain) => {
                    const row = document.createElement('div');
                    row.className = 'sb-item';

                    const text = document.createElement('span');
                    text.textContent = domain;
                    text.style.cssText = 'flex:1;color:#ddd;word-break:break-all;';

                    const del = document.createElement('button');
                    del.className = 'sb-del';
                    del.textContent = '×';
                    del.title = t('excludeDel');
                    del.addEventListener('click', () => {
                        currentExcludes = currentExcludes.filter((x) => x !== domain);
                        syncTextareaFromList();
                        refreshList();
                        persistExcludes();
                    });

                    row.appendChild(text);
                    row.appendChild(del);
                    listEl.appendChild(row);
                });
            }
            refreshToggleBtn();
        }
        function syncTextareaFromList() { ta.value = currentExcludes.join('\n'); }

        function refreshToggleBtn() {
            if (!host || host === '-') {
                toggleIcon.textContent = '—';
                toggleText.textContent = t('toggleHostFail');
                toggleHint.textContent = '';
                toggleBtn.disabled = true;
                return;
            }
            const isIn = currentExcludes.includes(host);
            toggleIcon.textContent = isIn ? '✓' : '✕';
            toggleIcon.style.color = isIn ? '#5dd28b' : '#e08282';
            toggleText.textContent = host;
            toggleHint.textContent = isIn ? t('toggleRemove') : t('toggleAdd');
            toggleBtn.disabled = false;
        }
        refreshList();
        syncTextareaFromList();

        toggleBtn.addEventListener('click', () => {
            if (!host || host === '-') return;
            if (currentExcludes.includes(host)) {
                currentExcludes = currentExcludes.filter((x) => x !== host);
            } else {
                currentExcludes.push(host);
            }
            refreshList();
            syncTextareaFromList();
            persistExcludes();
        });

        editModeBtn.addEventListener('click', () => {
            const isList = listEl.style.display !== 'none';
            if (isList) {
                listEl.style.display = 'none';
                ta.style.display = 'block';
                ta.value = currentExcludes.join('\n');
                editModeBtn.textContent = t('excludeBack');
            } else {
                currentExcludes = ta.value.split('\n').map((s) => s.trim()).filter(Boolean);
                ta.style.display = 'none';
                listEl.style.display = '';
                editModeBtn.textContent = t('excludeEdit');
                refreshList();
                persistExcludes();
            }
        });
        ta.addEventListener('blur', () => {
            currentExcludes = ta.value.split('\n').map((s) => s.trim()).filter(Boolean);
            refreshToggleBtn();
            persistExcludes();
        });
        ta.addEventListener('input', () => {
            if (ta.style.display !== 'block') return;
            const fromText = ta.value.split('\n').map((s) => s.trim()).filter(Boolean);
            const hostIn = fromText.includes(host);
            if (host && host !== '-') {
                toggleIcon.textContent = hostIn ? '✓' : '✕';
                toggleIcon.style.color = hostIn ? '#5dd28b' : '#e08282';
                toggleHint.textContent = hostIn ? t('editingExcluded') : t('editingNot');
            }
        });

        menuEl.querySelector('#sb-clear-exclude').onclick = () => {
            const editing = ta.style.display === 'block';
            currentExcludes = [];
            refreshList();
            if (editing) ta.value = ''; else syncTextareaFromList();
            persistExcludes();
        };

        function positionMenu() {
            const menuW = 360, menuH = 520;
            const btn = container.getBoundingClientRect();
            const vw = window.innerWidth, vh = window.innerHeight;
            const gap = 14;
            const cx = btn.left + btn.width / 2;
            const cy = btn.top + btn.height / 2;
            const btnOnRight = cx > vw / 2;
            const btnOnBottom = cy > vh / 2;

            let leftPos = btnOnRight
                ? Math.max(8, btn.left - menuW - gap)
                : Math.min(vw - menuW - 8, btn.right + gap);
            if (btnOnRight && leftPos < 8 && (vw - btn.right - gap) >= menuW) {
                leftPos = Math.min(vw - menuW - 8, btn.right + gap);
            }
            if (!btnOnRight && leftPos + menuW > vw - 8 && btn.left - gap >= menuW) {
                leftPos = Math.max(8, btn.left - menuW - gap);
            }

            let topPos = btnOnBottom
                ? Math.max(8, btn.top - menuH - gap)
                : Math.min(vh - menuH - 8, btn.bottom + gap);
            if (btnOnBottom && topPos < 8 && (vh - btn.bottom - gap) >= menuH) {
                topPos = Math.min(vh - menuH - 8, btn.bottom + gap);
            }
            if (!btnOnBottom && topPos + menuH > vh - 8 && btn.top - gap >= menuH) {
                topPos = Math.max(8, btn.top - menuH - gap);
            }

            const overlapX = leftPos < btn.right && (leftPos + menuW) > btn.left;
            const overlapY = topPos < btn.bottom && (topPos + menuH) > btn.top;
            if (overlapX && overlapY) {
                const corners = [
                    { l: 8, t: 8 },
                    { l: vw - menuW - 8, t: 8 },
                    { l: 8, t: vh - menuH - 8 },
                    { l: vw - menuW - 8, t: vh - menuH - 8 }
                ];
                let best = corners[0], bestDist = 0;
                corners.forEach((c) => {
                    const cxC = c.l + menuW / 2;
                    const cyC = c.t + menuH / 2;
                    const d = (cxC - cx) * (cxC - cx) + (cyC - cy) * (cyC - cy);
                    if (d > bestDist) { bestDist = d; best = c; }
                });
                leftPos = Math.max(8, best.l);
                topPos = Math.max(8, best.t);
            }

            menuEl.style.left = leftPos + 'px';
            menuEl.style.top = topPos + 'px';
        }
        positionMenu();

        menuEl.querySelector('#sb-close').onclick = () => closeMenu();
        menuEl.querySelector('#sb-cancel').onclick = () => closeMenu();
        menuEl.querySelector('#sb-reset-css').onclick = () => {
            menuEl.querySelector('#sb-css').value = DEFAULT_EDITABLE_CSS;
        };

        const langSel = menuEl.querySelector('#sb-lang');
        if (langSel) {
            langSel.addEventListener('change', () => {
                uiLang = langSel.value;
                currentCfg.lang = uiLang;

                menuEl.querySelectorAll('.sb-tab').forEach((tab) => {
                    const name = tab.getAttribute('data-tab');
                    if (!name) return;
                    tab.textContent = name === 'exclude' ? t('tabExclude') : t('tabStyle');
                });

                menuEl.querySelectorAll('.sb-panel').forEach((panel) => {
                    const name = panel.getAttribute('data-panel');
                    if (name === 'exclude') {
                        const head = panel.querySelector('.sb-head h4');
                        if (head) head.textContent = t('tabExclude');
                        const tip = panel.querySelector('.sb-tip');
                        if (tip) tip.textContent = t('excludeTip');
                        const empty = panel.querySelector('#sb-exclude-empty');
                        if (empty) empty.textContent = t('excludeEmpty');
                        const clearBtn = panel.querySelector('#sb-clear-exclude');
                        if (clearBtn) clearBtn.textContent = t('excludeClear');
                        const editBtn = panel.querySelector('#sb-toggle-edit');
                        if (editBtn) {
                            const isList = listEl.style.display !== 'none';
                            editBtn.textContent = isList ? t('excludeEdit') : t('excludeBack');
                        }
                        panel.querySelectorAll('.sb-item .sb-del').forEach((b) => { b.title = t('excludeDel'); });
                    } else if (name === 'style') {
                        const heads = panel.querySelectorAll('h4');
                        if (heads[0]) heads[0].textContent = t('sectionBtn');
                        if (heads[1]) heads[1].textContent = t('sectionStyle');
                        const optLabel = panel.querySelector('label');
                        if (optLabel) optLabel.lastChild.textContent = ' ' + t('titleBottom');
                        const tip = panel.querySelector('.sb-tip');
                        if (tip) tip.textContent = t('styleTip');
                        const resetBtn = panel.querySelector('#sb-reset-css');
                        if (resetBtn) resetBtn.textContent = t('styleReset');
                        const langLabel = panel.querySelector('label span');
                        if (langLabel) langLabel.textContent = t('langLabel');
                    }
                });

                refreshList();
                refreshToggleBtn();
                menuEl.querySelector('#sb-cancel').textContent = t('btnCancel');
                menuEl.querySelector('#sb-save').textContent = t('btnSave');
            });
        }

        menuEl.querySelector('#sb-save').onclick = () => {
            if (ta.style.display === 'block') {
                currentExcludes = ta.value.split('\n').map((s) => s.trim()).filter(Boolean);
            }
            const newCfg = loadConfig();
            newCfg.showBottom = menuEl.querySelector('#sb-opt-bottom').checked;
            newCfg.excludeList = dedupe(currentExcludes);
            newCfg.lang = uiLang;
            const cssVal = menuEl.querySelector('#sb-css').value;
            newCfg.customCss = (cssVal.trim() === DEFAULT_EDITABLE_CSS.trim()) ? '' : cssVal;
            saveConfig(newCfg);
            applyConfig(newCfg);
            closeMenu();
        };

        menuEl.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    function closeMenu() {
        menuOpen = false;
        if (menuEl && menuEl.parentNode) menuEl.parentNode.removeChild(menuEl);
        menuEl = null;
        if (container) container.style.opacity = currentCfg.opacityIdle;
    }

    function applyConfig(cfg) {
        currentCfg = { ...cfg };
        uiLang = pickLang(cfg);
        if (topBtn) topBtn.title = t('titleTop');
        if (bottomBtn) bottomBtn.title = t('titleBottom');
        if (bottomBtn) bottomBtn.hidden = !cfg.showBottom;
        if (container) {
            applyPositionToDom(cfg.position);
            container.style.opacity = cfg.opacityIdle;
        }
        injectStyle(cfg.customCss);
    }

    function init() {
        try {
            const cfg = loadConfig();
            const host = currentHost();
            if (matchExclude(host, cfg.excludeList)) return;
            injectStyle(cfg.customCss);
            buildButton(cfg);
        } catch (e) { /* noop */ }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
