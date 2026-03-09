const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const siteConfig = {
  name: "SVG Generation",
  description: "Create, Manage, and Share SVGs with AI",
  url: siteUrl,
  ogImage: `${siteUrl}/og.jpg`,
  links: {
    twitter: "",
    github: "",
  },
}; 
