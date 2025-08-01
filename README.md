# 🚀 SparkDone Blog

基于 Astro + Strapi 构建的现代化博客系统。

## ✨ 特性

- 🎨 **现代化设计** - 响应式布局，支持深色/浅色主题
- 📝 **内容管理** - 集成 Strapi CMS，支持实时内容更新
- 🔍 **全文搜索** - 基于 Pagefind 的快速搜索功能
- 🖼️ **图片优化** - 自动图片压缩和响应式处理
- 📱 **移动优先** - 完美的移动端体验
- ⚡ **性能优化** - 静态生成 + 边缘计算
- 🔒 **安全可靠** - 环境变量管理，安全头配置

## 🛠️ 技术栈

- **前端框架**: Astro 5.x
- **内容管理**: Strapi CMS
- **样式**: Tailwind CSS
- **搜索**: Pagefind
- **部署**: Cloudflare Pages
- **包管理**: pnpm

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd <project-name>
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 环境配置
复制 `.env.example` 为 `.env.local` 并配置：
```bash
cp .env.example .env.local
```

编辑 `.env.local`：
```env
STRAPI_URL=https://your-strapi-url.com
STRAPI_API_TOKEN=your_api_token_here
USE_STRAPI=true
```

### 4. 启动开发服务器
```bash
pnpm dev
```

访问 http://localhost:4321

## 📦 构建部署

### 本地构建
```bash
pnpm build
pnpm preview
```

### Cloudflare Pages 部署

1. **连接 GitHub 仓库**
2. **构建设置**:
   - Framework: `Astro`
   - Build command: `pnpm build`
   - Build output directory: `dist/client`
   - Node.js version: 18 或更高

3. **环境变量**:
   ```env
   STRAPI_URL=https://your-strapi-url.com
   STRAPI_PUBLIC_URL=https://your-strapi-url.com
   STRAPI_API_TOKEN=your_api_token_here
   USE_STRAPI=true
   USE_HYBRID_MODE=true
   NODE_ENV=production
   ```

## 📁 项目结构

```
/
├── src/
│   ├── components/     # 组件
│   ├── layouts/        # 布局
│   ├── pages/          # 页面和API路由
│   ├── styles/         # 样式文件
│   ├── utils/          # 工具函数
│   └── lib/            # 核心库
├── public/             # 静态资源
├── scripts/            # 构建脚本
└── DEPLOYMENT.md       # 部署指南
```

## 🔧 开发命令

```bash
# 开发服务器
pnpm dev

# 构建项目
pnpm build

# 预览构建
pnpm preview

# 安全检查
pnpm security-check

# 部署前检查
pnpm pre-deploy
```

## 📖 更多文档

- [部署指南](./DEPLOYMENT.md) - 详细的部署说明
- [Astro 文档](https://docs.astro.build/)
- [Strapi 文档](https://docs.strapi.io/)

## 📄 许可证

MIT License

---

**SparkDone** - 帮你创意落地 ✨

> 最后更新：2025-08-01 18:45 - CF Pages部署测试
