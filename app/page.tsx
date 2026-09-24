"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import s from "./page.module.css";
import { BenefitDataIcon, BenefitPrivacyIcon, BenefitSupportIcon, IconArrowLeft, IconArrowRight, IconArrowUp, IconCheck, IconComment, IconFacebook, IconInstagram, IconLinkedIn, IconLogin, IconMoon, IconShare, IconSun } from "@/components/ui/Icons";
import WaitlistModal from "@/components/WaitlistModal";

/* ================================================================
   HERO PARALLAX COMPONENT (4 Layers with Mouse & Floating Animation)
   ================================================================ */

function HeroParallax({ theme }: { theme: "light" | "dark" }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    setMouseOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  const l1Theme = theme === "dark" ? "/assets/img/landing/saas-3/hero/01-dark.png" : "/assets/img/landing/saas-3/hero/01-light.png";
  const l2Theme = theme === "dark" ? "/assets/img/landing/saas-3/hero/02-dark.png" : "/assets/img/landing/saas-3/hero/02-light.png";
  const l3Theme = theme === "dark" ? "/assets/img/landing/saas-3/hero/03-dark.png" : "/assets/img/landing/saas-3/hero/03-light.png";
  const l4Theme = theme === "dark" ? "/assets/img/landing/saas-3/hero/04-dark.png" : "/assets/img/landing/saas-3/hero/04-light.png";

  return (
    <div
      ref={containerRef}
      className={s.parallaxContainer}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Layer 1: Base Dashboard Canvas */}
      <div
        className={s.parallaxLayerBase}
        style={
          {
            transform: `translate3d(${mouseOffset.x * 6}px, ${mouseOffset.y * 6}px, 0)`,
          }
        }
      >
        <Image
          src={l1Theme}
          alt="Main Dashboard Interface"
          width={1440}
          height={800}
          priority
          className={s.heroLayerImg}
        />
      </div >

      {/* Layer 2: Floating Card Overlay 1 */}
      <div
        className={`${s.parallaxLayerOverlay} ${s.floatAnim1}`}
        style={
          {
            transform: `translate3d(${mouseOffset.x * 16}px, ${mouseOffset.y * 16}px, 0)`,
          }
        }
      >
        <Image
          src={l2Theme}
          alt="Dashboard Widget 1"
          width={1440}
          height={800}
          priority
          className={s.heroLayerImg}
        />
      </div >

      {/* Layer 3: Floating Card Overlay 2 */}
      <div
        className={`${s.parallaxLayerOverlay} ${s.floatAnim2}`}
        style={
          {
            transform: `translate3d(${mouseOffset.x * 24}px, ${mouseOffset.y * 24}px, 0)`,
          }
        }
      >
        <Image
          src={l3Theme}
          alt="Dashboard Widget 2"
          width={1440}
          height={800}
          priority
          className={s.heroLayerImg}
        />
      </div >

      {/* Layer 4: Floating Card Overlay 3 */}
      <div
        className={`${s.parallaxLayerOverlay} ${s.floatAnim3}`}
        style={
          {
            transform: `translate3d(${mouseOffset.x * 32}px, ${mouseOffset.y * 32}px, 0)`,
          }
        }
      >
        <Image
          src={l4Theme}
          alt="Dashboard Widget 3"
          width={1440}
          height={800}
          priority
          className={s.heroLayerImg}
        />
      </div >
    </div >
  );
}

/* ================================================================
   DATA — Exact arrays from landing-Index.html
   ================================================================ */

const featuresData = [
  {
    title: "Monitor Cost & Value",
    text: "Right on your user friendly dashboard find useful insights on your building material cost, rental values and decide when to buy, build and sell.",
    lightImg: "/assets/img/landing/saas-2/features/01-light.png",
    darkImg: "/assets/img/landing/saas-2/features/01-dark.png",
    layout: "vertical" as const,
  },
  {
    title: "Assigned Accredited Managers",
    text: "All properties and building projects listed are assigned to a unique Accredited Manager following due diligence and efficiency indices.",
    lightImg: "/assets/img/landing/saas-2/features/02.png",
    darkImg: "/assets/img/landing/saas-2/features/02.png",
    layout: "horizontal" as const,
    hasLink: true,
  },
  {
    title: "Use Vulnerability Tests",
    text: "The quicket way to learn about the actions of usurpers, land disputers and grabbers is to bait them. We can perform the drill, unmask their frauds, so you can keep them at bay.",
    lightImg: "/assets/img/landing/saas-2/features/03-light.png",
    darkImg: "/assets/img/landing/saas-2/features/03-dark.png",
    layout: "horizontal" as const,
    hasLink: true,
  },
  {
    title: "Data Driven Efficiency",
    text: "Using multiple data points our real estate valuers, project property values, rental fees, building materials cost and other variables to enhance your decision on the project or property.",
    lightImg: "/assets/img/landing/saas-2/features/04-light.png",
    darkImg: "/assets/img/landing/saas-2/features/04-dark.png",
    layout: "vertical" as const,
  },
];

