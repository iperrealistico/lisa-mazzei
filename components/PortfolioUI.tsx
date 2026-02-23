"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
// @ts-ignore
import Swiper from 'swiper/bundle';
import "swiper/css/bundle";
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
    const galleriesRef = useRef<Record<string, Swiper>>({});
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
                            // Fix preloader spinner
                            const preloader = img.parentElement?.querySelector('.swiper-lazy-preloader');
                            if (preloader) {
                                preloader.remove();
                            }
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
            Object.values(galleriesRef.current).forEach(swiper => {
                if (swiper && typeof swiper.update === 'function') swiper.update();
            });
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

    const initGallery = useCallback((galleryId: string) => {
        if (galleriesRef.current[galleryId]) return;

        setTimeout(() => {
            const swiperEl = document.querySelector(`[data-gallery="${galleryId}"]`) as HTMLElement;
            if (!swiperEl) return;

            const section = swiperEl.closest('.section') as HTMLElement;
            const prevBtn = section?.querySelector('.gallery-btn.prev') as HTMLButtonElement;
            const nextBtn = section?.querySelector('.gallery-btn.next') as HTMLButtonElement;

            const swiper = new Swiper(swiperEl, {
                slidesPerView: 'auto',
                spaceBetween: 0,
                freeMode: {
                    enabled: true,
                    sticky: false,
                    momentumRatio: 1,
                    momentumVelocityRatio: 1
                },
                mousewheel: {
                    forceToAxis: true,
                    invert: false
                },
                grabCursor: true,
                keyboard: {
                    enabled: true,
                    onlyInViewport: true,
                    pageUpDown: true
                },
                simulateTouch: true,
                navigation: {
                    prevEl: prevBtn,
                    nextEl: nextBtn
                },
                on: {
                    init: function (sw: any) {
                        sw.update();
                        updateButtons(sw);
                    },
                    slideChange: function (sw: any) {
                        updateButtons(sw);
                    },
                    progress: function (sw: any) {
                        updateButtons(sw);
                    }
                }
            } as any);

            const updateButtons = (sw: any) => {
                if (!prevBtn || !nextBtn) return;
                const atBeginning = sw.isBeginning || sw.progress <= 0;
                const atEnd = sw.isEnd || sw.progress >= 1;
                prevBtn.classList.toggle('show', !atBeginning);
                nextBtn.classList.toggle('show', !atEnd);
            };

            galleriesRef.current[galleryId] = swiper;
        }, 100);
    }, []);

    useEffect(() => {
        if (activeGallery && activeGallery !== 'home' && activeGallery !== 'about') {
            initGallery(activeGallery);
        }
    }, [activeGallery, initGallery]);

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
        return siteData.nav.map((section: any, idx: number) => {
            if (section.type === 'section') {
                return (
                    <div className="nav-section" key={idx}>
                        <div className="nav-section-title">{section.title[lang] || section.title.it}</div>
                        {section.links.map((link: any, i: number) => {
                            if (link.disabled) {
                                return <span className="nav-link disabled" key={i}>{link.label[lang] || link.label.it}</span>;
                            }
                            const isActive = activeGallery === link.slug;
                            const href = `/${lang === 'en' ? 'en/' : ''}${link.slug}`;
                            return (
                                <a
                                    key={i}
                                    href={href}
                                    className={`nav-link ${isActive ? 'active' : ''}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label[lang] || link.label.it}
                                </a>
                            );
                        })}
                    </div>
                );
            } else if (section.type === 'link') {
                if (section.isExternal) {
                    return (
                        <div className="nav-section" key={idx}>
                            <a href={section.url} className="nav-section-title link" target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}>
                                {section.label[lang] || section.label.it}
                            </a>
                        </div>
                    );
                } else {
                    const isActive = activeGallery === section.slug;
                    const href = `/${lang === 'en' ? 'en/' : ''}${section.slug}`;
                    return (
                        <div className="nav-section" key={idx}>
                            <a
                                href={href}
                                className={`nav-section-title link ${isActive ? 'active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {section.label[lang] || section.label.it}
                            </a>
                        </div>
                    );
                }
            }
            return null;
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
                    <section id={project.slug} className={`section ${activeGallery === project.slug ? 'active' : ''}`} key={project.id}>
                        <div className="gallery">
                            <div className="swiper" data-gallery={project.slug}>
                                <div className="swiper-wrapper">
                                    {project.photos.map((photo: any, i: number) => (
                                        <div
                                            className="swiper-slide"
                                            key={i}
                                            onClick={() => {
                                                setLightboxIndex(i);
                                                setLightboxOpen(true);
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <img data-src={'/' + photo.url} alt={photo.alt} className="gallery-img swiper-lazy" />
                                            <div className="swiper-lazy-preloader"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="gallery-nav">
                            <button className="gallery-btn prev" aria-label="Previous image"></button>
                            <button className="gallery-btn next show" aria-label="Next image"></button>
                        </div>

                        <div className="content">
                            {project.description?.[lang] ? (
                                <div dangerouslySetInnerHTML={{ __html: parseMarkdown(project.description[lang] || project.description.it) }} />
                            ) : null}
                        </div>
                    </section>
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
