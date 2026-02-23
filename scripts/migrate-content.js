const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const contentDir = path.join(rootDir, 'content');

if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir);
}

const siteJson = {
    seo: {
        title: "Lisa Mazzei - Photographer & Director",
        description: "Lisa Mazzei è una fotografa e regista italiana. Il suo lavoro esplora il mistero del quotidiano attraverso narrazioni visive cinematografiche tra i paesaggi rurali italiani.",
        keywords: "Lisa Mazzei, fotografa, photographer, director, regista, Italia, Toscana, Garfagnana, Country Mysteries, Lyzard Film",
        canonical: "https://www.lisamazzei.com",
        ogImage: "https://www.lisamazzei.com/home/img/img_desktop.jpg"
    },
    nav: [
        {
            type: "section", title: { it: "Projects", en: "Projects" }, links: [
                { slug: "", disabled: true, label: { it: "TBA (2026)", en: "TBA (2026)" } },
                { slug: "countrymysteries", disabled: false, label: { it: "Country Mysteries (2021)", en: "Country Mysteries (2021)" } },
                { slug: "narrative", disabled: false, label: { it: "Stories in Stills (2019)", en: "Stories in Stills (2019)" } },
                { slug: "other", disabled: false, label: { it: "Other", en: "Other" } }
            ]
        },
        {
            type: "section", title: { it: "Commercial", en: "Commercial" }, links: [
                { slug: "nuovestrade", disabled: false, label: { it: "Nuove Strade", en: "Nuove Strade" } },
                { slug: "apocalissitascabili", disabled: false, label: { it: "Apocalissi Tascabili", en: "Apocalissi Tascabili" } },
                { slug: "pdu", disabled: false, label: { it: "PDU", en: "PDU" } }
            ]
        },
        { type: "link", isExternal: true, url: "https://lyzardfilm.com", label: { it: "Films", en: "Films" } },
        { type: "link", isExternal: false, slug: "about", label: { it: "About/Contact", en: "About/Contact" } }
    ],
    home: {
        desktopImage: "home/img/img_desktop.jpg",
        mobileImage: "home/img/img_mobile.jpg"
    },
    about: {
        image: "about/img/img1.jpg",
        title: { it: "About/Contact", en: "About/Contact" },
        content: {
            it: `Lisa Mazzei is an Italian photographer and director. She holds a degree in Fine Arts from Florence and specialized in Cinematography in Rome. As one half of the creative duo Lyzard Film, she focuses on music videos for Italian artists and fashion films. Her photographic and video work has been featured at Pitti Uomo, Milano Unica, and ImageNation Paris, and she has collaborated with brands such as Kodak. She has received nominations at the Videoclip Italia Awards, Milano Fashion Film Festival, CANiFF, and the Berlin Fashion Film Festival.

**Contacts**
E-mail: [lyzardfilm@gmail.com](mailto:lyzardfilm@gmail.com)

**Expositions**
- Pitti Uomo, Velvet Mi Amor, installation, Florence, Italy, 2024
- 45° Festival di Cinema e Donne, TAPE001: GRACE, Florence, Italy, 2024
- Milano Unica, Velvet Mi Amor, installation, Milan, Italy, 2024
- Image Nation Paris, group exhibition, Paris, France, 2023
- Stymphalia Environmental Museum, solo exhibition, Corinth, Greece, 2022

**Awards**
- Videoclip Italia, Futuro, Finalist, Best Rock Videoclip 2025
- Videoclip Italia, Velvet Mi Amor, Winner, Best Styling 2025
- Austin Lift-Off Film Festival, Uncaptured, Official Selection, 2025
- Videoclip Italia, Apnea, Finalist, 2024
- CANIFF, TAPE001: GRACE, Official Selection, 2024
- Sentiero Film Factory, Velvet Mi Amor, Finalist, 2023
- FFFMilano Fashion Film Festival Milano, TAPE001: GRACE, Official Selection, Next Youth, 2023
- BFFF Berlino Fashion Film Festival, TAPE001: GRACE, Official Selection, Best Script, 2023
- Sentiero Film Factory, Peccato, Premio Boomker Sound, 2023
- Sentiero Film Factory, Panico, Finalist, 2023

**Publications**
- Artdoc Magazine, Country Mysteries – Lisa Mazzei, 2022
- FotoNostrum, Lisa Mazzei: Everyday Mystery, Incomunicability and Loneliness Through Cinematic Photography, Issue no. 18, 2021
- Fraction Magazine, Country Mysteries by Lisa Mazzei, Issue no. 145, 2021
- Artwort, Goodbye Countryside il saluto nostalgico di Lisa Mazzei, 2020
- Fisheye Magazine, Lisa Mazzei, 2020`,
            en: `Lisa Mazzei is an Italian photographer and director. She holds a degree in Fine Arts from Florence and specialized in Cinematography in Rome. As one half of the creative duo Lyzard Film, she focuses on music videos for Italian artists and fashion films. Her photographic and video work has been featured at Pitti Uomo, Milano Unica, and ImageNation Paris, and she has collaborated with brands such as Kodak. She has received nominations at the Videoclip Italia Awards, Milano Fashion Film Festival, CANiFF, and the Berlin Fashion Film Festival.

**Contacts**
E-mail: [lyzardfilm@gmail.com](mailto:lyzardfilm@gmail.com)

**Expositions**
- Pitti Uomo, Velvet Mi Amor, installation, Florence, Italy, 2024
- 45° Festival di Cinema e Donne, TAPE001: GRACE, Florence, Italy, 2024
- Milano Unica, Velvet Mi Amor, installation, Milan, Italy, 2024
- Image Nation Paris, group exhibition, Paris, France, 2023
- Stymphalia Environmental Museum, solo exhibition, Corinth, Greece, 2022

**Awards**
- Videoclip Italia, Futuro, Finalist, Best Rock Videoclip 2025
- Videoclip Italia, Velvet Mi Amor, Winner, Best Styling 2025
- Austin Lift-Off Film Festival, Uncaptured, Official Selection, 2025
- Videoclip Italia, Apnea, Finalist, 2024
- CANIFF, TAPE001: GRACE, Official Selection, 2024
- Sentiero Film Factory, Velvet Mi Amor, Finalist, 2023
- FFFMilano Fashion Film Festival Milano, TAPE001: GRACE, Official Selection, Next Youth, 2023
- BFFF Berlino Fashion Film Festival, TAPE001: GRACE, Official Selection, Best Script, 2023
- Sentiero Film Factory, Peccato, Premio Boomker Sound, 2023
- Sentiero Film Factory, Panico, Finalist, 2023

**Publications**
- Artdoc Magazine, Country Mysteries – Lisa Mazzei, 2022
- FotoNostrum, Lisa Mazzei: Everyday Mystery, Incomunicability and Loneliness Through Cinematic Photography, Issue no. 18, 2021
- Fraction Magazine, Country Mysteries by Lisa Mazzei, Issue no. 145, 2021
- Artwort, Goodbye Countryside il saluto nostalgico di Lisa Mazzei, 2020
- Fisheye Magazine, Lisa Mazzei, 2020`
        }
    },
    projects: []
};

