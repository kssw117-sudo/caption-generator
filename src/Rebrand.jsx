import React, { useEffect, useRef, useState } from 'react';
import { INTERFACE_LANGUAGES, isInterfaceLanguage, interfaceDirection, translate } from './tgLocale.js';
import App from './App.jsx';

// Marketing examples are local, not API requests; the original live App owns all generation and account state.
const EXAMPLES = {
  "Instagram": [
    "A little behind the scenes from our studio. Thoughtful details, everyday inspiration and a fresh perspective on what we create.",
    [
      "BehindTheScenes",
      "CreativeStudio",
      "EverydayInspiration",
      "ContentCreation",
      "StudioLife"
    ]
  ],
  "TikTok": [
    "POV: a little glimpse into our creative process. Watch the details come together.",
    [
      "CreativeProcess",
      "StudioLife",
      "BehindTheScenes",
      "CreativeTok",
      "ContentCreator",
      "DayInTheLife",
      "StudioVlog",
      "MakingOf"
    ]
  ],
  "YouTube Shorts": [
    "A quick look behind the scenes — see how a simple idea becomes something worth sharing.",
    [
      "Shorts",
      "CreativeProcess",
      "StudioLife",
      "BehindTheScenes",
      "StudioVlog",
      "ContentCreation",
      "MakingOf",
      "CreativeWorkflow"
    ]
  ],
  "Pinterest": [
    "Everyday studio inspiration: simple textures, thoughtful styling and ideas worth saving.",
    [
      "CreativeIdeas",
      "StudioInspiration",
      "VisualStorytelling",
      "CreativeWorkspace",
      "Moodboard",
      "DesignInspiration",
      "ContentIdeas",
      "CreativeProcess"
    ]
  ],
  "X": [
    "A glimpse into our studio today. Small details, fresh ideas, and the work behind the finished piece.",
    [
      "StudioLife",
      "CreativeProcess",
      "BTS",
      "Design",
      "Creators",
      "Studio",
      "Workflow",
      "Ideas"
    ]
  ],
  "WhatsApp": [
    "A little update from our studio today — here’s what we’ve been creating.",
    [
      "StudioLife",
      "BehindTheScenes",
      "StudioUpdate",
      "CreativeProcess",
      "OurWork",
      "DailyInspiration",
      "MakingOf",
      "SmallBusiness"
    ]
  ]
};

