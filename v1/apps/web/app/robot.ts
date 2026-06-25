import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'LinkedInBot',
        disallow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    // Optional: Add your sitemap if you have one
    // sitemap: 'https://verisite.luqman.cloud/sitemap.xml',
  }
}