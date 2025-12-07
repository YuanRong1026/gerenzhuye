document.addEventListener('DOMContentLoaded', function() {
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
        avatarContainer.style.transform = 'scale(0.8) translateY(20px)';
        
        setTimeout(() => {
            avatarContainer.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            avatarContainer.style.opacity = '1';
            avatarContainer.style.transform = 'scale(1) translateY(0)';
        }, 200);
    }
    
    // 控制台欢迎信息
    console.log('%c 👋 欢迎来到远容esh的个人空间！', 'color: #3498db; font-size: 16px; font-weight: bold;');
    console.log('%c 简洁 · 优雅 · 专注内容', 'color: #7f8c8d; font-size: 14px;');
});