export default function Rebrand() {
  const [interfaceLanguage, setInterfaceLanguage] = useState(() => {
    try { const saved = localStorage.getItem('tg_interface_language'); return isInterfaceLanguage(saved) ? saved : 'en'; }
    catch { return 'en'; }
  });
  const tr = (key, params) => translate(interfaceLanguage, key, params);
  const direction = interfaceDirection(interfaceLanguage);
  useEffect(() => {
    document.documentElement.lang = interfaceLanguage;
    document.documentElement.dir = direction;
    try { localStorage.setItem('tg_interface_language', interfaceLanguage); } catch {}
  }, [interfaceLanguage, direction]);
  const [platform, setPlatform] = useState('Instagram');
  const [copyLabel, setCopyLabel] = useState('Copy caption');
  const [showSupport, setShowSupport] = useState(false);
  const captionRef = useRef(null);
  const [caption, tags] = EXAMPLES[platform];
  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopyLabel('Copied ✓');
    } catch {
      const selection = window.getSelection();
      if (!selection || !captionRef.current) { setCopyLabel('Select caption to copy'); return; }
      const range = document.createRange();
      range.selectNodeContents(captionRef.current);
      selection.removeAllRanges();
      selection.addRange(range);
      setCopyLabel('Caption selected');
    }
  }
  return (
    <main className="tg-rebrand wrap" lang={interfaceLanguage} dir={direction}>
      <div className="tg-floating-hashtags" aria-hidden="true">
        <span className="tg-floating-hashtag tg-floating-hashtag--one">#</span>
        <span className="tg-floating-hashtag tg-floating-hashtag--two">#</span>
        <span className="tg-floating-hashtag tg-floating-hashtag--three">#</span>
      </div>
      <div className="tg-landing">
<nav><a className="brand" href="#top"><span className="mark">{"#"}</span>{"TagGenerator AI"}</a><div className="links"><a href="#how">{tr("How it works")}</a><a href="#price">{tr("Pricing")}</a><a href="#faq">{tr("FAQ")}</a><label className="tg-interface-language"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20"/></svg><select value={interfaceLanguage} onChange={event => setInterfaceLanguage(event.target.value)} aria-label={tr('Interface language')} title={tr('Interface language')}>{INTERFACE_LANGUAGES.map(item => <option key={item.code} value={item.code} lang={item.code}>{item.label}</option>)}</select></label><a className="btn dark" href="#try">{tr("Try it free")}</a></div></nav>
<div className="hero" id="top"><div><div className="eyebrow">{tr("A Plainwork product · AI content tool")}</div><h1>{tr("Your content.")}<br />{tr("Your voice.")}<br /><em>{tr("Ready to post.")}</em></h1><p className="lead">{tr("Turn your real photos and videos into thoughtful captions and relevant hashtags, written for your brand and the platform you post on.")}</p><a className="btn" href="#try">{tr("Create your first caption →")}</a><p className="fine">{tr("One free generation. No access code needed.")}</p></div><div className="window"><div className="windowbar"><i className="dot"></i><i className="dot"></i><i className="dot"></i><span className="demo-label">{tr("TagGenerator / Interactive example")}</span></div><img className="hero-media" src="/images/taggenerator-photo-video.webp" alt={tr("Photo and video creation workflow with AI caption and hashtag cards")} /><div className="windowbody"><div className="source"><div className="media-symbol" aria-hidden="true"><svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="5" y="7" width="28" height="25" rx="4"></rect><circle cx="14" cy="15" r="3"></circle><path d="M6 29l11-10 7 6 8-7"></path><rect x="23" y="25" width="20" height="17" rx="4" fill="#FAF9F4"></rect><path d="M31 29l6 4.5-6 4.5z" fill="currentColor" stroke="none"></path></svg></div><div><div className="tiny">{tr("SOURCE CONTENT")}</div><strong>{"Everyday Studio"}</strong><div className="fine" style={{"margin": "0"}}>{tr("Photo or video · Behind the scenes")}</div></div></div><div className="tabs" id="platform-tabs" role="group" aria-label={tr("Example social platform")}>{Object.keys(EXAMPLES).map(name => <button key={name} type="button" className={platform === name ? 'active' : ''} aria-pressed={platform === name} onClick={() => {setPlatform(name); setCopyLabel('Copy caption');}}>{name}</button>)}</div><div className="tiny" style={{"color": "var(--deep)"}}>{tr("✦ GENERATED CAPTION")}</div><p className="caption" id="tg-example-caption" ref={captionRef} dir="ltr" lang="en" aria-live="polite">{caption}</p><div className="tg-tag-heading"><span>{tr('HASHTAGS')}</span><span>{tags.length} {tr('tags')}</span></div><div className="tags" dir="ltr" aria-live="polite" aria-label={`${platform} example hashtags`}>{tags.map(tag => <span className="tag" key={tag}>#{tag}</span>)}</div><div className="windowfoot"><span className="fine" style={{"margin": "0"}}>{tr("✓ Tailored to your content")}</span><button className="smallbtn" type="button" onClick={copyCaption}>{tr(copyLabel)}</button></div></div></div></div>
<div className="strip" aria-label={tr("Supported platforms")}><span className="platform-logo"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2"></rect><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"></circle><circle cx="17.5" cy="6.5" r="1.2"></circle></svg><span>{"Instagram"}</span></span><span className="platform-logo"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M14 2h3c.4 3 2 4.7 5 5v3.2a9 9 0 0 1-5-1.6v8.1A6.2 6.2 0 1 1 10.8 10v3.3a3 3 0 1 0 3.2 3z"></path></svg><span>{"TikTok"}</span></span><span className="platform-logo"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M16.8 2.4a4.5 4.5 0 0 1 4.1 8l-3.1 1.7 1.2.6a4.5 4.5 0 0 1-.2 8l-8 4a4.5 4.5 0 0 1-4-8l3.2-1.7-1.4-.7a4.5 4.5 0 0 1 .1-8z" transform="translate(0 -1) scale(.93)"></path><path d="m10 8.5 6 3.5-6 3.5z" fill="var(--bg)"></path></svg><span>{"YouTube Shorts"}</span></span><span className="platform-logo"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.1-1.9.1-2.8l1.3-5.5s-.3-.7-.3-1.7c0-1.6.9-2.8 2-2.8 1 0 1.5.7 1.5 1.6 0 1-.7 2.4-1 3.8-.3 1.2.6 2.1 1.7 2.1 2.1 0 3.5-2.6 3.5-5.5 0-2.3-1.5-4-4.3-4-3.1 0-5.1 2.3-5.1 4.9 0 .9.3 1.6.7 2.1.2.2.2.4.1.7l-.2.9c-.1.3-.3.4-.6.3-1.5-.6-2.2-2.3-2.2-4.2 0-3.1 2.6-6.8 7.7-6.8 4.1 0 6.7 3 6.7 6.3 0 4.3-2.4 7.5-5.9 7.5-1.2 0-2.4-.7-2.8-1.4l-.8 3.2c-.3.9-.7 1.8-1.1 2.5A10 10 0 1 0 12 2z"></path></svg><span>{"Pinterest"}</span></span><span className="platform-logo"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.3 3H21l-7.5 8.6L22 21h-6.7l-5.2-6.8L4.2 21H.6l7.8-9L0 3h6.9l4.7 6.2L17.3 3zM16 19h2L5.8 5H3.7z"></path></svg><span>{"X"}</span></span><span className="platform-logo"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"></path><path d="M8.2 6.6c-.5-.1-.9.1-1.2.5-.4.5-.7 1.2-.6 2 .3 3.5 4.9 7.7 8.4 8.1 1 .1 2-.4 2.4-1.3.2-.4.4-1.1.1-1.3l-2.8-1.3c-.3-.1-.5 0-.7.3l-.9 1c-1.9-.8-3.2-2.1-4-4l.9-1c.2-.2.2-.4.1-.7L9 6.9c-.2-.3-.4-.3-.8-.3z"></path></svg><span>{"WhatsApp"}</span></span></div>
<section id="how"><div className="center"><div className="eyebrow">{tr("How it works")}</div><h2>{tr("From content to caption.")}<br />{tr("In three simple steps.")}</h2><p className="sub">{tr("No blank-page anxiety. No generic hashtag lists.")}</p></div><div className="grid3"><div className="feature"><div className="num">{"01"}</div><h3>{tr("Add your content")}</h3><p>{tr("Upload a real photo or video, or describe the post you want to create.")}</p></div><div className="feature"><div className="num">{"02"}</div><h3>{tr("Make it yours")}</h3><p>{tr("Set your brand voice, language, platform and preferred caption length.")}</p></div><div className="feature"><div className="num">{"03"}</div><h3>{tr("Choose and publish")}</h3><p>{tr("Pick your caption, copy the hashtags and make the post your own.")}</p></div></div></section>
      </div>
      <section id="try" className="tg-try-section">
        <div className="tg-landing"><div className="center"><div className="eyebrow">{tr("Try it yourself")}</div><h2>{tr("Make your next post.")}</h2><p className="sub">{tr("Start with a photo, a video or an idea.")}</p></div></div>
        <div className="tg-live-app"><App interfaceLanguage={interfaceLanguage} /></div>
      </section>
      <div className="tg-landing">
<section><div className="split"><div><div className="eyebrow">{tr("What you get")}</div><h2>{tr("Every frame has a story.")}</h2><p className="lead">{tr("Content inspired by what you actually share — not just another generic AI caption.")}</p><a className="btn" href="#try">{tr("Try it with your content →")}</a></div><figure style={{"margin": "0"}}><img className="art" src="/images/hero1.jpg" alt={tr("Original TagGenerator illustration")} loading="lazy" /></figure></div><div className="grid3"><div className="feature"><div className="num">{"◉"}</div><h3>{tr("Photo & video analysis")}</h3><p>{tr("Captions based on your visual content.")}</p></div><div className="feature"><div className="num">{"#"}</div><h3>{tr("Relevant hashtags")}</h3><p>{tr("Tags tailored to the selected platform.")}</p></div><div className="feature"><div className="num">{"Aa"}</div><h3>{tr("Your brand voice")}</h3><p>{tr("Content that sounds like your business.")}</p></div><div className="feature"><div className="num">{"◎"}</div><h3>{tr("Multiple languages")}</h3><p>{tr("Create and translate your content.")}</p></div><div className="feature"><div className="num">{"▤"}</div><h3>{tr("Batch generation")}</h3><p>{tr("Prepare multiple posts in one workflow.")}</p></div><div className="feature"><div className="num">{"↺"}</div><h3>{tr("Generation history")}</h3><p>{tr("Return to your recent results.")}</p></div></div></section>
<section id="price"><div className="center"><div className="eyebrow">{tr("Pricing")}</div><h2>{tr("Pay once. Keep creating.")}</h2><p className="sub">{tr("No monthly subscription.")}</p></div><div className="price"><div><strong style={{"color": "var(--deep)"}}>{tr("TagGenerator AI license")}</strong><div><span className="amount">{"$49"}</span><span className="fine">{tr("one time")}</span></div><ul className="checks"><li>{tr("Lifetime access")}</li><li>{tr("15 daily generations")}</li><li>{tr("Photo and video support")}</li><li>{tr("Batch mode and translations")}</li><li>{tr("Additional credits available")}</li></ul></div><div className="right"><h3>{tr("Less time writing.")}<br />{tr("More time creating.")}</h3><p className="fine" style={{"margin": "6px 0 22px"}}>{tr("One license for your everyday content workflow.")}</p><a className="btn" href="/buy.html">{tr("Get lifetime access →")}</a><a className="fine center" style={{"color": "var(--deep)"}} href="/unlock.html">{tr("Already have an access code?")}</a></div></div></section>
<section id="faq"><div className="center"><div className="eyebrow">{tr("FAQ")}</div><h2>{tr("Questions, answered.")}</h2><p className="sub">{tr("Everything you need to get started.")}</p></div><div className="faq"><details><summary>{tr("Does it actually look at my photo?")}</summary><p>{tr("Yes. TagGenerator analyzes the photo you upload, or an extracted frame from your video, to write captions inspired by what is actually visible.")}</p></details><details><summary>{tr("Can I create content without a photo?")}</summary><p>{tr("Yes. Describe your topic or use batch mode to prepare multiple posts.")}</p></details><details><summary>{tr("Is this a subscription?")}</summary><p>{tr("No. The current license is a one-time $49 purchase. Daily generation limits apply, and extra credits are available.")}</p></details><details><summary>{tr("Does it publish posts automatically?")}</summary><p>{tr("No. You choose and copy your generated content, keeping control of what you publish.")}</p></details></div></section>
<div className="final"><div className="eyebrow">{tr("Made for creators")}</div><h2>{tr("Good content starts here.")}</h2><p>{tr("Your idea. Your brand. Your next great post.")}</p><a className="btn" href="#try">{tr("Create your first caption →")}</a></div>
<footer className="tg-brand-footer">
  <div className="tg-footer-credit"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z" /></svg><span>Powered by Claude · <a href="https://plainwork.website" target="_blank" rel="noopener noreferrer">Plainwork by Ksenia</a></span></div>
  <div className="tg-footer-links"><a href="/terms.html">{tr("Terms")}</a><a href="/privacy.html">{tr("Privacy")}</a><a href="/refund.html">{tr("Refunds")}</a><button type="button" aria-expanded={showSupport} aria-controls="tg-support-email" onClick={() => setShowSupport(value => !value)}>{tr("Support")}</button></div>
  <div id="tg-support-email" hidden={!showSupport}><a href="mailto:kssw117@gmail.com">kssw117@gmail.com</a></div>
  <p className="tg-footer-legal">Грезина Ксения Викторовна (Ksenia Grezina) · Tax ID (ИНН) 710607167655</p>
</footer>
      </div>
    </main>
  );
}
