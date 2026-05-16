// 内联图片数据
const embeddedImageData = {
  "light": [
    { "id": 1, "url": "images/light/1.jpg", "description": "浅色1", "credit": "原神壁纸" },
    { "id": 2, "url": "images/light/2.webp", "description": "浅色2", "credit": "原神壁纸" },
  ],
  "dark": [
    { "id": 2, "url": "images/dark/2.webp", "description": "深色2", "credit": "原神壁纸" },
    { "id": 3, "url": "images/dark/3.jpg", "description": "深色3", "credit": "原神壁纸" }
  ],
  "fallback": {
    "light": "images/light/1.jpg",
    "dark": "images/dark/2.webp"   // 修复缺失的 1.jpeg
  }
};

// 图片API管理器
const ImageAPI = {
  imageCache: null,
  isSwitching: false,
  currentTheme: 'light',
  loadedImages: { light: null, dark: null },
  
  async getImageList() {
    if (this.imageCache) return this.imageCache;
    this.imageCache = embeddedImageData;
    return this.imageCache;
  },
  
  async getRandomImage(theme = 'light') {
    const imageData = await this.getImageList();
    if (!imageData || !imageData[theme] || imageData[theme].length === 0) {
      return this.getFallbackImage(theme, imageData);
    }
    if (!this.loadedImages[theme]) {
      const images = imageData[theme];
      const randomIndex = Math.floor(Math.random() * images.length);
      this.loadedImages[theme] = images[randomIndex];
    }
    return this.loadedImages[theme];
  },
  
  async refreshCurrentThemeImage() {
    const imageData = await this.getImageList();
    const theme = this.currentTheme;
    if (imageData && imageData[theme] && imageData[theme].length > 0) {
      const images = imageData[theme];
      const randomIndex = Math.floor(Math.random() * images.length);
      this.loadedImages[theme] = images[randomIndex];
    }
  },
  
  getFallbackImage(theme, imageData) {
    if (imageData && imageData.fallback && imageData.fallback[theme]) {
      return { url: imageData.fallback[theme], description: '回退图片', credit: '默认' };
    }
    return { url: theme === 'dark' ? 'images/dark/2.webp' : 'images/light/1.jpg', description: '默认背景', credit: '系统' };
  },
  
  preloadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject(new Error(`无法加载图片: ${url}`));
      img.src = url;
    });
  },
  
  async switchBackgroundWithAnimation(targetTheme = null) {
    if (this.isSwitching) return;
    this.isSwitching = true;
    const currentBg = document.querySelector('.current-background');
    const nextBg = document.querySelector('.next-background');
    if (!currentBg || !nextBg) { this.isSwitching = false; return; }
    try {
      let themeToLoad = targetTheme || this.currentTheme;
      let imageInfo = await this.getRandomImage(themeToLoad);
      if (!imageInfo || !imageInfo.url) throw new Error('no url');
      try { await this.preloadImage(imageInfo.url); } catch(e) {
        const fallbackInfo = this.getFallbackImage(themeToLoad, await this.getImageList());
        imageInfo.url = fallbackInfo.url;
      }
      nextBg.style.backgroundImage = `url('${imageInfo.url}')`;
      nextBg.style.opacity = '1';
      currentBg.style.opacity = '0';
      await new Promise(resolve => setTimeout(resolve, 1200));
      nextBg.style.opacity = '0';
      currentBg.style.backgroundImage = `url('${imageInfo.url}')`;
      currentBg.style.opacity = '1';
      this.currentTheme = themeToLoad;
    } catch(e) { console.warn(e); } finally {
      setTimeout(() => { this.isSwitching = false; }, 300);
    }
  },
  
  async initializeBackground(theme = 'light') {
    const currentBg = document.querySelector('.current-background');
    if (!currentBg) return;
    this.currentTheme = theme;
    try {
      let imageInfo = await this.getRandomImage(theme);
      if (!imageInfo || !imageInfo.url) throw new Error();
      try { await this.preloadImage(imageInfo.url); } catch(e) {
        const fallbackInfo = this.getFallbackImage(theme, await this.getImageList());
        imageInfo.url = fallbackInfo.url;
      }
      currentBg.style.backgroundImage = `url('${imageInfo.url}')`;
    } catch(e) {
      const fallbackInfo = this.getFallbackImage(theme, await this.getImageList());
      currentBg.style.backgroundImage = `url('${fallbackInfo.url}')`;
    }
  }
};

// ========== 资源加载检测 ==========
function waitForAllImages() {
  const images = document.images;
  if (images.length === 0) return Promise.resolve();
  const promises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      img.addEventListener('load', resolve);
      img.addEventListener('error', resolve);
    });
  });
  return Promise.all(promises);
}

