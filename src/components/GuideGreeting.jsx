import { useEffect, useMemo, useRef, useState } from 'react';
import { answer, initialContext, GREETING, SUGGESTIONS, WELCOME_TILES } from '../lib/guideBot.js';
import { scrollToSection } from '../lib/gsap.js';
import { prefersReducedMotion } from '../lib/env.js';
import MascotCanvas from './MascotCanvas.jsx';
import Icon from './Icon.jsx';

const FACE = './media/guide-mascot/001.webp';

/* ---------------------------------------------------------------- rich cards */

function PackagesCard({ card, onAsk }) {
  return (
    <div className="gcard gcard--packages">
      {card.items.map((p) => (
        <button key={p.id} type="button" className="gpkg" onClick={() => onAsk(`Tell me about the ${p.name}`)}>
          <span className="gpkg__icon" aria-hidden="true">
            <Icon name={p.icon} size={18} strokeWidth={1.5} />
          </span>
          <span className="gpkg__main">
            <strong>{p.name}</strong>
            <small>{p.time}</small>
          </span>
          <span className="gpkg__price">
            <small>from</small>
            <b>{p.from}</b>
            <i>{p.fromAlt}</i>
          </span>
        </button>
      ))}
    </div>
  );
}

function QuoteCard({ card }) {
  return (
    <div className="gcard gcard--quote">
      {card.title ? <p className="gcard__title">{card.title}</p> : null}
      {card.subtitle ? <p className="gcard__sub">{card.subtitle}</p> : null}
      {card.rows ? (
        <ul className="gq__rows">
          {card.rows.map((r, i) => (
            <li key={`${r.label}-${r.sub}-${i}`}>
              <span>
                <strong>{r.label}</strong>
                <small>{r.sub}</small>
              </span>
              <span className="gq__val">
                <b>{r.value}</b>
                <i>{r.alt}</i>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {card.lines ? (
        <ul className="gq__lines">
          {card.lines.map((l) => (
            <li key={l.label}>
              <span>{l.label}</span>
              <span>{l.value}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {card.total ? (
        <div className="gq__total">
          <span>Total</span>
          <span>
            <b>{card.total.value}</b>
            <i>{card.total.alt}</i>
          </span>
        </div>
      ) : null}
      {card.note ? <p className="gq__note">{card.note}</p> : null}
    </div>
  );
}

function StepsCard({ card }) {
  return (
    <ol className="gcard gcard--steps">
      {card.items.map((s) => (
        <li key={s.n}>
          <span className="gstep__n">{s.n}</span>
          <span>
            <strong>{s.title}</strong>
            <small>{s.text}</small>
          </span>
        </li>
      ))}
    </ol>
  );
}

function FactsCard({ card }) {
  return (
    <div className="gcard gcard--facts">
      {card.title ? <p className="gcard__title">{card.title}</p> : null}
      <dl>
        {card.items.map((f) => (
          <div key={f.k}>
            <dt>{f.k}</dt>
            <dd>{f.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TimelineCard({ card }) {
  return (
    <div className="gcard gcard--timeline">
      {card.title ? <p className="gcard__title">{card.title}</p> : null}
      <ol>
        {card.items.map((i) => (
          <li key={`${i.time}-${i.title}`}>
            <time>{i.time}</time>
            <span>{i.title}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ContactCard({ card }) {
  return (
    <ul className="gcard gcard--contact">
      {card.rows.map((r) => (
        <li key={r.label}>
          <a href={r.href} {...(r.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            <span className="gcontact__icon" aria-hidden="true">
              <Icon name={r.icon} size={16} strokeWidth={1.6} />
            </span>
            <span>
              <small>{r.label}</small>
              <strong>{r.value}</strong>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function Card({ card, onAsk }) {
  switch (card.kind) {
    case 'packages':
      return <PackagesCard card={card} onAsk={onAsk} />;
    case 'quote':
      return <QuoteCard card={card} />;
    case 'steps':
      return <StepsCard card={card} />;
    case 'facts':
      return <FactsCard card={card} />;
    case 'timeline':
      return <TimelineCard card={card} />;
    case 'contact':
      return <ContactCard card={card} />;
    default:
      return null;
  }
}

/* ---------------------------------------------------------------- one assistant message */

/** Words appear one after another; cards and buttons follow once the text has landed. */
function BotMessage({ m, reduced, onGrow, onAsk, onAction }) {
  const tokens = useMemo(() => m.text.split(/(\s+)/), [m.text]);
  const [shown, setShown] = useState(m.animate && !reduced ? 0 : tokens.length);
  const done = shown >= tokens.length;

  useEffect(() => {
    if (done) return undefined;
    const step = Math.max(2, Math.ceil(tokens.length / 46));
    const id = setTimeout(() => {
      setShown((s) => Math.min(tokens.length, s + step));
      onGrow();
    }, 26);
    return () => clearTimeout(id);
  }, [shown, done, tokens.length, onGrow]);

  useEffect(() => {
    if (done) onGrow();
  }, [done, onGrow]);

  return (
    <div className="gmsg gmsg--bot">
      <img className="gmsg__face" src={FACE} alt="" aria-hidden="true" />
      <div className="gmsg__col">
        <div className="gmsg__bubble">
          <p>{tokens.slice(0, shown).join('')}</p>
        </div>
        {done ? (
          <div className="gmsg__extra">
            {m.cards && m.cards.map((c, i) => <Card key={i} card={c} onAsk={onAsk} />)}
            {m.note ? <p className="gmsg__note">{m.note}</p> : null}
            {m.actions && m.actions.length ? (
              <div className="gmsg__actions">
                {m.actions.map((a) => (
                  <a key={a.label} href={a.href} className="gmsg__btn" onClick={(e) => onAction(e, a)} {...(a.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                    {a.label}
                    <Icon name={a.external ? 'arrowUpRight' : 'arrowRight'} size={13} />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- the panel */

/**
 * "Meet your guide" panel: the welcoming mascot behind the Ayubowan greeting, plus the Yala Concierge —
 * a chat assistant that answers from the site's own data and can calculate a live price.
 */
export default function GuideGreeting() {
  const reduced = prefersReducedMotion();
  const [open, setOpen] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState([{ id: 0, from: 'bot', ...GREETING }]);
  const [draft, setDraft] = useState('');
  const logRef = useRef(null);
  const inputRef = useRef(null);
  const nextId = useRef(1);
  const timer = useRef(0);
  const ctx = useRef(initialContext());
  const rootRef = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const toBottom = useMemo(
    () => () => {
      const el = logRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    },
    [],
  );

  useEffect(() => {
    toBottom();
  }, [messages, thinking, open, toBottom]);

  useEffect(() => {
    if (!open) return undefined;
    inputRef.current && inputRef.current.focus({ preventScroll: true });
    // on small screens the panel grows while chatting — bring it fully into view
    const bring =
      window.matchMedia('(max-width: 900px)').matches && rootRef.current
        ? setTimeout(() => rootRef.current && rootRef.current.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }), 80)
        : 0;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(bring);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, reduced]);

  const send = (text) => {
    const t = text.trim();
    if (!t || thinking) return;
    setMessages((m) => [...m, { id: nextId.current++, from: 'user', text: t }]);
    setDraft('');
    setThinking(true);
    const reply = answer(t, ctx.current);
    ctx.current = reply.ctx;
    const wait = reduced ? 120 : Math.min(1100, 520 + reply.text.length * 2);
    timer.current = setTimeout(() => {
      setMessages((m) => [...m, { id: nextId.current++, from: 'bot', animate: true, ...reply }]);
      setThinking(false);
    }, wait);
  };

  const restart = () => {
    clearTimeout(timer.current);
    ctx.current = initialContext();
    setThinking(false);
    setMessages([{ id: nextId.current++, from: 'bot', ...GREETING }]);
    inputRef.current && inputRef.current.focus({ preventScroll: true });
  };

  const onAction = (e, a) => {
    if (a.href.startsWith('#')) {
      e.preventDefault();
      setOpen(false);
      scrollToSection(a.href.slice(1));
    }
  };

  const last = messages[messages.length - 1];
  const fresh = messages.length === 1;
  const chips = !fresh && last.from === 'bot' && last.followUps && last.followUps.length ? last.followUps : fresh ? [] : SUGGESTIONS.slice(0, 4);

  return (
    <div ref={rootRef} className={`guide ${open ? 'is-chatting' : ''}`}>
      <div className="guide__glow" aria-hidden="true" />
      <div className="guide__mascot">
        <MascotCanvas label="A friendly cartoon gorilla guide in a safari hat, waving hello" speaking={thinking} />
      </div>
      <div className="guide__shade" aria-hidden="true" />

      <div className="guide__bubble">
        <strong>May You Live Long!</strong>
        <span>Welcome to Yala — I’ll be your guide.</span>
      </div>

      <button type="button" className="guide__open" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="guide-chat" hidden={open}>
        <span className="gopen__avatar" aria-hidden="true">
          <img src={FACE} alt="" />
          <i />
        </span>
        <span className="gopen__text">
          <small>Yala Concierge</small>
          <strong>Chat with me</strong>
        </span>
        <span className="gopen__go" aria-hidden="true">
          <Icon name="arrowRight" size={17} />
        </span>
      </button>

      <section id="guide-chat" className="gchat" role="dialog" aria-label="Yala Concierge chat" aria-hidden={!open} inert={!open}>
        <header className="gchat__head">
          <button type="button" className="gchat__tool gchat__tool--left" onClick={restart} aria-label="Start a new conversation" title="New conversation">
            <Icon name="rotate" size={15} />
          </button>
          <span className="gchat__avatar" aria-hidden="true">
            <img src={FACE} alt="" />
          </span>
          <button type="button" className="gchat__tool gchat__tool--right" onClick={() => setOpen(false)} aria-label="Close chat">
            <Icon name="close" size={15} />
          </button>
          <strong>
            Yala <em>Concierge</em>
          </strong>
          <span className="gchat__status">
            <i className="gchat__online" aria-hidden="true" /> Online · answers in seconds
          </span>
        </header>

        <div className="gchat__log" ref={logRef} role="log" aria-live="polite">
          {messages.map((m) =>
            m.from === 'bot' ? (
              <BotMessage key={m.id} m={m} reduced={reduced} onGrow={toBottom} onAsk={send} onAction={onAction} />
            ) : (
              <div key={m.id} className="gmsg gmsg--user">
                <div className="gmsg__bubble">
                  <p>{m.text}</p>
                </div>
              </div>
            ),
          )}

          {fresh ? (
            <div className="gwelcome" role="group" aria-label="Quick questions">
              {WELCOME_TILES.map((t) => (
                <button key={t.label} type="button" className="gtile" onClick={() => send(t.query)} disabled={thinking}>
                  <span className="gtile__icon" aria-hidden="true">
                    <Icon name={t.icon} size={18} strokeWidth={1.5} />
                  </span>
                  <strong>{t.label}</strong>
                  <small>{t.sub}</small>
                </button>
              ))}
            </div>
          ) : null}

          {thinking ? (
            <div className="gmsg gmsg--bot gmsg--typing" aria-label="The concierge is typing">
              <img className="gmsg__face" src={FACE} alt="" aria-hidden="true" />
              <div className="gmsg__bubble">
                <i />
                <i />
                <i />
              </div>
            </div>
          ) : null}
        </div>

        {chips.length ? (
          <div className="gchat__chips">
            {chips.map((s) => (
              <button key={s} type="button" onClick={() => send(s)} disabled={thinking}>
                {s}
              </button>
            ))}
          </div>
        ) : null}

        <form
          className="gchat__form"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about packages, prices, Yala…" aria-label="Your question" maxLength={240} autoComplete="off" />
          <button type="submit" aria-label="Send" disabled={!draft.trim() || thinking}>
            <Icon name="arrowRight" size={17} />
          </button>
        </form>
        <p className="gchat__fine">Answers come from our website · Sightings are never guaranteed</p>
      </section>
    </div>
  );
}
