/* === Custom Crack - 커스텀 JS === */

(function () {
  // 중복 실행 방지
  if (document.getElementById('cc-fab')) return;

  // Mac 플랫폼 감지 → CSS 클래스 부여
  if (window.customCrack?.platform === 'darwin') {
    document.body.classList.add('cc-mac');
  }

  // ── 상태 ──
  let fontSize = 100;
  let isImmersive = false;
  let isFullscreen = false;
  let isFabHidden = false;
  let isCodeblockClean = false;
  let isCrackerShow = false;

  // 단축키 매핑 (버튼ID → {ctrl, shift, alt, key})
  const defaultShortcuts = {
    'cc-fullscreen': { ctrl: false, shift: false, alt: false, key: 'F11' },
    'cc-immersive': { ctrl: false, shift: false, alt: false, key: 'F10' },
    'cc-hide-fab': { ctrl: false, shift: false, alt: false, key: 'F9' },
    'cc-usernote': { ctrl: false, shift: false, alt: false, key: 'F8' },
    'cc-chatprofile': { ctrl: false, shift: false, alt: false, key: 'F7' },
    'cc-summary-memory': { ctrl: false, shift: false, alt: false, key: 'F6' },
  };
  let shortcuts = JSON.parse(JSON.stringify(defaultShortcuts));

  function formatShortcut(s) {
    const parts = [];
    if (s.ctrl) parts.push('Ctrl');
    if (s.shift) parts.push('Shift');
    if (s.alt) parts.push('Alt');
    parts.push(s.key);
    return parts.join('+');
  }

  function matchShortcut(e, s) {
    return e.key === s.key &&
      e.ctrlKey === s.ctrl &&
      e.shiftKey === s.shift &&
      e.altKey === s.alt;
  }

  // ── 메뉴 패널 ──
  const menu = document.createElement('div');
  menu.id = 'cc-menu';
  menu.innerHTML = `
    <div class="cc-section">화면</div>
    <button id="cc-fullscreen"><span class="cc-icon">⛶</span><span>전체화면</span><span class="cc-shortcut">F11</span></button>
    <button id="cc-immersive"><span class="cc-icon">👁</span><span>몰입모드</span><span class="cc-shortcut">F10</span></button>
    <button id="cc-hide-fab"><span class="cc-icon">👻</span><span>버튼 숨기기</span><span class="cc-shortcut">F9</span></button>
    <div id="cc-codeblock-toggle">
      <span class="cc-theme-label">상태창</span>
      <div class="cc-toggle-track">
        <button id="cc-codeblock-default" class="cc-toggle-btn" title="기본"><svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/><line x1="1" y1="4.5" x2="13" y2="4.5" stroke="currentColor" stroke-width="1.3"/></svg></button>
        <button id="cc-codeblock-clean" class="cc-toggle-btn" title="클린"><svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg></button>
      </div>
    </div>
    <div id="cc-theme-toggle">
      <span class="cc-theme-label">테마</span>
      <div class="cc-toggle-track">
        <button id="cc-theme-light" class="cc-toggle-btn" title="라이트">☀</button>
        <button id="cc-theme-dark" class="cc-toggle-btn" title="다크">🌙</button>
      </div>
    </div>

    <div class="cc-section">편의 기능</div>
    <button id="cc-usernote"><span class="cc-icon">📝</span><span>유저노트</span><span class="cc-shortcut">F8</span></button>
    <button id="cc-chatprofile"><span class="cc-icon">👤</span><span>대화 프로필</span><span class="cc-shortcut">F7</span></button>
    <button id="cc-summary-memory"><span class="cc-icon">🧠</span><span>요약 메모리</span><span class="cc-shortcut">F6</span></button>
    <button id="cc-cracker-toggle"><span class="cc-icon">🪙</span><span>크래커 표시</span></button>

    <div class="cc-section">채팅 너비</div>
    <div id="cc-width-controls">
      <button id="cc-width-down">−</button>
      <span id="cc-width-label">100%</span>
      <button id="cc-width-up">+</button>
      <button id="cc-width-reset" style="margin-left:4px;font-size:12px;">초기화</button>
    </div>

    <div class="cc-section">폰트 크기</div>
    <div id="cc-font-controls">
      <button id="cc-font-down">−</button>
      <span id="cc-font-size-label">100%</span>
      <button id="cc-font-up">+</button>
      <button id="cc-font-reset" style="margin-left:4px;font-size:12px;">초기화</button>
    </div>
  `;
  document.body.appendChild(menu);

  // ── 몰입모드 드래그 바 ──
  const dragBar = document.createElement('div');
  dragBar.id = 'cc-immersive-drag';
  document.body.appendChild(dragBar);

  // ── 플로팅 버튼 ──
  const fab = document.createElement('button');
  fab.id = 'cc-fab';
  fab.textContent = '⚙';
  fab.title = 'Custom Crack 메뉴';
  document.body.appendChild(fab);

  fab.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menu.classList.toggle('show');
    fab.classList.toggle('open', open);
  });

  // capture 단계에서 메뉴 외부 클릭 감지 (채팅 영역 포함)
  let menuLocked = false;
  let menuReady = false;
  setTimeout(() => { menuReady = true; }, 500);
  menu.addEventListener('click', () => {
    menuLocked = true;
    setTimeout(() => { menuLocked = false; }, 1000);
  });
  document.addEventListener('click', (e) => {
    if (!menuReady || menuLocked) return;
    if (!menu.contains(e.target) && !fab.contains(e.target)) {
      menu.classList.remove('show');
      fab.classList.remove('open');
    }
  }, true);

  // ── 전체화면 (Electron API) ──
  document.getElementById('cc-fullscreen').addEventListener('click', () => {
    window.customCrack?.toggleFullscreen();
  });

  window.customCrack?.onFullscreenChange((isFullscreen) => {
    const btn = document.getElementById('cc-fullscreen');
    btn.querySelectorAll('span')[1].textContent = isFullscreen ? '전체화면 해제' : '전체화면';
    btn.classList.toggle('active', isFullscreen);
  });

  // ── 몰입모드 ──
  document.getElementById('cc-immersive').addEventListener('click', () => {
    const btn = document.getElementById('cc-immersive');
    isImmersive = !isImmersive;
    document.body.classList.toggle('cc-immersive', isImmersive);
    btn.querySelectorAll('span')[1].textContent = isImmersive ? '몰입모드 해제' : '몰입모드';
    btn.classList.toggle('active', isImmersive);

    // Mac: 몰입모드 시 트래픽 라이트 숨기기
    window.customCrack?.setTrafficLightsVisible(!isImmersive);

    saveSettings();
  });

  // ── 단축키 (동적 매핑) ──
  let isListeningForKey = null; // 키 변경 대기 중인 버튼 ID

  document.addEventListener('keydown', (e) => {
    // Ctrl/Shift/Alt 단독 입력은 무시
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    // 키 변경 대기 중이면 새 키 할당
    if (isListeningForKey) {
      e.preventDefault();
      const btnId = isListeningForKey;
      const newSc = {
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        key: e.key,
      };

      // 중복 확인
      for (const [otherId, sc] of Object.entries(shortcuts)) {
        if (otherId !== btnId && sc.key === newSc.key && sc.ctrl === newSc.ctrl && sc.shift === newSc.shift && sc.alt === newSc.alt) {
          const label = document.querySelector(`#${btnId} .cc-shortcut`);
          if (label) {
            label.textContent = '중복!';
            setTimeout(() => {
              label.textContent = formatShortcut(shortcuts[btnId]);
              label.classList.remove('cc-shortcut-listening');
            }, 800);
          }
          isListeningForKey = null;
          return;
        }
      }

      isListeningForKey = null;
      shortcuts[btnId] = newSc;
      const label = document.querySelector(`#${btnId} .cc-shortcut`);
      if (label) {
        label.textContent = formatShortcut(newSc);
        label.classList.remove('cc-shortcut-listening');
      }
      saveSettings();
      return;
    }

    // 단축키 실행
    for (const [btnId, sc] of Object.entries(shortcuts)) {
      if (matchShortcut(e, sc)) {
        e.preventDefault();
        document.getElementById(btnId)?.click();
        return;
      }
    }
  });

  // 단축키 라벨 클릭 → 변경 모드
  document.querySelectorAll('#cc-menu .cc-shortcut').forEach(label => {
    label.addEventListener('click', (e) => {
      e.stopPropagation();
      // 이전 대기 상태 해제
      if (isListeningForKey) {
        const prev = document.querySelector(`#${isListeningForKey} .cc-shortcut`);
        if (prev) {
          prev.textContent = shortcuts[isListeningForKey];
          prev.classList.remove('cc-shortcut-listening');
        }
      }
      const btnId = label.closest('button')?.id;
      if (!btnId || !shortcuts[btnId]) return;
      isListeningForKey = btnId;
      label.textContent = '...';
      label.classList.add('cc-shortcut-listening');
    });
  });

  // ── 상태창 스타일 토글 ──
  const cbDefault = document.getElementById('cc-codeblock-default');
  const cbClean = document.getElementById('cc-codeblock-clean');

  function updateCodeblockUI() {
    cbDefault.classList.toggle('active', !isCodeblockClean);
    cbClean.classList.toggle('active', isCodeblockClean);
    document.body.classList.toggle('cc-codeblock-clean', isCodeblockClean);
  }

  cbDefault.addEventListener('click', () => {
    isCodeblockClean = false;
    updateCodeblockUI();
    saveSettings();
  });

  cbClean.addEventListener('click', () => {
    isCodeblockClean = true;
    updateCodeblockUI();
    saveSettings();
  });

  // ── 사이드 패널 버튼 공통 로직 ──
  function clickPanelButton(keyword) {
    menu.classList.remove('show');
    fab.classList.remove('open');

    const subHeader = document.querySelector('main .absolute.top-0.left-0');
    if (!subHeader) return;
    const buttons = subHeader.querySelectorAll('button');
    const moreBtn = buttons[buttons.length - 1];
    if (!moreBtn) return;

    // 패널이 이미 열려있는지 확인
    const panel = document.querySelector('.bg-background.border-l');
    const panelOpen = panel && panel.offsetWidth > 10;

    if (panelOpen) {
      // 이미 열려있으면 바로 버튼 찾아서 클릭
      const allBtns = document.querySelectorAll('button, [role="button"]');
      for (const btn of allBtns) {
        if (btn.textContent.trim().includes(keyword)) {
          btn.click();
          return;
        }
      }
    } else {
      menuLocked = true;
      const hideStyle = document.createElement('style');
      hideStyle.id = 'cc-hide-panel-temp';
      hideStyle.textContent = `
        .bg-background.border-l {
          position: fixed !important;
          right: -9999px !important;
          opacity: 0 !important;
        }
      `;
      document.head.appendChild(hideStyle);
      moreBtn.click();

      setTimeout(() => {
        const allBtns = document.querySelectorAll('button, [role="button"]');
        for (const btn of allBtns) {
          if (btn.textContent.trim().includes(keyword)) {
            btn.click();
            setTimeout(() => {
              moreBtn.click();
              setTimeout(() => {
                hideStyle.remove();
                menuLocked = false;
              }, 500);
            }, 200);
            return;
          }
        }
        moreBtn.click();
        hideStyle.remove();
        menuLocked = false;
      }, 300);
    }
  }

  // ── 유저노트 ──
  document.getElementById('cc-usernote').addEventListener('click', () => {
    clickPanelButton('유저 노트');
  });

  // ── 대화 프로필 ──
  document.getElementById('cc-chatprofile').addEventListener('click', () => {
    clickPanelButton('대화 프로필');
  });

  // ── 요약 메모리 ──
  document.getElementById('cc-summary-memory').addEventListener('click', () => {
    clickPanelButton('요약 메모리');
  });

  // ── 버튼 숨기기 ──
  document.getElementById('cc-hide-fab').addEventListener('click', () => {
    const btn = document.getElementById('cc-hide-fab');
    isFabHidden = !isFabHidden;
    fab.classList.toggle('cc-hidden-mode', isFabHidden);
    btn.querySelectorAll('span')[1].textContent = isFabHidden ? '버튼 표시' : '버튼 숨기기';
    btn.classList.toggle('active', isFabHidden);
    saveSettings();
  });


  // ── 크래커 표시 ──
  let crackerBadge = null;
  let crackerInterval = null;

  function findHeaderGap() {
    // 검색창과 아이콘 영역 사이의 부모 (gap-5.ml-auto.shrink)
    const parent = document.querySelector('.gap-5.ml-auto.shrink');
    return parent;
  }

  function fetchCrackerCount() {
    const subHeader = document.querySelector('main .absolute.top-0.left-0');
    if (!subHeader) return;
    const buttons = subHeader.querySelectorAll('button');
    const moreBtn = buttons[buttons.length - 1];
    if (!moreBtn) return;

    // 패널이 이미 열려있는지 확인
    const panel = document.querySelector('.bg-background.border-l');
    const panelOpen = panel && panel.offsetWidth > 10;

    function readCount() {
      const spans = document.querySelectorAll('span.whitespace-nowrap.overflow-hidden.text-ellipsis');
      for (const span of spans) {
        const text = span.textContent.trim();
        if (/^[\d,]+$/.test(text)) {
          updateCrackerBadge(text);
          break;
        }
      }
    }

    if (panelOpen) {
      readCount();
    } else {
      menuLocked = true;
      const hideStyle = document.createElement('style');
      hideStyle.id = 'cc-hide-panel-cracker';
      hideStyle.textContent = `
        .bg-background.border-l {
          position: fixed !important;
          right: -9999px !important;
          opacity: 0 !important;
        }
      `;
      document.head.appendChild(hideStyle);
      moreBtn.click();

      setTimeout(() => {
        readCount();
        moreBtn.click();
        setTimeout(() => {
          hideStyle.remove();
          menuLocked = false;
        }, 500);
      }, 400);
    }
  }

  function updateCrackerBadge(count) {
    const headerGap = findHeaderGap();
    if (!headerGap) return;
    if (!crackerBadge) {
      crackerBadge = document.createElement('span');
      crackerBadge.id = 'cc-cracker-badge';
      crackerBadge.style.cssText = `
        font-size: 14px;
        color: #f59e0b;
        font-weight: 700;
        font-family: -apple-system, 'Segoe UI', sans-serif;
        white-space: nowrap;
        flex-shrink: 0;
        -webkit-app-region: no-drag;
        display: flex;
        align-items: center;
        height: 40px;
      `;
      // 크래커 아이콘(css-79elbk) 바로 앞에 삽입
      const iconsArea = headerGap.querySelector('.flex.items-center.shrink-0');
      const crackerIcon = iconsArea?.querySelector('.css-79elbk');
      if (crackerIcon) {
        crackerIcon.parentElement.insertBefore(crackerBadge, crackerIcon);
      } else if (iconsArea) {
        headerGap.insertBefore(crackerBadge, iconsArea);
      } else {
        headerGap.appendChild(crackerBadge);
      }
    }
    crackerBadge.textContent = count;
  }

  function removeCrackerBadge() {
    if (crackerBadge) {
      crackerBadge.remove();
      crackerBadge = null;
    }
    if (crackerInterval) {
      clearInterval(crackerInterval);
      crackerInterval = null;
    }
  }

  document.getElementById('cc-cracker-toggle').addEventListener('click', () => {
    const btn = document.getElementById('cc-cracker-toggle');
    isCrackerShow = !isCrackerShow;
    btn.classList.toggle('active', isCrackerShow);
    if (isCrackerShow) {
      fetchCrackerCount();
      crackerInterval = setInterval(fetchCrackerCount, 60000);
      startChatSendDetection();
    } else {
      removeCrackerBadge();
      stopChatSendDetection();
    }
    saveSettings();
  });

  // 채팅 전송 감지 → 크래커 수치 갱신 (DOM 변화 감지)
  let chatSendObserver = null;
  let chatSendTimeout = null;

  function startChatSendDetection() {
    const chatArea = document.querySelector('main [class*="stick-to-bottom"]');
    if (chatArea) {
      chatSendObserver = new MutationObserver(() => {
        if (isCrackerShow) {
          clearTimeout(chatSendTimeout);
          chatSendTimeout = setTimeout(fetchCrackerCount, 1000);
        }
      });
      chatSendObserver.observe(chatArea, { childList: true, subtree: true });
    }
  }

  function stopChatSendDetection() {
    if (chatSendObserver) {
      chatSendObserver.disconnect();
      chatSendObserver = null;
    }
    clearTimeout(chatSendTimeout);
  }

  // ── 설정 저장/복원 ──
  function saveSettings() {
    localStorage.setItem('cc-settings', JSON.stringify({
      fontSize,
      chatWidth,
      fabHidden: isFabHidden,
      codeblockClean: isCodeblockClean,
      crackerShow: isCrackerShow,
      shortcuts,
    }));
  }

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('cc-settings'));
      if (s) {
        fontSize = s.fontSize ?? 100;
        chatWidth = s.chatWidth ?? 100;
        if (s.fabHidden) {
          isFabHidden = true;
          fab.classList.add('cc-hidden-mode');
          document.getElementById('cc-hide-fab').querySelectorAll('span')[1].textContent = '버튼 표시';
          document.getElementById('cc-hide-fab').classList.add('active');
        }
        if (s.codeblockClean) {
          isCodeblockClean = true;
        }
        if (s.shortcuts) {
          // 이전 형식(문자열)과 새 형식(객체) 모두 지원
          for (const [btnId, val] of Object.entries(s.shortcuts)) {
            if (typeof val === 'string') {
              shortcuts[btnId] = { ctrl: false, shift: false, alt: false, key: val };
            } else if (val && val.key) {
              shortcuts[btnId] = val;
            }
          }
          for (const [btnId, sc] of Object.entries(shortcuts)) {
            const label = document.querySelector(`#${btnId} .cc-shortcut`);
            if (label) label.textContent = formatShortcut(sc);
          }
        }
        if (s.crackerShow) {
          isCrackerShow = true;
          document.getElementById('cc-cracker-toggle').classList.add('active');
          setTimeout(() => {
            fetchCrackerCount();
            crackerInterval = setInterval(fetchCrackerCount, 60000);
            startChatSendDetection();
          }, 1000);
        }
      }
    } catch(e) {}
  }

  // ── 채팅 너비 조정 ──
  let chatWidth = 100;
  const widthLabel = document.getElementById('cc-width-label');
  const WIDTH_STYLE_ID = 'cc-width-style';

  // 기본 콘텐츠 max-width를 px로 캡처
  let baseMaxWidth = 0;
  (function captureBase() {
    const targets = document.querySelectorAll('main [class*="stick-to-bottom"] [class*="max-w"]');
    for (const el of targets) {
      const computed = getComputedStyle(el).maxWidth;
      const px = parseInt(computed);
      if (px > 100) { baseMaxWidth = px; break; }
    }
    if (!baseMaxWidth) baseMaxWidth = 768;
    console.log('[CustomCrack] 채팅 기본 너비:', baseMaxWidth + 'px');
  })();

  function applyChatWidth() {
    widthLabel.textContent = chatWidth + '%';
    const targetPx = Math.round(baseMaxWidth * chatWidth / 100);
    let styleEl = document.getElementById(WIDTH_STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = WIDTH_STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      main [class*="stick-to-bottom"] [class*="max-w"],
      main [class*="stick-to-bottom"] [style*="max-width"] {
        max-width: ${targetPx}px !important;
      }
    `;
    saveSettings();
  }

  document.getElementById('cc-width-up').addEventListener('click', () => {
    chatWidth = Math.min(250, chatWidth + 10);
    applyChatWidth();
  });

  document.getElementById('cc-width-down').addEventListener('click', () => {
    chatWidth = Math.max(50, chatWidth - 10);
    applyChatWidth();
  });

  document.getElementById('cc-width-reset').addEventListener('click', () => {
    chatWidth = 100;
    applyChatWidth();
  });

  // ── 폰트 크기 조정 (채팅 메시지만) ──
  const label = document.getElementById('cc-font-size-label');
  const FONT_STYLE_ID = 'cc-font-style';

  function getScrollContainer() {
    // 채팅 스크롤 컨테이너 찾기
    const candidates = document.querySelectorAll('main div[class*="overflow"]');
    for (const el of candidates) {
      if (el.scrollHeight > el.clientHeight) return el;
    }
    // fallback: main 내부에서 스크롤 가능한 첫 번째 요소
    const all = document.querySelectorAll('main *');
    for (const el of all) {
      if (el.scrollHeight > el.clientHeight + 10 && getComputedStyle(el).overflowY !== 'visible') return el;
    }
    return document.documentElement;
  }

  function applyFontSize() {
    document.documentElement.style.fontSize = '';
    label.textContent = fontSize + '%';

    // 스크롤 위치 비율 저장
    const sc = getScrollContainer();
    const maxScroll = sc.scrollHeight - sc.clientHeight;
    const ratio = maxScroll > 0 ? sc.scrollTop / maxScroll : 0;

    let styleEl = document.getElementById(FONT_STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = FONT_STYLE_ID;
      document.head.appendChild(styleEl);
    }
    const px = Math.round(16 * fontSize / 100);
    styleEl.textContent = `
      main p, main span:not([class*="typo-text-xs"]), main li, main td, main th,
      main pre, main code, main blockquote,
      main em, main i, main strong, main b, main a {
        font-size: ${px}px !important;
        line-height: 1.6 !important;
      }
      main h1 { font-size: ${Math.round(px * 1.8)}px !important; }
      main h2 { font-size: ${Math.round(px * 1.5)}px !important; }
      main h3 { font-size: ${Math.round(px * 1.25)}px !important; }
      main h4, main h5, main h6 { font-size: ${Math.round(px * 1.1)}px !important; }
      textarea.rc-textarea { font-size: ${px}px !important; }
    `;

    // 스크롤 위치 복원
    requestAnimationFrame(() => {
      const newMax = sc.scrollHeight - sc.clientHeight;
      sc.scrollTop = ratio * newMax;
    });

    saveSettings();
  }

  document.getElementById('cc-font-up').addEventListener('click', () => {
    fontSize = Math.min(200, fontSize + 10);
    applyFontSize();
  });

  document.getElementById('cc-font-down').addEventListener('click', () => {
    fontSize = Math.max(50, fontSize - 10);
    applyFontSize();
  });

  document.getElementById('cc-font-reset').addEventListener('click', () => {
    fontSize = 100;
    applyFontSize();
  });

  // ── 테마 변경 ──
  const lightBtn = document.getElementById('cc-theme-light');
  const darkBtn = document.getElementById('cc-theme-dark');

  function applyTheme(theme) {
    document.body.dataset.theme = theme;
    lightBtn.classList.toggle('active', theme === 'light');
    darkBtn.classList.toggle('active', theme === 'dark');
  }

  const savedTheme = localStorage.getItem('cc-theme');
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    applyTheme(document.body.dataset.theme || 'light');
  }

  const themeObserver = new MutationObserver(() => {
    const saved = localStorage.getItem('cc-theme');
    if (saved && document.body.dataset.theme !== saved) {
      document.body.dataset.theme = saved;
    }
  });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

  lightBtn.addEventListener('click', () => {
    localStorage.setItem('cc-theme', 'light');
    applyTheme('light');
  });

  darkBtn.addEventListener('click', () => {
    localStorage.setItem('cc-theme', 'dark');
    applyTheme('dark');
  });

  // ── 저장된 설정 복원 & 적용 ──
  loadSettings();
  applyFontSize();
  applyChatWidth();
  updateCodeblockUI();

  // ── 채팅 히스토리 (방향키 위/아래) ──
  const chatHistory = JSON.parse(localStorage.getItem('cc-chat-history') || '[]');
  let historyIndex = -1;
  let currentDraft = '';
  const MAX_HISTORY = 100;

  function getChatInput() {
    return document.querySelector('textarea') ||
      document.querySelector('[contenteditable="true"]');
  }

  function getInputValue(el) {
    return el.tagName === 'TEXTAREA' ? el.value : el.textContent;
  }

  function setInputValue(el, val) {
    if (el.tagName === 'TEXTAREA') {
      // React 호환: native setter로 값 변경
      const nativeSetter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype, 'value'
      ).set;
      nativeSetter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      el.textContent = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    // 커서를 끝으로
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = val.length;
    }, 0);
  }

  // 전송 감지: Enter 키 (Shift 없이) 또는 전송 버튼 클릭
  document.addEventListener('keydown', (e) => {
    const input = getChatInput();
    if (!input || document.activeElement !== input) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      const text = getInputValue(input).trim();
      if (text) {
        // 중복 방지 (직전과 동일하면 저장 안 함)
        if (chatHistory[0] !== text) {
          chatHistory.unshift(text);
          if (chatHistory.length > MAX_HISTORY) chatHistory.pop();
          localStorage.setItem('cc-chat-history', JSON.stringify(chatHistory));
        }
        historyIndex = -1;
        currentDraft = '';
      }
      return;
    }

    // 방향키 위: 커서가 맨 앞일 때 이전 메시지
    if (e.key === 'ArrowUp') {
      const atTop = input.tagName === 'TEXTAREA'
        ? input.selectionStart === 0
        : window.getSelection()?.anchorOffset === 0;

      if ((atTop && !e.repeat) || historyIndex >= 0) {
        if (historyIndex < chatHistory.length - 1) {
          e.preventDefault();
          if (historyIndex === -1) currentDraft = getInputValue(input);
          historyIndex++;
          setInputValue(input, chatHistory[historyIndex]);
        }
      }
    }

    // 방향키 아래: 커서가 맨 뒤일 때 다음 메시지
    if (e.key === 'ArrowDown' && historyIndex >= 0) {
      const val = getInputValue(input);
      const atBottom = input.tagName === 'TEXTAREA'
        ? input.selectionStart === val.length
        : window.getSelection()?.anchorOffset === (input.textContent || '').length;

      if (atBottom) {
        e.preventDefault();
        historyIndex--;
        if (historyIndex < 0) {
          setInputValue(input, currentDraft);
        } else {
          setInputValue(input, chatHistory[historyIndex]);
        }
      }
    }

    // ESC: 히스토리 탐색 취소
    if (e.key === 'Escape' && historyIndex >= 0) {
      historyIndex = -1;
      setInputValue(input, currentDraft);
    }
  }, true);

  console.log('[CustomCrack] 커스텀 UI 로드 완료');
})();
