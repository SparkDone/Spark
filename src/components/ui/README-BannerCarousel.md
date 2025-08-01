# BannerCarousel 组件

一个功能完整的响应式轮播组件，专为首页和分类页面的banner展示设计。

## 功能特性

- ✅ 支持多张图片自动轮播
- ✅ 鼠标悬停暂停播放
- ✅ 键盘导航支持（左右箭头键）
- ✅ 触摸滑动支持（移动设备）
- ✅ 响应式设计，适配各种屏幕尺寸
- ✅ 与文章页面图片相同的圆角设计
- ✅ 暗色主题适配
- ✅ 高对比度模式支持
- ✅ 减少动画模式支持
- ✅ 可配置的自动播放间隔
- ✅ 可选的导航箭头和指示点
- ✅ 支持图片标题和副标题
- ✅ 支持点击跳转链接

## 使用方法

### 1. 导入组件

```astro
import BannerCarousel from "../components/ui/BannerCarousel.astro";
```

### 2. 准备图片数据

```typescript
interface BannerImage {
  src: string;        // 图片URL
  alt: string;        // 图片描述
  title?: string;     // 标题（可选）
  subtitle?: string;  // 副标题（可选）
  link?: string;      // 跳转链接（可选）
}

const images: BannerImage[] = [
  {
    src: "https://example.com/image1.jpg",
    alt: "图片描述",
    title: "图片标题",
    subtitle: "图片副标题",
    link: "/posts/example"
  },
  // 更多图片...
];
```

### 3. 使用组件

```astro
<BannerCarousel 
  images={images}
  autoPlay={true}
  interval={5000}
  showDots={true}
  showArrows={true}
  height="400px"
  className="w-full"
/>
```

## 组件属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `images` | `BannerImage[]` | `[]` | 图片数据数组 |
| `autoPlay` | `boolean` | `true` | 是否自动播放 |
| `interval` | `number` | `5000` | 自动播放间隔（毫秒） |
| `showDots` | `boolean` | `true` | 是否显示指示点 |
| `showArrows` | `boolean` | `true` | 是否显示导航箭头 |
| `height` | `string` | `"400px"` | 轮播高度 |
| `className` | `string` | `""` | 额外的CSS类名 |

## 样式定制

组件使用CSS变量，可以通过修改主题变量来定制样式：

```css
:root {
  --radius-large: 1rem;        /* 圆角大小 */
  --card-bg: #ffffff;          /* 背景颜色 */
  --primary: #3b82f6;          /* 主色调 */
  --text-90: #1f2937;          /* 文字颜色 */
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1); /* 阴影 */
}
```

## 响应式设计

组件在不同屏幕尺寸下会自动调整：

- **桌面端（>768px）**：完整功能，大尺寸箭头和指示点
- **平板端（≤768px）**：中等尺寸控件，优化触摸体验
- **移动端（≤480px）**：小尺寸控件，简化文字内容

## 无障碍支持

- 键盘导航（左右箭头键）
- 屏幕阅读器友好的ARIA标签
- 高对比度模式支持
- 减少动画模式支持

## 性能优化

- 首张图片使用 `eager` 加载，其他图片懒加载
- 鼠标悬停时暂停自动播放，节省资源
- 使用 `requestIdleCallback` 优化性能
- 支持 Swup 页面切换时的重新初始化

## 示例用法

### 首页Banner

```astro
---
import { getHomeBanners } from "../data/banners";
const bannerImages = getHomeBanners();
---

<BannerCarousel 
  images={bannerImages}
  autoPlay={true}
  interval={5000}
  height="400px"
/>
```

### 分类页Banner

```astro
---
import { getCategoryBanners } from "../data/banners";
const categoryBanners = getCategoryBanners('technology');
---

<BannerCarousel 
  images={categoryBanners}
  autoPlay={true}
  interval={6000}
  height="350px"
/>
```

### 单张图片展示

```astro
<BannerCarousel 
  images={[singleImage]}
  autoPlay={false}
  showDots={false}
  showArrows={false}
  height="300px"
/>
```

## 测试页面

访问 `/test-banner` 查看组件的各种使用示例和功能演示。

## 注意事项

1. 确保图片URL可访问，建议使用CDN
2. 图片建议使用16:9或类似的宽屏比例
3. 图片大小建议在1920x1080左右，确保清晰度
4. 标题和副标题不宜过长，避免在小屏幕上显示问题
5. 自动播放间隔建议在3-8秒之间，太快或太慢都会影响用户体验
