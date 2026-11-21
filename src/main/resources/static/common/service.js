(function () {
  'use strict';

  // 서비스 공용 움직임 (기울기·등장·장난감). 가볍게: 마우스 있는 기기만 기울이고, 안 보이면 멈춤
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function init() {
    // 카드가 마우스 쪽으로 살짝 기울어짐. 한 프레임에 한 번만 계산함
    if (!reduce && finePointer) {
      document.querySelectorAll('.bw-tilt').forEach(function (card) {
        const max = Number(card.dataset.tilt || 7);
        let frame = 0;
        let lastEvent = null;

        function apply() {
          frame = 0;
          const rect = card.getBoundingClientRect();
          const x = (lastEvent.clientX - rect.left) / rect.width;
          const y = (lastEvent.clientY - rect.top) / rect.height;
          card.style.setProperty('--ry', ((x - 0.5) * max * 2).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((0.5 - y) * max * 2).toFixed(2) + 'deg');
          card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
          card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        }

        card.addEventListener('pointermove', function (event) {
          lastEvent = event;
          card.classList.add('is-tilting');
          if (!frame) frame = requestAnimationFrame(apply);
        });

        card.addEventListener('pointerleave', function () {
          if (frame) cancelAnimationFrame(frame);
          frame = 0;
          card.classList.remove('is-tilting');
          card.style.setProperty('--rx', '0deg');
          card.style.setProperty('--ry', '0deg');
        });
      });
    }

    if (!('IntersectionObserver' in window)) return;

    // 장난감은 첫 화면이 안 보이면 멈춤
    document.querySelectorAll('.bw-svc-toys').forEach(function (toys) {
      const io = new IntersectionObserver(function (entries) {
        toys.classList.toggle('is-paused', !entries[0].isIntersecting);
      });
      io.observe(toys);
    });

    // 스크롤해서 보이면 아래에서 올라오며 나타남 (이미 보이는 건 그대로)
    if (reduce) return;
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      el.classList.add('bw-reveal');
      io.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