const plansData = [
  {
    name: "Basic",
    price: "₦0",
    period: "per month",
    details: "1 Listing | Bi-Monthly Reports | 0 Vulnerability Tests",
    featured: false,
  },
  {
    name: "Premium",
    price: "₦25K",
    period: "per month",
    details: "5 Listings | Monthly Reports | 2 Vulnerability Tests",
    featured: true,
  },
  {
    name: "Standard",
    price: "₦",
    period: "per month",
    details: "2 Listings | Monthly Reports | 0 Vulnerability Tests",
    featured: false,
  },
];

const testimonialsData = [
  {
    quote:
      "Too many malpractices distorts the free flow in our value chain, especially by those we put in charge. Now we have verifiable information to checkmate everyone.",
    name: "Ezeamaka Williams",
    role: "R-O-D Construction",
    avatar: "/assets/img/avatar/30.jpg",
  },
  {
    quote:
      "Oversite may be an App but it is going to revolutionalize the way everything is done in project development, especially in the real estate world. Our investors are never around and they rely on feedback from their employees, this is going to change how they manage everything now.",
    name: "Elvis 'Desage' Osung",
    role: "Total E&P",
    avatar: "/assets/img/avatar/31.jpg",
  },
  {
    quote:
      "I have lost alot to people I thought I trusted. When I make purchases of properties and when I do developments of those properties. I wish I had this solution earlier. Well, I'm glad its handy now. I have alternative source of useful information.",
    name: "Rex Osagiede",
    role: "Bella Homes NG",
    avatar: "/assets/img/avatar/32.jpg",
  },
];

const benefitsData = [
  {
    title: "Support",
    stat: "24/7",
    text: "Oversite.ng users and partners can count on 24/7 technical assistance, as well as the help of the technical analytics department and teams of experts.",
    icon: BenefitSupportIcon,
    colorClass: "primary" as const,
  },
  {
    title: "Strict Privacy",
    stat: "Secured",
    text: "Oversite.ng users and partners share actionable and verifiable data based on terms of service. Actors outside this engagement are null and void.",
    icon: BenefitPrivacyIcon,
    colorClass: "danger" as const,
  },
  {
    title: "Reliable data",
    stat: "100%",
    text: "Data points for evaluating the projected property value and other recommendations are highly reviewd by Estate Valuers for fidelity to the margin of admissible errors.",
    icon: BenefitDataIcon,
    colorClass: "info" as const,
  },
];

const resourcesData = [
  {
    title: "How to know when your Property Assets are Worth Selling",
    text: "Whatever is not measured cannot be grown or controlled, so goes the saying that gave rise to accounting. This case is similar to properties...",
    image: "/assets/img/landing/saas-2/resources/01.jpg",
    shares: 6,
    comments: 12,
    time: "12 hours ago",
    tag: "Analytics",
  },
  {
    title: "5 Must haves if you live away from your building projects & properties.",
    text: "Overseeing your building projects and monitoring properties while abroad can be daunting but still possible. Here are a few tips to ease that drill...",
    image: "/assets/img/landing/saas-2/resources/02.jpg",
    shares: 10,
    comments: 19,
    time: "3 days ago",
    tag: "Analytics",
  },
  {
    title: "Property Landscape in 2025; A Data Driven Research",
    text: "Time are changing and they are chaning fast. Alongside, they are changing the way we build, buy and sell. In 2025, government reforms and industry technologies...",
    image: "/assets/img/landing/saas-2/resources/03.jpg",
    shares: 21,
    comments: 37,
    time: "5 days ago",
    tag: "Analytics",
  },
];

