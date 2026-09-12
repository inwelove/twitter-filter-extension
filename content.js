(() => {
  'use strict';

  let settings = {
    enabled: true,
    highlight: true,
    hide: false,
    breathe: true,
    repliesThreshold: 0,
    retweetsThreshold: 0,
    likesThreshold: 0,
    viewsThreshold: 10000,
    highlightColor: '#00ba7c',
    glowColor: '#1da1f2',
    breatheIntensity: 50,
    breatheSpeed: 20
  };

  const MATCH_CLASS = 'twitter-filter-match';
  const NO_MATCH_CLASS = 'twitter-filter-no-match';
  const BREATHE_CLASS = 'twitter-filter-breathe';
  const ALL_CLASSES = `${MATCH_CLASS} ${NO_MATCH_CLASS} ${BREATHE_CLASS}`;

  let debounceTimer = null;
  let lastUrl = location.href;
  let observer = null;

  // 消息监听
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'applyFilter') {
      settings = msg.settings;
      applyStyles();
      processAllTweets();
      sendResponse({ success: true });
    }
  });

  // 初始化
  chrome.storage.local.get('twitterFilterSettings', (result) => {
    if (result.twitterFilterSettings) {
      settings = { ...settings, ...result.twitterFilterSettings };
    }
    applyStyles();
    processAllTweets();
    startObserver();
  });

  // 设置变化监听
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.twitterFilterSettings) {
      settings = { ...settings, ...changes.twitterFilterSettings.newValue };
      applyStyles();
      processAllTweets();
    }
  });

  function applyStyles() {
    const root = document.documentElement;
    root.style.setProperty('--highlight-color', settings.highlightColor);
    root.style.setProperty('--glow-color', settings.glowColor);
    root.style.setProperty('--glow-color-rgb', `rgba(${hexToRgb(settings.glowColor)}, `);
    root.style.setProperty('--breathe-intensity', (settings.breatheIntensity / 100).toString());
    root.style.setProperty('--breathe-speed', (settings.breatheSpeed / 10) + 's');
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '29, 161, 242';
  }

  function startObserver() {
    if (observer) observer.disconnect();

    observer = new MutationObserver(() => {
      if (!settings.enabled) return;
      // URL变化检测
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        debouncedProcess();
      } else {
        debouncedProcess();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function debouncedProcess() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processAllTweets, 300);
  }

  function isTimelinePage() {
    const path = window.location.pathname;
    // 首页时间线
    if (path === '/' || path === '/home' || path === '/explore' || path === '/search') {
      return true;
    }
    // 用户主页: /username 格式 (排除帖子详情页 /username/status/xxx)
    if (settings.profileEnabled && /^\/[^/]+$/.test(path)) {
      return true;
    }
    return false;
  }

  function processAllTweets() {
    if (!settings.enabled || !isTimelinePage()) {
      clearAllFilters();
      return;
    }
    document.querySelectorAll('article[data-testid="tweet"]').forEach(processTweet);
  }

  function clearAllFilters() {
    document.querySelectorAll(`article.${MATCH_CLASS}, article.${NO_MATCH_CLASS}, article.${BREATHE_CLASS}`)
      .forEach(el => el.classList.remove(MATCH_CLASS, NO_MATCH_CLASS, BREATHE_CLASS));
  }

  function processTweet(tweet) {
    tweet.classList.remove(MATCH_CLASS, NO_MATCH_CLASS, BREATHE_CLASS);
    const stats = extractStats(tweet);
    tweet.setAttribute('data-filter-stats', JSON.stringify(stats));

    if (checkMatch(stats)) {
      tweet.classList.add(MATCH_CLASS);
      if (settings.breathe) tweet.classList.add(BREATHE_CLASS);
    } else if (settings.hide) {
      tweet.classList.add(NO_MATCH_CLASS);
    }
  }

  function extractStats(tweet) {
    const stats = { replies: 0, retweets: 0, likes: 0, views: 0 };

    // 主提取：从 aria-label
    const group = tweet.querySelector('[role="group"][aria-label]');
    if (group) {
      const label = group.getAttribute('aria-label');
      const patterns = [
        [/(\d[\d,.]*)\s*回复/, 'replies'],
        [/(\d[\d,.]*)\s*(?:转推|转发|Reposts?)/i, 'retweets'],
        [/(\d[\d,.]*)\s*(?:喜欢|点赞|Likes?)/i, 'likes'],
        [/(\d[\d,.]*)\s*(?:次观看|浏览|Views?)/i, 'views']
      ];
      patterns.forEach(([regex, key]) => {
        const match = label.match(regex);
        if (match) stats[key] = parseNumber(match[1]);
      });
    }

    // 备用提取
    const fallbacks = [
      { key: 'replies', selector: '[data-testid="reply"]' },
      { key: 'retweets', selector: '[data-testid="retweet"], [data-testid="unretweet"]' },
      { key: 'likes', selector: '[data-testid="like"], [data-testid="unlike"]' }
    ];

    fallbacks.forEach(({ key, selector }) => {
      if (stats[key] === 0) {
        const btn = tweet.querySelector(selector);
        if (btn) {
          const m = (btn.getAttribute('aria-label') || '').match(/(\d[\d,.]*)/);
          if (m) stats[key] = parseNumber(m[1]);
        }
      }
    });

    // 浏览量备用
    if (stats.views === 0) {
      const analytics = tweet.querySelector('a[href*="analytics"]');
      if (analytics) {
        const m = analytics.textContent.trim().match(/^([\d,.]+)$/);
        if (m) stats.views = parseNumber(m[1]);
      }
    }

    return stats;
  }

  function parseNumber(text) {
    if (!text) return 0;
    text = text.toString().replace(/,/g, '').trim();
    let mult = 1;
    if (text.endsWith('万')) { mult = 10000; text = text.slice(0, -1); }
    else if (text.endsWith('亿')) { mult = 100000000; text = text.slice(0, -1); }
    else if (text.toLowerCase().endsWith('k')) { mult = 1000; text = text.slice(0, -1); }
    else if (text.toLowerCase().endsWith('m')) { mult = 1000000; text = text.slice(0, -1); }
    const num = parseFloat(text);
    return isNaN(num) ? 0 : Math.floor(num * mult);
  }

  function checkMatch(stats) {
    const conditions = [];
    if (settings.repliesThreshold > 0) conditions.push(stats.replies >= settings.repliesThreshold);
    if (settings.retweetsThreshold > 0) conditions.push(stats.retweets >= settings.retweetsThreshold);
    if (settings.likesThreshold > 0) conditions.push(stats.likes >= settings.likesThreshold);
    if (settings.viewsThreshold > 0) conditions.push(stats.views >= settings.viewsThreshold);
    return conditions.length > 0 && conditions.some(c => c);
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(processAllTweets, 1000));
  } else {
    setTimeout(processAllTweets, 1000);
  }
})();
