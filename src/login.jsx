import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { flagLowPower } from './lib/env.js';

flagLowPower();
import { Field } from './components/ui.jsx';
import Icon from './components/Icon.jsx';
import { gsap } from './lib/gsap.js';
import { pointerParallax } from './lib/parallax.js';
import { removeBootScreen, prefersReducedMotion } from './lib/env.js';

const REMEMBER_KEY = 'wys.remember';

import { signIn, signUp, requestPasswordReset } from './lib/auth.js';

function SignedIn({ title, email }) {
  return (
    <div className="auth__done" role="status">
      <span className="checkout__tick">
        <svg viewBox="0 0 52 52" aria-hidden="true">
          <circle cx="26" cy="26" r="24" />
          <path d="M15 27l7 7 15-16" />
        </svg>
      </span>
      <h2>{title}</h2>
      <p>You are signed in as {email}.</p>
      <a className="btn btn--primary btn--block" href="./index.html#packages">
        <span className="btn__label">Explore Safaris</span>
        <Icon name="arrowRight" size={18} className="btn__icon" />
      </a>
    </div>
  );
}

function RegisterForm({ onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('idle'); // idle | loading | done
  const [notice, setNotice] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = 'Please enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = 'Please enter a valid email address.';
    if (password.length < 10) errs.password = 'Use at least 10 characters.';
    else if (!/[a-z]/i.test(password) || !/\d/.test(password)) errs.password = 'Use letters and at least one number.';
    if (!errs.password && confirm !== password) errs.confirm = 'The passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setNotice('');
    setState('loading');
    try {
      await signUp({ name: name.trim(), email: email.trim(), password });
      setState('done');
    } catch (err) {
      setNotice(err.message);
      setState('idle');
    }
  };

  if (state === 'done') return <SignedIn title={`Welcome, ${name.trim().split(/\s+/)[0]}`} email={email.trim()} />;

  return (
    <form onSubmit={submit} noValidate className="auth__form">
      <h1 id="auth-title">Create Account</h1>
      <p className="auth__sub">Join Wild Yala Safari to book and manage your safaris.</p>
      {notice ? (
        <p className="auth__notice" role="alert">
          <Icon name="info" size={16} />
          <span>{notice}</span>
        </p>
      ) : null}
      <Field id="rg-name" label="Full Name" icon="user" required value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" />
      <Field id="rg-email" label="Email Address" type="email" icon="mail" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" />
      <div className="pw">
        <Field
          id="rg-pass"
          label="Password (10+ characters, with a number)"
          type={show ? 'text' : 'password'}
          icon="lock"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
        />
        <button type="button" className="pw__toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
          <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
        </button>
      </div>
      <Field id="rg-confirm" label="Confirm Password" type={show ? 'text' : 'password'} icon="lock" required value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} autoComplete="new-password" />
      <button type="submit" className={`btn btn--primary btn--glow btn--xl btn--block ${state === 'loading' ? 'is-loading' : ''}`} disabled={state === 'loading'}>
        {state === 'loading' ? <span className="btn__spinner" aria-hidden="true" /> : <Icon name="user" size={18} />}
        <span className="btn__label">{state === 'loading' ? 'Creating account…' : 'Create Account'}</span>
      </button>
      <p className="auth__alt">
        Already have an account?{' '}
        <button type="button" className="link-btn" onClick={onLogin}>
          Sign in
        </button>
      </p>
    </form>
  );
}

function LoginForm({ onForgot, onRegister }) {
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(REMEMBER_KEY) || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(Boolean(email));
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('idle'); // idle | loading | done
  const [notice, setNotice] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = 'Please enter a valid email address.';
    if (password.length < 6) errs.password = 'Your password must be at least 6 characters.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setNotice('');
    setState('loading');
    try {
      if (remember) localStorage.setItem(REMEMBER_KEY, email.trim());
      else localStorage.removeItem(REMEMBER_KEY);
    } catch {
      /* storage unavailable */
    }
    try {
      await signIn({ email: email.trim(), password, remember });
      setState('done');
    } catch (err) {
      setNotice(err.message);
      setState('idle');
    }
  };

  if (state === 'done') return <SignedIn title="Welcome back" email={email.trim()} />;

  return (
    <form onSubmit={submit} noValidate className="auth__form">
      <h1 id="auth-title">Welcome Back</h1>
      <p className="auth__sub">Sign in to manage your safari bookings.</p>
      {notice ? (
        <p className="auth__notice" role="alert">
          <Icon name="info" size={16} />
          <span>{notice}</span>
        </p>
      ) : null}
      <Field id="lg-email" label="Email Address" type="email" icon="mail" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" />
      <div className="pw">
        <Field
          id="lg-pass"
          label="Password"
          type={show ? 'text' : 'password'}
          icon="lock"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
        />
        <button type="button" className="pw__toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
          <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
        </button>
      </div>
      <div className="auth__row">
        <label className="check">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span className="check__box" aria-hidden="true">
            <Icon name="check" size={13} strokeWidth={2.4} />
          </span>
          Remember me
        </label>
        <button type="button" className="link-btn" onClick={onForgot}>
          Forgot password?
        </button>
      </div>
      <button type="submit" className={`btn btn--primary btn--glow btn--xl btn--block ${state === 'loading' ? 'is-loading' : ''}`} disabled={state === 'loading'}>
        {state === 'loading' ? <span className="btn__spinner" aria-hidden="true" /> : <Icon name="login" size={18} />}
        <span className="btn__label">{state === 'loading' ? 'Signing in…' : 'Login'}</span>
      </button>
      <p className="auth__alt">
        New to Wild Yala Safari?{' '}
        <button type="button" className="link-btn" onClick={onRegister}>
          Create an account
        </button>
      </p>
    </form>
  );
}

