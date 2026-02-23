import siteData from "../../content/site.json";
import PortfolioUI from "../../components/PortfolioUI";

export default function EnglishHomePage() {
    return <PortfolioUI siteData={siteData} lang="en" />;
}
