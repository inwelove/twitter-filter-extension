document.addEventListener('DOMContentLoaded', () => {
  // DOM元素缓存
  const $ = (id) => document.getElementById(id);
  
  const fields = {
    repliesThreshold: $('repliesThreshold'),
    retweetsThreshold: $('retweetsThreshold'),
    likesThreshold: $('likesThreshold'),
    viewsThreshold: $('viewsThreshold'),
    maxFilterCount: $('maxFilterCount'),
    highlightColor: $('highlightColor'),
    glowColor: $('glowColor'),
    highlightColorText: $('highlightColorText'),
    glowColorText: $('glowColorText')
  };

  const toggles = {
    enable: $('enableToggle'),
    highlight: $('highlightToggle'),
    hide: $('hideToggle'),
    breathe: $('breatheToggle'),
    profile: $('profileToggle'),
    autoLoad: $('autoLoadToggle')
  };

  const sliders = {
    breatheIntensity: $('breatheIntensity'),
    breatheSpeed: $('breatheSpeed')
  };

  const sliderValues = {
    breatheIntensity: $('breatheIntensityValue'),
    breatheSpeed: $('breatheSpeedValue')
  };

  const breatheSliders = $('breatheSliders');
  const themeSwitch = $('themeSwitch');
  const themeIcon = $('themeIcon');
  const saveBtn = $('saveBtn');
  const applyBtn = $('applyBtn');
  const statusBar = $('statusBar');
  const statusText = $('statusText');
  const previewTweet = $('previewTweet');

  let currentTheme = 'dark';

  // ============ 工具函数 ============

  function isValidHex(color) {
    return /^#[0-9a-fA-F]{6}$/.test(color);
  }

  function normalizeHex(value) {
    let val = value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    return val;
  }

  function setToggle(toggle, active) {
    toggle.classList[active ? 'add' : 'remove']('active');
  }

  // ============ 颜色同步 ============

  function setupColorSync(colorPicker, textInput) {
    colorPicker.addEventListener('input', (e) => {
      textInput.value = e.target.value;
      updatePreview();
    });

    textInput.addEventListener('input', (e) => {
      if (isValidHex(e.target.value)) {
        colorPicker.value = e.target.value;
        updatePreview();
      }
    });

    textInput.addEventListener('blur', (e) => {
      const val = normalizeHex(e.target.value);
      if (isValidHex(val)) {
        e.target.value = val;
        colorPicker.value = val;
        updatePreview();
      } else {
        e.target.value = colorPicker.value;
      }
    });
  }

  setupColorSync(fields.highlightColor, fields.highlightColorText);
  setupColorSync(fields.glowColor, fields.glowColorText);

  // ============ 主题 ============

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function loadTheme() {
    chrome.storage.local.get('twitterTheme', (result) => {
      currentTheme = result.twitterTheme || 'dark';
      applyTheme(currentTheme);
    });
  }

  themeSwitch.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(currentTheme);
    chrome.storage.local.set({ twitterTheme: currentTheme });
  });

  loadTheme();

  // ============ 开关 ============

  Object.values(toggles).forEach(t => {
    t.addEventListener('click', () => {
      t.classList.toggle('active');
      if (t === toggles.breathe) {
        breatheSliders.style.display = toggles.breathe.classList.contains('active') ? 'block' : 'none';
      }
      updatePreview();
    });
  });

  // ============ 滑块 ============

  sliders.breatheIntensity.addEventListener('input', (e) => {
    sliderValues.breatheIntensity.textContent = e.target.value + '%';
    updatePreview();
  });

  sliders.breatheSpeed.addEventListener('input', (e) => {
    sliderValues.breatheSpeed.textContent = (e.target.value / 10).toFixed(1) + 's';
    updatePreview();
  });

  // ============ 保存/应用 ============

  function getSettings() {
    return {
      enabled: toggles.enable.classList.contains('active'),
      highlight: toggles.highlight.classList.contains('active'),
      hide: toggles.hide.classList.contains('active'),
      breathe: toggles.breathe.classList.contains('active'),
      profileEnabled: toggles.profile.classList.contains('active'),
      autoLoad: toggles.autoLoad.classList.contains('active'),
      repliesThreshold: parseInt(fields.repliesThreshold.value) || 0,
      retweetsThreshold: parseInt(fields.retweetsThreshold.value) || 0,
      likesThreshold: parseInt(fields.likesThreshold.value) || 0,
      viewsThreshold: parseInt(fields.viewsThreshold.value) || 0,
      maxFilterCount: parseInt(fields.maxFilterCount.value) || 0,
      highlightColor: fields.highlightColor.value,
      glowColor: fields.glowColor.value,
      breatheIntensity: parseInt(sliders.breatheIntensity.value) || 50,
      breatheSpeed: parseInt(sliders.breatheSpeed.value) || 20
    };
  }

  function saveAndApply() {
    const settings = getSettings();
    chrome.storage.local.set({ twitterFilterSettings: settings }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'applyFilter', settings }, () => {
            // 忽略非推特页面的错误
            if (chrome.runtime.lastError) return;
          });
        }
      });
    });
  }

  saveBtn.addEventListener('click', () => {
    saveAndApply();
    showStatus('设置已保存', true);
  });

  applyBtn.addEventListener('click', () => {
    saveAndApply();
    showStatus('筛选已应用', true);
  });

  // ============ 加载设置 ============

  function loadSettings() {
    chrome.storage.local.get('twitterFilterSettings', (result) => {
      if (result.twitterFilterSettings) {
        const s = result.twitterFilterSettings;
        
        fields.repliesThreshold.value = s.repliesThreshold || 0;
        fields.retweetsThreshold.value = s.retweetsThreshold || 0;
        fields.likesThreshold.value = s.likesThreshold || 0;
        fields.viewsThreshold.value = s.viewsThreshold || 10000;
        fields.maxFilterCount.value = s.maxFilterCount || 100;
        fields.highlightColor.value = s.highlightColor || '#00ba7c';
        fields.glowColor.value = s.glowColor || '#1da1f2';
        fields.highlightColorText.value = s.highlightColor || '#00ba7c';
        fields.glowColorText.value = s.glowColor || '#1da1f2';
        sliders.breatheIntensity.value = s.breatheIntensity || 50;
        sliders.breatheSpeed.value = s.breatheSpeed || 20;
        sliderValues.breatheIntensity.textContent = (s.breatheIntensity || 50) + '%';
        sliderValues.breatheSpeed.textContent = ((s.breatheSpeed || 20) / 10).toFixed(1) + 's';

        setToggle(toggles.enable, s.enabled);
        setToggle(toggles.highlight, s.highlight);
        setToggle(toggles.hide, s.hide);
        setToggle(toggles.breathe, s.breathe);
        setToggle(toggles.profile, s.profileEnabled);
        setToggle(toggles.autoLoad, s.autoLoad);

        breatheSliders.style.display = toggles.breathe.classList.contains('active') ? 'block' : 'none';
        updatePreview();
      }
    });
  }

  // ============ 预览 ============

  function updatePreview() {
    const color = fields.highlightColor.value;
    const glow = fields.glowColor.value;
    const breathe = toggles.breathe.classList.contains('active');

    previewTweet.style.borderLeftColor = color;
    previewTweet.style.boxShadow = breathe ? `0 0 15px ${glow}40, 0 0 30px ${glow}20` : 'none';
    previewTweet.style.animation = breathe ? 'preview-breathe 2s ease-in-out infinite' : 'none';
  }

  // ============ 状态 ============

  function showStatus(msg, ok) {
    statusText.textContent = msg;
    statusBar.className = ok ? 'status-bar active' : 'status-bar';
    setTimeout(() => {
      statusText.textContent = '就绪';
      statusBar.className = 'status-bar';
    }, 2000);
  }

  // ============ 初始化 ============

  loadSettings();
  updatePreview();
});
