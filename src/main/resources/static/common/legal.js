(function () {
  'use strict';

  const page = document.querySelector('.bw-legal-page');
  if (!page) {
    return;
  }

  const FONT_HREF =
    'https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700&family=Syne:wght@700;800&display=swap';

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
      // ignore
    }

    const themeLink = document.getElementById('theme-style');
    if (themeLink && themeLink.getAttribute('href')) {
      return themeLink.getAttribute('href').includes('dark') ? 'dark' : 'light';
    }

    return 'dark';
  }

  function applyLegalTheme(theme) {
    page.dataset.theme = theme === 'light' ? 'light' : 'dark';
  }

  ensureFonts();
  applyLegalTheme(resolveTheme());

  document.addEventListener('bw:theme-change', function (event) {
    if (event.detail && event.detail.theme) {
      applyLegalTheme(event.detail.theme);
    }
  });

  window.addEventListener('storage', function (event) {
    if (event.key === 'theme') {
      applyLegalTheme(resolveTheme());
    }
  });

  const themeLink = document.getElementById('theme-style');
  if (themeLink) {
    new MutationObserver(function () {
      applyLegalTheme(resolveTheme());
    }).observe(themeLink, {
      attributes: true,
      attributeFilter: ['href'],
    });
  }
})();
