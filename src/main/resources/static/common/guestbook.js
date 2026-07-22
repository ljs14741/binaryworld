(function () {
  'use strict';

  const mount = document.getElementById('bw-guestbook');
  if (!mount || mount.dataset.bwMounted === 'true') {
    return;
  }

  const FONT_HREF =
    'https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700&family=Syne:wght@700;800&display=swap';
  const PAGE_SIZE = 5;
  const API_BASE = window.location.origin + '/api/guestbook';

  let currentPage = 0;
  let totalPages = 1;

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

    const header = document.querySelector('.bw-global-header');
    if (header && header.dataset.theme) {
      return header.dataset.theme;
    }

    return 'dark';
  }

  function applyTheme(theme) {
    mount.dataset.theme = theme === 'light' ? 'light' : 'dark';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(value) {
    if (!value) {
      return '';
    }
    return String(value).substring(0, 10);
  }

  ensureFonts();
  mount.dataset.bwMounted = 'true';
  applyTheme(resolveTheme());

  mount.innerHTML =
    '<section class="bw-gb-shell" aria-label="방명록">' +
    '<div class="bw-gb-inner">' +
    '<div class="bw-gb-header">' +
    '<div>' +
    '<h2 class="bw-gb-title">방명록</h2>' +
    '<p class="bw-gb-subtitle">짧은 인사나 피드백을 남겨주세요.</p>' +
    '</div>' +
    '<div class="bw-gb-count" data-gb-count>1페이지</div>' +
    '</div>' +
    '<form class="bw-gb-form" data-gb-form>' +
    '<div class="bw-gb-field">' +
    '<label class="bw-gb-label" for="bw-gb-nickname">닉네임</label>' +
    '<input id="bw-gb-nickname" class="bw-gb-input" name="nickname" type="text" maxlength="10" placeholder="닉네임" required autocomplete="nickname">' +
    '</div>' +
    '<div class="bw-gb-field">' +
    '<label class="bw-gb-label" for="bw-gb-password">비밀번호</label>' +
    '<input id="bw-gb-password" class="bw-gb-input" name="password" type="password" maxlength="20" placeholder="삭제용 비밀번호" required autocomplete="new-password">' +
    '</div>' +
    '<div class="bw-gb-field bw-gb-field-full">' +
    '<label class="bw-gb-label" for="bw-gb-message">내용</label>' +
    '<textarea id="bw-gb-message" class="bw-gb-textarea" name="content" maxlength="1000" placeholder="방문한 소감을 남겨주세요" required></textarea>' +
    '</div>' +
    '<div class="bw-gb-actions">' +
    '<button class="bw-gb-submit" type="submit" data-gb-submit>등록하기</button>' +
    '</div>' +
    '</form>' +
    '<ul class="bw-gb-list" data-gb-list></ul>' +
    '<div class="bw-gb-pagination">' +
    '<button class="bw-gb-page-btn" type="button" data-gb-prev>이전</button>' +
    '<div class="bw-gb-page-info" data-gb-page>1 / 1</div>' +
    '<button class="bw-gb-page-btn" type="button" data-gb-next>다음</button>' +
    '</div>' +
    '</div>' +
    '</section>';

  const form = mount.querySelector('[data-gb-form]');
  const list = mount.querySelector('[data-gb-list]');
  const prevBtn = mount.querySelector('[data-gb-prev]');
  const nextBtn = mount.querySelector('[data-gb-next]');
  const pageInfo = mount.querySelector('[data-gb-page]');
  const countBadge = mount.querySelector('[data-gb-count]');
  const submitBtn = mount.querySelector('[data-gb-submit]');

  function renderItems(items) {
    if (!items.length) {
      list.innerHTML =
        '<li class="bw-gb-empty">아직 작성된 방명록이 없습니다. 첫 글을 남겨보세요.</li>';
      return;
    }

    list.innerHTML = items
      .map(function (item) {
        return (
          '<li class="bw-gb-item">' +
          '<div class="bw-gb-item-top">' +
          '<strong class="bw-gb-name">' +
          escapeHtml(item.nickname) +
          '</strong>' +
          '<span class="bw-gb-date">' +
          escapeHtml(formatDate(item.createdAt)) +
          '</span>' +
          '</div>' +
          '<p class="bw-gb-content">' +
          escapeHtml(item.content) +
          '</p>' +
          '<div class="bw-gb-item-actions">' +
          '<button class="bw-gb-delete" type="button" data-id="' +
          escapeHtml(item.id) +
          '">삭제</button>' +
          '</div>' +
          '</li>'
        );
      })
      .join('');
  }

  function updatePagination(page) {
    currentPage = page.number || 0;
    totalPages = Math.max(page.totalPages || 1, 1);
    pageInfo.textContent = currentPage + 1 + ' / ' + totalPages;
    countBadge.textContent = currentPage + 1 + '페이지';
    prevBtn.disabled = page.first === true || currentPage <= 0;
    nextBtn.disabled =
      page.last === true || currentPage >= totalPages - 1;
  }

  function loadPage(page) {
    const targetPage = Math.max(0, page || 0);
    list.innerHTML = '<li class="bw-gb-empty">불러오는 중...</li>';

    fetch(
      API_BASE +
        '/paged?page=' +
        encodeURIComponent(targetPage) +
        '&size=' +
        encodeURIComponent(PAGE_SIZE)
    )
      .then(function (res) {
        if (!res.ok) {
          throw new Error('failed');
        }
        return res.json();
      })
      .then(function (data) {
        renderItems(data.content || []);
        updatePagination(data);
      })
      .catch(function () {
        list.innerHTML =
          '<li class="bw-gb-error">방명록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</li>';
      });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const nickname = form.nickname.value.trim();
    const password = form.password.value.trim();
    const content = form.content.value.trim();

    if (!nickname || !password || !content) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    if (nickname.length > 10) {
      alert('닉네임은 10자 이하로 입력해주세요.');
      return;
    }
    if (password.length > 20) {
      alert('비밀번호는 20자 이하로 입력해주세요.');
      return;
    }
    if (content.length > 1000) {
      alert('내용이 너무 깁니다. 1000자 이하로 작성해주세요.');
      return;
    }

    submitBtn.disabled = true;

    fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: nickname, password: password, content: content }),
    })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('failed');
        }
        form.reset();
        loadPage(0);
      })
      .catch(function () {
        alert('등록에 실패했습니다.');
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });

  list.addEventListener('click', function (event) {
    const button = event.target.closest('.bw-gb-delete');
    if (!button) {
      return;
    }

    const id = button.getAttribute('data-id');
    const password = window.prompt('비밀번호를 입력하세요');
    if (!password) {
      return;
    }

    fetch(
      API_BASE +
        '/' +
        encodeURIComponent(id) +
        '?password=' +
        encodeURIComponent(password),
      { method: 'DELETE' }
    )
      .then(function (res) {
        if (!res.ok) {
          throw new Error('failed');
        }
        loadPage(0);
      })
      .catch(function () {
        alert('비밀번호가 틀렸거나 삭제에 실패했습니다.');
      });
  });

  prevBtn.addEventListener('click', function () {
    if (currentPage > 0) {
      loadPage(currentPage - 1);
    }
  });

  nextBtn.addEventListener('click', function () {
    if (currentPage < totalPages - 1) {
      loadPage(currentPage + 1);
    }
  });

  document.addEventListener('bw:theme-change', function (event) {
    if (event.detail && event.detail.theme) {
      applyTheme(event.detail.theme);
    }
  });

  window.addEventListener('storage', function (event) {
    if (event.key === 'theme') {
      applyTheme(resolveTheme());
    }
  });

  const themeLink = document.getElementById('theme-style');
  if (themeLink) {
    new MutationObserver(function () {
      applyTheme(resolveTheme());
    }).observe(themeLink, {
      attributes: true,
      attributeFilter: ['href'],
    });
  }

  loadPage(0);
})();
