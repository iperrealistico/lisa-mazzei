"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Swiper from 'swiper';

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

export default function PortfolioUI({ siteData, lang }: { siteData: any, lang: 'it' | 'en' }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const galleriesRef = useRef<Record<string, Swiper>>({});
    const mobileNavRef = useRef<HTMLElement>(null);
    const [showScrollIndicator, setShowScrollIndicator] = useState(false);

    const navigateToSection = useCallback((sectionId: string, pushState: boolean = true) => {
        setActiveSection(sectionId);
        if (pushState) {
            const prefix = lang === 'en' ? '/en' : '/';
            const url = sectionId === 'home' ? prefix : `${prefix}?project=${sectionId}`;
            window.history.pushState({ section: sectionId }, '', url);
        }
        setMenuOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [lang]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const project = params.get('project');
        if (project) {
            navigateToSection(project, false);
        } else {
            navigateToSection('home', false);
        }

        const onPopState = (e: PopStateEvent) => {
            const section = e.state?.section || 'home';
            navigateToSection(section, false);
        };
        window.addEventListener('popstate', onPopState);

        let imageObserver: IntersectionObserver | null = null;
        if ('IntersectionObserver' in window) {
            imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target as HTMLImageElement;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.add('loaded');
                        }
                        if (imageObserver) imageObserver.unobserve(img);
                    }
                });
            });
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver!.observe(img);
            });
        }

        const onResize = () => {
            if (menuOpen) checkMobileMenuScroll();
            Object.values(galleriesRef.current).forEach(swiper => {
                if (swiper && typeof swiper.update === 'function') swiper.update();
            });
        };
        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('popstate', onPopState);
            window.removeEventListener('resize', onResize);
            if (imageObserver) imageObserver.disconnect();
        };
    }, [lang, menuOpen, navigateToSection]);

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
                    sticky: false
                },
                mousewheel: {
                    forceToAxis: true
                },
                lazy: {
                    loadPrevNext: true,
                    loadPrevNextAmount: 3
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
                const atBeginning = sw.progress <= 0;
                const atEnd = sw.progress >= 1;
                prevBtn.classList.toggle('show', !atBeginning);
                nextBtn.classList.toggle('show', !atEnd);
            };

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    const containerWidth = swiper.width;
                    const currentTranslate = swiper.translate;
                    const newTranslate = Math.min(0, currentTranslate + containerWidth * 0.8);
                    swiper.setTranslate(newTranslate);
                    updateButtons(swiper);
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    const containerWidth = swiper.width;
                    const currentTranslate = swiper.translate;
                    const maxTranslate = swiper.maxTranslate();
                    const newTranslate = Math.max(maxTranslate, currentTranslate - containerWidth * 0.8);
                    swiper.setTranslate(newTranslate);
                    updateButtons(swiper);
                });
            }

            galleriesRef.current[galleryId] = swiper;
        }, 100);
    }, []);

    useEffect(() => {
        if (activeSection !== 'home' && activeSection !== 'about') {
            initGallery(activeSection);
        }
    }, [activeSection, initGallery]);

    const checkMobileMenuScroll = () => {
        const mobileNav = mobileNavRef.current;
        if (!mobileNav) return;
        const hasScroll = mobileNav.scrollHeight > mobileNav.clientHeight;
        const isAtTop = mobileNav.scrollTop <= 10;
        setShowScrollIndicator(hasScroll && isAtTop);
    };

    const toggleMenu = () => {
        setMenuOpen(prev => {
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
                            const isActive = activeSection === link.slug;
                            return (
                                <a
                                    key={i}
                                    href={`#${link.slug}`}
                                    className={`nav-link ${isActive ? 'active' : ''}`}
                                    onClick={(e) => { e.preventDefault(); navigateToSection(link.slug); }}
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
                            <a href={section.url} className="nav-section-title link" target="_blank" rel="noopener noreferrer">
                                {section.label[lang] || section.label.it}
                            </a>
                        </div>
                    );
                } else {
                    return (
                        <div className="nav-section" key={idx}>
                            <a
                                href={`#${section.slug}`}
                                className="nav-section-title link"
                                onClick={(e) => { e.preventDefault(); navigateToSection(section.slug); }}
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
            className={`nav-mobile ${menuOpen ? 'open' : ''}`}
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
                    <a href="#home" className="logo" onClick={(e) => { e.preventDefault(); navigateToSection('home'); }}>Lisa Mazzei</a>
                    {navDesktop}
                    <button
                        className={`menu-btn ${menuOpen ? 'open' : ''}`}
                        aria-label="Menu"
                        aria-expanded={menuOpen}
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
                <section id="home" className={`section ${activeSection === 'home' ? 'active' : ''}`}>
                    <div className="hero">
                        <img src={'/' + siteData.home.desktopImage} alt="Lisa Mazzei Portfolio" className="hero-img desktop" loading="eager" />
                        <img src={'/' + siteData.home.mobileImage} alt="Lisa Mazzei Portfolio" className="hero-img mobile" loading="eager" />
                    </div>
                </section>

                {siteData.projects.map((project: any) => (
                    <section id={project.slug} className={`section ${activeSection === project.slug ? 'active' : ''}`} key={project.id}>
                        <div className="gallery">
                            <div className="swiper" data-gallery={project.slug}>
                                <div className="swiper-wrapper">
                                    {project.photos.map((photo: any, i: number) => (
                                        <div className="swiper-slide" key={i}>
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

                <section id="about" className={`section ${activeSection === 'about' ? 'active' : ''}`}>
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
        </>
    );
}
