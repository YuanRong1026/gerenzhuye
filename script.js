// 内联图片数据
const embeddedImageData = {
  "light": [
    { "id": 1, "url": "images/light/1.jpg", "description": "浅色1", "credit": "原神壁纸" },
    { "id": 2, "url": "images/light/2.webp", "description": "浅色2", "credit": "原神壁纸" },
    { "id": 3, "url": "images/light/3.jpg", "description": "浅色3", "credit": "原神壁纸" }
  ],
  "dark": [
    { "id": 1, "url": "images/dark/1.jpeg", "description": "深色1", "credit": "原神壁纸" },
    { "id": 2, "url": "images/dark/2.webp", "description": "深色2", "credit": "原神壁纸" },
    { "id": 3, "url": "images/dark/3.jpg", "description": "深色3", "credit": "原神壁纸" },
    { "id": 4, "url": "images/dark/4.webp", "description": "深色4", "credit": "原神壁纸" }
  ],
  "fallback": {
    "light": "images/light/1.jpg",
    "dark": "images/dark/1.jpeg"
  }
};

// 图片API管理器
const ImageAPI = {
  // 缓存图片列表
  imageCache: null,
  // 切换锁定状态，防止重复切换
  isSwitching: false,
  // 当前主题
  currentTheme: 'light',
  // 已加载的图片缓存
  loadedImages: {
    light: null,
    dark: null
  },
  
  // 获取图片列表
  async getImageList() {
    if (this.imageCache) {
      return this.imageCache;
    }
    
    // 使用内联数据
    this.imageCache = embeddedImageData;
    return this.imageCache;
  },
  
  // 获取随机图片 - 确保不重复
  async getRandomImage(theme = 'light') {
    const imageData = await this.getImageList();
    
    if (!imageData || !imageData[theme] || imageData[theme].length === 0) {
      return this.getFallbackImage(theme, imageData);
    }
    
    // 如果没有已加载的图片或需要强制刷新
    if (!this.loadedImages[theme]) {
      const images = imageData[theme];
      const randomIndex = Math.floor(Math.random() * images.length);
      this.loadedImages[theme] = images[randomIndex];
    }
    
    return this.loadedImages[theme];
  },
  
  // 强制刷新当前主题的图片
  async refreshCurrentThemeImage() {
    const imageData = await this.getImageList();
    const theme = this.currentTheme;
    
    if (imageData && imageData[theme] && imageData[theme].length > 0) {
      const images = imageData[theme];
      const randomIndex = Math.floor(Math.random() * images.length);
      this.loadedImages[theme] = images[randomIndex];
    }
  },
  
  // 获取回退图片
  getFallbackImage(theme, imageData) {
    if (imageData && imageData.fallback && imageData.fallback[theme]) {
      return {
        url: imageData.fallback[theme],
        description: '回退图片',
        credit: '默认'
      };
    }
    
    return {
      url: theme === 'dark' ? 'images/dark/1.jpeg' : 'images/light/1.jpg',
      description: '默认背景',
      credit: '系统'
    };
  },
  
  // 预加载图片
  preloadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject(new Error(`无法加载图片: ${url}`));
      img.src = url;
    });
  },
  
  // 使用双背景层实现丝滑切换 - 修复版
  async switchBackgroundWithAnimation(targetTheme = null) {
    // 如果正在切换中，直接返回
    if (this.isSwitching) {
      return;
    }
    
    // 锁定切换状态
    this.isSwitching = true;
    
    const currentBg = document.querySelector('.current-background');
    const nextBg = document.querySelector('.next-background');
    
    if (!currentBg || !nextBg) {
      this.isSwitching = false;
      return;
    }
    
    try {
      // 确定目标主题
      let themeToLoad;
      if (targetTheme) {
        themeToLoad = targetTheme;
        this.currentTheme = targetTheme;
      } else {
        themeToLoad = this.currentTheme;
      }
      
      // 获取新图片信息
      const imageInfo = await this.getRandomImage(themeToLoad);
      
      if (!imageInfo || !imageInfo.url) {
        throw new Error('无法获取图片URL');
      }
      
      // 预加载新图片
      try {
        await this.preloadImage(imageInfo.url);
      } catch (error) {
        // 图片预加载失败，使用回退方案
        const fallbackInfo = this.getFallbackImage(themeToLoad, await this.getImageList());
        imageInfo.url = fallbackInfo.url;
      }
      
      // 设置下一层背景
      nextBg.style.backgroundImage = `url('${imageInfo.url}')`;
      
      // 开始切换动画
      nextBg.style.opacity = '1';
      currentBg.style.opacity = '0';
      
      // 等待动画完成
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // 交换层的位置
      nextBg.style.opacity = '0';
      currentBg.style.backgroundImage = `url('${imageInfo.url}')`;
      currentBg.style.opacity = '1';
      
      // 更新当前主题
      this.currentTheme = themeToLoad;
      
    } catch (error) {
      // 错误处理
      const theme = targetTheme || this.currentTheme;
      const fallbackInfo = this.getFallbackImage(theme, await this.getImageList());
      currentBg.style.backgroundImage = `url('${fallbackInfo.url}')`;
    } finally {
      // 解锁切换状态
      setTimeout(() => {
        this.isSwitching = false;
      }, 300);
    }
  },
  
  // 初始化背景图片
  async initializeBackground(theme = 'light') {
    const currentBg = document.querySelector('.current-background');
    
    if (!currentBg) {
      return;
    }
    
    // 设置初始主题
    this.currentTheme = theme;
    
    try {
      const imageInfo = await this.getRandomImage(theme);
      
      if (!imageInfo || !imageInfo.url) {
        throw new Error('无法获取图片URL');
      }
      
      // 预加载图片
      try {
        await this.preloadImage(imageInfo.url);
      } catch (error) {
        // 图片预加载失败，使用回退方案
        const fallbackInfo = this.getFallbackImage(theme, await this.getImageList());
        imageInfo.url = fallbackInfo.url;
      }
      
      // 设置初始背景
      currentBg.style.backgroundImage = `url('${imageInfo.url}')`;
      
    } catch (error) {
      // 错误处理
      const fallbackInfo = this.getFallbackImage(theme, await this.getImageList());
      currentBg.style.backgroundImage = `url('${fallbackInfo.url}')`;
    }
  }
};