function ForgotForm({ onBack }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [state, setState] = useState('idle');
  const [notice, setNotice] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setNotice('');
    setState('loading');
    try {
      await requestPasswordReset(email.trim());
      setState('sent');
    } catch (err) {
      setNotice(err.message);
      setState('idle');
    }
  };
  return (
    <form onSubmit={submit} noValidate className="auth__form">
      <button type="button" className="back-link" onClick={onBack}>
        <Icon name="arrowLeft" size={16} /> Back to login
      </button>
      <h1 id="auth-title">Reset Your Password</h1>
      {state === 'sent' ? (
        <div className="auth__sent" role="status">
          <Icon name="mail" size={22} />
          <p>
            If an account exists for <strong>{email.trim()}</strong>, you will receive an email with instructions to reset your password.
          </p>
        </div>
      ) : (
        <>
          <p className="auth__sub">Enter the email address you use with Wild Yala Safari and we will send you a reset link.</p>
          {notice ? (
            <p className="auth__notice" role="alert">
              <Icon name="info" size={16} />
              <span>{notice}</span>
            </p>
          ) : null}
          <Field id="fp-email" label="Email Address" type="email" icon="mail" required value={email} onChange={(e) => setEmail(e.target.value)} error={error} autoComplete="email" />
          <button type="submit" className="btn btn--primary btn--xl btn--block" disabled={state === 'loading'}>
            {state === 'loading' ? <span className="btn__spinner" aria-hidden="true" /> : <Icon name="send" size={18} />}
            <span className="btn__label">{state === 'loading' ? 'Sending…' : 'Send Reset Link'}</span>
          </button>
        </>
      )}
    </form>
  );
}

function LoginApp() {
  // login.html#register (or ?signup) opens straight on the sign-up form.
  const [mode, setMode] = useState(() => (/register|signup/.test(window.location.hash + window.location.search) ? 'register' : 'login'));

  useEffect(() => {
    removeBootScreen();
    if (prefersReducedMotion()) return undefined;
    // Entrance sequence: image (CSS) → brand → story → card → form fields in order → button last.
    // fromTo (not from): React StrictMode runs effects twice in dev, and a second from() would animate to the hidden state.
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.fromTo('.auth__logo', { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 1, clearProps: 'transform' }, 0.3)
      .fromTo('.auth__home', { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 1, clearProps: 'transform' }, 0.4)
      .fromTo('.auth__story > *', { y: 26, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.12, duration: 1.1 }, 0.9)
      .fromTo('.auth__card', { y: 38, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 1.25, clearProps: 'transform' }, 1.1)
      .fromTo('.auth__form > *', { y: 16, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.075, duration: 0.85, ease: 'power3.out', clearProps: 'transform,opacity' }, 1.45);
    const stopParallax = pointerParallax(document.querySelector('.auth'));
    return () => {
      tl.kill();
      stopParallax();
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    gsap.fromTo('.auth__form', { opacity: 0, x: mode === 'login' ? -20 : 20 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' });
    const first = document.querySelector('.auth__form input');
    if (first && mode !== 'login') first.focus();
  }, [mode]);

  return (
    <main id="main" className="auth">
      <div className="auth__stage">
        <div className="auth__scene" aria-hidden="true">
          <div className="auth__sun" data-depth="6" />
          <div className="auth__rings" data-depth="3">
            <i />
            <i />
          </div>
          <div className="auth__arch" data-spot>
            <div className="auth__photo" data-depth="10">
              <img
                src="./media/login-p1-1600.webp"
                srcSet="./media/login-p1-1000.webp 1000w, ./media/login-p1-1600.webp 1600w"
                sizes="(max-width: 900px) 80vw, 40vw"
                alt=""
                width="1600"
                height="2000"
                fetchPriority="high"
              />
            </div>
            <div className="auth__light" />
            <div className="auth__shade" />
            <div className="auth__grain" />
          </div>
        </div>
        <p className="auth__vertical" aria-hidden="true">
          Explore the wild
        </p>
        <div className="auth__story" data-depth="3">
          <p className="eyebrow">Wild Yala Safari</p>
          <p className="auth__quote">
            Into the <em>wild heart</em> of Yala.
          </p>
          <p className="auth__coords">6.37° N · 81.52° E</p>
        </div>
      </div>
      <a className="auth__logo" href="./index.html" aria-label="Wild Yala Safari — back to home">
        <img src="./brand/logo-480.webp" alt="Wild Yala Safari" width="96" height="83" />
      </a>
      <a className="auth__home" href="./index.html">
        <Icon name="arrowLeft" size={16} /> Back to website
      </a>
      <section className="auth__card glass" aria-labelledby="auth-title">
        {mode === 'login' ? (
          <LoginForm onForgot={() => setMode('forgot')} onRegister={() => setMode('register')} />
        ) : mode === 'register' ? (
          <RegisterForm onLogin={() => setMode('login')} />
        ) : (
          <ForgotForm onBack={() => setMode('login')} />
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LoginApp />
  </StrictMode>
);
