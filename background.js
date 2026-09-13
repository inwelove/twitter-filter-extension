const DEFAULT_SETTINGS = {
  enabled: true,
  highlight: true,
  hide: false,
  breathe: true,
  profileEnabled: false,
  autoLoad: false,
  repliesThreshold: 0,
  retweetsThreshold: 0,
  likesThreshold: 0,
  viewsThreshold: 10000,
  maxFilterCount: 100,
  highlightColor: '#00ba7c',
  glowColor: '#1da1f2',
  breatheIntensity: 50,
  breatheSpeed: 20
};

// 安装时初始化默认配置
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({ twitterFilterSettings: DEFAULT_SETTINGS });
  }
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSettings') {
    chrome.storage.local.get('twitterFilterSettings', (result) => {
      sendResponse(result.twitterFilterSettings || DEFAULT_SETTINGS);
    });
    return true;
  }
});
