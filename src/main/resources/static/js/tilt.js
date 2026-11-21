(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // 카드가 마우스 쪽으로 살짝 기울어짐 (마우스 있는 기기만)
  if (!reduce && finePointer) {
    document.querySelectorAll('.bw-tilt').forEach(function (card) {
      const MAX = card.classList.contains('bw-game-feature') ? 5 : 9;

      card.addEventListener('pointermove', function (event) {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        card.classList.add('is-tilting');
        card.style.setProperty('--ry', ((x - 0.5) * MAX * 2).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - y) * MAX * 2).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });

      card.addEventListener('pointerleave', function () {
        card.classList.remove('is-tilting');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  // 스크롤해서 보이면 아래에서 올라오며 나타남
  const targets = document.querySelectorAll('.bw-section-head, .bw-games, .bw-services, .bw-stats, .bw-maker, .bw-flow, .bw-arch, .bw-about-block');
  if (reduce || !('IntersectionObserver' in window)) {
    return;
  }

  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px' });

  targets.forEach(function (el) {
    // 이미 화면 안에 있으면 그냥 둠 (깜빡임 방지)
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
      return;
    }
    el.classList.add('bw-reveal');
    io.observe(el);
  });
})();
