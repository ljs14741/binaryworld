(function () {
  'use strict';

  const mount = document.getElementById('global-footer');

  if (!mount || mount.dataset.bwMounted === 'true') {
    return;
  }

  const FONT_HREF =
    'https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700&family=Syne:wght@700;800&display=swap';

  const legalLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Contact', href: '/contact' },
  ];

  const serviceLinks = [
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

    const header = document.querySelector('.bw-global-header');
    if (header && header.dataset.theme) {
      return header.dataset.theme;
    }

    return 'dark';
  }

  function applyFooterTheme(theme) {
    mount.dataset.theme = theme === 'light' ? 'light' : 'dark';
  }

  function renderLinkList(items) {
    return items
      .map(function (item) {
        return (
          '<li><a href="' + item.href + '">' + item.label + '</a></li>'
        );
      })
      .join('');
  }

  ensureFonts();

  mount.className = 'bw-global-footer';
  mount.dataset.bwMounted = 'true';
  mount.innerHTML =
    '<div class="bw-footer-inner">' +
    '<div class="bw-footer-top">' +
    '<div class="bw-footer-brand">' +
    '<a class="bw-footer-logo" href="https://binaryworld.kr">' +
    '<span class="bw-footer-mark" aria-hidden="true">01</span>' +
    '<span>Binary World</span>' +
    '</a>' +
    '<p class="bw-footer-copy">' +
    '미니게임, 익명투표, 음식추천, 상식테스트까지. 한 곳에서 가볍게 즐기고 바로 공유하는 개인 웹 프로젝트 모음입니다.' +
    '</p>' +
    '</div>' +
    '<div class="bw-footer-panels">' +
    '<div>' +
    '<p class="bw-footer-panel-title">Explore</p>' +
    '<ul class="bw-footer-links">' +
    renderLinkList(serviceLinks) +
    '</ul>' +
    '</div>' +
    '<div>' +
    '<p class="bw-footer-panel-title">Site</p>' +
    '<ul class="bw-footer-links">' +
    renderLinkList(legalLinks) +
    '</ul>' +
    '<ul class="bw-footer-meta" style="margin-top:0.85rem">' +
    '<li><a href="mailto:ljs14741@gmail.com">ljs14741@gmail.com</a></li>' +
    '<li><span>Created by Binary</span></li>' +
    '</ul>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="bw-footer-bottom">' +
    '<p class="bw-footer-legal">© 2026 Binary World. All rights reserved.</p>' +
    '<div class="bw-footer-chip">' +
    '<span class="bw-footer-chip-dot" aria-hidden="true"></span>' +
    'Signal Glass System' +
    '</div>' +
    '</div>' +
    '</div>';

  applyFooterTheme(resolveTheme());

  document.addEventListener('bw:theme-change', function (event) {
    if (event.detail && event.detail.theme) {
      applyFooterTheme(event.detail.theme);
    }
  });

  window.addEventListener('storage', function (event) {
    if (event.key === 'theme') {
      applyFooterTheme(resolveTheme());
    }
  });

  const themeLink = document.getElementById('theme-style');
  if (themeLink) {
    new MutationObserver(function () {
      applyFooterTheme(resolveTheme());
    }).observe(themeLink, {
      attributes: true,
      attributeFilter: ['href'],
    });
  }

  document.dispatchEvent(new CustomEvent('bw:footer-ready'));
})();