// 页面加载动画
document.addEventListener('DOMContentLoaded', function() {
  console.log('%c 👋 欢迎来到远容esh的个人主页！', 'color: #3498db; font-size: 16px; font-weight: bold;');
  console.log('%c 远容esh个人主页，版本: 3.3，作者: 远容esh，更新日期: 2026年2月7日 00:15', 'color: #7f8c8d; font-size: 14px;');
  console.log('%c 已开源到GitHub，仓库gerenzhuye', 'color:rgb(136, 136, 136); font-size: 12px;');
  
  // 为卡片添加延迟出现效果
  const cards = document.querySelectorAll('.contact-card, .blog-card, .intro-section');
  
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    
    setTimeout(() => {
      card.style.transition = 'opacity 0.6s ease';
      card.style.opacity = '1';
    }, 100 + index * 100);
  });
  
  // 头像加载动画
  const avatarContainer = document.querySelector('.avatar-container');
  if (avatarContainer) {
    avatarContainer.style.opacity = '0';
    avatarContainer.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
      avatarContainer.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      avatarContainer.style.opacity = '1';
      avatarContainer.style.transform = 'scale(1)';
    }, 200);
  }
  
  // 添加关于我部分的动画
  const aboutContent = document.querySelector('.about-content');
  if (aboutContent) {
    aboutContent.style.opacity = '0';
    aboutContent.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      aboutContent.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      aboutContent.style.opacity = '1';
      aboutContent.style.transform = 'translateY(0)';
    }, 1500);
  }
  
  // 初始化返回顶部按钮
  initBackToTop();
  
  // 初始化主题切换功能（包含图片API）
  initThemeToggle();
  
  // 页面加载时设置背景图片
  initializeBackground();
});

// 初始化背景图片
async function initializeBackground() {
  // 获取当前主题
  const savedTheme = localStorage.getItem('theme') || 'light';
  const currentTheme = document.documentElement.getAttribute('data-theme') || savedTheme;
  
  // 初始加载背景图片
  await ImageAPI.initializeBackground(currentTheme);
}

// 返回顶部按钮
function initBackToTop() {
  const backToTopBtn = document.querySelector('.back-to-top');
  if (!backToTopBtn) return;
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });
  
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// 主题切换功能（集成图片API）
function initThemeToggle() {
  const themeToggle = document.querySelector('.theme-toggle');
  if (!themeToggle) return;
  
  // 检查本地存储的主题偏好
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = localStorage.getItem('theme');
  
  // 设置初始主题
  if (currentTheme === 'dark' || (!currentTheme && prefersDarkScheme.matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    ImageAPI.currentTheme = 'dark';
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    ImageAPI.currentTheme = 'light';
  }
  
  // 主题切换点击事件 - 修复版
  themeToggle.addEventListener('click', async () => {
    // 如果正在切换中，直接返回
    if (ImageAPI.isSwitching) {
      return;
    }
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // 确定目标主题
    let targetTheme;
    if (isDark) {
      // 切换到亮色主题
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      targetTheme = 'light';
    } else {
      // 切换到暗色主题
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      targetTheme = 'dark';
    }
    
    // 强制刷新目标主题的图片
    await ImageAPI.refreshCurrentThemeImage();
    
    // 使用丝滑动画切换背景图片
    await ImageAPI.switchBackgroundWithAnimation(targetTheme);
  });
}

// 监听主题变化（如果有其他代码修改主题）
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(async function(mutation) {
    if (mutation.attributeName === 'data-theme') {
      const theme = document.documentElement.getAttribute('data-theme') || 'light';
      
      // 如果正在切换中，直接返回
      if (ImageAPI.isSwitching) {
        return;
      }
      
      // 刷新目标主题的图片
      await ImageAPI.refreshCurrentThemeImage();
      
      // 使用丝滑动画切换背景图片
      await ImageAPI.switchBackgroundWithAnimation(theme);
    }
  });
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme']
});
