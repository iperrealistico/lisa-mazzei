import type { Metadata } from 'next';
import siteData from '@/content/site.json';
import PortfolioUI from '@/components/PortfolioUI';

export const metadata: Metadata = {
    title: `Editions | ${siteData.seo.title}`,
    description: 'Photobooks, prints and editions by Lisa Mazzei.',
    alternates: {
        canonical: `${siteData.seo.canonical}/editions`,
    },
};

export default function EditionsPage() {
    return <PortfolioUI siteData={siteData} lang="it" activeProjectSlug="editions" />;
}
