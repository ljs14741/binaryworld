(function () {
  'use strict';

  const mount = document.getElementById('global-header');

  if (!mount || mount.dataset.bwMounted === 'true') {
    return;
  }

  const FONT_HREF =
    'https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700&family=Syne:wght@700;800&display=swap';

  const navigationItems = [
    { label: '인생망한사람', href: 'https://life.binaryworld.kr' },
    { label: '게임', href: 'https://game.binaryworld.kr' },
    { label: '익명투표', href: 'https://vote.binaryworld.kr' },
    { label: '음식추천', href: 'https://food.binaryworld.kr' },
    { label: '상식테스트', href: 'https://quiz.binaryworld.kr' },
    { label: 'AI 외모평가', href: 'https://face.binaryworld.kr' },
  ];

  function ensureFonts() {
    if (document.getElementById('bw-gnb-fonts')) {
      return;
    }

    const preconnectGoogle = document.createElement('link');
    preconnectGoogle.rel = 'preconnect';
    preconnectGoogle.href = 'https://fonts.googleapis.com';

    const preconnectGstatic = document.createElement('link');
    preconnectGstatic.rel = 'preconnect';
    preconnectGstatic.href = 'https://fonts.gstatic.com';
    preconnectGstatic.crossOrigin = 'anonymous';

    const fonts = document.createElement('link');
    fonts.id = 'bw-gnb-fonts';
    fonts.rel = 'stylesheet';
    fonts.href = FONT_HREF;

    document.head.appendChild(preconnectGoogle);
    document.head.appendChild(preconnectGstatic);
    document.head.appendChild(fonts);
  }

  function resolveTheme() {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      // ignore storage errors
    }

    const themeLink = document.getElementById('theme-style');
    if (themeLink && themeLink.getAttribute('href')) {
      return themeLink.getAttribute('href').includes('dark') ? 'dark' : 'light';
    }

    return 'dark';
  }

  function applyHeaderTheme(theme) {
    const nextTheme = theme === 'light' ? 'light' : 'dark';
    mount.dataset.theme = nextTheme;

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.setAttribute(
        'aria-label',
        nextTheme === 'dark' ? '라이트 테마로 변경' : '다크 테마로 변경'
      );
      themeToggle.setAttribute('aria-pressed', String(nextTheme === 'dark'));
    }
  }

  ensureFonts();

  const links = navigationItems
    .map(function (item) {
      let isCurrent = false;

      try {
        isCurrent = window.location.hostname === new URL(item.href).hostname;
      } catch {
        isCurrent = false;
      }

      const currentAttribute = isCurrent ? ' aria-current="page"' : '';

      return (
        '<a class="bw-gnb-link" href="' +
        item.href +
        '"' +
        currentAttribute +
        '>' +
        item.label +
        '</a>'
      );
    })
    .join('');

  mount.className = 'bw-global-header';
  mount.dataset.bwMounted = 'true';
  document.documentElement.style.setProperty('--bw-header-height', '64px');
  mount.innerHTML =
    '<div class="bw-gnb-inner">' +
    '<a class="bw-gnb-logo" href="https://binaryworld.kr">' +
    '<span class="bw-gnb-mark" aria-hidden="true">01</span>' +
    '<span class="bw-gnb-word">Binary World</span>' +
    '</a>' +
    '<nav id="bw-global-navigation" class="bw-gnb-nav" aria-label="Binary World 서비스" data-open="false">' +
    links +
    '</nav>' +
    '<div class="bw-gnb-controls">' +
    '<button class="bw-gnb-toggle" type="button" aria-label="메뉴 열기" aria-controls="bw-global-navigation" aria-expanded="false">' +
    '<span class="bw-gnb-toggle-lines" aria-hidden="true">' +
    '<span class="bw-gnb-toggle-line"></span>' +
    '<span class="bw-gnb-toggle-line"></span>' +
    '<span class="bw-gnb-toggle-line"></span>' +
    '</span>' +
    '</button>' +
    '<button id="themeToggle" class="bw-theme-toggle" type="button" aria-label="테마 변경">' +
    '<svg class="bw-icon-sun" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/>' +
    '<path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.05 5.05l1.56 1.56M17.39 17.39l1.56 1.56M18.95 5.05l-1.56 1.56M6.61 17.39l-1.56 1.56" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
    '</svg>' +
    '<svg class="bw-icon-moon" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M19.5 13.2A7.5 7.5 0 0 1 10.8 4.5 7.7 7.7 0 1 0 19.5 13.2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>' +
    '</svg>' +
    '</button>' +
    '</div>' +
    '</div>';

  applyHeaderTheme(resolveTheme());

  const toggle = mount.querySelector('.bw-gnb-toggle');
  const navigation = mount.querySelector('.bw-gnb-nav');

  function setMenuOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    navigation.dataset.open = String(open);
  }

  toggle.addEventListener('click', function () {
    setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  navigation.addEventListener('click', function (event) {
    if (event.target.closest('a')) {
      setMenuOpen(false);
    }
  });

  document.addEventListener('click', function (event) {
    if (!mount.contains(event.target)) {
      setMenuOpen(false);
    }
  });

  document.addEventListener('keydown', function (event) {
    if (
      event.key === 'Escape' &&
      toggle.getAttribute('aria-expanded') === 'true'
    ) {
      setMenuOpen(false);
      toggle.focus();
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 960) {
      setMenuOpen(false);
    }
  });

  const themeLink = document.getElementById('theme-style');
  if (themeLink) {
    new MutationObserver(function () {
      applyHeaderTheme(resolveTheme());
    }).observe(themeLink, {
      attributes: true,
      attributeFilter: ['href'],
    });
  }

  window.addEventListener('storage', function (event) {
    if (event.key === 'theme') {
      applyHeaderTheme(resolveTheme());
    }
  });

  // Keep header theme in sync when page scripts toggle #themeToggle.
  document.addEventListener(
    'click',
    function (event) {
      if (!event.target.closest('#themeToggle')) {
        return;
      }

      window.setTimeout(function () {
        applyHeaderTheme(resolveTheme());
      }, 0);
    },
    true
  );

  document.dispatchEvent(new CustomEvent('bw:header-ready'));
})();
