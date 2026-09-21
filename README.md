# 🐺 Mr.wolf\'s Blog

> 记录安全学习的点滴，从学习者到从业者的成长之路。

![Blog Screenshot](https://worldpeace.top/img/pages/home-bg.jpg)

一个基于 **Hexo** 与 **Butterfly 主题** 搭建的个人技术博客，部署于腾讯云服务器（Docker + Nginx）。

🌐 **在线地址：** [https://worldpeace.top](https://worldpeace.top)

---

## ✨ 功能特色

- 📝 **博文系统** — 支持分类、标签、时间轴归档
- 🎨 **优雅的视觉风格** — 毛玻璃效果 / 渐变卡片 / 自定义滚动条
- 🌗 **明暗主题切换** — 一键切换日间/夜间模式
- 🌐 **繁简体转换** — 支持简繁切换
- 🔍 **全文搜索** — 集成本地搜索
- 📊 **访问统计** — 接入 Busuanzi 统计
- 🎵 **悬浮音乐播放器** — 右下角常驻，切换页面不中断（PJAX）
- 🗺️ **访客地图** — 可视化访客分布
- 🤖 **AI 渗透平台** — 内置 AI 安全学习环境链接
- 📱 **响应式布局** — 完美适配桌面和移动端

## 🗂️ 页面结构

| 页面 | 路径 | 说明 |
|------|------|------|
| 🏠 首页 | `/` | 博文列表 |
| 📚 博文 | `/categories/` | 门类、标签集、时光轴 |
| 🔗 友联 | `/links/` | 友链 + AI 渗透平台 |
| 📸 拾光集 | `/photos/` | 相册 |
| 💡 灵感集 | `/shares/` | 灵感分享 |
| 🎬 帧藏 | `/movies/` | 影视记忆 |
| 💬 回响 | `/comments/` | 留言板 |
| ❤️ 自述 | `/about/` | 关于笔者 |
| 👤 关于我 | `/resume/` | 个人简历 |

---

## ⚠️ 关于 PJAX（换页不刷新）

站点开着 Butterfly 的 `pjax.enable`，页面之间用 AJAX 换内容，
这样悬浮播放器才能跨页连续播放不断点。代价是：

- 被替换的范围是 `#body-wrap`，面板类元素（音乐播放器）在它外面，所以能原样保留；
- **自定义脚本换页后不会重新执行**，必须自己监听 `pjax:complete` 重新初始化，
  已有的例子：`collection.js`、`calendar.js`、`blog-filter.js`、`visitor-map.js`、`daily-quote.js`、`matrix-rain.js`；
- 侧边栏里的访客地图、每日一句都在 `#body-wrap` 内，换页会被抹掉，必须重挂；
- `#rightside-config-hide` 也在替换列表里，而明暗切换的图标就在其中，
  所以 `sun_moon.js` 每次换页后要按 `data-theme` 重新同步图标，否则会出现「夜间模式却显示太阳」。

新加脚本时，记得在 `pjax:complete` 里做一次幂等的初始化（加个「已经初始化过就跳过」的判断）。

---

## 🛠️ 技术栈

| 技术 | 说明 |
|------|------|
| [Hexo](https://hexo.io/) | 静态博客框架 v7.3.0 |
| [Butterfly](https://github.com/jerryc127/hexo-theme-butterfly) | 主题 v5.4.3 |
| Node.js | 运行环境 |
| 腾讯云 + Docker Nginx | 托管部署 |
| Pug | 模板引擎 |
| Stylus | CSS 预处理器 |

---

## 🚀 本地运行

```bash
# 克隆源码
git clone -b source https://github.com/Wolf66660724/Wolf66660724.github.io.git blog
cd blog

# 安装依赖
npm install

# 本地预览
hexo server

# 构建静态文件
hexo generate

# 部署到自建服务器（构建 -> 上传 -> 发布）
powershell -ExecutionPolicy Bypass -File .\deploy.ps1
```

访问 `http://localhost:4000` 即可预览。

---

## 📦 版本标签

| 标签 | 说明 |
|:----:|------|
| v1.0 | 初始版本，博客基础框架 |
| v1.1 | 功能补全、视觉增强、SEO |
| v1.1.1 | 新增使用文档 |
| v1.2 | 当前版本 — 标题美化、明暗动画修复、新博文 |

---

## 📂 项目结构

```
source/
├── _posts/          # 博文 (.md)
├── about/           # 关于页面
├── links/           # 友链页面
├── comments/        # 留言板
├── photos/          # 相册
├── movies/          # 帧藏
├── shares/          # 灵感集
├── resume/          # 简历
├── img/             # 图片资源
│   ├── pages/       # 页面背景图
│   └── posts/       # 文章封面图
├── css/             # 自定义样式
├── js/              # 自定义脚本
└── _data/           # 数据文件（友链等）
```

---

## 🔗 相关链接

- 📖 **在线博客：** [https://worldpeace.top](https://worldpeace.top)
- 💻 **GitHub 仓库：** [https://github.com/Wolf66660724/Wolf66660724.github.io](https://github.com/Wolf66660724/Wolf66660724.github.io)
- 🤖 **AI 渗透平台：** [https://ai.worldpeace.top](https://ai.worldpeace.top)

---

## 📄 许可证

本项目采用 MIT 许可证。


---

## 部署与回滚

站点现已部署在自建服务器（Docker + Nginx），不再使用 GitHub Pages。

```powershell
# 一键构建并发布
powershell -ExecutionPolicy Bypass -File .\deploy.ps1

# 查看服务器上的历史版本
powershell -ExecutionPolicy Bypass -File .\rollback.ps1 -List

# 回滚到指定版本（回滚前会自动备份当前线上版本）
powershell -ExecutionPolicy Bypass -File .\rollback.ps1 -Restore blog-2026-09-17-213000.tar.gz
```
