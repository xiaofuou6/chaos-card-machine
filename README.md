# 混乱计划抽卡机 🎴

把待办清单变成充满未知的行动卡牌游戏

## 功能特点

- ✅ 任务池管理（添加、删除、分类）
- 🎲 智能随机抽取任务
- ⏱️ 内置计时器
- 📱 PWA支持（可安装到桌面/手机）
- 💾 本地存储（无需网络）
- 🔄 每日重置常规任务状态

## 使用方法

1. 直接用浏览器打开 `index.html` 文件
2. 或者部署到任何静态文件服务器

## 安装为应用

1. 在Chrome/Edge浏览器中打开
2. 点击地址栏右侧的"安装"按钮
3. 即可像原生应用一样使用

## 技术栈

- HTML5 + CSS3 + Vanilla JavaScript
- PWA (Progressive Web App)
- localStorage 本地存储
- Service Worker 离线缓存

## 项目结构

```
chaos-card-machine/
├── index.html      # 主页面
├── app.js          # 核心逻辑
├── manifest.json   # PWA配置
├── sw.js          # Service Worker
└── README.md      # 说明文档
```