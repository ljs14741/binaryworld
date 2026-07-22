(function () {
  'use strict';

  const mount = document.getElementById('global-header');

  if (!mount || mount.dataset.bwMounted === 'true') {
    return;
  }

  const navigationItems = [
    {
      label: '인생망한사람',
      href: 'https://life.binaryworld.kr',
    },
    {
      label: '게임',
      href: 'https://game.binaryworld.kr',
    },
    {
      label: '익명투표',
      href: 'https://vote.binaryworld.kr',
    },
    {
      label: '음식추천',
      href: 'https://food.binaryworld.kr',
    },
    {
      label: '상식테스트',
      href: 'https://quiz.binaryworld.kr',
    },
    {
      label: 'AI 외모평가',
      href: 'https://face.binaryworld.kr',
    },
  ];

  const links = navigationItems
    .map(function (item) {
      const isCurrent = window.location.hostname === new URL(item.href).hostname;
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
  mount.innerHTML =
    '<div class="bw-gnb-inner">' +
    '<a class="bw-gnb-logo" href="https://binaryworld.kr">Binary World</a>' +
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
    '<button id="themeToggle" class="bw-theme-toggle" type="button" aria-label="테마 변경">🌗</button>' +
    '</div>' +
    '</div>';

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
    if (window.innerWidth > 900) {
      setMenuOpen(false);
    }
  });

  document.dispatchEvent(new CustomEvent('bw:header-ready'));
})();