/* ================================================================
   MAIN PAGE COMPONENT
   ================================================================ */

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [selectedWaitlistPlan, setSelectedWaitlistPlan] = useState("Basic Tier (Free)");

  const openWaitlist = useCallback((plan: string = "Basic Tier (Free)") => {
    setSelectedWaitlistPlan(plan);
    setWaitlistModalOpen(true);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("oversite-theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("oversite-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }, [theme]);

  const toggleFlip = useCallback((index: number) => {
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }));
  }, []);

  const nextTestimonial = useCallback(() => {
    setActiveTestimonial((prev) => (prev + 1) % testimonialsData.length);
  }, []);

  const prevTestimonial = useCallback(() => {
    setActiveTestimonial((prev) => (prev - 1 + testimonialsData.length) % testimonialsData.length);
  }, []);

  return (
    <div className={s.page} >
      {/* ===== HEADER / NAVBAR ===== */}
      <header className={s.navbar} >
        <div className="container" >
          <div className={s.navInner} >
            {/* Logo */}
            < Link href="/" className={s.brandLink} >
              <div className={s.brandLogoWrap} >
                <Image
                  src={theme === "dark" ? "/assets/app-icons/oversite_logo_dark.png" : "/assets/app-icons/oversite_logo.png"}
                  alt="Oversite.ng Logo"
                  width={140}
                  height={36}
                  priority
                  className={s.brandLogoImg}
                />
              </div >
            </Link >

            {/* Navigation Links */}
            <nav className={s.navLinks} >
              < a href="#how-it-works" > How It Works</a >
              < a href="#features" > Features</a >
              < a href="#pricing" > Pricing</a >
            </nav >

            {/* Right Side: Theme Switcher & Login Button */}
            <div className={s.navRight} >
              <button
                className={s.themeToggle}
                onClick={toggleTheme}
                aria-label="Toggle theme"
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? <IconMoon /> : <IconSun />
                }
              </button >

              < a
                className={s.btnPrimarySm}
                href="http://oversite.ng/login"
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconLogin className={s.btnIcon} />
                Sign in
              </a >

              {/* Hamburger Button (Mobile Only) */}
              <button
                className={s.hamburger}
                onClick={() => setMobileMenuOpen((p) => !p)}
                aria-label="Toggle Navigation"
              >
                <span />
                <span />
                <span />
              </button >
            </div >
          </div >

          {/* Mobile Menu Overlay */}
          {
            mobileMenuOpen && (
              <div className={s.mobileMenu} >
                < a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>
                  How It Works
                </a >
                < a href="#features" onClick={() => setMobileMenuOpen(false)}>
                  Features
                </a >
                < a href="#pricing" onClick={() => setMobileMenuOpen(false)}>
                  Pricing
                </a >
                < a
                  className={s.mobileSignInBtn}
                  href="http://oversite.ng/login"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconLogin /> Sign in
                </a >
              </div >
            )
          }
        </div >
      </header >

      {/* ===== HERO SECTION ===== */}
      < section className={s.hero} >
        <div className="container" >
          <div className={s.heroInner} >
            <div className={s.heroTitleWrap} >
              <h1 className={s.heroTitle} >
                Get Realtime info about your Properties &amp; Building Projects Wherever you are.
              </h1 >
              <div className={s.titleDecoration} >
                <svg width="608" height="66" viewBox="0 0 608 66" fill="currentColor" >
                  < path
                    opacity=".35"
                    d="M45.66 63.0651C48.1682 62.8708 50.692 62.5736 53.2046 62.482C55.5493 62.3949 57.8918 62.3033 60.232 62.2161C73.0671 61.7358 85.8977 61.1192 98.7394 60.9293C112.169 60.7304 125.603 60.402 139.035 60.3663C152.743 60.3328 166.446 60.2747 180.152 60.3417C206.867 60.4757 231.522 59.2366 258.233 59.3013C290.201 57.8797 306.797 56.9045 334.904 55.6546C348.07 55.5876 361.243 55.2681 374.408 55.0111C387.336 54.7632 399.538 53.6311 412.46 53.1396C415.299 53.0323 418.137 52.8201 420.972 52.6548C423.774 52.4894 426.583 52.3576 429.383 52.1432C436.572 51.5913 444.461 51.7091 451.639 51.0545C464.138 49.9061 476.595 48.378 489.11 47.4218C502.221 46.4209 515.361 45.8534 528.486 45.0379C534.408 44.6715 540.366 44.2135 546.249 43.4048C552.974 42.4865 559.639 41.3762 566.288 39.991C572.715 38.6505 579.137 37.2743 585.567 35.9584C588.655 35.3261 591.757 34.7497 594.873 34.2984C598.4 33.7868 601.894 33.2618 605.377 32.5044C607.052 32.138 607.381 29.8927 607.381 28.4494C607.388 27.6273 607.258 26.8297 606.995 26.0567C606.749 25.4065 606.232 24.3676 605.377 24.3967C599.094 24.6089 592.816 24.8234 586.535 25.1205C580.2 25.4177 573.853 25.6009 567.51 25.6903C555.192 25.8578 542.852 25.4311 530.548 24.9172C532.645 24.6335 534.742 24.3498 536.839 24.0638C544.371 23.0361 551.882 21.7448 559.453 21.0522C563.482 20.6813 567.524 20.373 571.541 19.8971C573.579 19.6581 575.599 19.381 577.614 18.9744C579.777 18.5365 581.91 17.9378 584.036 17.339C584.719 17.2653 585.234 16.9212 585.587 16.3158C586.213 15.4489 586.5 14.2872 586.608 13.1746C588.761 12.511 589.194 9.31622 589.194 7.39709C589.207 6.20853 589.022 5.05348 588.635 3.93417C588.261 2.94892 587.55 1.55034 586.297 1.53694C579.758 1.46321 573.23 1.01862 566.691 0.938188C565.93 0.931485 565.163 0.927017 564.397 0.927017C558.77 0.927017 553.155 1.17501 547.535 1.47885C535.016 2.1558 522.495 2.96679 509.989 3.87832C504.175 4.29834 498.369 4.79655 492.551 5.15178C485.435 5.58297 478.335 5.91139 471.212 6.19066C459.296 6.65536 447.361 6.83632 435.438 7.05527C421.763 7.3122 408.106 7.67189 394.447 8.31756C381.795 8.91631 369.155 9.7139 356.512 10.4757C343.816 11.2354 331.122 11.9905 318.427 12.7613C305.415 13.5499 292.394 14.1353 279.373 14.7206C272.783 15.02 266.185 15.1071 259.593 15.297C253.354 15.4758 247.107 15.5227 240.864 15.6143C228.574 15.7952 216.287 15.9069 203.998 16.0343C179.21 16.2867 154.428 16.6934 129.642 17.1067C116.025 17.3346 102.412 17.587 88.7943 17.8439C81.8486 17.9758 74.9007 18.2506 67.9594 18.4539C62.0236 18.6259 56.0901 19.0303 50.1565 19.3364C43.8406 19.6625 37.5247 20.0222 31.2089 20.3886C27.4542 20.6076 23.6952 20.8332 19.9362 21.0522C18.3053 21.1505 16.67 21.2443 15.0346 21.3426C13.5474 21.4297 12.0579 21.5415 10.5729 21.6554C9.51432 21.7358 8.47346 21.89 7.42818 22.0687C6.26798 22.2631 5.11442 22.7859 4.00063 23.1657C3.33545 23.7019 2.87138 24.381 2.61503 25.2099C2.24156 26.3002 2.05814 27.4217 2.0714 28.5768C2.05814 29.7341 2.24156 30.8556 2.61503 31.9459C2.81834 32.3569 3.02165 32.768 3.22496 33.1769C3.60506 33.8292 4.15974 34.1979 4.88901 34.2783C6.1818 34.6492 7.4547 35.0156 8.78063 35.2367C9.50548 35.1563 10.0602 34.7922 10.4381 34.142C10.5817 33.9432 10.7077 33.7309 10.8182 33.5075C11.5121 33.4896 12.2082 33.4919 12.9043 33.4919C13.5695 33.4919 14.2369 33.4874 14.9043 33.4718C16.407 33.4383 17.9053 33.4003 19.4058 33.3645C23.2709 33.2729 27.136 33.1791 31.0011 33.0875C35.1889 32.987 39.3766 32.911 43.5622 32.8373C43.129 32.8753 42.6981 32.9132 42.265 32.9467C32.3735 33.7242 22.4886 34.5062 12.606 35.3931C11.0038 35.5741 9.79056 36.3784 8.95301 37.806C7.71768 39.5129 7.04366 41.7135 6.70996 43.9231C4.97299 43.9075 3.2338 43.8873 1.49682 43.8739C0.28359 43.865 0.0449219 46.0031 0.0449219 46.8252C0.0449219 47.6608 0.28359 49.7564 1.50345 49.7698C3.1675 49.7855 4.83376 49.8145 6.49781 49.8369C6.64146 51.6934 7.01272 53.5098 7.62265 55.2882C8.06905 56.1908 8.51545 57.0934 8.96184 57.9937C9.79719 59.4213 15.9944 65.1786 17.5966 65.3596C26.9466 64.5218 36.3011 63.789 45.66 63.0651Z"
                  />
                </svg >
              </div >
            </div >

            < p className={s.heroLead} >
              Trust but verify with actionable feedback: request quick errands, verify vendors and use law enforcement as if you were on ground.
            </p >

            <button
              className={s.btnPrimary}
              type="button"
              onClick={() => openWaitlist("Basic Tier (Free)")}
            >
              Get Early Access
            </button >

            {/* 4-Layer Hero Parallax Component with Floating & Mouse Animation */}
            <div className={s.heroImageContainer} >
              <HeroParallax theme={theme} />
            </div >
          </div >
        </div >
      </section >

      {/* ===== CURVED EDGE DIVIDER ===== */}
      < div className={s.curvedEdge} >
        <svg width="3000" height="18" viewBox="0 0 3000 18" xmlns="http://www.w3.org/2000/svg" >
          < polygon
            fill="currentColor"
            points="3000,0 3000,12.3 2751,7.2 2460,18 2239,7.2 2017,10.7 1911.5,7.2 1368,18 831,7.2 540,18 319,7.2 97,10.7 0,7.5 0,0"
          />
        </svg >
      </div >

      {/* ===== FEATURES SECTION ===== */}
      < section id="features" className={s.features} >
        <div className="container" >
          <div className={s.sectionHeaderCenter} >
            <h2 > Track development, be the first to know</h2 >
            < p > Data driven property value projections, state policy news, recent landmarks, community updates</p >
          </div >

          <div className={s.featuresGrid} >
            {
              featuresData.map((f, i) => {
                const isWide = f.layout === "horizontal";
                const imgSrc = theme === "dark" ? f.darkImg : f.lightImg;
                return (
                  <div
                    key={i}
                    className={`${s.card} ${isWide ? s.cardWide : s.cardNarrow}`}
                  >
                    <div className={isWide ? s.cardHorizontal : ""} >
                      <div className={isWide ? s.cardHorizImage : s.cardImageWrap} >
                        <Image
                          src={imgSrc}
                          alt={f.title}
                          width={isWide ? 308 : 500}
                          height={isWide ? 260 : 300}
                          className={s.featureImg}
                        />
                      </div >

                      <div className={s.cardBody} >
                        <h3 > {f.title}</h3 >
                        < p > {f.text}</p >

                        {
                          f.hasLink && (
                            < a href="#" className={s.linkPrimary} >
                              Learn more <IconArrowRight className={s.linkIcon} />
                            </a >
                          )
                        }
                      </div >
                    </div >
                  </div >
                );
              })}
          </div >
        </div >
      </section >

      {/* ===== HOW IT WORKS (STEPS) ===== */}
      < section id="how-it-works" className={s.howItWorks} >
        <div className="container" >
          <h2 className={s.sectionTitle} > How does it work ?</h2 >

          {/* Step 01: Content Left, Image Right */}
          <div className={s.stepRow} >
            <div className={s.stepContent} >
              <span className={s.badge} > Step 01</span >
              <h3 > Register on the Platform</h3 >
              <p>
                Quick and easy registration process using desired name, valid email and contact phone number, we validate and approve your profile account.
              </p >
              < a className={s.btnOutlinePill} href="#" >
                Get Verified
              </a >
            </div >
            <div className={s.stepVisual} >
              <Image
                src={theme === "dark" ? "/assets/img/landing/saas-2/steps/01-dark.png" : "/assets/img/landing/saas-2/steps/01-light.png"}
                alt="Step 01"
                width={525}
                height={400}
                className={s.stepImg}
              />
            </div >
          </div >

          {/* Curved Arrow 1 */}
          <div className={s.stepArrowWrap} >
            <svg className={s.stepArrowSvg} width="339" height="365" viewBox="0 0 339 365" fill="none" >
              < path
                d="M324 291.371C120.111 291.37 240.756 58.7225 1.00032 73.2606"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="6 6"
              />
              < path
                d="M337.375 290.62C338.074 290.998 338.074 292.001 337.375 292.379L328.476 297.196C327.81 297.557 327 296.317 327 296.317L327 286.683C327 285.925 327.81 285.443 328.476 285.803L337.375 290.62Z"
                fill="currentColor"
              />
            </svg >
          </div >

          {/* Step 02: Image Left, Content Right */}
          <div className={`${s.stepRow} ${s.stepRowReverse}`}>
            <div className={s.stepVisual} >
              <Image
                src={theme === "dark" ? "/assets/img/landing/saas-2/steps/02-dark.png" : "/assets/img/landing/saas-2/steps/02-light.png"}
                alt="Step 02"
                width={473}
                height={380}
                className={s.stepImg}
              />
            </div >
            <div className={s.stepContent} >
              <span className={s.badge} > Step 02</span >
              <h3 > Complete Your Property Listings</h3 >
              < ul className={s.checkList} >
                <li>
                  <IconCheck className={s.checkIcon} />
                  Enlist your project or property details
                </li >
                <li>
                  <IconCheck className={s.checkIcon} />
                  Provide emergency contact person
                </li >
                <li>
                  <IconCheck className={s.checkIcon} />
                  Get Assigned Accredited Manager
                </li >
              </ul >
            </div >
          </div >

          {/* Curved Arrow 2 */}
          <div className={s.stepArrowWrap} >
            <svg className={s.stepArrowSvg} width="263" height="275" viewBox="0 0 263 275" fill="none" >
              < path
                d="M8.13678 249.647C7.47108 250.081 6.59001 249.602 6.59106 248.808L6.60444 238.689C6.60544 237.931 7.4158 237.45 8.08162 237.811L16.5478 242.408C17.2136 242.77 17.2512 243.712 16.6163 244.125L8.13678 249.647Z"
                fill="currentColor"
              />
              < path
                d="M261.961 37.8891C216.908 65.6243 128.226 135.486 133.916 193.05C141.029 265.005 265.134 173.468 173.666 148.634C89.2542 125.715 30.9125 210.547 13.9796 236.702"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="6 6"
              />
            </svg >
          </div >

          {/* Step 03: Content Left, Image Right */}
          <div className={s.stepRow} >
            <div className={s.stepContent} >
              <span className={s.badge} > Step 03</span >
              <h3 > Receive Dashboard Updates and Download Expert Review Data</h3 >
              <p>
                Once a verification of your listing is successful, an expert review is documented on intervals, with highlights on your dashboard, summary on Newsletters and Details on Downloadable Reports.
              </p >
              < a className={s.btnOutlinePill} href="#" >
                Get Started
              </a >
            </div >
            <div className={s.stepVisual} >
              <Image
                src={theme === "dark" ? "/assets/img/landing/saas-2/steps/03-dark.png" : "/assets/img/landing/saas-2/steps/03-light.png"}
                alt="Step 03"
                width={473}
                height={380}
                className={s.stepImg}
              />
            </div >
          </div >
        </div >
      </section >

      {/* ===== PRICING PLANS ===== */}
      < section id="pricing" className={s.pricing} >
        <div className="container" >
          <div className={s.sectionHeaderCenter} >
            <h2 > Pricing plans</h2 >
            < p > Select a service plan that suits your needs</p >
          </div >

          <div className={s.plansRow} >
            {
              plansData.map((p, i) => (
                <div
                  key={i}
                  className={`${s.planCard} ${p.featured ? s.planFeatured : ""}`}
                >
                  <h3 > {p.name}</h3 >
                  <div className={s.planPrice} > {p.price}</div >
                  <div className={s.planPeriod} > {p.period}</div >
                  < p className={s.planDetails} > {p.details}</p >
                  <button
                    className={p.featured ? s.btnLightFull : s.btnPrimaryFull}
                    type="button"
                    onClick={() => openWaitlist(`${p.name} Plan`)}
                  >
                    Join Waitlist({p.name})
                  </button >
                </div >
              ))}
          </div >
        </div >
      </section >

      {/* ===== TESTIMONIALS + CTA ===== */}
      < section className={s.testimonials} >
        <div className="container" >
          <div className={s.testimonialGrid} >
            {/* Testimonials Slider */}
            <div className={s.testimonialCard} >
              < p className={s.quoteText} >
                & ldquo; {testimonialsData[activeTestimonial].quote}& rdquo;
              </p >
              <div className={s.quoteAuthor} >
                <Image
                  src={testimonialsData[activeTestimonial].avatar}
                  alt={testimonialsData[activeTestimonial].name}
                  width={60}
                  height={60}
                  className={s.avatarImg}
                />
                <div>
                  <strong > {testimonialsData[activeTestimonial].name}</strong >
                  <span > {testimonialsData[activeTestimonial].role}</span >
                </div >
              </div >

              <div className={s.sliderNav} >
                <button
                  className={s.sliderBtn}
                  onClick={prevTestimonial}
                  aria-label="Previous testimonial"
                >
                  <IconArrowLeft />
                </button >
                <button
                  className={s.sliderBtn}
                  onClick={nextTestimonial}
                  aria-label="Next testimonial"
                >
                  <IconArrowRight />
                </button >
              </div >
            </div >

            {/* Proof CTA */}
            <div className={s.proofCta} >
              <h2>
                More than 2, 653 diaspora clients use Oversite.ng for remote monitoring of their building projects &amp; properties.
              </h2 >
              < ul className={s.checkList} >
                <li>
                  <IconCheck className={s.checkIcon} /> 24 / 7 customer support
                </li >
                <li>
                  <IconCheck className={s.checkIcon} /> Lifetime update
                </li >
                <li>
                  <IconCheck className={s.checkIcon} /> Forecasting and recommendations
                </li >
              </ul >
              <button
                className={s.btnPrimaryPill}
                type="button"
                onClick={() => openWaitlist("Basic Tier (Free)")}
              >
                Claim Free Early Access
              </button >
            </div >
          </div >
        </div >
      </section >

      {/* ===== BENEFITS (3D FLIP CARDS) ===== */}
      < section className={s.benefits} >
        <div className="container" >
          <h2 className={s.sectionTitle} > Our benefits</h2 >

          <div className={s.benefitsGrid} >
            {
              benefitsData.map((b, i) => {
                const IconComp = b.icon;
                return (
                  <div
                    key={i}
                    className={`${s.flipCard} ${flipped[i] ? s.flipCardFlipped : ""}`}
                    onClick={() => toggleFlip(i)}
                  >
                    <div className={s.flipInner} >
                      {/* Front */}
                      <div className={`${s.flipFace} ${s.flipFront}`
                      }>
                        <IconComp className={`${s.benefitIcon} ${s[`color_${b.colorClass}`]}`} />
                        <h3 > {b.title}</h3 >
                        < p > {b.text}</p >
                      </div >

                      {/* Back */}
                      <div className={`${s.flipFace} ${s.flipBack} ${s[`bg_${b.colorClass}`]}`}>
                        <IconComp className={s.benefitIconBack} />
                        <div className={s.flipStat} > {b.stat}</div >
                        < p > {b.text}</p >
                      </div >
                    </div >
                  </div >
                );
              })}
          </div >
        </div >
      </section >

      {/* ===== RESOURCES SECTION ===== */}
      < section className={s.resourcesSection} >
        <div className="container" >
          <div className={s.resourcesHeader} >
            <h2 > Resources for you</h2 >
            < a className={s.btnOutlinePill} href="#" >
              Read all
            </a >
          </div >

          <div className={s.resourcesGrid} >
            {
              resourcesData.map((r, i) => (
                < article key={i} className={s.resourceCard} >
                  <div className={s.resourceImageWrap} >
                    <Image
                      src={r.image}
                      alt={r.title}
                      width={400}
                      height={240}
                      className={s.resourceImg}
                    />
                  </div >
                  <h3 className={s.resourceTitle} >
                    < a href="#" > {r.title}</a >
                  </h3 >
                  < p > {r.text}</p >

                  <div className={s.resourceMeta} >
                    <span className={s.metaStat} >
                      {r.shares} <IconShare />
                    </span >
                    <span className={s.metaStat} >
                      {r.comments} <IconComment />
                    </span >
                    <span className={s.metaDivider} >|</span >
                    <span className={s.metaTime} > {r.time}</span >
                    <span className={s.metaDivider} >|</span >
                    <span className={s.metaBadge} > {r.tag}</span >
                  </div >
                </article >
              ))
            }
          </div >
        </div >
      </section >

      {/* ===== BOTTOM CTA SECTION ===== */}
      < section className={s.ctaSection} >
        <div className={s.ctaBg} >
          <div className="container" >
            <div className={s.ctaInner} >
              <h2 > Trust but Verify!</h2 >
              < p > Oversite.ng saves you unanticipated liabilities without insuring your losses.</p >

              <div className={s.ctaButtons} >
                <button
                  className={s.btnWarningPill}
                  type="button"
                  onClick={() => openWaitlist("Basic Tier (Free)")}
                >
                  Claim Free Early Access
                </button >
                <button
                  className={s.btnOutlineWarningPill}
                  type="button"
                  onClick={() => openWaitlist("Priority Waitlist")}
                >
                  Join Waitlist NOW
                </button >
              </div >
            </div >
          </div >
        </div >

        {/* Dashboard Preview Image */}
        <div className={s.ctaDashWrap} >
          <Image
            src={theme === "dark" ? "/assets/img/landing/saas-2/dash-dark.png" : "/assets/img/landing/saas-2/dash-light.png"}
            alt="Oversite Dashboard Preview"
            width={1076}
            height={600}
            className={s.ctaDashImg}
          />
        </div >
      </section >

      {/* ===== FOOTER ===== */}
      < footer className={s.footer} >
        <div className="container" >
          <div className={s.footerGrid} >
            <div className={s.footerBrand} >
              <Image
                src="/assets/app-icons/oversite_logo_dark.png"
                alt="Oversite.ng Logo"
                width={140}
                height={36}
                className={s.footerLogoImg}
              />
              <p>
                A service application helping with property oversight and building project monitoring.
              </p >
              <div className={s.socialRow} >
                < a className={s.socialIconBtn} href="#" aria-label="Facebook" >
                  <IconFacebook />
                </a >
                < a className={s.socialIconBtn} href="#" aria-label="Instagram" >
                  <IconInstagram />
                </a >
                < a className={s.socialIconBtn} href="#" aria-label="LinkedIn" >
                  <IconLinkedIn />
                </a >
              </div >
            </div >

            <div className={s.footerCol} >
              <h4 > Company</h4 >
              <ul>
                <li > <a href="#features">Features</a></li >
                <li > <a href="#how-it-works">How it works</a></li >
                <li > <a href="#pricing">Pricing</a></li >
              </ul >
            </div >

            <div className={s.footerCol} >
              <h4 > Support</h4 >
              <ul>
                <li > <a href="#">Help Center</a></li >
                <li > <a href="#">Terms of service</a></li >
                <li > <a href="#">Privacy policy</a></li >
              </ul >
            </div >

            <div className={s.footerCol} >
              <h4 > Mobile App(Soon)</h4 >
              <div className={s.appStoreButtons} >
                < a className={s.appStoreBadgeLink} href="#" >
                  <Image
                    src={theme === "dark" ? "/assets/img/market/appstore-light.svg" : "/assets/img/market/appstore-dark.svg"}
                    alt="App Store"
                    width={120}
                    height={40}
                  />
                </a >
                < a className={s.appStoreBadgeLink} href="#" >
                  <Image
                    src={theme === "dark" ? "/assets/img/market/googleplay-light.svg" : "/assets/img/market/googleplay-dark.svg"}
                    alt="Google Play"
                    width={119}
                    height={40}
                  />
                </a >
              </div >
            </div >
          </div >

          <div className={s.footerBottom} >
            <p>
              & copy; All rights reserved.Powered by{" "}
              < a href="https://playsourceunltd.com/" target="_blank" rel="noopener noreferrer" >
                Playsource Unlimited Technologies
              </a >
            </p >
          </div >
        </div >
      </footer >

      {/* Back to top button */}
      < a
        href="#"
        className={s.scrollTopBtn}
        onClick={
          (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
        aria-label="Scroll back to top"
      >
        <IconArrowUp />
      </a >

      {/* Interactive Waitlist Modal */}
      < WaitlistModal
        isOpen={waitlistModalOpen}
        onClose={() => setWaitlistModalOpen(false)}
        defaultPlan={selectedWaitlistPlan}
      />
    </div >
  );
}
