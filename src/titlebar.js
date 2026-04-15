/* === Custom Crack - 크랙 헤더에 창 컨트롤 통합 === */

(function () {
  if (document.getElementById('cc-window-buttons')) return;

  // 크랙 헤더의 내부 컨테이너 찾기 (테마 불문)
  const header = document.querySelector('.css-9gj46x') || document.querySelector('.css-7238to');
  const headerInner = header?.querySelector('.relative.h-full');
  if (!headerInner) return;

  // 헤더를 드래그 가능 영역으로 설정
  header.style.webkitAppRegion = 'drag';
  headerInner.querySelectorAll('a, button, input, [role="button"], div[class*="shrink"], div[class*="gap-5"]').forEach(el => {
    el.style.webkitAppRegion = 'no-drag';
  });

  // 창 컨트롤 버튼을 헤더 내부에 삽입
  const buttons = document.createElement('div');
  buttons.id = 'cc-window-buttons';
  buttons.innerHTML = `
    <button id="cc-btn-min" title="최소화">─</button>
    <button id="cc-btn-max" title="최대화">□</button>
    <button id="cc-btn-close" title="닫기">✕</button>
  `;
  headerInner.appendChild(buttons);

  // 스타일
  const style = document.createElement('style');
  style.id = 'cc-window-buttons-style';
  style.textContent = `
    /* 헤더 내부를 flex로 강제 (이미 flex일 수 있지만 확실하게) */
    .css-9gj46x .relative.h-full {
      display: flex !important;
      align-items: center !important;
    }

    #cc-window-buttons {
      display: flex;
      align-items: center;
      height: 100%;
      margin-left: 8px;
      flex-shrink: 0;
      -webkit-app-region: no-drag;
    }

    #cc-window-buttons button {
      width: 40px;
      height: 36px;
      border: none;
      background: transparent;
      color: #888;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      font-family: -apple-system, 'Segoe UI', sans-serif;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #cc-window-buttons button:hover {
      background: rgba(0,0,0,0.1);
      color: #333;
    }

    #cc-btn-close:hover {
      background: #e81123 !important;
      color: #fff !important;
    }
  `;
  document.head.appendChild(style);

  // 버튼 동작
  const maxBtn = document.getElementById('cc-btn-max');

  document.getElementById('cc-btn-min').addEventListener('click', () => {
    window.customCrack?.minimize();
  });
  let isMaxState = false;
  let isFullState = false;

  const restoreIcon = '<svg width="10" height="10" viewBox="0 0 10 10"><rect x="0" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.2"/><polyline points="2,2 2,0 10,0 10,8 8,8" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
  const maximizeIcon = '□';

  function updateMaxBtn() {
    const expanded = isMaxState || isFullState;
    maxBtn.innerHTML = expanded ? restoreIcon : maximizeIcon;
    maxBtn.title = expanded ? '이전 크기로 복원' : '최대화';
  }

  maxBtn.addEventListener('click', () => {
    if (isFullState) {
      window.customCrack?.toggleFullscreen();
    } else {
      window.customCrack?.maximize();
    }
  });
  document.getElementById('cc-btn-close').addEventListener('click', () => {
    window.customCrack?.close();
  });

  window.customCrack?.onMaximizeChange((val) => {
    isMaxState = val;
    updateMaxBtn();
  });
  window.customCrack?.onFullscreenChange((val) => {
    isFullState = val;
    updateMaxBtn();
  });
})();
