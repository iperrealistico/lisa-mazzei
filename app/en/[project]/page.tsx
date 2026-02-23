import siteData from '@/content/site.json';
import PortfolioUI from '@/components/PortfolioUI';

export function generateStaticParams() {
    return siteData.projects.map((p: any) => ({
        project: p.slug
    }));
}

export default function Project({ params }: { params: { project: string } }) {
    return <PortfolioUI siteData={siteData} lang="en" activeProjectSlug={params.project} />;
}
