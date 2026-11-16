import { ABOUT, STATS } from '../data/content.js';
import { SectionTag, Heading } from './ui.jsx';
import Icon from './Icon.jsx';
import GuideGreeting from './GuideGreeting.jsx';
import Wildlife from './Wildlife.jsx';
import CountUp from './CountUp.jsx';

export default function About() {
  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <div className="about__ambient" aria-hidden="true" />
      <div className="container">
        <SectionTag>About Us</SectionTag>
        <Heading id="about-title" className="about__title">
          Where Adventure Meets the <em>Untamed Beauty</em> of Yala.
        </Heading>

        <div className="about__grid">
          <div className="about__media" data-reveal="tilt">
            <span className="chip chip--float">
              <span className="section-tag__dot" aria-hidden="true" /> Meet Your Guide
            </span>
            {/* Add your guide video: <GuideGreeting videoSrc="./media/guide-greeting.mp4" /> */}
            <GuideGreeting />
          </div>

          <div className="about__copy">
            <p className="about__lead" data-reveal="up">
              {ABOUT.lead}
            </p>
            {ABOUT.paragraphs.map((p) => (
              <p key={p.slice(0, 20)} className="about__p" data-reveal="up">
                {p}
              </p>
            ))}
            <div className="about__stats" data-reveal="up">
              {STATS.map((s) => (
                <div key={s.label} className="about__stat">
                  <strong>
                    <CountUp value={s.value} suffix={s.suffix} />
                  </strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ul className="pillars">
          {ABOUT.pillars.map((p) => (
            <li key={p.title} className="pillar glass" data-reveal="up">
              <span className="pillar__icon">
                <Icon name={p.icon} size={22} />
              </span>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </li>
          ))}
        </ul>
      </div>

      <Wildlife />
    </section>
  );
}
