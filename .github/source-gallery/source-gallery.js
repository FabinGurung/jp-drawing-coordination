(() => {
  'use strict';
  const config = {"cards": [{"title": "Drawing project directory", "kind": "Source directory", "url": "/jp-drawing-coordination/projects/"}, {"title": "Registered 2D and 3D drawing sources", "kind": "Google Drive · sign in", "url": "https://drive.google.com/drive/u/0/search?q=jp-drawing-coordination"}]};
  if (!config.cards?.length || document.querySelector('jp-source-gallery')) return;

  const component = document.createElement('jp-source-gallery');
  const shadow = component.attachShadow({mode: 'open'});
  const style = document.createElement('style');
  style.textContent = `
    :host{display:block;color:#22283b;font:14px/1.45 system-ui,sans-serif;margin:0 auto;max-width:1280px}
    *{box-sizing:border-box}
    details{margin:0 12px 2px;background:#f6f5ed;border:1px solid #d8dbe3;border-radius:0 0 12px 12px}
    summary{cursor:pointer;min-height:44px;display:flex;align-items:center;gap:10px;padding:8px 15px;font-weight:750;color:#252b49}
    summary::-webkit-details-marker{display:none}
    summary::before{content:'›';font-size:22px;color:#4b55a0;line-height:1}
    details[open] summary::before{transform:rotate(90deg)}
    .inside{padding:8px clamp(10px,3vw,26px) 20px;border-top:1px solid #d8dbe3}
    .controls,.modes,.arrows{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .controls{justify-content:space-between}
    button{font:inherit;background:white;border:1px solid #c8ccd8;border-radius:8px;color:#242b48;padding:7px 12px;min-height:40px;cursor:pointer}
    button[aria-pressed=true]{background:#313963;color:white;border-color:#313963}
    button:disabled{opacity:.45;cursor:default}
    a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid #6471e5;outline-offset:3px}
    .scene{position:relative;height:194px;perspective:850px;overflow:hidden;touch-action:pan-y;cursor:grab}
    .scene.grabbing,.rail.grabbing{cursor:grabbing;user-select:none}
    .scene .card{position:absolute;width:min(245px,67%);height:143px;inset:18px auto auto 50%;
      margin:0;transition:transform .28s ease,opacity .24s ease;backface-visibility:hidden;will-change:transform}
    .scene.grabbing .card{transition:none}
    [hidden]{display:none!important}
    .rail{display:flex;position:relative;overflow-x:auto;align-items:stretch;gap:14px;
      padding:27px 5px 10px;scroll-snap-type:x mandatory;touch-action:pan-x pan-y;overscroll-behavior-x:contain}
    .rail::before{content:'';position:absolute;pointer-events:none;inset:10px 0 auto;height:2px;background:#777da6}
    .rail.grabbing{scroll-snap-type:none}
    .rail .card{flex:0 0 min(245px,72%);scroll-snap-align:start;min-height:132px;position:relative}
    .rail .card::before{content:'';position:absolute;inset:-18px auto auto 49%;height:18px;width:2px;background:#777da6}
    .card{display:flex;flex-direction:column;gap:6px;justify-content:center;min-width:0;overflow-wrap:anywhere;
      border:1px solid #d2d5e5;padding:16px;border-radius:11px;color:#232744;background:#fff;text-decoration:none;
      box-shadow:0 4px 12px rgb(40 49 90 / .12)}
    .card:hover{background:#f4f5ff;border-color:#7d85c3;text-decoration:underline}
    .card strong{font-size:15px;line-height:1.28}
    .card span{color:#515b7a;font-size:12px}
    .position{min-width:56px;text-align:center;color:#505a76;font-variant-numeric:tabular-nums}
    @media(prefers-reduced-motion:reduce){.scene .card{transition:none}}
    @media print{:host{display:none}}
  `;
  shadow.append(style);

  function element(tag, parent, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    parent.append(node);
    return node;
  }

  const details = element('details', shadow);
  element('summary', details, 'Google Drive sources');
  const inside = element('div', details, '', 'inside');
  const controls = element('div', inside, '', 'controls');
  const modes = element('div', controls, '', 'modes');
  const curved = element('button', modes, 'Curved gallery');
  const straight = element('button', modes, 'On the rail');
  const arrows = element('div', controls, '', 'arrows');
  const prev = element('button', arrows, '‹');
  prev.setAttribute('aria-label', 'Previous source');
  const position = element('span', arrows, '', 'position');
  position.setAttribute('aria-live', 'polite');
  const next = element('button', arrows, '›');
  next.setAttribute('aria-label', 'Next source');

  const arc = element('div', inside, '', 'scene');
  const rail = element('div', inside, '', 'rail');
  for (const view of [arc, rail]) {
    view.setAttribute('role', 'region');
    view.setAttribute('aria-label', view === arc ? 'Curved source gallery' : 'Source card rail');
    view.tabIndex = 0;
  }

  function makeCards(parent) {
    return config.cards.map(item => {
      const card = element('a', parent, '', 'card');
      card.href = item.url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      element('strong', card, item.title);
      element('span', card, item.kind);
      return card;
    });
  }

  const arcCards = makeCards(arc);
  const railCards = makeCards(rail);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let mode = 'curved';
  let selected = 0;
  let drag;
  let cancelledClick = false;
  const clamp = index => Math.min(config.cards.length - 1, Math.max(0, index));

  function drawArc(offset = 0) {
    const radius = Math.max(185, Math.min(350, arc.clientWidth * 0.55));
    arcCards.forEach((card, index) => {
      const distance = index - selected - offset;
      const angle = Math.max(-95, Math.min(95, distance * 33));
      const radians = angle * Math.PI / 180;
      card.style.transform = 'translate(-50%,0) translate3d(' +
        radius * Math.sin(radians) + 'px,0,' +
        radius * (Math.cos(radians) - 1) + 'px) rotateY(' + angle + 'deg)';
      card.style.zIndex = String(100 - Math.round(Math.abs(distance) * 20));
      card.style.opacity = Math.abs(distance) > 2.1 ? '0' : String(Math.max(0.38, 1 - Math.abs(distance) * 0.25));
      card.style.visibility = Math.abs(distance) > 2.2 ? 'hidden' : 'visible';
      card.tabIndex = index === selected ? 0 : -1;
    });
  }

  function paint() {
    curved.setAttribute('aria-pressed', mode === 'curved');
    straight.setAttribute('aria-pressed', mode === 'rail');
    arc.hidden = mode !== 'curved';
    rail.hidden = mode !== 'rail';
    position.textContent = (selected + 1) + ' / ' + config.cards.length;
    prev.disabled = selected === 0;
    next.disabled = selected === config.cards.length - 1;
    drawArc();
  }

  function choose(index) {
    selected = clamp(index);
    paint();
    if (mode === 'rail') rail.scrollTo({
      left: railCards[selected].offsetLeft - railCards[0].offsetLeft,
      behavior: reduced.matches ? 'auto' : 'smooth',
    });
  }

  curved.addEventListener('click', () => { mode = 'curved'; paint(); });
  straight.addEventListener('click', () => { mode = 'rail'; choose(selected); });
  prev.addEventListener('click', () => choose(selected - 1));
  next.addEventListener('click', () => choose(selected + 1));
  details.addEventListener('toggle', paint);
  if ('ResizeObserver' in window) new ResizeObserver(() => drawArc()).observe(arc);

  let scrollTimer;
  rail.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      if (drag || rail.hidden) return;
      const end = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 3;
      const leading = railCards.findIndex(card => card.offsetLeft - railCards[0].offsetLeft >= rail.scrollLeft - 10);
      selected = end && rail.scrollLeft > 3 ? railCards.length - 1 : Math.max(0, leading);
      paint();
    }, 130);
  }, {passive: true});

  for (const view of [arc, rail]) {
    view.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      choose(event.key === 'Home' ? 0 : event.key === 'End' ? config.cards.length - 1 :
        selected + (event.key === 'ArrowLeft' ? -1 : 1));
      if (view === arc && event.target.tagName === 'A') arcCards[selected].focus();
    });
    view.addEventListener('pointerdown', event => {
      if (event.button !== 0 || (view === rail && event.pointerType !== 'mouse')) return;
      cancelledClick = false;
      drag = {id: event.pointerId, x: event.clientX, y: event.clientY, left: view.scrollLeft, moved: false};
    });
    view.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      if (!drag.moved) {
        if (Math.abs(dx) < 9 || Math.abs(dx) < Math.abs(event.clientY - drag.y)) return;
        drag.moved = true;
        view.setPointerCapture(event.pointerId);
        view.classList.add('grabbing');
      }
      if (view === arc) drawArc(Math.max(-1.5, Math.min(1.5, -dx / 190)));
      else view.scrollLeft = drag.left - dx;
    });
    const release = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      cancelledClick = drag.moved;
      if (view === arc && drag.moved && event.type === 'pointerup' && Math.abs(dx) > 30) {
        choose(selected + (dx < 0 ? 1 : -1));
      } else {
        drawArc();
      }
      view.classList.remove('grabbing');
      drag = undefined;
    };
    view.addEventListener('pointerup', release);
    view.addEventListener('pointercancel', release);
    view.addEventListener('pointerleave', event => { if (drag && !drag.moved) release(event); });
    view.addEventListener('dragstart', event => event.preventDefault());
    view.addEventListener('click', event => {
      if (!cancelledClick) return;
      event.preventDefault();
      event.stopPropagation();
      cancelledClick = false;
    }, true);
  }

  const masthead = [...document.querySelectorAll('header,[role=banner],#jp-site-masthead,#site-header')]
    .find(node => !node.closest('main,article,section') && getComputedStyle(node).position !== 'fixed');
  if (masthead) masthead.after(component);
  else document.body.prepend(component);
  paint();
})();
