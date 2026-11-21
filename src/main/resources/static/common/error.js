(function () {
  'use strict';

  // 공용 오류 페이지 내용. body 의 data-code(404, 500 …)를 보고 채움
  const body = document.body;
  const mount = document.getElementById('bw-error');
  if (!body || !mount) {
    return;
  }

  const code = String(body.dataset.code || '404').replace(/[^0-9]/g, '') || '404';

  const MESSAGES = {
    404: {
      title: '앗, 길을 잃었어요',
      lead: '주소가 바뀌었거나 없는 페이지예요. 주소를 다시 확인하거나 아래에서 골라 주세요.',
    },
    403: {
      title: '여기는 들어갈 수 없어요',
      lead: '볼 수 있는 권한이 없는 페이지예요.',
    },
    500: {
      title: '잠깐 넘어졌어요',
      lead: '서버에서 문제가 생겼어요. 잠시 뒤 새로고침해 주세요. 계속되면 알려 주시면 바로 볼게요.',
    },
    502: {
      title: '잠깐 점검 중이에요',
      lead: '새 버전을 올리는 중일 수 있어요. 보통 1분 안팎이면 끝나니 잠시 뒤 새로고침해 주세요.',
    },
  };
  MESSAGES[503] = MESSAGES[502];
  MESSAGES[504] = MESSAGES[502];

  // 4xx·5xx 가 아니면(예: /error 직접 열기) 500 으로 보여 줌
  const shown = /^[45]\d\d$/.test(code) ? code : '500';
  const msg = MESSAGES[shown] || (shown.charAt(0) === '4' ? MESSAGES[404] : MESSAGES[500]);

  const isMain = /^(www\.)?binaryworld\.kr$/.test(location.hostname);
  const path = decodeURIComponent(location.pathname + location.search);

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  const toys = [
    ['dice', '9%', '18%', '64px', '7s', '0s', '-12deg', '8deg'],
    ['star', '82%', '14%', '58px', '8s', '-2s', '6deg', '-14deg'],
    ['heart', '86%', '62%', '54px', '6.5s', '-1s', '-6deg', '10deg'],
    ['donut', '6%', '66%', '70px', '7.5s', '-3s', '0deg', '30deg'],
    ['quiz', '72%', '84%', '46px', '6s', '-4s', '8deg', '-8deg'],
    ['ball', '20%', '86%', '26px', '5s', '-2s', '0deg', '0deg'],
    ['ball', '92%', '38%', '18px', '6s', '-1s', '0deg', '0deg'],
  ]
    .map(function (t) {
      return (
        '<span class="bw-err-toy bw-err-' + t[0] + '" style="--x:' + t[1] + ';--y:' + t[2] + ';--s:' + t[3] +
        ';--d:' + t[4] + ';--delay:' + t[5] + ';--r0:' + t[6] + ';--r1:' + t[7] + '">' +
        (t[0] === 'quiz' ? '?' : '') + '</span>'
      );
    })
    .join('');

  // 서버 오류면 새로고침을 맨 앞에, 못 찾은 페이지면 처음으로 가기를 맨 앞에
  const isServerError = shown.charAt(0) === '5';
  const buttons = [];
  if (isServerError) buttons.push('<button class="bw-err-btn bw-err-btn-primary" type="button" data-retry>새로고침</button>');
  buttons.push(isMain
    ? '<a class="bw-err-btn' + (isServerError ? '' : ' bw-err-btn-primary') + '" href="/">홈으로</a>'
    : '<a class="bw-err-btn' + (isServerError ? '' : ' bw-err-btn-primary') + '" href="/">이 사이트 처음으로</a>');
  if (!isMain) buttons.push('<a class="bw-err-btn" href="https://binaryworld.kr">진수의 잡동사니 홈</a>');
  if (!isServerError || isMain) buttons.push('<a class="bw-err-btn" href="https://game.binaryworld.kr">게임하러 가기</a>');

  mount.innerHTML =
    '<div class="bw-err-toys" aria-hidden="true">' + toys + '</div>' +
    '<div class="bw-err-inner">' +
    '<p class="bw-err-code" aria-label="오류 ' + shown + '">' +
    '<span class="bw-err-code-depth">' + shown + '</span>' +
    '<span class="bw-err-code-face" aria-hidden="true">' + shown + '</span>' +
        '</p>' +
    '<h1>' + msg.title + '</h1>' +
    '<p class="bw-err-lead">' + msg.lead + '</p>' +
    '<p class="bw-err-path">' + escapeHtml(location.hostname + path) + '</p>' +
    '<div class="bw-err-actions">' + buttons.join('') + '</div>' +
    '<p class="bw-err-note">계속 이러면 <a href="mailto:ljs14741@gmail.com">ljs14741@gmail.com</a> 으로 알려 주세요.</p>' +
    '</div>';

  const retry = mount.querySelector('[data-retry]');
  if (retry) {
    retry.addEventListener('click', function () {
      location.reload();
    });
  }

  // 숫자가 마우스 쪽으로 살짝 기울어짐
  const codeEl = mount.querySelector('.bw-err-code');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (codeEl && !reduce && window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('pointermove', function (event) {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      codeEl.style.setProperty('--ry', (x * 30).toFixed(1) + 'deg');
      codeEl.style.setProperty('--rx', (-y * 22 + 6).toFixed(1) + 'deg');
    }, { passive: true });
  }
})();