async function waitForBackgroundImages() {
  const imageData = await ImageAPI.getImageList();
  const allUrls = [];
  if (imageData.light) allUrls.push(...imageData.light.map(i => i.url));
  if (imageData.dark) allUrls.push(...imageData.dark.map(i => i.url));
  if (imageData.fallback) {
    allUrls.push(imageData.fallback.light, imageData.fallback.dark);
  }
  const promises = allUrls.map(url => ImageAPI.preloadImage(url).catch(() => {}));
  await Promise.all(promises);
}

function waitForStable() {
  return new Promise(resolve => setTimeout(resolve, 500));
}

// ========== 飞行动画 ==========
async function flyAvatarToTarget() {
  const loadingAvatar = document.getElementById('loadingAvatar');
  const targetWrapper = document.getElementById('targetAvatarWrapper');
  const finalAvatar = document.getElementById('finalAvatar');
  if (!loadingAvatar || !targetWrapper) return;

  const startRect = loadingAvatar.getBoundingClientRect();
  const targetRect = targetWrapper.getBoundingClientRect();
  
  const deltaX = targetRect.left + targetRect.width/2 - (startRect.left + startRect.width/2);
  const deltaY = targetRect.top + targetRect.height/2 - (startRect.top + startRect.height/2);
  const scaleX = targetRect.width / startRect.width;
  const scaleY = targetRect.height / startRect.height;
  
  loadingAvatar.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.9, 0.4, 1.1)';
  loadingAvatar.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;
  
  const loadingRing = document.querySelector('.loading-ring');
  if (loadingRing) {
    loadingRing.style.transition = 'opacity 0.5s ease';
    loadingRing.style.opacity = '0';
  }
  
  await new Promise(resolve => setTimeout(resolve, 900));
  
  finalAvatar.src = loadingAvatar.src;
  finalAvatar.style.opacity = '1';
  
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    await new Promise(resolve => setTimeout(resolve, 500));
    overlay.style.display = 'none';
  }
  
  document.querySelector('.theme-toggle').style.display = 'flex';
  document.querySelector('.back-to-top').style.display = 'flex';
  
  const headerContent = document.getElementById('headerContent');
  headerContent.style.opacity = '1';
  headerContent.style.visibility = 'visible';
  
  const bgContainer = document.querySelector('.background-container');
  if (bgContainer) bgContainer.style.opacity = '1';
  
  initSwipeHint();
}

// ========== 滚动提示隐藏 ==========
function initSwipeHint() {
  const hint = document.getElementById('swipeHint');
  if (!hint) return;
  const handleScroll = () => {
    if (window.scrollY > 20) {
      hint.classList.add('hide');
      window.removeEventListener('scroll', handleScroll);
    }
  };
  window.addEventListener('scroll', handleScroll);
  if (window.scrollY > 20) hint.classList.add('hide');
}

// ========== 返回顶部 ==========
function initBackToTop() {
  const backToTopBtn = document.querySelector('.back-to-top');
  if (!backToTopBtn) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) backToTopBtn.classList.add('visible');
    else backToTopBtn.classList.remove('visible');
  });
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ========== 主题切换 ==========
function initThemeToggle() {
  const themeToggle = document.querySelector('.theme-toggle');
  if (!themeToggle) return;
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'dark' || (!currentTheme && prefersDarkScheme.matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    ImageAPI.currentTheme = 'dark';
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    ImageAPI.currentTheme = 'light';
  }
  themeToggle.addEventListener('click', async () => {
    if (ImageAPI.isSwitching) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    let targetTheme;
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      targetTheme = 'light';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      targetTheme = 'dark';
    }
    await ImageAPI.refreshCurrentThemeImage();
    await ImageAPI.switchBackgroundWithAnimation(targetTheme);
  });
}

// ========== 页面加载主流程 ==========
window.addEventListener('load', async () => {
  // 等待所有资源加载完成
  await Promise.all([waitForAllImages(), waitForBackgroundImages(), waitForStable()]);
  // 执行飞行动画（遮罩消失）
  await flyAvatarToTarget();
  // 初始化背景（确保主题正确）
  const savedTheme = localStorage.getItem('theme') || 'light';
  await ImageAPI.initializeBackground(savedTheme);
  // 初始化功能
  initThemeToggle();
  initBackToTop();
});

// 预置初始样式
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.theme-toggle').style.display = 'none';
  document.querySelector('.back-to-top').style.display = 'none';
  const bgContainer = document.querySelector('.background-container');
  if (bgContainer) bgContainer.style.opacity = '0';
  document.getElementById('finalAvatar').style.opacity = '0';
  document.getElementById('headerContent').style.opacity = '0';
  document.getElementById('headerContent').style.visibility = 'hidden';
  
  // 控制台欢迎日志
  console.log('%c 👋 欢迎来到远容esh的个人主页！', 'color: #3498db; font-size: 16px; font-weight: bold;');
  console.log('%c 远容esh个人主页，版本: 4.2，作者: 远容esh，更新日期: 2026年5月16日', 'color: #7f8c8d; font-size: 14px;');
  console.log('%c 已开源到GitHub，仓库gerenzhuye', 'color:rgb(136, 136, 136); font-size: 12px;');
});