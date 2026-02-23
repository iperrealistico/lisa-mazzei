"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

function parseMarkdown(text: string) {
    if (!text) return '';
    const paragraphs = text.split('\n\n');
    const rendered = paragraphs.map(p => {
        if (p.startsWith('- ')) {
            const items = p.split('\n').map(item => `<li>${item.replace(/^- /, '')}</li>`).join('');
            return `<ul>${items}</ul>`;
        }
        let content = p.replace(/\n/g, '<br>');
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
        return `<p>${content}</p>`;
    });
    return rendered.join('');
}

function ProjectGallery({ project, lang, activeGallery, setLightboxIndex, setLightboxOpen }: any) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: 'start',
        dragFree: true,
        containScroll: 'trimSnaps'
    });

    const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
    const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setPrevBtnEnabled(emblaApi.canScrollPrev());
        setNextBtnEnabled(emblaApi.canScrollNext());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);

        // Global arrow keys, but only if this gallery is active
        const handleKeyDown = (e: KeyboardEvent) => {
            if (activeGallery !== project.slug) return;
            if (e.key === 'ArrowLeft') scrollPrev();
            if (e.key === 'ArrowRight') scrollNext();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [emblaApi, onSelect, activeGallery, project.slug, scrollPrev, scrollNext]);

    return (
        <section id={project.slug} className={`section ${activeGallery === project.slug ? 'active' : ''}`}>
            <div className="gallery embla" ref={emblaRef} style={{ overflow: 'hidden' }}>
                <div className="embla__container swiper-wrapper" style={{ display: 'flex' }}>
                    {project.photos.map((photo: any, i: number) => (
                        <div
                            className="embla__slide swiper-slide"
                            key={i}
                            style={{ cursor: 'grab', flex: '0 0 auto' }}
                            onClick={() => {
                                // Guarantee it only pops the lightbox on clicks, not drags!
                                if (emblaApi && (emblaApi as any).clickAllowed()) {
                                    setLightboxIndex(i);
                                    setLightboxOpen(true);
                                }
                            }}
                        >
                            <img data-src={'/' + photo.url} alt={photo.alt} className="gallery-img swiper-lazy" style={{ userSelect: 'none' }} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="gallery-nav">
                <button className={`gallery-btn prev ${prevBtnEnabled ? 'show' : ''}`} onClick={scrollPrev} aria-label="Previous image"></button>
                <button className={`gallery-btn next ${nextBtnEnabled ? 'show' : ''}`} onClick={scrollNext} aria-label="Next image"></button>
            </div>

            <div className="content">
                {project.description?.[lang] ? (
                    <div dangerouslySetInnerHTML={{ __html: parseMarkdown(project.description[lang] || project.description.it) }} />
                ) : null}
            </div>
        </section>
    );
}

export default function PortfolioUI({
    siteData,
    lang,
    activeProjectSlug = null
}: {
    siteData: any,
    lang: string,
    activeProjectSlug?: string | null
}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeGallery, setActiveGallery] = useState(activeProjectSlug);
    const mobileNavRef = useRef<HTMLElement>(null);
    const [showScrollIndicator, setShowScrollIndicator] = useState(false);

    // Lightbox State
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // Compute slides for lightbox
    const currentProject = useMemo(() => {
        return siteData.projects.find((p: any) => p.slug === activeGallery);
    }, [activeGallery, siteData]);

    const lightboxSlides = useMemo(() => {
        if (!currentProject?.photos) return [];
        return currentProject.photos.map((photo: any) => ({
            src: '/' + photo.url,
            alt: photo.alt
        }));
    }, [currentProject]);

    useEffect(() => {
        // Intersection Observer for lazy loading images inside swiper
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target as HTMLImageElement;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        img.onload = () => {
                            img.classList.add('loaded');
                        };
                        observer.unobserve(img);
                    }
                }
            });
        }, { rootMargin: '50px' });

        document.querySelectorAll('img[data-src]').forEach(img => {
            observer.observe(img);
        });

        const onResize = () => {
            if (mobileMenuOpen) checkMobileMenuScroll();
        };
        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('resize', onResize);
            observer.disconnect();
        };
    }, [mobileMenuOpen]);

    // Sync active project if prop changes
    useEffect(() => {
        setActiveGallery(activeProjectSlug || 'home');
    }, [activeProjectSlug]);

    const checkMobileMenuScroll = () => {
        const mobileNav = mobileNavRef.current;
        if (!mobileNav) return;
        const hasScroll = mobileNav.scrollHeight > mobileNav.clientHeight;
        const isAtTop = mobileNav.scrollTop <= 10;
        setShowScrollIndicator(hasScroll && isAtTop);
    };

    const toggleMenu = () => {
        setMobileMenuOpen(prev => {
            const next = !prev;
            if (next) {
                setTimeout(() => checkMobileMenuScroll(), 300);
            } else {
                setShowScrollIndicator(false);
            }
            return next;
        });
    };

    const renderNavLinks = (isMobile: boolean) => {
        return siteData.nav.map((item: any, idx: number) => {
            const title = item.title?.[lang] || item.label?.[lang] || item.title?.it || item.label?.it;

            // If it behaves as a direct URL / Slug (no links array or explicitly defined url/slug)
            if (item.slug || item.url) {
                if (item.isExternal) {
                    return (
                        <div className="nav-section" key={idx}>
                            <a href={item.url} className="nav-section-title link" target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}>
                                {title}
                            </a>
                        </div>
                    );
                } else {
                    const isActive = activeGallery === item.slug;
                    const href = `/${lang === 'en' ? 'en/' : ''}${item.slug}`;
                    return (
                        <div className="nav-section" key={idx}>
                            <a
                                href={href}
                                className={`nav-section-title link ${isActive ? 'active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {title}
                            </a>
                        </div>
                    );
                }
            } else {
                // Otherwise it acts as a Dropdown Section containing links
                return (
                    <div className="nav-section" key={idx}>
                        <div className="nav-section-title">{title}</div>
                        {(item.links || []).map((link: any, i: number) => {
                            const linkTitle = link.title?.[lang] || link.label?.[lang] || link.title?.it || link.label?.it;
                            if (link.disabled) {
                                return <span className="nav-link disabled" key={i}>{linkTitle}</span>;
                            }
                            if (link.isExternal) {
                                return (
                                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                                        {linkTitle}
                                    </a>
                                );
                            } else {
                                const isActive = activeGallery === link.slug;
                                const href = `/${lang === 'en' ? 'en/' : ''}${link.slug}`;
                                return (
                                    <a key={i} href={href} className={`nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                                        {linkTitle}
                                    </a>
                                );
                            }
                        })}
                    </div>
                );
            }
        });
    };

    const navDesktop = (
        <nav className="nav-desktop" aria-label="Main navigation">
            {renderNavLinks(false)}
            <div className="nav-section">
                <a href={lang === 'it' ? "/en" : "/"} className="nav-section-title link">
                    {lang === 'it' ? "EN" : "IT"}
                </a>
            </div>
        </nav>
    );

    const navMobile = (
        <nav
            className={`nav-mobile ${mobileMenuOpen ? 'open' : ''}`}
            aria-label="Mobile navigation"
            ref={mobileNavRef as any}
            onScroll={checkMobileMenuScroll}
        >
            <div className="nav-mobile-content">
                {renderNavLinks(true)}
                <div className="nav-section">
                    <a href={lang === 'it' ? "/en" : "/"} className="nav-section-title link">
                        {lang === 'it' ? "English" : "Italiano"}
                    </a>
                </div>
            </div>
            <div className={`scroll-indicator ${showScrollIndicator ? 'show' : ''}`} id="scroll-indicator"></div>
        </nav>
    );

    return (
        <>
            <header className="header">
                <div className="header-content">
                    <a href={`/${lang === 'en' ? 'en' : ''}`} className="logo" onClick={() => setMobileMenuOpen(false)}>Lisa Mazzei</a>
                    {navDesktop}
                    <button
                        className={`menu-btn ${mobileMenuOpen ? 'open' : ''}`}
                        aria-label="Menu"
                        aria-expanded={mobileMenuOpen}
                        onClick={toggleMenu}
                    >
                        <span className="menu-btn-line"></span>
                        <span className="menu-btn-line"></span>
                        <span className="menu-btn-line"></span>
                    </button>
                </div>
            </header>

            {navMobile}

            <main className="main">
                <section id="home" className={`section ${activeGallery === 'home' ? 'active' : ''}`}>
                    <div className="hero">
                        <img src={'/' + siteData.home.desktopImage} alt="Lisa Mazzei Portfolio" className="hero-img desktop" loading="eager" />
                        <img src={'/' + siteData.home.mobileImage} alt="Lisa Mazzei Portfolio" className="hero-img mobile" loading="eager" />
                    </div>
                </section>

                {siteData.projects.map((project: any) => (
                    <ProjectGallery
                        key={project.id}
                        project={project}
                        lang={lang}
                        activeGallery={activeGallery}
                        setLightboxIndex={setLightboxIndex}
                        setLightboxOpen={setLightboxOpen}
                    />
                ))}

                <section id="about" className={`section ${activeGallery === 'about' ? 'active' : ''}`}>
                    <div className="about-photo">
                        <img src={'/' + siteData.about.image} alt={siteData.about.title[lang] || siteData.about.title.it} loading="lazy" />
                    </div>
                    <div className="content">
                        <h1>{siteData.about.title[lang] || siteData.about.title.it}</h1>
                        <div dangerouslySetInnerHTML={{
                            __html: parseMarkdown(siteData.about.content[lang] || siteData.about.content.it)
                        }} />
                    </div>
                </section>
            </main>

            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                index={lightboxIndex}
                slides={lightboxSlides}
            />
        </>
    );
}
