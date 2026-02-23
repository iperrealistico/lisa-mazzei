import siteData from "../content/site.json";
import PortfolioUI from "../components/PortfolioUI";

export default function HomePage() {
    return <PortfolioUI siteData={siteData} lang="it" />;
}
