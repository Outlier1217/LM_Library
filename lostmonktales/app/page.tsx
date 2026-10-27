
import Image from "next/image";
import FeaturedJournalStory from "@/app/components/featured-journal-story";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  Building2,
  GraduationCap,
  Palette,
  Sparkles,
} from "lucide-react";

const sections = [
  {
    number: "01",
    title: "Ideas & Perspectives",
    description:
      "Explore religion, philosophy, mythology, history and the questions that shape human understanding.",
    href: "/blogs",
    label: "Explore articles",
    icon: BookOpen,
  },
  {
    number: "02",
    title: "Architecture & Spaces",
    description:
      "Discover architectural projects, interior environments and thoughtfully designed spaces.",
    href: "/projects",
    label: "View projects",
    icon: Building2,
  },
  {
    number: "03",
    title: "Art & Expression",
    description:
      "Explore portraits, paintings and original artworks created through different artistic mediums.",
    href: "/art",
    label: "Explore artwork",
    icon: Palette,
  },
  {
    number: "04",
    title: "Quizzes & Learning",
    description:
      "Test your knowledge through interactive quizzes, practice questions and educational resources.",
    href: "/quizzes",
    label: "Start learning",
    icon: GraduationCap,
  },
];

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="LostMonkTales home">
          <Image
            src="/logo.png"
            alt="LostMonkTales"
            width={190}
            height={70}
            priority
            className="brand-logo"
          />
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/blogs">Journal</Link>
          <Link href="/projects">Architecture</Link>
          <Link href="/art">Art</Link>
          <Link href="/art-gallery">Gallery</Link>
          <Link href="/quizzes">Learning</Link>
          <Link href="/about">About</Link>
        </nav>

        <Link href="/contact" className="header-contact">
          Get in touch <ArrowRight size={15} />
        </Link>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            AN INITIATIVE OF STUDIO LM
          </div>

          <h1>
            Beyond belief.
            <br />
            <span>Toward understanding.</span>
          </h1>

          <p className="hero-description">
            A space for curious minds to explore religions, civilisations,
            architecture, art and the ideas that connect humanity.
          </p>

          <div className="hero-actions">
            <Link href="/blogs" className="button-primary">
              Explore the journal <ArrowRight size={17} />
            </Link>
            <Link href="/about" className="button-secondary">
              Discover our story
            </Link>
          </div>

          <div className="hero-note">
            <Sparkles size={16} />
            <span>Read deeply. Question respectfully. Understand openly.</span>
          </div>
        </div>

        <div className="hero-art" aria-label="Explore the world of ideas">
          <div className="hero-art-top">
            <span>AN OPEN FIELD OF IDEAS</span>
            <span>EST. STUDIO LM</span>
          </div>

          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-symbol">L<span>M</span></div>

          <div className="hero-art-caption">
            <span>Curiosity is the beginning.</span>
            <ArrowDownRight size={24} />
          </div>
        </div>
      </section>

      <section className="principle-strip">
        <span>NOT BLIND BELIEF.</span>
        <span className="principle-star">✳</span>
        <span>NOT BLIND REJECTION.</span>
        <span className="principle-star">✳</span>
        <span>JUST THE COURAGE TO SEEK.</span>
      </section>

      <section className="explore-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">EXPLORE LOSTMONKTALES</div>
            <h2>Knowledge has many doors.</h2>
          </div>
          <p>
            From ancient traditions to contemporary creative practice,
            discover a collection of ideas, spaces and expressions.
          </p>
        </div>

        <div className="explore-grid">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <article className="explore-card" key={section.number}>
                <div className="card-topline">
                  <span>{section.number}</span>
                  <Icon size={23} strokeWidth={1.5} />
                </div>

                <h3>{section.title}</h3>
                <p>{section.description}</p>

                <Link href={section.href} className="card-link">
                  {section.label} <ArrowRight size={16} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>
      <FeaturedJournalStory />  

      <section className="manifesto">
        <div className="manifesto-label">
          <span className="eyebrow">OUR PHILOSOPHY</span>
          <span className="manifesto-line" />
        </div>

        <div>
          <h2>
            The journey towards understanding begins with the humility to say,
            <em> “I do not know.”</em>
          </h2>
          <Link href="/about" className="manifesto-link">
            Read our philosophy <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <section className="studio-cta">
        <div>
          <div className="eyebrow">CURIOUS ABOUT SOMETHING?</div>
          <h2>Every good question opens a new world.</h2>
          <p>
            Explore our work, discover an artwork or begin your learning
            journey with LostMonkTales.
          </p>
        </div>

        <Link href="/contact" className="button-primary">
          Connect with Studio LM <ArrowRight size={17} />
        </Link>
      </section>

      <footer className="site-footer">
        <div className="footer-brand">
          <span>LostMonkTales</span>
          <p>An initiative of Studio LM</p>
        </div>

        <p className="footer-philosophy">
          Explore. Question. Understand.
        </p>

        <div className="footer-links">
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
        </div>

        <p className="copyright">
          © 2026 LostMonkTales. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
