/**
 * Banner轮播数据
 * 支持静态数据和Strapi动态数据
 */

import { getHomeBannersFromStrapi } from '../lib/banner-adapter';

export interface BannerImage {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  link?: string;
  textColor?: 'light' | 'dark' | 'auto';
  textColorCustom?: string;
}

// 首页Banner数据 - 科技AI风格
export const homeBanners: BannerImage[] = [
  {
    src: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    alt: "AI人工智能概念",
    title: "AI 革命时代",
    subtitle: "探索人工智能如何重塑我们的未来",
    link: "/category/ai"
  },
  {
    src: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2025&q=80",
    alt: "编程代码界面",
    title: "代码艺术",
    subtitle: "用代码创造无限可能的数字世界",
    link: "/category/programming"
  },
  {
    src: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    alt: "量子计算概念",
    title: "量子计算",
    subtitle: "下一代计算技术的突破与创新",
    link: "/category/quantum"
  },
  {
    src: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    alt: "区块链网络",
    title: "Web3.0 未来",
    subtitle: "去中心化网络与区块链技术革新",
    link: "/category/web3"
  },
  {
    src: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    alt: "数据可视化",
    title: "数据科学",
    subtitle: "从海量数据中发现价值与洞察",
    link: "/category/data-science"
  }
];

// 分类页Banner数据 - 科技AI风格
export const categoryBanners: Record<string, BannerImage[]> = {
  ai: [
    {
      src: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      alt: "AI神经网络",
      title: "机器学习",
      subtitle: "深度学习算法与神经网络架构"
    },
    {
      src: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2065&q=80",
      alt: "AI机器人",
      title: "智能机器人",
      subtitle: "自主学习与决策的智能系统"
    }
  ],

  programming: [
    {
      src: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2025&q=80",
      alt: "代码编程",
      title: "现代开发",
      subtitle: "前沿编程语言与开发框架"
    },
    {
      src: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      alt: "云计算架构",
      title: "云原生",
      subtitle: "微服务与容器化部署策略"
    }
  ],

  quantum: [
    {
      src: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      alt: "量子计算机",
      title: "量子算法",
      subtitle: "量子比特与量子纠缠原理"
    },
    {
      src: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      alt: "量子物理",
      title: "量子优势",
      subtitle: "超越经典计算的计算能力"
    }
  ],

  web3: [
    {
      src: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      alt: "区块链网络",
      title: "去中心化",
      subtitle: "分布式账本与智能合约"
    },
    {
      src: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      alt: "加密货币",
      title: "数字资产",
      subtitle: "NFT与DeFi生态系统"
    }
  ],

  "data-science": [
    {
      src: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      alt: "数据可视化",
      title: "大数据分析",
      subtitle: "数据挖掘与预测建模"
    },
    {
      src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      alt: "数据图表",
      title: "商业智能",
      subtitle: "数据驱动的决策支持系统"
    }
  ]
};

// 检查分类Banner是否启用
export async function isCategoryBannerEnabled(category: string): Promise<boolean> {
  try {
    const { isCategoryBannerEnabled } = await import('../lib/banner-adapter');
    return await isCategoryBannerEnabled(category);
  } catch (error) {
    console.error('检查分类Banner开关失败:', error);
    return true; // 出错时默认启用
  }
}

// 获取指定分类的Banner数据 - 异步从Strapi获取
export async function getCategoryBanners(category: string): Promise<BannerImage[]> {
  try {
    // 首先检查是否启用Banner
    const isEnabled = await isCategoryBannerEnabled(category);
    if (!isEnabled) {
      return [];
    }

    // 首先尝试从Strapi获取
    const { getCategoryBannersFromStrapi } = await import('../lib/banner-adapter');
    const strapiBanners = await getCategoryBannersFromStrapi(category);

    if (strapiBanners.length > 0) {
      return strapiBanners;
    }

    // 如果Strapi没有数据，使用静态数据作为后备
    return categoryBanners[category] || [];

  } catch (error) {
    console.error('获取分类Banner数据失败，使用静态数据:', error);
    return categoryBanners[category] || [];
  }
}

// 检查首页Banner是否启用
export async function isHomeBannerEnabled(): Promise<boolean> {
  try {
    const { isHomeBannerEnabled } = await import('../lib/banner-adapter');
    return await isHomeBannerEnabled();
  } catch (error) {
    console.error('检查首页Banner开关失败:', error);
    return true; // 出错时默认启用
  }
}

// 获取首页Banner数据 - 异步从Strapi获取
export async function getHomeBanners(): Promise<BannerImage[]> {
  try {
    // 首先检查是否启用Banner
    const isEnabled = await isHomeBannerEnabled();
    if (!isEnabled) {
      return [];
    }

    // 从Strapi获取真实数据
    const strapiBanners = await getHomeBannersFromStrapi();

    if (strapiBanners.length > 0) {
      return strapiBanners;
    }

    // 如果Strapi没有数据，使用静态数据作为后备
    return homeBanners;

  } catch (error) {
    console.error('获取Banner数据失败，使用静态数据:', error);
    return homeBanners;
  }
}

// 默认Banner（当没有指定数据时使用）- 科技AI风格
export const defaultBanner: BannerImage = {
  src: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
  alt: "AI科技未来",
  title: "科技前沿",
  subtitle: "探索人工智能与未来科技"
};