const assetsManifest = [];
const projectSlugs = ['countrymysteries', 'narrative', 'other', 'nuovestrade', 'apocalissitascabili', 'pdu'];

projectSlugs.forEach(slug => {
    const projDir = path.join(rootDir, slug);
    const textPath = path.join(projDir, 'text.txt');
    const titlePath = path.join(projDir, 'title.txt');
    const imgDir = path.join(projDir, 'img');

    let text = '';
    if (fs.existsSync(textPath)) {
        text = fs.readFileSync(textPath, 'utf-8').trim();
    }

    let title = slug;
    if (fs.existsSync(titlePath)) {
        title = fs.readFileSync(titlePath, 'utf-8').trim();
    }

    let photos = [];
    if (fs.existsSync(imgDir)) {
        const files = fs.readdirSync(imgDir);
        const images = files.filter(f => f.endsWith('.jpg')).sort((a, b) => {
            const numA = parseInt(a.replace('img', '').replace('.jpg', '')) || 0;
            const numB = parseInt(b.replace('img', '').replace('.jpg', '')) || 0;
            return numA - numB;
        });

        photos = images.map(img => {
            const srcPath = `${slug}/img/${img}`;
            const assetSize = fs.statSync(path.join(imgDir, img)).size;
            assetsManifest.push({
                id: srcPath,
                backend: 'github',
                path: srcPath,
                byteSize: assetSize,
                references: [`project:${slug}`]
            });

            let altContent = title;
            if (title.includes(' - ')) {
                altContent = title.split(' - ')[0]; // Take base name for title
            } else if (title.includes(' (')) {
                altContent = title.split(' (')[0];
            }
            return {
                url: srcPath,
                alt: `${altContent} ${img.replace('img', '').replace('.jpg', '')}`
            };
        });
    }

    siteJson.projects.push({
        id: slug,
        slug: slug,
        title: { it: title, en: title },
        description: { it: text, en: text },
        photos
    });
});

['home/img/img_desktop.jpg', 'home/img/img_mobile.jpg', 'about/img/img1.jpg'].forEach(img => {
    if (fs.existsSync(path.join(rootDir, img))) {
        const size = fs.statSync(path.join(rootDir, img)).size;
        assetsManifest.push({
            id: img,
            backend: 'github',
            path: img,
            byteSize: size,
            references: ['site:global']
        });
    }
});

fs.writeFileSync(path.join(contentDir, 'site.json'), JSON.stringify(siteJson, null, 2));
fs.writeFileSync(path.join(contentDir, 'assets-manifest.json'), JSON.stringify(assetsManifest, null, 2));

console.log('Migration complete!');
