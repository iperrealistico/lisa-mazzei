import type { Metadata, Viewport } from "next";
import "./global.css";
import siteData from "../content/site.json";

export const metadata: Metadata = {
    title: siteData.seo.title,
    description: siteData.seo.description,
    keywords: siteData.seo.keywords,
    authors: [{ name: "Lisa Mazzei" }],
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    alternates: {
        canonical: siteData.seo.canonical,
        languages: {
            'it': `${siteData.seo.canonical}/`,
            'en': `${siteData.seo.canonical}/en`,
            'x-default': `${siteData.seo.canonical}/`
        }
    },
    openGraph: {
        title: siteData.seo.title,
        description: siteData.seo.description,
        type: "website",
        url: siteData.seo.canonical,
        siteName: "Lisa Mazzei Photography",
        locale: "it_IT",
        images: [{
            url: siteData.seo.ogImage,
            width: 1200,
            height: 630,
        }]
    },
    twitter: {
        card: "summary_large_image",
        title: siteData.seo.title,
        description: siteData.seo.description,
        images: [siteData.seo.ogImage],
    },
    appleWebApp: {
        title: "Lisa Mazzei",
        statusBarStyle: "black-translucent",
        capable: true
    },
    icons: {
        icon: [
            { url: '/favicon.ico' },
            { url: '/icon.png', type: 'image/png', sizes: '192x192' }
        ],
        apple: [
            { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }
        ]
    }
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="it">
            <head>
                <link rel="preload" href="https://fonts.googleapis.com/css2?family=Cousine:wght@400;700&family=Helvetica+Neue:wght@400;700&display=swap" as="style" />
                <link rel="preload" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" as="style" />
                <link href="https://fonts.googleapis.com/css2?family=Cousine:wght@400;700&family=Helvetica+Neue:wght@400;700&display=swap" rel="stylesheet" />
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" />
            </head>
            <body>
                {children}
                <footer className="footer">
                    © {new Date().getFullYear()} Lisa Mazzei. All rights reserved.
                </footer>
            </body>
        </html>
    );
}
