// A2UI Studio playground webview: a full A2UI v0.9.1 client renderer plus the
// playground app shell (canvas, inspectors, composer, example gallery).
(function () {
  'use strict';
  const vscode = acquireVsCodeApi();

  // =========================================================================
  // Icon set — consistent 24x24 stroke icons covering the basic catalog names
  // =========================================================================
  const I = {
    add: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    arrowBack: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    arrowForward: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    moreVert: '<circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none"/>',
    moreHoriz: '<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
    settings: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
    accountCircle: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M5.5 19a7.5 7.5 0 0 1 13 0"/>',
    phone: '<path d="M6.6 3h3l1.5 4-2 1.5a13 13 0 0 0 6.4 6.4L17 13l4 1.5v3A2.5 2.5 0 0 1 18.5 20 15.5 15.5 0 0 1 4 5.5 2.5 2.5 0 0 1 6.6 3z"/>',
    call: '<path d="M6.6 3h3l1.5 4-2 1.5a13 13 0 0 0 6.4 6.4L17 13l4 1.5v3A2.5 2.5 0 0 1 18.5 20 15.5 15.5 0 0 1 4 5.5 2.5 2.5 0 0 1 6.6 3z"/>',
    delete: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6"/>',
    download: '<path d="M12 3v12M6 11l6 6 6-6M4 21h16"/>',
    edit: '<path d="M17 3l4 4L8 20l-5 1 1-5L17 3z"/>',
    favorite: '<path d="M12 21S4 14.5 4 8.8C4 5.6 6.4 4 8.5 4c1.7 0 3 .9 3.5 2 .5-1.1 1.8-2 3.5-2C17.6 4 20 5.6 20 8.8 20 14.5 12 21 12 21z"/>',
    favoriteOff: '<path d="M12 21S4 14.5 4 8.8C4 5.6 6.4 4 8.5 4c1.7 0 3 .9 3.5 2 .5-1.1 1.8-2 3.5-2C17.6 4 20 5.6 20 8.8 20 14.5 12 21 12 21z"/><path d="M4 4l16 16"/>',
    home: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-5"/><circle cx="12" cy="8" r="1.1" fill="currentColor" stroke="none"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.1 1-1.1 1.8"/><circle cx="12" cy="16.5" r="1.1" fill="currentColor" stroke="none"/>',
    warning: '<path d="M12 3 2 20h20L12 3zM12 10v4"/><circle cx="12" cy="17" r="1.1" fill="currentColor" stroke="none"/>',
    error: '<circle cx="12" cy="12" r="10"/><path d="M12 7v6"/><circle cx="12" cy="16.5" r="1.1" fill="currentColor" stroke="none"/>',
    calendarToday: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',
    event: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/><rect x="13" y="12" width="4" height="4" rx="0.8" fill="currentColor" stroke="none"/>',
    locationOn: '<path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    lockOpen: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.6-1.7"/>',
    notifications: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 19a2 2 0 0 0 4 0"/>',
    notificationsOff: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 19a2 2 0 0 0 4 0"/><path d="M4 4l16 16"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    play: '<path d="M7 5l12 7-12 7V5z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="1.5"/>',
    fastForward: '<path d="M4 6l8 6-8 6V6zM12 6l8 6-8 6V6z"/>',
    rewind: '<path d="M20 6l-8 6 8 6V6zM12 6l-8 6 8 6V6z"/>',
    payment: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    camera: '<path d="M9 7l1.5-3h3L15 7"/><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/>',
    photo: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="2" y="9" width="20" height="8" rx="2"/><rect x="6" y="14" width="12" height="7" rx="1"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 3v5h-5"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>',
    starHalf: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/><path d="M12 2v15.8"/>',
    starOff: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/><path d="M4 4l16 16"/>',
    shoppingCart: '<circle cx="9" cy="20" r="1.5" fill="currentColor" stroke="none"/><circle cx="17" cy="20" r="1.5" fill="currentColor" stroke="none"/><path d="M3 4h2l2.6 12h10.8L21 8H7"/>',
    thumbUp: '<path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zM7 11l4-7c1.6 0 2.7 1.1 2.7 2.7V10H19a2 2 0 0 1 2 2.4l-1.2 5.6A2.5 2.5 0 0 1 17.3 20H7"/>',
    thumbDown: '<path d="M17 13V4h3a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-3zM17 13l-4 7c-1.6 0-2.7-1.1-2.7-2.7V14H5a2 2 0 0 1-2-2.4l1.2-5.6A2.5 2.5 0 0 1 6.7 4H17"/>',
    visibility: '<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    visibilityOff: '<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/>',
    share: '<circle cx="6" cy="12" r="2.6"/><circle cx="17.5" cy="5.5" r="2.6"/><circle cx="17.5" cy="18.5" r="2.6"/><path d="M8.4 10.8l6.8-4M8.4 13.2l6.8 4"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>',
    attachFile: '<path d="M21.4 11 12.2 20.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8L15 6.1"/>'
  };

  function iconSvg(name, cls) {
    const inner = I[name] || '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>';
    return `<svg class="${cls || 'icon'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  }

  // =========================================================================
  // JSON Pointer utilities (RFC 6901 + A2UI relative paths)
  // =========================================================================
  function parsePointer(ptr) {
    if (!ptr || ptr === '/') return [];
    return ptr
      .replace(/^\//, '')
      .split('/')
      .map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'));
  }

  function getPath(obj, ptr) {
    let cur = obj;
    for (const seg of parsePointer(ptr)) {
      if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
      cur = cur[Array.isArray(cur) ? Number(seg) : seg];
    }
    return cur;
  }

  function setPath(obj, ptr, value) {
    const segs = parsePointer(ptr);
    if (segs.length === 0) return;
    let cur = obj;
    for (let i = 0; i < segs.length - 1; i++) {
      const seg = segs[i];
      const key = Array.isArray(cur) ? Number(seg) : seg;
      if (cur[key] === null || cur[key] === undefined || typeof cur[key] !== 'object') {
        cur[key] = /^\d+$/.test(segs[i + 1]) ? [] : {};
      }
      cur = cur[key];
    }
    const last = segs[segs.length - 1];
    const lastKey = Array.isArray(cur) ? Number(last) : last;
    if (value === undefined) {
      if (Array.isArray(cur)) cur[lastKey] = undefined;
      else delete cur[lastKey];
    } else {
      cur[lastKey] = value;
    }
  }

  function absPath(path, scope) {
    if (typeof path !== 'string') return '/';
    if (path.startsWith('/')) return path;
    return (scope || '') + '/' + path;
  }

  // =========================================================================
  // Surface store
  // =========================================================================
  /** @type {Map<string, any>} */
  const surfaces = new Map();

  function processEnvelope(env, store) {
    const map = store || surfaces;
    if (env.createSurface) {
      const c = env.createSurface;
      map.set(c.surfaceId, {
        id: c.surfaceId,
        catalogId: c.catalogId,
        theme: c.theme || {},
        sendDataModel: !!c.sendDataModel,
        components: new Map(),
        dataModel: {},
        ui: { tabs: {}, modals: {}, touched: {} }
      });
    } else if (env.updateComponents) {
      const u = env.updateComponents;
      let s = map.get(u.surfaceId);
      if (!s) {
        // Tolerate missing createSurface (spec allows the agent to skip it).
        s = { id: u.surfaceId, catalogId: '', theme: {}, sendDataModel: true, components: new Map(), dataModel: {}, ui: { tabs: {}, modals: {}, touched: {} } };
        map.set(u.surfaceId, s);
      }
      for (const comp of u.components || []) {
        if (comp && typeof comp.id === 'string') s.components.set(comp.id, comp);
      }
    } else if (env.updateDataModel) {
      const u = env.updateDataModel;
      const s = map.get(u.surfaceId);
      if (!s) return;
      if (!u.path || u.path === '/' || u.path === '') {
        s.dataModel = u.value !== undefined ? u.value : {};
      } else {
        setPath(s.dataModel, u.path, u.value);
      }
    } else if (env.deleteSurface) {
      map.delete(env.deleteSurface.surfaceId);
    }
    if (!store) {
      scheduleRender();
      renderDataTab();
    }
  }

  // =========================================================================
  // Dynamic value resolution + client-side functions
  // =========================================================================
  function resolveDynamic(v, s, scope) {
    if (v === null || v === undefined) return undefined;
    if (typeof v !== 'object') return v;
    if (Array.isArray(v)) return v;
    if (typeof v.path === 'string') return getPath(s.dataModel, absPath(v.path, scope));
    if (typeof v.call === 'string') return callFn(v, s, scope);
    if ('literalString' in v) return v.literalString;
    if ('literalNumber' in v) return v.literalNumber;
    if ('literalBoolean' in v) return v.literalBoolean;
    return v;
  }

  function toDisplayString(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    return JSON.stringify(v);
  }

  function callFn(callObj, s, scope) {
    const name = callObj.call;
    const rawArgs = callObj.args || {};
    const arg = (key) => resolveDynamic(rawArgs[key], s, scope);
    switch (name) {
      case 'required': {
        const v = arg('value');
        return !(v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0));
      }
      case 'email': {
        const v = toDisplayString(arg('value'));
        return v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      }
      case 'regex': {
        const v = toDisplayString(arg('value'));
        try {
          return v === '' || new RegExp(String(rawArgs.pattern)).test(v);
        } catch {
          return true;
        }
      }
      case 'length': {
        const v = toDisplayString(arg('value'));
        const min = rawArgs.min ?? 0;
        const max = rawArgs.max ?? Infinity;
        return v.length >= min && v.length <= max;
      }
      case 'numeric': {
        const n = Number(arg('value'));
        if (Number.isNaN(n)) return false;
        const min = rawArgs.min ?? -Infinity;
        const max = rawArgs.max ?? Infinity;
        return n >= min && n <= max;
      }
      case 'and': {
        const vals = rawArgs.values || [];
        return vals.every((v) => !!resolveDynamic(v, s, scope));
      }
      case 'or': {
        const vals = rawArgs.values || [];
        return vals.some((v) => !!resolveDynamic(v, s, scope));
      }
      case 'not':
        return !resolveDynamic(rawArgs.value, s, scope);
      case 'formatString':
        return interpolate(toDisplayString(rawArgs.value), s, scope);
      case 'concat': {
        const vals = rawArgs.values || [];
        return vals.map((v) => toDisplayString(resolveDynamic(v, s, scope))).join('');
      }
      case 'formatNumber': {
        const n = Number(arg('value'));
        if (Number.isNaN(n)) return '';
        return n.toLocaleString(undefined, {
          minimumFractionDigits: rawArgs.minFractionDigits ?? 0,
          maximumFractionDigits: rawArgs.maxFractionDigits ?? rawArgs.precision ?? 2
        });
      }
      case 'formatCurrency': {
        const n = Number(arg('value'));
        if (Number.isNaN(n)) return '';
        try {
          return n.toLocaleString(undefined, { style: 'currency', currency: String(rawArgs.currency || 'USD') });
        } catch {
          return String(n);
        }
      }
      case 'formatDate': {
        const v = arg('value');
        const d = v ? new Date(v) : new Date();
        if (isNaN(d.getTime())) return toDisplayString(v);
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: /[Hhms]/.test(String(rawArgs.format || '')) ? 'short' : undefined });
      }
      case 'pluralize': {
        const n = Number(arg('count'));
        return n === 1 ? toDisplayString(rawArgs.one) : toDisplayString(rawArgs.other ?? rawArgs.many);
      }
      case 'now':
        return new Date().toISOString();
      case 'upper':
        return toDisplayString(arg('value')).toUpperCase();
      case 'lower':
        return toDisplayString(arg('value')).toLowerCase();
      case 'openUrl':
        vscode.postMessage({ type: 'openExternal', url: toDisplayString(arg('url')) });
        return true;
      default:
        return undefined;
    }
  }

  /** formatString `${...}` interpolation with nesting support. */
  function interpolate(template, s, scope) {
    let out = '';
    let i = 0;
    while (i < template.length) {
      if (template[i] === '\\' && template.slice(i + 1, i + 3) === '${') {
        out += '${';
        i += 3;
        continue;
      }
      if (template[i] === '$' && template[i + 1] === '{') {
        let depth = 1;
        let j = i + 2;
        while (j < template.length && depth > 0) {
          if (template[j] === '{') depth++;
          else if (template[j] === '}') depth--;
          if (depth > 0) j++;
        }
        const expr = template.slice(i + 2, j);
        out += toDisplayString(evalExpr(expr.trim(), s, scope));
        i = j + 1;
      } else {
        out += template[i++];
      }
    }
    return out;
  }

  function evalExpr(expr, s, scope) {
    if (!expr) return '';
    const fnMatch = /^([a-zA-Z_][\w]*)\((.*)\)$/s.exec(expr);
    if (fnMatch) {
      const args = {};
      for (const part of splitArgs(fnMatch[2])) {
        const idx = part.indexOf(':');
        if (idx < 0) continue;
        const key = part.slice(0, idx).trim();
        const raw = part.slice(idx + 1).trim();
        args[key] = parseArgValue(raw, s, scope);
      }
      return callFn({ call: fnMatch[1], args }, s, scope);
    }
    // Plain path (absolute or relative)
    return getPath(s.dataModel, absPath(expr, scope));
  }

  function splitArgs(text) {
    const parts = [];
    let depth = 0;
    let inStr = false;
    let strCh = '';
    let cur = '';
    for (const ch of text) {
      if (inStr) {
        cur += ch;
        if (ch === strCh) inStr = false;
        continue;
      }
      if (ch === "'" || ch === '"') {
        inStr = true;
        strCh = ch;
        cur += ch;
      } else if (ch === '(' || ch === '{') {
        depth++;
        cur += ch;
      } else if (ch === ')' || ch === '}') {
        depth--;
        cur += ch;
      } else if (ch === ',' && depth === 0) {
        parts.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    if (cur.trim()) parts.push(cur);
    return parts;
  }

  function parseArgValue(raw, s, scope) {
    if (/^'.*'$/.test(raw) || /^".*"$/.test(raw)) return raw.slice(1, -1);
    if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    if (raw.startsWith('${') && raw.endsWith('}')) return evalExpr(raw.slice(2, -1).trim(), s, scope);
    if (raw.includes('(')) return evalExpr(raw, s, scope);
    return getPath(s.dataModel, absPath(raw, scope));
  }

  // =========================================================================
  // Checks (validation)
  // =========================================================================
  function evaluateChecks(comp, s, scope) {
    const failures = [];
    for (const check of comp.checks || []) {
      const callObj = check.condition || check;
      if (typeof callObj.call !== 'string') continue;
      let ok = true;
      try {
        ok = !!callFn(callObj, s, scope);
      } catch {
        ok = true;
      }
      if (!ok) failures.push(check.message || 'Invalid value');
    }
    return failures;
  }

  // =========================================================================
  // Renderer
  // =========================================================================
  const JUSTIFY = {
    start: 'flex-start', center: 'center', end: 'flex-end',
    spaceBetween: 'space-between', spaceAround: 'space-around',
    spaceEvenly: 'space-evenly', stretch: 'stretch'
  };
  const ALIGN = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };

  function mdLite(text) {
    const esc = String(text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return esc
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  function el(tag, cls, attrs) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  }

  function placeholder(id) {
    const node = el('div', 'a2-placeholder');
    node.title = `Waiting for component "${id}"…`;
    return node;
  }

  /**
   * Webviews are a secure context: plain-http media is blocked as mixed
   * content, so upgrade it — models very often emit sample URLs as http://.
   */
  function normalizeMediaUrl(url) {
    const u = String(url || '').trim();
    return u.startsWith('http://') ? 'https://' + u.slice(7) : u;
  }

  function isPageVideoUrl(url) {
    return /(?:youtube\.com\/(watch|shorts)|youtu\.be\/|vimeo\.com\/\d|dailymotion\.com\/video)/i.test(url);
  }

  /** Friendly card shown when media can't play inside the webview. */
  function mediaFallback(url, reason) {
    const node = el('div', 'a2-media-fallback');
    node.innerHTML = `${iconSvg('play')}<div class="a2-media-fallback-text"><strong>Can’t play here</strong><span>${reason}</span></div>`;
    const btn = el('button', 'a2-button a2-button-primary');
    btn.textContent = 'Open in browser';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      vscode.postMessage({ type: 'openExternal', url });
    });
    attachRipple(btn);
    node.appendChild(btn);
    return node;
  }

  /**
   * MD3 pointer ripple. Skipped entirely under body.no-motion; the ripple
   * span is pointer-events:none so the inspector never sees it as a target,
   * and it removes itself on animationend.
   */
  function attachRipple(node) {
    node.classList.add('a2-ripple-host');
    node.addEventListener('pointerdown', (e) => {
      if (document.body.classList.contains('no-motion') || node.disabled) return;
      const rect = node.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2.1;
      const ripple = el('span', 'a2-ripple');
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      ripple.addEventListener('animationend', () => ripple.remove());
      node.appendChild(ripple);
    });
  }

  function fkey(s, compId, scope) {
    return `${s.id}|${compId}|${scope || ''}`;
  }

  function markTouched(s, key) {
    s.ui.touched[key] = true;
  }

  /** MD3 outlined field: input + 3-segment notched outline hosting the floating label. */
  function outlinedField(wrap, input, labelText) {
    const box = el('div', 'a2-field-box');
    box.appendChild(input);
    const outline = el('div', 'a2-field-outline');
    outline.appendChild(el('span', 'a2-outline-lead'));
    const notch = el('span', 'a2-outline-notch');
    const label = el('span', 'a2-field-label');
    label.textContent = labelText || '';
    if (!labelText) notch.classList.add('empty');
    notch.appendChild(label);
    outline.appendChild(notch);
    outline.appendChild(el('span', 'a2-outline-trail'));
    box.appendChild(outline);
    wrap.appendChild(box);
  }

  function renderComponent(id, s, scope, seen) {
    seen = seen || new Set();
    const comp = s.components.get(id);
    if (!comp) return placeholder(id);
    const cycleKey = id + '@' + (scope || '');
    if (seen.has(cycleKey)) return placeholder(id);
    seen.add(cycleKey);

    let node;
    try {
      node = renderByType(comp, s, scope, seen);
    } catch (e) {
      node = el('div', 'a2-error-chip');
      node.textContent = `⚠ ${comp.component}: ${e.message}`;
    }
    seen.delete(cycleKey);
    if (comp.weight !== undefined && node) {
      node.style.flexGrow = String(comp.weight);
      node.style.flexBasis = '0';
      node.style.minWidth = '0';
    }
    if (node && node.dataset) {
      node.dataset.cid = id;
      node.dataset.sid = s.id;
    }
    return node;
  }

  function renderChildList(children, s, scope, seen, container) {
    if (Array.isArray(children)) {
      for (const childId of children) {
        container.appendChild(renderComponent(childId, s, scope, seen));
      }
    } else if (children && typeof children === 'object' && children.path && children.componentId) {
      const listPath = absPath(children.path, scope);
      const arr = getPath(s.dataModel, listPath);
      if (Array.isArray(arr)) {
        arr.forEach((_item, idx) => {
          container.appendChild(renderComponent(children.componentId, s, `${listPath}/${idx}`, seen));
        });
      } else {
        container.appendChild(placeholder(children.componentId));
      }
    }
  }

  function renderByType(comp, s, scope, seen) {
    const D = (v) => resolveDynamic(v, s, scope);
    const DS = (v) => toDisplayString(D(v));

    switch (comp.component) {
      case 'Text': {
        const variant = comp.variant || 'body';
        const node = el('div', `a2-text a2-text-${variant}`);
        let text = DS(comp.text);
        // Leading markdown heading syntax maps onto the variant style.
        const hm = /^(#{1,5})\s+(.*)$/s.exec(text);
        if (hm) {
          node.className = `a2-text a2-text-h${Math.min(hm[1].length + 1, 5)}`;
          text = hm[2];
        }
        node.innerHTML = mdLite(text);
        return node;
      }
      case 'Image': {
        const node = el('img', `a2-image a2-image-${comp.variant || 'mediumFeature'} a2-fit-${comp.fit || 'fill'}`);
        node.src = normalizeMediaUrl(DS(comp.url));
        node.alt = DS(comp.description) || '';
        node.loading = 'lazy';
        node.addEventListener('error', () => node.classList.add('a2-image-broken'));
        return node;
      }
      case 'Icon': {
        const node = el('span', 'a2-icon-wrap');
        node.innerHTML = iconSvg(DS(comp.name), 'a2-icon');
        return node;
      }
      case 'Video': {
        const url = normalizeMediaUrl(DS(comp.url));
        // <video> can't play page URLs (YouTube/Vimeo) — offer the browser.
        if (isPageVideoUrl(url)) return mediaFallback(url, 'This looks like a video page, not a direct media file. Webviews can only stream .mp4/.webm files.');
        const wrap = el('div', 'a2-video-wrap');
        const node = el('video', 'a2-video');
        node.src = url;
        node.controls = true;
        node.preload = 'metadata';
        node.muted = false;
        node.volume = 1;
        node.dataset.mkey = fkey(s, comp.id, scope);
        node.addEventListener('error', () => {
          if (wrap.parentElement) wrap.parentElement.replaceChild(mediaFallback(url, 'This video could not be loaded inside VS Code (codec, CORS or network restriction).'), wrap);
        });
        // Many "sample" videos ship without an audio track (or with audio
        // Chromium can't decode). Detect it and say so, instead of leaving
        // the user hunting for a mute button.
        let audioChecked = false;
        node.addEventListener('timeupdate', () => {
          if (audioChecked || node.currentTime < 0.7) return;
          audioChecked = true;
          const decoded = node.webkitAudioDecodedByteCount;
          if (decoded === 0) {
            const badge = el('span', 'a2-silent-badge');
            badge.innerHTML = `${iconSvg('notificationsOff')}<span>No audio track in this file</span>`;
            wrap.appendChild(badge);
          }
        });
        wrap.appendChild(node);
        return wrap;
      }
      case 'AudioPlayer': {
        const wrap = el('div', 'a2-audio');
        const desc = DS(comp.description);
        if (desc) {
          const label = el('div', 'a2-audio-desc');
          label.textContent = desc;
          wrap.appendChild(label);
        }
        const url = normalizeMediaUrl(DS(comp.url));
        const audio = el('audio');
        audio.src = url;
        audio.controls = true;
        audio.dataset.mkey = fkey(s, comp.id, scope);
        audio.addEventListener('error', () => {
          if (audio.parentElement) wrap.replaceChild(mediaFallback(url, 'This audio could not be loaded inside VS Code.'), audio);
        });
        wrap.appendChild(audio);
        return wrap;
      }
      case 'Row':
      case 'Column': {
        const isRow = comp.component === 'Row';
        const node = el('div', isRow ? 'a2-row' : 'a2-column');
        node.style.justifyContent = JUSTIFY[comp.justify] || 'flex-start';
        node.style.alignItems = ALIGN[comp.align] || (isRow ? 'center' : 'stretch');
        renderChildList(comp.children, s, scope, seen, node);
        return node;
      }
      case 'List': {
        const node = el('div', `a2-list a2-list-${comp.direction || 'vertical'}`);
        node.style.alignItems = ALIGN[comp.align] || 'stretch';
        renderChildList(comp.children, s, scope, seen, node);
        return node;
      }
      case 'Card': {
        const node = el('div', 'a2-card');
        if (comp.child) node.appendChild(renderComponent(comp.child, s, scope, seen));
        return node;
      }
      case 'Divider': {
        return el('div', `a2-divider a2-divider-${comp.axis || 'horizontal'}`);
      }
      case 'Tabs': {
        const node = el('div', 'a2-tabs');
        const bar = el('div', 'a2-tabbar');
        const key = fkey(s, comp.id, scope);
        const active = s.ui.tabs[key] || 0;
        (comp.tabs || []).forEach((tab, idx) => {
          const btn = el('button', 'a2-tab' + (idx === active ? ' active' : ''));
          btn.textContent = DS(tab.title);
          btn.addEventListener('click', () => {
            s.ui.tabs[key] = idx;
            scheduleRender();
          });
          attachRipple(btn);
          bar.appendChild(btn);
        });
        // Sliding MD3 indicator. The tree is rebuilt every render, so the
        // last metrics are memoized in s.ui and re-applied as the start
        // position; the rAF measures the new active tab and the CSS
        // transition slides the indicator across.
        const indicator = el('span', 'a2-tab-indicator');
        bar.appendChild(indicator);
        const memo = (s.ui.tabInd = s.ui.tabInd || {});
        const prev = memo[key];
        if (prev) {
          indicator.style.transform = `translateX(${prev.x}px)`;
          indicator.style.width = prev.w + 'px';
        } else {
          indicator.style.opacity = '0';
        }
        requestAnimationFrame(() => {
          if (!bar.isConnected) return;
          const btnEl = bar.querySelectorAll('.a2-tab')[active];
          if (!btnEl) return;
          const m = { x: btnEl.offsetLeft + 10, w: Math.max(btnEl.offsetWidth - 20, 16) };
          memo[key] = m;
          indicator.style.opacity = '1';
          indicator.style.transform = `translateX(${m.x}px)`;
          indicator.style.width = m.w + 'px';
        });
        node.appendChild(bar);
        const panel = el('div', 'a2-tabpanel');
        const activeTab = (comp.tabs || [])[active];
        if (activeTab && activeTab.child) panel.appendChild(renderComponent(activeTab.child, s, scope, seen));
        node.appendChild(panel);
        return node;
      }
      case 'Modal': {
        const node = el('div', 'a2-modal-host');
        const key = fkey(s, comp.id, scope);
        const trigger = el('div', 'a2-modal-trigger');
        if (comp.trigger) trigger.appendChild(renderComponent(comp.trigger, s, scope, seen));
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          s.ui.modals[key] = true;
          scheduleRender();
        }, true);
        node.appendChild(trigger);
        if (s.ui.modals[key]) {
          const overlay = el('div', 'a2-modal-overlay');
          const dialog = el('div', 'a2-modal-dialog');
          const closeBtn = el('button', 'a2-modal-close');
          closeBtn.innerHTML = iconSvg('close', 'a2-icon');
          closeBtn.addEventListener('click', () => {
            s.ui.modals[key] = false;
            scheduleRender();
          });
          attachRipple(closeBtn);
          dialog.appendChild(closeBtn);
          if (comp.content) dialog.appendChild(renderComponent(comp.content, s, scope, seen));
          overlay.appendChild(dialog);
          overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
              s.ui.modals[key] = false;
              scheduleRender();
            }
          });
          node.appendChild(overlay);
        }
        return node;
      }
      case 'Button': {
        const failures = evaluateChecks(comp, s, scope);
        const node = el('button', `a2-button a2-button-${comp.variant || 'default'}`);
        if (comp.child) node.appendChild(renderComponent(comp.child, s, scope, seen));
        else node.textContent = 'Button';
        if (failures.length > 0) {
          node.disabled = true;
          node.title = failures.join('\n');
        }
        node.addEventListener('click', () => handleAction(comp, s, scope));
        attachRipple(node);
        return node;
      }
      case 'TextField': {
        const key = fkey(s, comp.id, scope);
        const variant = comp.variant || 'shortText';
        const wrap = el('label', 'a2-field a2-field-outlined' + (variant === 'longText' ? ' a2-field-area' : ''));
        const bindPath = comp.value && comp.value.path ? absPath(comp.value.path, scope) : null;
        const current = comp.value !== undefined ? DS(comp.value) : '';
        let input;
        if (variant === 'longText') {
          input = el('textarea', 'a2-input a2-textarea');
          input.rows = 4;
          input.value = current;
        } else {
          input = el('input', 'a2-input');
          input.type = variant === 'number' ? 'number' : variant === 'obscured' ? 'password' : 'text';
          input.value = current;
        }
        input.dataset.fkey = key;
        if (input.value !== '') wrap.classList.add('has-value');
        input.addEventListener('input', () => {
          wrap.classList.toggle('has-value', input.value !== '');
          markTouched(s, key);
          if (bindPath) {
            const val = variant === 'number' ? (input.value === '' ? '' : Number(input.value)) : input.value;
            setPath(s.dataModel, bindPath, val);
            scheduleRender();
            renderDataTab();
          }
        });
        outlinedField(wrap, input, DS(comp.label));
        const failures = evaluateChecks(comp, s, scope);
        if (failures.length > 0 && s.ui.touched[key]) {
          const err = el('span', 'a2-field-error');
          err.textContent = failures[0];
          wrap.appendChild(err);
          input.classList.add('invalid');
          wrap.classList.add('has-error');
        }
        return wrap;
      }
      case 'CheckBox': {
        const key = fkey(s, comp.id, scope);
        const bindPath = comp.value && comp.value.path ? absPath(comp.value.path, scope) : null;
        const wrap = el('label', 'a2-checkbox');
        const input = el('input');
        input.type = 'checkbox';
        input.dataset.fkey = key;
        input.checked = !!D(comp.value);
        input.addEventListener('change', () => {
          markTouched(s, key);
          if (bindPath) {
            setPath(s.dataModel, bindPath, input.checked);
            scheduleRender();
            renderDataTab();
          }
        });
        const box = el('span', 'a2-checkbox-box');
        box.innerHTML = iconSvg('check', 'a2-icon');
        const label = el('span', 'a2-checkbox-label');
        label.textContent = DS(comp.label);
        wrap.appendChild(input);
        wrap.appendChild(box);
        wrap.appendChild(label);
        return wrap;
      }
      case 'ChoicePicker': {
        const key = fkey(s, comp.id, scope);
        const multi = comp.variant === 'multipleSelection';
        const bindPath = comp.value && comp.value.path ? absPath(comp.value.path, scope) : null;
        const wrap = el('div', 'a2-field');
        const labelText = DS(comp.label);
        if (labelText) {
          const label = el('span', 'a2-field-label');
          label.textContent = labelText;
          wrap.appendChild(label);
        }
        const group = el('div', multi ? 'a2-chips' : 'a2-chips a2-segmented');
        let current = bindPath ? getPath(s.dataModel, bindPath) : D(comp.value);
        const selected = Array.isArray(current) ? current.slice() : current !== undefined && current !== null && current !== '' ? [current] : [];
        for (const opt of comp.options || []) {
          const optValue = resolveDynamic(opt.value, s, scope);
          const chip = el('button', 'a2-chip' + (selected.includes(optValue) ? ' selected' : ''));
          chip.innerHTML = `${iconSvg('check', 'a2-chip-check')}<span>${escapeHtml(toDisplayString(resolveDynamic(opt.label, s, scope)))}</span>`;
          chip.addEventListener('click', () => {
            markTouched(s, key);
            let next;
            if (multi) {
              next = selected.includes(optValue) ? selected.filter((v) => v !== optValue) : [...selected, optValue];
            } else {
              next = [optValue];
            }
            if (bindPath) {
              setPath(s.dataModel, bindPath, next);
              scheduleRender();
              renderDataTab();
            }
          });
          group.appendChild(chip);
        }
        wrap.appendChild(group);
        return wrap;
      }
      case 'Slider': {
        const key = fkey(s, comp.id, scope);
        const bindPath = comp.value && comp.value.path ? absPath(comp.value.path, scope) : null;
        const wrap = el('div', 'a2-field');
        const min = comp.min ?? 0;
        const max = comp.max ?? 100;
        const raw = D(comp.value);
        const current = typeof raw === 'number' ? raw : Number(raw) || min;
        const header = el('div', 'a2-slider-header');
        const label = el('span', 'a2-field-label');
        label.textContent = DS(comp.label);
        const valueBadge = el('span', 'a2-slider-value');
        valueBadge.textContent = String(current);
        header.appendChild(label);
        header.appendChild(valueBadge);
        wrap.appendChild(header);
        const track = el('div', 'a2-slider-wrap');
        const input = el('input', 'a2-slider');
        input.type = 'range';
        input.min = String(min);
        input.max = String(max);
        input.value = String(current);
        input.dataset.fkey = key;
        const bubble = el('span', 'a2-slider-bubble');
        bubble.textContent = String(current);
        const pct = max > min ? ((current - min) / (max - min)) * 100 : 0;
        track.style.setProperty('--pct', pct + '%');
        input.addEventListener('input', () => {
          const p = max > min ? ((Number(input.value) - min) / (max - min)) * 100 : 0;
          track.style.setProperty('--pct', p + '%');
          bubble.textContent = input.value;
          valueBadge.textContent = input.value;
          markTouched(s, key);
          if (bindPath) {
            setPath(s.dataModel, bindPath, Number(input.value));
            scheduleRender();
            renderDataTab();
          }
        });
        track.appendChild(input);
        track.appendChild(bubble);
        wrap.appendChild(track);
        return wrap;
      }
      case 'DateTimeInput': {
        const key = fkey(s, comp.id, scope);
        const bindPath = comp.value && comp.value.path ? absPath(comp.value.path, scope) : null;
        const wrap = el('label', 'a2-field a2-field-outlined has-value');
        const input = el('input', 'a2-input');
        input.type = comp.enableDate && comp.enableTime ? 'datetime-local' : comp.enableTime ? 'time' : 'date';
        input.dataset.fkey = key;
        const v = DS(comp.value);
        if (v) input.value = input.type === 'date' ? v.slice(0, 10) : input.type === 'time' ? v.slice(11, 16) || v : v.slice(0, 16);
        input.addEventListener('input', () => {
          markTouched(s, key);
          if (bindPath) {
            setPath(s.dataModel, bindPath, input.value);
            scheduleRender();
            renderDataTab();
          }
        });
        outlinedField(wrap, input, comp.enableTime && !comp.enableDate ? 'Time' : comp.enableTime ? 'Date & time' : 'Date');
        return wrap;
      }
      default: {
        // Custom-catalog component: render a labeled placeholder with props.
        const node = el('div', 'a2-custom');
        const props = Object.entries(comp).filter(([k]) => !['id', 'component', 'weight'].includes(k));
        node.innerHTML =
          `<div class="a2-custom-head">${iconSvg('help')}<span>${escapeHtml(comp.component)}</span><em>custom component</em></div>` +
          (props.length
            ? `<div class="a2-custom-props">${props
                .map(([k, v]) => `<span class="a2-custom-key">${escapeHtml(k)}</span><span class="a2-custom-val">${escapeHtml(JSON.stringify(v))}</span>`)
                .join('')}</div>`
            : '');
        // Render structural children if the catalog uses standard shapes.
        if (comp.children) {
          const kids = el('div', 'a2-column');
          renderChildList(comp.children, s, scope, seen, kids);
          node.appendChild(kids);
        } else if (typeof comp.child === 'string') {
          node.appendChild(renderComponent(comp.child, s, scope, seen));
        }
        return node;
      }
    }
  }

  // =========================================================================
  // Actions
  // =========================================================================
  function resolveDeep(value, s, scope) {
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) return value.map((v) => resolveDeep(v, s, scope));
    if (typeof value === 'object') {
      if (typeof value.path === 'string' || typeof value.call === 'string') {
        return resolveDynamic(value, s, scope);
      }
      const out = {};
      for (const [k, v] of Object.entries(value)) out[k] = resolveDeep(v, s, scope);
      return out;
    }
    return value;
  }

  function handleAction(comp, s, scope) {
    const action = comp.action;
    if (!action) return;
    if (action.functionCall) {
      resolveDynamic(action.functionCall, s, scope);
      return;
    }
    if (action.event) {
      const payload = {
        name: action.event.name,
        surfaceId: s.id,
        sourceComponentId: comp.id,
        timestamp: new Date().toISOString(),
        context: resolveDeep(action.event.context || {}, s, scope),
        dataModel: s.sendDataModel !== false ? s.dataModel : undefined
      };
      logAction(payload);
      vscode.postMessage({ type: 'action', payload });
      setStatus('generating', `Action "${payload.name}" sent to the agent…`);
    }
  }


  // =========================================================================
  // App shell — sidebar, dashboard, chat, arena, gallery, settings, editor
  // =========================================================================
  const MODE = document.body.dataset.a2uiMode || 'studio';
  const persisted = vscode.getState() || {};
  const state = {
    provider: 'copilot',
    model: '',
    providers: [],
    models: [],
    modelsNote: '',
    modelsLoading: false,
    effective: null,
    settings: null,
    keys: {},
    savedPrompts: [],
    generating: false,
    rawText: '',
    streamEntries: [],
    actions: [],
    chat: [],
    activity: [],
    view: MODE === 'editor' ? 'playground' : 'dashboard',
    activeTab: 'stream',
    showRaw: false,
    inspect: false,
    inspected: null,
    dataEditing: null,
    replay: null,
    turnPending: false,
    turnEnvelopes: 0,
    turnInvalid: 0,
    startedAt: Date.now(),
    appearance: Object.assign(
      { accent: '#6C8EEF', accentB: '#B06CEF', surfaceWidth: 600, density: 'comfortable', motion: true },
      persisted.appearance || {}
    )
  };

  const arena = {
    a: { store: new Map(), msgs: 0, invalid: 0, ms: 0, state: 'idle', text: '' },
    b: { store: new Map(), msgs: 0, invalid: 0, ms: 0, state: 'idle', text: '' }
  };

  const VIEW_TITLES = {
    dashboard: 'Dashboard',
    playground: 'Playground',
    arena: 'Model arena',
    gallery: 'Example gallery',
    settings: 'Settings'
  };

  const NAV_ICONS = { dashboard: 'home', playground: 'play', arena: 'fastForward', gallery: 'photo', settings: 'settings' };
  const NAV_LABELS = { dashboard: 'Dashboard', playground: 'Playground', arena: 'Arena', gallery: 'Gallery', settings: 'Settings' };

  const ACCENT_PRESETS = [
    { name: 'Indigo', a: '#6C8EEF', b: '#B06CEF' },
    { name: 'Teal', a: '#22B8A0', b: '#3D9BE9' },
    { name: 'Sunset', a: '#EF8354', b: '#EE4266' },
    { name: 'Forest', a: '#4C9F70', b: '#95D5B2' },
    { name: 'Mono', a: '#8E9AAF', b: '#CBC0D3' }
  ];

  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="shell${MODE === 'editor' ? ' mode-editor' : ''}">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">${iconSvg('star', 'brand-icon')}</span>
        <span class="brand-text"><span class="brand-name">A2UI <em>Studio</em></span><span class="brand-sub">protocol v0.9.1</span></span>
      </div>
      <nav class="nav">
        ${['dashboard', 'playground', 'arena', 'gallery', 'settings'].map((v) => `
          <button class="nav-item${v === state.view ? ' active' : ''}" data-view="${v}">
            ${iconSvg(NAV_ICONS[v], 'nav-icon')}<span>${NAV_LABELS[v]}</span>
            ${v === 'playground' ? '<span class="nav-badge" id="nav-badge" hidden>0</span>' : ''}
          </button>`).join('')}
      </nav>
      <div class="sidebar-foot">
        <div class="mini-card" id="mini-provider"></div>
        <button class="link-btn" id="docs-link">${iconSvg('share', 'nav-icon')}<span>a2ui.org</span></button>
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        <h1 class="view-title" id="view-title">${VIEW_TITLES[state.view]}</h1>
        <div class="controls">
          <label class="control" id="profile-control" hidden><span>Profile</span><select id="profile-select"></select></label>
          <label class="control"><span>Provider</span><select id="provider-select"></select></label>
          <label class="control" id="model-control"><span>Model</span>
            <select id="model-select"></select>
            <input id="model-custom" type="text" spellcheck="false" placeholder="model id…" hidden>
          </label>
          <button id="apikey-btn" class="ghost-btn" title="Store an API key for this provider">${iconSvg('lock', 'btn-icon')}<span>API key</span></button>
          <button id="clear-btn" class="ghost-btn" title="Clear session, chat and surfaces">${iconSvg('refresh', 'btn-icon')}<span>Reset</span></button>
        </div>
      </header>
      <div class="content">

        <section class="view" id="view-dashboard" ${state.view === 'dashboard' ? '' : 'hidden'}>
          <div class="dash">
            <div class="dash-hero">
              <div class="dash-hero-text">
                <div class="hero-badge">Agent-driven interfaces, live in VS Code</div>
                <h2>Describe a UI. Watch an agent build it.</h2>
                <p>A2UI Studio streams <strong>A2UI v0.9.1</strong> protocol messages from your AI provider and renders them as interactive surfaces — bindings, validation and action round-trips included.</p>
                <div class="dash-hero-actions">
                  <button class="cta" id="dash-open-playground">${iconSvg('play', 'btn-icon')}<span>Open playground</span></button>
                  <button class="ghost-btn" id="dash-open-gallery">${iconSvg('photo', 'btn-icon')}<span>Browse examples</span></button>
                  <button class="ghost-btn" id="dash-open-arena">${iconSvg('fastForward', 'btn-icon')}<span>Model arena</span></button>
                </div>
              </div>
              <div class="dash-hero-art">${iconSvg('star', 'hero-art-icon')}</div>
            </div>
            <div class="stat-grid">
              <div class="stat-card"><span class="stat-icon s-a">${iconSvg('photo')}</span><div><div class="stat-value" id="stat-surfaces">0</div><div class="stat-label">Live surfaces</div></div></div>
              <div class="stat-card"><span class="stat-icon s-b">${iconSvg('mail')}</span><div><div class="stat-value" id="stat-messages">0</div><div class="stat-label">Protocol messages</div></div></div>
              <div class="stat-card"><span class="stat-icon s-c">${iconSvg('send')}</span><div><div class="stat-value" id="stat-actions">0</div><div class="stat-label">Actions round-tripped</div></div></div>
              <div class="stat-card"><span class="stat-icon s-d">${iconSvg('warning')}</span><div><div class="stat-value" id="stat-invalid">0</div><div class="stat-label">Invalid messages</div></div></div>
              <div class="stat-card"><span class="stat-icon s-e">${iconSvg('calendarToday')}</span><div><div class="stat-value" id="stat-uptime">0m</div><div class="stat-label">Session time</div></div></div>
            </div>
            <div class="dash-grid">
              <div class="dash-card">
                <h3>${iconSvg('menu', 'card-icon')} Message stream</h3>
                <div id="dash-breakdown" class="breakdown"></div>
              </div>
              <div class="dash-card">
                <h3>${iconSvg('settings', 'card-icon')} AI provider</h3>
                <div id="dash-provider" class="provider-info"></div>
              </div>
              <div class="dash-card">
                <h3>${iconSvg('notifications', 'card-icon')} Recent activity</h3>
                <div id="dash-activity" class="activity"></div>
              </div>
              <div class="dash-card">
                <h3>${iconSvg('play', 'card-icon')} Quick start</h3>
                <div id="dash-quick" class="quickstart"></div>
              </div>
            </div>
          </div>
        </section>

        <section class="view" id="view-playground" ${state.view === 'playground' ? '' : 'hidden'}>
          <div class="playground">
            <div class="chat-pane">
              <div class="chat-log" id="chat-log"></div>
              <div class="chips-row" id="chips-row"></div>
              <div class="composer-input">
                <textarea id="prompt-input" rows="1" placeholder="Describe any UI… e.g. “a coffee order form with size, milk options and a pay button”"></textarea>
                <button id="bookmark-btn" class="icon-btn" title="Save this prompt to your library">${iconSvg('star')}</button>
                <button id="send-btn" class="send-btn" title="Generate (Enter)">${iconSvg('send')}</button>
              </div>
              <div class="status-row"><span class="status-dot idle" id="status-dot"></span><span id="status-text">Ready.</span></div>
            </div>
            <div class="canvas-wrap">
              <div class="replay-bar" id="replay-bar" hidden>
                <button class="icon-btn" id="replay-play" title="Play / pause">${iconSvg('play')}</button>
                <button class="icon-btn" id="replay-back" title="Step back">${iconSvg('rewind')}</button>
                <button class="icon-btn" id="replay-fwd" title="Step forward">${iconSvg('fastForward')}</button>
                <input type="range" id="replay-slider" class="a2-slider" min="0" max="0" value="0">
                <span class="replay-count" id="replay-count">0 / 0</span>
                <button class="icon-btn" id="replay-exit" title="Exit replay">${iconSvg('close')}</button>
              </div>
              <div class="canvas" id="canvas">
                <button class="inspect-toggle" id="inspect-toggle" title="Inspect components — click any rendered component to see its definition">${iconSvg('search')}<span>Inspect</span></button>
                <div class="canvas-empty" id="canvas-empty">
                  <div class="canvas-empty-icon">${iconSvg('photo')}</div>
                  <h3>No surfaces yet</h3>
                  <p>Generated A2UI surfaces render here. Ask for a UI in the chat, or play an instant demo from the gallery.</p>
                </div>
                <div class="surfaces" id="surfaces"></div>
              </div>
            </div>
            <aside class="inspector">
              <nav class="inspector-tabs">
                <button data-tab="stream" class="active">Stream</button>
                <button data-tab="data">Data</button>
                <button data-tab="actions">Actions</button>
                <button data-tab="inspect">Inspect</button>
              </nav>
              <div class="inspector-body">
                <div class="inspector-panel" id="panel-stream">
                  <div class="panel-toolbar">
                    <span class="muted" id="stream-count">0 messages</span>
                    <span class="toolbar-actions">
                      <button class="ghost-btn tiny" id="replay-btn" title="Replay this session message by message">Replay</button>
                      <button class="ghost-btn tiny" id="export-btn" title="Export the valid message stream as .a2ui.jsonl">Export</button>
                      <button class="ghost-btn tiny" id="raw-toggle">Raw</button>
                    </span>
                  </div>
                  <div id="stream-list" class="stream-list"></div>
                  <pre id="raw-console" class="raw-console" hidden></pre>
                </div>
                <div class="inspector-panel" id="panel-data" hidden></div>
                <div class="inspector-panel" id="panel-actions" hidden></div>
                <div class="inspector-panel" id="panel-inspect" hidden></div>
              </div>
            </aside>
          </div>
        </section>

        <section class="view" id="view-arena" ${state.view === 'arena' ? '' : 'hidden'}>
          <div class="arena">
            <div class="arena-head">
              <div class="arena-intro">
                <h2>Same prompt. Two models. One winner.</h2>
                <p>Run a prompt against two providers side by side and compare the surfaces they produce.</p>
              </div>
              <div class="arena-composer">
                <textarea id="arena-prompt" rows="2" placeholder="e.g. “an airline seat picker with a legend and confirm button”"></textarea>
                <button class="cta" id="arena-run">${iconSvg('fastForward', 'btn-icon')}<span>Run both</span></button>
              </div>
            </div>
            <div class="arena-grid">
              ${['a', 'b'].map((side) => `
                <div class="arena-side" id="arena-side-${side}">
                  <div class="arena-side-head">
                    <span class="arena-tag arena-tag-${side}">${side.toUpperCase()}</span>
                    <select id="arena-${side}-provider" class="arena-select"></select>
                    <input id="arena-${side}-model" class="arena-model" type="text" spellcheck="false" placeholder="auto model">
                    <span class="arena-stats" id="arena-${side}-stats"></span>
                  </div>
                  <div class="arena-status" id="arena-${side}-status">Waiting for a prompt…</div>
                  <div class="arena-canvas" id="arena-${side}-canvas"></div>
                </div>`).join('')}
            </div>
          </div>
        </section>

        <section class="view" id="view-gallery" ${state.view === 'gallery' ? '' : 'hidden'}>
          <div class="gallery-page">
            <div class="hero">
              <div class="hero-badge">Curated experiments</div>
              <h2>Pick an example to run</h2>
              <p>Instant demos render locally with zero setup. The rest are prompts sent to your AI provider — then everything stays interactive.</p>
            </div>
            <div class="gallery" id="gallery"></div>
            <div class="library-head" id="library-head" hidden><h3>${iconSvg('star', 'card-icon')} Your prompt library</h3></div>
            <div class="gallery" id="library"></div>
          </div>
        </section>

        <section class="view" id="view-settings" ${state.view === 'settings' ? '' : 'hidden'}>
          <div class="settings-page" id="settings-page"></div>
        </section>

      </div>
    </div>
  </div>`;

  const $ = (sel) => app.querySelector(sel);
  const surfacesHost = $('#surfaces');
  const promptInput = $('#prompt-input');
  const sendBtn = $('#send-btn');

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ---------------- Appearance ----------------
  function applyAppearance() {
    const a = state.appearance;
    const root = document.documentElement;
    root.style.setProperty('--accent-a', a.accent);
    root.style.setProperty('--accent-b', a.accentB);
    root.style.setProperty('--surface-w', a.surfaceWidth + 'px');
    document.body.classList.toggle('density-compact', a.density === 'compact');
    document.body.classList.toggle('no-motion', !a.motion);
    vscode.setState(Object.assign({}, vscode.getState() || {}, { appearance: a }));
  }
  applyAppearance();

  // ---------------- View switching ----------------
  function setView(view) {
    if (!VIEW_TITLES[view] || (MODE === 'editor' && view !== 'playground')) return;
    state.view = view;
    $('#view-title').textContent = VIEW_TITLES[view];
    app.querySelectorAll('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
    app.querySelectorAll('.view').forEach((v) => (v.hidden = v.id !== 'view-' + view));
    if (view === 'dashboard') updateDashboard();
    if (view === 'settings') renderSettings();
    if (view === 'playground' && MODE !== 'editor') promptInput.focus();
  }
  app.querySelectorAll('.nav-item').forEach((btn) =>
    btn.addEventListener('click', () => setView(btn.dataset.view))
  );
  $('#dash-open-playground').addEventListener('click', () => setView('playground'));
  $('#dash-open-gallery').addEventListener('click', () => setView('gallery'));
  $('#dash-open-arena').addEventListener('click', () => setView('arena'));
  $('#docs-link').addEventListener('click', () => vscode.postMessage({ type: 'openExternal', url: 'https://a2ui.org' }));

  // ---------------- Provider / profile / model controls ----------------
  $('#profile-select').addEventListener('change', (e) => {
    vscode.postMessage({ type: 'setActiveProfile', name: e.target.value });
  });

  $('#provider-select').addEventListener('change', (e) => {
    state.provider = e.target.value;
    state.model = '';
    state.models = [];
    state.modelsLoading = true;
    vscode.postMessage({ type: 'setProvider', provider: state.provider });
    vscode.postMessage({ type: 'setModel', model: '' });
    vscode.postMessage({ type: 'listModels', provider: state.provider });
    syncProviderUi();
  });

  const modelSelect = $('#model-select');
  const modelCustom = $('#model-custom');

  modelSelect.addEventListener('change', () => {
    if (modelSelect.value === '__custom') {
      modelSelect.hidden = true;
      modelCustom.hidden = false;
      modelCustom.value = state.model;
      modelCustom.focus();
      return;
    }
    state.model = modelSelect.value;
    vscode.postMessage({ type: 'setModel', model: state.model });
    syncProviderUi();
  });

  function commitCustomModel() {
    modelCustom.hidden = true;
    modelSelect.hidden = false;
    const v = modelCustom.value.trim();
    if (v) {
      state.model = v;
      vscode.postMessage({ type: 'setModel', model: v });
    }
    populateModelSelect();
    syncProviderUi();
  }
  modelCustom.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commitCustomModel();
    if (e.key === 'Escape') { modelCustom.hidden = true; modelSelect.hidden = false; }
  });
  modelCustom.addEventListener('blur', commitCustomModel);

  function populateModelSelect() {
    const info = state.providers.find((p) => p.id === state.provider);
    modelSelect.innerHTML = '';
    const auto = document.createElement('option');
    auto.value = '';
    auto.textContent = state.modelsLoading
      ? 'Loading models…'
      : 'Auto' + (info && info.defaultModel ? ` (${info.defaultModel})` : state.provider === 'copilot' ? ' (best available)' : '');
    modelSelect.appendChild(auto);
    let matched = state.model === '';
    for (const m of state.models) {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.label;
      if (m.id === state.model) { opt.selected = true; matched = true; }
      modelSelect.appendChild(opt);
    }
    if (!matched && state.model) {
      const opt = document.createElement('option');
      opt.value = state.model;
      opt.textContent = `${state.model} (custom)`;
      opt.selected = true;
      modelSelect.appendChild(opt);
    }
    const custom = document.createElement('option');
    custom.value = '__custom';
    custom.textContent = 'Custom model id…';
    modelSelect.appendChild(custom);
  }

  $('#apikey-btn').addEventListener('click', () => vscode.postMessage({ type: 'setApiKey' }));
  $('#clear-btn').addEventListener('click', () => {
    exitReplay();
    surfaces.clear();
    state.streamEntries = [];
    state.rawText = '';
    state.actions = [];
    state.chat = [];
    state.activity = [];
    state.inspected = null;
    renderChat();
    renderStreamTab();
    renderDataTab();
    renderActionsTab();
    renderInspectTab();
    scheduleRender();
    updateDashboard();
    vscode.postMessage({ type: 'clear' });
    logActivity('refresh', 'Session cleared');
  });

  function syncProviderUi() {
    const eff = state.effective;
    const profiles = eff ? eff.profiles : [];
    const usingProfile = !!(eff && eff.activeProfile);

    const profileControl = $('#profile-control');
    const profileSelect = $('#profile-select');
    profileControl.hidden = profiles.length === 0;
    profileSelect.innerHTML = '';
    const manual = document.createElement('option');
    manual.value = '';
    manual.textContent = 'Manual (settings)';
    profileSelect.appendChild(manual);
    for (const p of profiles) {
      const opt = document.createElement('option');
      opt.value = p.name;
      opt.textContent = p.name;
      if (eff && eff.activeProfile === p.name) opt.selected = true;
      profileSelect.appendChild(opt);
    }

    const sel = $('#provider-select');
    sel.innerHTML = '';
    for (const p of state.providers) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.label;
      if (p.id === state.provider) opt.selected = true;
      sel.appendChild(opt);
    }
    sel.disabled = usingProfile;
    sel.title = usingProfile ? 'Managed by the active profile in a2ui.config.json' : '';
    modelSelect.disabled = usingProfile;
    modelSelect.title = sel.title;

    populateModelSelect();
    syncArenaSelects();
    const needsKey = ['anthropic', 'openai', 'gemini'].includes(state.provider);
    $('#apikey-btn').style.display = needsKey ? '' : 'none';
    const info = state.providers.find((p) => p.id === state.provider);
    $('#mini-provider').innerHTML = `
      <span class="mini-dot"></span>
      <span class="mini-text"><strong>${escapeHtml(usingProfile ? eff.activeProfile : info ? info.label : state.provider)}</strong>
      <em>${escapeHtml(usingProfile ? (info ? info.label : state.provider) : state.model || 'auto model')}</em></span>`;
    updateDashboard();
    if (state.view === 'settings') renderSettings();
  }

  // ---------------- Chat ----------------
  function pushChat(role, text, meta) {
    state.chat.push({ role, text, meta: meta || null, ts: Date.now() });
    renderChat();
  }

  function renderChat() {
    const log = $('#chat-log');
    log.innerHTML = '';
    if (state.chat.length === 0 && !state.generating) {
      log.innerHTML = `<div class="chat-empty">
        <div class="chat-empty-icon">${iconSvg('send')}</div>
        <p><strong>This is your agent chat.</strong><br>Describe a UI below, or try an example. The agent replies with live A2UI surfaces, not text.</p>
      </div>`;
      return;
    }
    for (const entry of state.chat.slice(-60)) {
      const bubble = el('div', `chat-bubble chat-${entry.role}`);
      if (entry.role === 'user') {
        bubble.textContent = entry.text;
      } else if (entry.role === 'event') {
        bubble.innerHTML = `${iconSvg('send', 'chat-ev-icon')}<span>${escapeHtml(entry.text)}</span>`;
      } else {
        const meta = entry.meta
          ? `<span class="chat-meta">${entry.meta.envelopes} message${entry.meta.envelopes === 1 ? '' : 's'}${entry.meta.invalid ? ` · ${entry.meta.invalid} invalid` : ''}</span>`
          : '';
        bubble.innerHTML = `<span>${escapeHtml(entry.text)}</span>${meta}`;
        if (entry.error) bubble.classList.add('chat-error');
      }
      log.appendChild(bubble);
    }
    if (state.generating) {
      const typing = el('div', 'chat-bubble chat-agent chat-typing');
      typing.innerHTML = '<span class="tdot"></span><span class="tdot"></span><span class="tdot"></span>';
      log.appendChild(typing);
    }
    log.scrollTop = log.scrollHeight;
  }

  // ---------------- Composer ----------------
  function autoGrow() {
    promptInput.style.height = 'auto';
    promptInput.style.height = Math.min(promptInput.scrollHeight, 140) + 'px';
  }
  promptInput.addEventListener('input', autoGrow);
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitPrompt();
    }
  });
  sendBtn.addEventListener('click', () => {
    if (state.generating) vscode.postMessage({ type: 'stop' });
    else submitPrompt();
  });
  $('#bookmark-btn').addEventListener('click', () => {
    const text = promptInput.value.trim() || [...state.chat].reverse().find((c) => c.role === 'user')?.text || '';
    if (!text) return;
    vscode.postMessage({ type: 'savePrompt', text });
    logActivity('star', 'Prompt saved to your library');
  });

  function beginTurn() {
    state.turnPending = true;
    state.turnEnvelopes = 0;
    state.turnInvalid = 0;
  }

  function submitPrompt(text) {
    const value = (text !== undefined ? text : promptInput.value).trim();
    if (!value || state.generating) return;
    if (text === undefined) {
      promptInput.value = '';
      autoGrow();
    }
    exitReplay();
    beginTurn();
    pushChat('user', value);
    vscode.postMessage({ type: 'prompt', text: value });
    setStatus('generating', 'Sending prompt…');
  }

  function setStatus(stateName, text) {
    const wasGenerating = state.generating;
    state.generating = stateName === 'generating';
    $('#status-dot').className = 'status-dot ' + stateName;
    $('#status-text').textContent = text || '';
    sendBtn.innerHTML = state.generating ? iconSvg('stop') : iconSvg('send');
    sendBtn.classList.toggle('stop', state.generating);
    if (wasGenerating !== state.generating) renderChat();
  }

  // ---------------- Examples & prompt library ----------------
  const EXAMPLES = window.A2UI_EXAMPLES || [];

  function runExample(ex) {
    setView('playground');
    if (ex.demo) {
      setStatus('generating', `Playing instant demo “${ex.title}”…`);
      logActivity('play', `Instant demo: ${ex.title}`);
      ex.demo.forEach((env, idx) => {
        setTimeout(() => {
          logEnvelope(env, true);
          processEnvelope(env);
          if (idx === ex.demo.length - 1) {
            setStatus('idle', 'Demo rendered locally. Interact with it — actions go to your AI provider.');
            pushChat('agent', `Rendered the “${ex.title}” demo locally.`, { envelopes: ex.demo.length, invalid: 0 });
          }
        }, 240 * idx + 60);
      });
    } else if (ex.prompt) {
      submitPrompt(ex.prompt);
    }
  }

  function galleryCard(ex, onDelete) {
    const card = el('button', 'gallery-card');
    card.innerHTML = `
      <span class="gallery-icon">${iconSvg(ex.icon || 'star')}</span>
      <span class="gallery-title">${escapeHtml(ex.title)}${ex.badge ? ` <span class="badge">${escapeHtml(ex.badge)}</span>` : ''}</span>
      <span class="gallery-desc">${escapeHtml(ex.desc || '')}</span>`;
    card.addEventListener('click', () => runExample(ex));
    if (onDelete) {
      const del = el('span', 'gallery-del');
      del.innerHTML = iconSvg('delete');
      del.title = 'Remove from library';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        onDelete();
      });
      card.appendChild(del);
    }
    return card;
  }

  function renderGallery() {
    const gallery = $('#gallery');
    gallery.innerHTML = '';
    for (const ex of EXAMPLES) gallery.appendChild(galleryCard(ex));

    const library = $('#library');
    library.innerHTML = '';
    $('#library-head').hidden = state.savedPrompts.length === 0;
    for (const p of state.savedPrompts) {
      const ex = { icon: 'star', title: p.text.slice(0, 42) + (p.text.length > 42 ? '…' : ''), desc: p.text.slice(0, 120), prompt: p.text, badge: 'Saved' };
      library.appendChild(galleryCard(ex, () => vscode.postMessage({ type: 'deletePrompt', id: p.id })));
    }

    const chips = $('#chips-row');
    chips.innerHTML = '<span class="chips-label">Try:</span>';
    const chipify = (ex) => {
      const chip = el('button', 'prompt-chip');
      chip.innerHTML = `${iconSvg(ex.icon || 'star')}<span>${escapeHtml(ex.title)}</span>`;
      chip.title = ex.desc || ex.prompt || '';
      chip.addEventListener('click', () => runExample(ex));
      chips.appendChild(chip);
    };
    EXAMPLES.slice(0, 5).forEach(chipify);
    state.savedPrompts.slice(0, 4).forEach((p) =>
      chipify({ icon: 'star', title: p.text.slice(0, 26) + (p.text.length > 26 ? '…' : ''), prompt: p.text, desc: p.text })
    );

    const quick = $('#dash-quick');
    quick.innerHTML = '';
    for (const ex of EXAMPLES.filter((e) => e.demo)) {
      const btn = el('button', 'quick-item');
      btn.innerHTML = `${iconSvg(ex.icon)}<span class="quick-text"><strong>${ex.title}</strong><em>${ex.desc}</em></span><span class="quick-go">${iconSvg('arrowForward')}</span>`;
      btn.addEventListener('click', () => runExample(ex));
      quick.appendChild(btn);
    }
    const more = el('button', 'quick-item quick-more');
    more.innerHTML = `${iconSvg('photo')}<span class="quick-text"><strong>Browse all examples</strong><em>${EXAMPLES.length} prompts and demos in the gallery</em></span><span class="quick-go">${iconSvg('arrowForward')}</span>`;
    more.addEventListener('click', () => setView('gallery'));
    quick.appendChild(more);
  }

  // ---------------- Model arena ----------------
  function syncArenaSelects() {
    for (const side of ['a', 'b']) {
      const sel = $(`#arena-${side}-provider`);
      if (!sel) continue;
      const current = sel.value;
      sel.innerHTML = '';
      for (const p of state.providers) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.label;
        sel.appendChild(opt);
      }
      if (current && state.providers.some((p) => p.id === current)) {
        sel.value = current;
      } else {
        sel.value = side === 'a' ? state.provider : (state.providers.find((p) => p.id !== state.provider) || state.providers[0] || {}).id || state.provider;
      }
    }
  }

  $('#arena-run').addEventListener('click', runArena);
  $('#arena-prompt').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      runArena();
    }
  });

  function runArena() {
    const prompt = $('#arena-prompt').value.trim();
    if (!prompt) return;
    for (const side of ['a', 'b']) {
      const rec = arena[side];
      rec.store.clear();
      rec.msgs = 0;
      rec.invalid = 0;
      rec.ms = 0;
      rec.state = 'generating';
      rec.text = 'Starting…';
    }
    renderArena();
    vscode.postMessage({
      type: 'arena',
      prompt,
      sides: {
        a: { provider: $('#arena-a-provider').value, model: $('#arena-a-model').value.trim() },
        b: { provider: $('#arena-b-provider').value, model: $('#arena-b-model').value.trim() }
      }
    });
    logActivity('fastForward', 'Arena run started');
  }

  function renderArena() {
    for (const side of ['a', 'b']) {
      const rec = arena[side];
      const stats = $(`#arena-${side}-stats`);
      stats.innerHTML = rec.msgs || rec.invalid || rec.ms
        ? `<span class="arena-stat">${rec.msgs} msgs</span>${rec.invalid ? `<span class="arena-stat bad">${rec.invalid} invalid</span>` : ''}${rec.ms ? `<span class="arena-stat">${(rec.ms / 1000).toFixed(1)}s</span>` : ''}`
        : '';
      const status = $(`#arena-${side}-status`);
      status.textContent = rec.text || '';
      status.className = 'arena-status ' + rec.state;
      const canvas = $(`#arena-${side}-canvas`);
      canvas.innerHTML = '';
      if (rec.store.size === 0) {
        canvas.innerHTML = `<div class="arena-empty">${rec.state === 'generating' ? '<div class="a2-placeholder"></div><div class="a2-placeholder short"></div>' : 'Surfaces will render here.'}</div>`;
        continue;
      }
      for (const s of rec.store.values()) {
        canvas.appendChild(buildSurfaceFrame(s, { closable: false, exportable: false }));
      }
    }
  }

  let arenaRenderQueued = false;
  function scheduleArenaRender() {
    if (arenaRenderQueued) return;
    arenaRenderQueued = true;
    requestAnimationFrame(() => {
      arenaRenderQueued = false;
      renderArena();
    });
  }

  // ---------------- Settings view ----------------
  function settingRow(label, hint, controlHtml) {
    return `<div class="set-row">
      <div class="set-info"><div class="set-label">${label}</div>${hint ? `<div class="set-hint">${hint}</div>` : ''}</div>
      <div class="set-control">${controlHtml}</div>
    </div>`;
  }

  function renderSettings() {
    const page = $('#settings-page');
    const eff = state.effective;
    const settings = state.settings;
    if (!eff || !settings) {
      page.innerHTML = '<div class="empty-mini">Loading configuration…</div>';
      return;
    }
    const usingProfile = !!eff.activeProfile;
    const overrideNote = usingProfile
      ? `<div class="set-banner">${iconSvg('info', 'btn-icon')}<span>Profile <strong>${escapeHtml(eff.activeProfile)}</strong> from <code>a2ui.config.json</code> currently controls provider, model and generation parameters. Switch to <em>Manual</em> in the header to use the values below.</span></div>`
      : '';

    page.innerHTML = `
      <div class="set-section">
        <h2>${iconSvg('folder', 'card-icon')} Workspace profiles <span class="set-tag">a2ui.config.json — shared with your team</span></h2>
        ${eff.configError ? `<div class="set-banner set-error">${iconSvg('warning', 'btn-icon')}<span>${escapeHtml(eff.configError)}</span></div>` : ''}
        ${eff.catalog ? `<div class="set-banner">${iconSvg('check', 'btn-icon')}<span>Custom catalog <strong>${escapeHtml(eff.catalog.id)}</strong> active — ${eff.catalog.componentNames.length} components. The agent is instructed to use it; unknown components render as labeled placeholders.</span></div>` : ''}
        <div class="profile-grid" id="profile-grid"></div>
        <div class="set-actions">
          <button class="ghost-btn" id="set-open-config">${iconSvg('edit', 'btn-icon')}<span>${eff.configPath ? 'Open config file' : 'Create a2ui.config.json'}</span></button>
          ${eff.configPath ? `<span class="set-hint mono">${escapeHtml(eff.configPath)}</span>` : '<span class="set-hint">Commit the config file to share provider profiles, gateways, catalogs and prompt rules across your team.</span>'}
        </div>
      </div>

      <div class="set-section">
        <h2>${iconSvg('settings', 'card-icon')} Generation <span class="set-tag">VS Code settings</span></h2>
        ${overrideNote}
        ${settingRow('Temperature', 'Higher values produce more varied UIs.',
          `<div class="range-wrap"><input type="range" id="set-temp" class="a2-slider" min="0" max="2" step="0.1" value="${settings.temperature}"><span class="range-val" id="set-temp-val">${settings.temperature}</span></div>`)}
        ${settingRow('Max output tokens', 'Upper bound per generation turn.',
          `<input type="number" id="set-maxtok" class="set-input" min="256" max="128000" step="256" value="${settings.maxTokens}">`)}
        ${settingRow('Auto-repair', 'Send one corrective turn when messages fail validation.',
          `<label class="switch"><input type="checkbox" id="set-repair" ${eff.autoRepair ? 'checked' : ''}><span class="switch-track"></span></label>`)}
        ${settingRow('System prompt additions', 'Brand voice, design rules, preferred colors — appended to the A2UI system prompt.',
          `<textarea id="set-prompt" class="set-input set-textarea" rows="4" placeholder="e.g. Always use #0F62FE as primaryColor and a formal tone.">${escapeHtml(settings.systemPromptAppend || '')}</textarea>`)}
      </div>

      <div class="set-section">
        <h2>${iconSvg('lock', 'card-icon')} Connections</h2>
        <div class="key-grid" id="key-grid"></div>
        ${settingRow('Ollama URL', 'Local or remote Ollama server.',
          `<input type="text" id="set-ollama" class="set-input mono" value="${escapeHtml(settings.ollamaUrl)}" spellcheck="false">`)}
        ${settingRow('A2A agent endpoint', 'Experimental: URL of a remote A2UI-capable A2A agent (JSON-RPC message/stream).',
          `<input type="text" id="set-a2a" class="set-input mono" value="${escapeHtml(settings.a2aEndpoint || '')}" spellcheck="false" placeholder="https://agent.example.com/a2a">`)}
        ${settingRow('Claude gateway URL', 'Optional Anthropic-compatible proxy (AWS/LiteLLM gateway). Models are fetched from it; the vendor API key becomes optional.',
          `<input type="text" id="set-gw-anthropic" class="set-input mono" value="${escapeHtml((settings.baseUrls || {}).anthropic || '')}" spellcheck="false" placeholder="https://llm-gateway.corp/anthropic">`)}
        ${settingRow('OpenAI gateway URL', 'Optional OpenAI-compatible proxy base URL.',
          `<input type="text" id="set-gw-openai" class="set-input mono" value="${escapeHtml((settings.baseUrls || {}).openai || '')}" spellcheck="false" placeholder="https://llm-gateway.corp/openai">`)}
        ${settingRow('Gemini gateway URL', 'Optional Gemini-compatible proxy base URL.',
          `<input type="text" id="set-gw-gemini" class="set-input mono" value="${escapeHtml((settings.baseUrls || {}).gemini || '')}" spellcheck="false" placeholder="https://llm-gateway.corp/gemini">`)}
      </div>

      <div class="set-section">
        <h2>${iconSvg('photo', 'card-icon')} Appearance <span class="set-tag">stored per workspace</span></h2>
        ${settingRow('Accent theme', 'Used for the studio chrome and default surfaces.', `<div class="accent-row" id="accent-row"></div>`)}
        ${settingRow('Surface width', 'Maximum width of rendered surfaces.',
          `<div class="range-wrap"><input type="range" id="set-width" class="a2-slider" min="420" max="900" step="20" value="${state.appearance.surfaceWidth}"><span class="range-val" id="set-width-val">${state.appearance.surfaceWidth}px</span></div>`)}
        ${settingRow('Density', 'Compact reduces paddings across the studio.',
          `<div class="a2-chips"><button class="a2-chip ${state.appearance.density !== 'compact' ? 'selected' : ''}" data-density="comfortable">Comfortable</button><button class="a2-chip ${state.appearance.density === 'compact' ? 'selected' : ''}" data-density="compact">Compact</button></div>`)}
        ${settingRow('Animations', 'Disable for reduced motion.',
          `<label class="switch"><input type="checkbox" id="set-motion" ${state.appearance.motion ? 'checked' : ''}><span class="switch-track"></span></label>`)}
      </div>

      <div class="set-section">
        <h2>${iconSvg('download', 'card-icon')} Session &amp; data</h2>
        ${settingRow('Export session', 'Save the valid A2UI message stream as a replayable .a2ui.jsonl file.',
          `<button class="ghost-btn" id="set-export">${iconSvg('download', 'btn-icon')}<span>Export stream</span></button>`)}
        ${settingRow('Reset session', 'Clears chat history, surfaces and logs.',
          `<button class="ghost-btn danger" id="set-clear">${iconSvg('delete', 'btn-icon')}<span>Reset session</span></button>`)}
      </div>`;

    const grid = page.querySelector('#profile-grid');
    if (eff.profiles.length === 0) {
      grid.innerHTML = `<div class="empty-mini">No profiles yet. Create <code>a2ui.config.json</code> to define named provider presets — e.g. <em>copilot</em>, <em>claude</em>, <em>local</em> — that your whole team can use.</div>`;
    } else {
      const manualCard = el('button', 'profile-card' + (usingProfile ? '' : ' active'));
      manualCard.innerHTML = `<span class="profile-name">Manual</span><span class="profile-desc">Use the provider &amp; model from VS Code settings</span><span class="profile-meta">${escapeHtml(settings.provider)}${settings.model ? ' · ' + escapeHtml(settings.model) : ''}</span>`;
      manualCard.addEventListener('click', () => vscode.postMessage({ type: 'setActiveProfile', name: '' }));
      grid.appendChild(manualCard);
      for (const p of eff.profiles) {
        const card = el('button', 'profile-card' + (eff.activeProfile === p.name ? ' active' : ''));
        card.innerHTML = `<span class="profile-name">${escapeHtml(p.name)}</span>
          <span class="profile-desc">${escapeHtml(p.description || '')}</span>
          <span class="profile-meta">${escapeHtml(p.provider)}${p.model ? ' · ' + escapeHtml(p.model) : ''}${p.baseUrl ? ' · gateway' : ''}${typeof p.temperature === 'number' ? ` · t=${p.temperature}` : ''}</span>`;
        card.addEventListener('click', () => vscode.postMessage({ type: 'setActiveProfile', name: p.name }));
        grid.appendChild(card);
      }
    }
    page.querySelector('#set-open-config').addEventListener('click', () =>
      vscode.postMessage({ type: eff.configPath ? 'openConfigFile' : 'createConfigFile' })
    );

    const temp = page.querySelector('#set-temp');
    temp.addEventListener('input', () => (page.querySelector('#set-temp-val').textContent = temp.value));
    temp.addEventListener('change', () => vscode.postMessage({ type: 'setSetting', key: 'temperature', value: Number(temp.value) }));
    page.querySelector('#set-maxtok').addEventListener('change', (e) =>
      vscode.postMessage({ type: 'setSetting', key: 'maxTokens', value: Number(e.target.value) || 8192 })
    );
    page.querySelector('#set-repair').addEventListener('change', (e) =>
      vscode.postMessage({ type: 'setSetting', key: 'autoRepair', value: e.target.checked })
    );
    page.querySelector('#set-prompt').addEventListener('change', (e) =>
      vscode.postMessage({ type: 'setSetting', key: 'systemPromptAppend', value: e.target.value })
    );

    const keyGrid = page.querySelector('#key-grid');
    for (const p of state.providers) {
      if (!['anthropic', 'openai', 'gemini'].includes(p.id)) continue;
      const hasKey = !!state.keys[p.id];
      const row = el('div', 'key-row');
      row.innerHTML = `<span class="key-dot ${hasKey ? 'ok' : ''}"></span>
        <span class="key-name">${escapeHtml(p.label)}</span>
        <span class="key-state">${hasKey ? 'Key stored in VS Code secrets' : 'No API key set'}</span>`;
      const btn = el('button', 'ghost-btn tiny');
      btn.textContent = hasKey ? 'Update key' : 'Set key';
      btn.addEventListener('click', () => vscode.postMessage({ type: 'setApiKey' }));
      row.appendChild(btn);
      keyGrid.appendChild(row);
    }
    page.querySelector('#set-ollama').addEventListener('change', (e) =>
      vscode.postMessage({ type: 'setSetting', key: 'ollamaUrl', value: e.target.value.trim() })
    );
    page.querySelector('#set-a2a').addEventListener('change', (e) =>
      vscode.postMessage({ type: 'setSetting', key: 'a2aEndpoint', value: e.target.value.trim() })
    );
    const wireGateway = (sel, providerKey) =>
      page.querySelector(sel).addEventListener('change', (e) => {
        const next = Object.assign({}, settings.baseUrls || {});
        const v = e.target.value.trim();
        if (v) next[providerKey] = v;
        else delete next[providerKey];
        vscode.postMessage({ type: 'setSetting', key: 'baseUrls', value: next });
      });
    wireGateway('#set-gw-anthropic', 'anthropic');
    wireGateway('#set-gw-openai', 'openai');
    wireGateway('#set-gw-gemini', 'gemini');

    const accentRow = page.querySelector('#accent-row');
    for (const preset of ACCENT_PRESETS) {
      const dotBtn = el('button', 'accent-dot' + (state.appearance.accent === preset.a ? ' active' : ''));
      dotBtn.title = preset.name;
      dotBtn.style.background = `linear-gradient(135deg, ${preset.a}, ${preset.b})`;
      dotBtn.addEventListener('click', () => {
        state.appearance.accent = preset.a;
        state.appearance.accentB = preset.b;
        applyAppearance();
        renderSettings();
      });
      accentRow.appendChild(dotBtn);
    }
    const width = page.querySelector('#set-width');
    width.addEventListener('input', () => {
      state.appearance.surfaceWidth = Number(width.value);
      page.querySelector('#set-width-val').textContent = width.value + 'px';
      applyAppearance();
    });
    page.querySelectorAll('[data-density]').forEach((chip) =>
      chip.addEventListener('click', () => {
        state.appearance.density = chip.dataset.density;
        applyAppearance();
        renderSettings();
      })
    );
    page.querySelector('#set-motion').addEventListener('change', (e) => {
      state.appearance.motion = e.target.checked;
      applyAppearance();
    });

    page.querySelector('#set-export').addEventListener('click', exportSession);
    page.querySelector('#set-clear').addEventListener('click', () => $('#clear-btn').click());
  }

  function exportSession() {
    const jsonl = state.streamEntries
      .filter((e) => e.ok)
      .map((e) => JSON.stringify(e.env))
      .join('\n');
    vscode.postMessage({ type: 'exportSession', jsonl });
  }

  // ---------------- Dashboard ----------------
  function logActivity(icon, text, cls) {
    state.activity.push({ icon, text, cls: cls || '', ts: Date.now() });
    if (state.activity.length > 100) state.activity.splice(0, state.activity.length - 100);
    if (state.view === 'dashboard') updateDashboard();
  }

  function fmtTime(ts) {
    return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function updateDashboard() {
    if (MODE === 'editor') return;
    const invalid = state.streamEntries.filter((e) => !e.ok).length;
    $('#stat-surfaces').textContent = String(surfaces.size);
    $('#stat-messages').textContent = String(state.streamEntries.length);
    $('#stat-actions').textContent = String(state.actions.length);
    $('#stat-invalid').textContent = String(invalid);
    const mins = Math.max(0, Math.round((Date.now() - state.startedAt) / 60000));
    $('#stat-uptime').textContent = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
    const badge = $('#nav-badge');
    badge.hidden = surfaces.size === 0;
    badge.textContent = String(surfaces.size);

    const kinds = ['createSurface', 'updateComponents', 'updateDataModel', 'deleteSurface'];
    const counts = {};
    for (const k of kinds) counts[k] = 0;
    for (const e of state.streamEntries) {
      const k = envelopeKind(e.env);
      if (counts[k] !== undefined && e.ok) counts[k]++;
    }
    counts.invalid = invalid;
    const total = Math.max(1, Object.values(counts).reduce((a, b) => a + b, 0));
    const breakdown = $('#dash-breakdown');
    breakdown.innerHTML = state.streamEntries.length === 0
      ? '<div class="empty-mini">No protocol traffic yet — generate a surface to see the stream anatomy.</div>'
      : [...kinds, 'invalid'].map((k) => `
        <div class="bd-row">
          <span class="bd-label">${k}</span>
          <span class="bd-track"><span class="bd-fill bd-${k}" style="width:${Math.round((counts[k] / total) * 100)}%"></span></span>
          <span class="bd-count">${counts[k]}</span>
        </div>`).join('');

    const eff = state.effective;
    const info = state.providers.find((p) => p.id === state.provider);
    const needsKey = ['anthropic', 'openai', 'gemini'].includes(state.provider);
    const hasKey = !!state.keys[state.provider];
    $('#dash-provider').innerHTML = `
      ${eff && eff.activeProfile ? `<div class="pi-row"><span class="pi-label">Profile</span><span class="pi-value pi-badge">${escapeHtml(eff.activeProfile)}</span></div>` : ''}
      <div class="pi-row"><span class="pi-label">Provider</span><span class="pi-value">${escapeHtml(info ? info.label : state.provider)}</span></div>
      <div class="pi-row"><span class="pi-label">Model</span><span class="pi-value">${escapeHtml(state.model || (info && info.defaultModel) || 'auto')}</span></div>
      ${eff && eff.baseUrl ? `<div class="pi-row"><span class="pi-label">Gateway</span><span class="pi-value">${escapeHtml(eff.baseUrl)}</span></div>` : ''}
      <div class="pi-row"><span class="pi-label">Temperature</span><span class="pi-value">${eff ? eff.temperature : '—'}</span></div>
      <div class="pi-row"><span class="pi-label">Models found</span><span class="pi-value">${state.modelsLoading ? '…' : state.models.length}</span></div>
      ${eff && eff.catalog ? `<div class="pi-row"><span class="pi-label">Catalog</span><span class="pi-value">${eff.catalog.componentNames.length} custom components</span></div>` : ''}
      ${needsKey && !hasKey ? `<div class="pi-note">No API key stored for this provider yet.</div>` : ''}
      ${state.modelsNote ? `<div class="pi-note">${escapeHtml(state.modelsNote)}</div>` : ''}
      <div class="pi-actions">
        ${needsKey ? `<button class="ghost-btn tiny" id="pi-key">${hasKey ? 'Update' : 'Set'} API key</button>` : ''}
        <button class="ghost-btn tiny" id="pi-refresh">Refresh models</button>
        <button class="ghost-btn tiny" id="pi-settings">All settings</button>
      </div>`;
    const keyBtn = $('#pi-key');
    if (keyBtn) keyBtn.addEventListener('click', () => vscode.postMessage({ type: 'setApiKey' }));
    $('#pi-refresh').addEventListener('click', () => {
      state.modelsLoading = true;
      updateDashboard();
      vscode.postMessage({ type: 'listModels', provider: state.provider });
    });
    $('#pi-settings').addEventListener('click', () => setView('settings'));

    const feed = $('#dash-activity');
    const recent = state.activity.slice(-9).reverse();
    feed.innerHTML = recent.length === 0
      ? '<div class="empty-mini">Activity will appear here: surfaces created, actions dispatched, validation issues.</div>'
      : recent.map((a) => `
        <div class="act-row ${a.cls}">
          <span class="act-icon">${iconSvg(a.icon)}</span>
          <span class="act-text">${escapeHtml(a.text)}</span>
          <span class="act-time">${fmtTime(a.ts)}</span>
        </div>`).join('');
  }

  setInterval(() => {
    if (state.view === 'dashboard') updateDashboard();
  }, 30000);

  // ---------------- Surface canvas ----------------
  let renderQueued = false;
  function scheduleRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      renderSurfaces();
      if (arena.a.store.size || arena.b.store.size) renderArena();
    });
  }

  function captureFocus() {
    const active = document.activeElement;
    if (active && active.dataset && active.dataset.fkey) {
      return { fkey: active.dataset.fkey, start: active.selectionStart, end: active.selectionEnd };
    }
    return null;
  }

  function restoreFocus(saved) {
    if (!saved) return;
    const node = document.querySelector(`[data-fkey="${CSS.escape(saved.fkey)}"]`);
    if (node) {
      node.focus({ preventScroll: true });
      try {
        if (saved.start !== null && saved.start !== undefined && node.setSelectionRange) {
          node.setSelectionRange(saved.start, saved.end);
        }
      } catch { /* not a text input */ }
    }
  }

  function buildSurfaceFrame(s, opts) {
    opts = opts || {};
    const frame = el('article', 'surface-frame');
    const accent = (s.theme && s.theme.primaryColor) || state.appearance.accent;
    frame.style.setProperty('--accent', accent);

    const header = el('header', 'surface-header');
    const title = el('div', 'surface-title');
    title.innerHTML = `<span class="surface-dot"></span><span>${escapeHtml(
      (s.theme && s.theme.agentDisplayName) || s.id
    )}</span><span class="surface-id">${escapeHtml(s.id)}</span>`;
    header.appendChild(title);
    const btns = el('div', 'surface-actions');
    if (opts.exportable !== false) {
      const exportBtn = el('button', 'surface-close');
      exportBtn.innerHTML = iconSvg('download');
      exportBtn.title = 'Export this surface as a standalone HTML snapshot';
      exportBtn.addEventListener('click', () => {
        vscode.postMessage({ type: 'exportHtml', surfaceId: s.id, html: frame.outerHTML });
      });
      btns.appendChild(exportBtn);
    }
    if (opts.closable !== false) {
      const closeBtn = el('button', 'surface-close');
      closeBtn.innerHTML = iconSvg('close');
      closeBtn.title = 'Remove surface (local only)';
      closeBtn.addEventListener('click', () => {
        surfaces.delete(s.id);
        scheduleRender();
        renderDataTab();
        updateDashboard();
      });
      btns.appendChild(closeBtn);
    }
    header.appendChild(btns);
    frame.appendChild(header);

    const body = el('div', 'surface-body');
    if (s.components.has('root')) {
      body.appendChild(renderComponent('root', s, null));
    } else {
      const waiting = el('div', 'surface-waiting');
      waiting.innerHTML = '<div class="a2-placeholder"></div><div class="a2-placeholder short"></div><div class="a2-placeholder"></div>';
      body.appendChild(waiting);
    }
    frame.appendChild(body);
    return frame;
  }

  function renderSurfaces() {
    const saved = captureFocus();
    const scrollTop = $('#canvas').scrollTop;
    // Re-rendering rebuilds <video>/<audio> elements — carry playback across.
    const mediaState = new Map();
    surfacesHost.querySelectorAll('video[data-mkey], audio[data-mkey]').forEach((m) => {
      mediaState.set(m.dataset.mkey, { src: m.src, time: m.currentTime, paused: m.paused });
    });
    surfacesHost.innerHTML = '';
    $('#canvas-empty').style.display = surfaces.size === 0 ? '' : 'none';
    for (const s of surfaces.values()) {
      surfacesHost.appendChild(buildSurfaceFrame(s, { closable: true, exportable: MODE !== 'editor' }));
    }
    surfacesHost.querySelectorAll('video[data-mkey], audio[data-mkey]').forEach((m) => {
      const prev = mediaState.get(m.dataset.mkey);
      if (!prev || prev.src !== m.src) return;
      try {
        if (prev.time > 0) m.currentTime = prev.time;
      } catch { /* metadata not ready yet */ }
      if (!prev.paused) m.play().catch(() => {});
    });
    $('#canvas').scrollTop = scrollTop;
    restoreFocus(saved);
  }

  // ---------------- Component inspector ----------------
  const inspectToggle = $('#inspect-toggle');
  inspectToggle.addEventListener('click', () => {
    state.inspect = !state.inspect;
    inspectToggle.classList.toggle('active', state.inspect);
    $('#canvas').classList.toggle('inspect-mode', state.inspect);
  });

  let hoverTarget = null;
  surfacesHost.addEventListener('mouseover', (e) => {
    if (!state.inspect) return;
    const target = e.target.closest('[data-cid]');
    if (hoverTarget) hoverTarget.classList.remove('inspect-hit');
    hoverTarget = target;
    if (target) target.classList.add('inspect-hit');
  });
  surfacesHost.addEventListener(
    'click',
    (e) => {
      if (!state.inspect) return;
      const target = e.target.closest('[data-cid]');
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      selectComponent(target.dataset.sid, target.dataset.cid);
    },
    true
  );

  function collectBindings(value, out) {
    if (!value || typeof value !== 'object') return out;
    if (typeof value.path === 'string') out.push(value.path);
    if (Array.isArray(value)) value.forEach((v) => collectBindings(v, out));
    else Object.values(value).forEach((v) => collectBindings(v, out));
    return out;
  }

  function selectComponent(sid, cid) {
    state.inspected = { sid, cid };
    setInspectorTab('inspect');
    renderInspectTab();
  }

  function setInspectorTab(tab) {
    state.activeTab = tab;
    app.querySelectorAll('.inspector-tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    $('#panel-stream').hidden = tab !== 'stream';
    $('#panel-data').hidden = tab !== 'data';
    $('#panel-actions').hidden = tab !== 'actions';
    $('#panel-inspect').hidden = tab !== 'inspect';
  }

  function renderInspectTab() {
    const panel = $('#panel-inspect');
    if (!state.inspected) {
      panel.innerHTML = `<div class="empty-mini">Toggle <strong>Inspect</strong> on the canvas, then click any rendered component to see its definition, bindings and live data.</div>`;
      return;
    }
    const { sid, cid } = state.inspected;
    const s = surfaces.get(sid);
    const comp = s && s.components.get(cid);
    if (!comp) {
      panel.innerHTML = '<div class="empty-mini">That component is gone — it may have been replaced by a newer update.</div>';
      return;
    }
    const bindings = collectBindings(comp, []);
    panel.innerHTML = `
      <div class="inspect-head">
        <span class="kind kind-updateComponents">${escapeHtml(comp.component)}</span>
        <span class="sid">#${escapeHtml(cid)}</span>
        <span class="muted">${escapeHtml(sid)}</span>
      </div>
      <div class="data-block"><div class="data-block-title">Definition</div><pre class="json-view">${highlightJson(comp)}</pre></div>
      ${bindings.length ? `<div class="data-block"><div class="data-block-title">Data bindings</div><div class="binding-list">${bindings
        .map((b) => {
          const abs = b.startsWith('/') ? b : '(relative) ' + b;
          const val = b.startsWith('/') ? getPath(s.dataModel, b) : undefined;
          return `<div class="binding-row"><code>${escapeHtml(abs)}</code><span>${escapeHtml(val === undefined ? '—' : JSON.stringify(val))}</span></div>`;
        })
        .join('')}</div></div>` : ''}
    `;
  }

  // ---------------- Session replay ----------------
  const replayBar = $('#replay-bar');
  const replaySlider = $('#replay-slider');

  function enterReplay() {
    const log = state.streamEntries.filter((e) => e.ok).map((e) => e.env);
    if (log.length === 0) return;
    state.replay = { log, pos: log.length, playing: false, timer: null };
    replayBar.hidden = false;
    replaySlider.max = String(log.length);
    applyReplay(log.length);
    logActivity('rewind', 'Replay mode — scrub through the session');
  }

  function applyReplay(pos) {
    if (!state.replay) return;
    state.replay.pos = pos;
    surfaces.clear();
    for (let i = 0; i < pos; i++) processEnvelope(state.replay.log[i]);
    replaySlider.value = String(pos);
    $('#replay-count').textContent = `${pos} / ${state.replay.log.length}`;
    scheduleRender();
    renderDataTab();
  }

  function stopReplayTimer() {
    if (state.replay && state.replay.timer) {
      clearInterval(state.replay.timer);
      state.replay.timer = null;
      state.replay.playing = false;
      $('#replay-play').innerHTML = iconSvg('play');
    }
  }

  function exitReplay() {
    if (!state.replay) return;
    stopReplayTimer();
    const log = state.replay.log;
    state.replay = null;
    replayBar.hidden = true;
    surfaces.clear();
    for (const env of log) processEnvelope(env);
    scheduleRender();
    renderDataTab();
  }

  $('#replay-btn').addEventListener('click', enterReplay);
  $('#replay-exit').addEventListener('click', exitReplay);
  $('#replay-back').addEventListener('click', () => state.replay && (stopReplayTimer(), applyReplay(Math.max(0, state.replay.pos - 1))));
  $('#replay-fwd').addEventListener('click', () => state.replay && (stopReplayTimer(), applyReplay(Math.min(state.replay.log.length, state.replay.pos + 1))));
  replaySlider.addEventListener('input', () => state.replay && (stopReplayTimer(), applyReplay(Number(replaySlider.value))));
  $('#replay-play').addEventListener('click', () => {
    if (!state.replay) return;
    if (state.replay.playing) {
      stopReplayTimer();
      return;
    }
    if (state.replay.pos >= state.replay.log.length) applyReplay(0);
    state.replay.playing = true;
    $('#replay-play').innerHTML = iconSvg('pause');
    state.replay.timer = setInterval(() => {
      if (!state.replay) return;
      if (state.replay.pos >= state.replay.log.length) {
        stopReplayTimer();
        return;
      }
      applyReplay(state.replay.pos + 1);
    }, 600);
  });

  // ---------------- Inspector tabs, stream, data, actions ----------------
  app.querySelectorAll('.inspector-tabs button').forEach((btn) => {
    btn.addEventListener('click', () => setInspectorTab(btn.dataset.tab));
  });
  $('#raw-toggle').addEventListener('click', () => {
    state.showRaw = !state.showRaw;
    $('#raw-console').hidden = !state.showRaw;
    $('#raw-toggle').classList.toggle('active', state.showRaw);
    renderStreamTab();
  });
  $('#export-btn').addEventListener('click', exportSession);

  function highlightJson(obj) {
    const json = escapeHtml(JSON.stringify(obj, null, 2));
    return json
      .replace(/(&quot;[^&]*?&quot;)(\s*:)/g, '<span class="j-key">$1</span>$2')
      .replace(/: (&quot;.*?&quot;)/g, ': <span class="j-str">$1</span>')
      .replace(/: (-?\d+\.?\d*)/g, ': <span class="j-num">$1</span>')
      .replace(/: (true|false|null)/g, ': <span class="j-bool">$1</span>');
  }

  function envelopeKind(env) {
    if (env.createSurface) return 'createSurface';
    if (env.updateComponents) return 'updateComponents';
    if (env.updateDataModel) return 'updateDataModel';
    if (env.deleteSurface) return 'deleteSurface';
    return 'unknown';
  }

  function logEnvelope(env, ok, errors) {
    state.streamEntries.push({ env, ok, errors: errors || [] });
    const kind = envelopeKind(env);
    if (ok && kind === 'createSurface') {
      logActivity('add', `Surface created: ${env.createSurface.surfaceId}`);
    } else if (!ok) {
      logActivity('warning', `Invalid message: ${(errors || ['unknown'])[0]}`, 'act-warn');
    }
    renderStreamTab();
    updateDashboard();
  }

  function buildStreamItem(entry) {
    const kind = envelopeKind(entry.env);
    const item = el('details', 'stream-item' + (entry.ok ? '' : ' invalid'));
    const surfaceId = (entry.env[kind] && entry.env[kind].surfaceId) || '';
    const summary = el('summary');
    summary.innerHTML = `<span class="kind kind-${kind}">${kind}</span><span class="sid">${escapeHtml(surfaceId)}</span>${entry.ok ? '' : '<span class="err-badge">invalid</span>'}`;
    item.appendChild(summary);
    if (entry.errors.length) {
      const errs = el('div', 'stream-errors');
      errs.textContent = entry.errors.join(' · ');
      item.appendChild(errs);
    }
    const pre = el('pre', 'json-view');
    pre.innerHTML = highlightJson(entry.env);
    item.appendChild(pre);
    item.addEventListener('toggle', () => {
      if (item.open) item.scrollIntoView({ block: 'nearest' });
    });
    // Hovering a message flashes the components it defines.
    if (entry.ok && entry.env.updateComponents) {
      const ids = (entry.env.updateComponents.components || []).map((c) => c.id);
      const sid = entry.env.updateComponents.surfaceId;
      summary.addEventListener('mouseenter', () => {
        for (const cid of ids) {
          const node = surfacesHost.querySelector(`[data-sid="${CSS.escape(sid)}"][data-cid="${CSS.escape(cid)}"]`);
          if (node) node.classList.add('flash');
        }
      });
      summary.addEventListener('mouseleave', () => {
        surfacesHost.querySelectorAll('.flash').forEach((n) => n.classList.remove('flash'));
      });
    }
    return item;
  }

  // Incremental rendering preserves the expanded <details> while streaming.
  let streamRendered = 0;
  function renderStreamTab() {
    const list = $('#stream-list');
    $('#stream-count').textContent = `${state.streamEntries.length} message${state.streamEntries.length === 1 ? '' : 's'}`;
    if (state.streamEntries.length < streamRendered) {
      list.innerHTML = '';
      streamRendered = 0;
    }
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 60;
    for (let i = streamRendered; i < state.streamEntries.length; i++) {
      list.appendChild(buildStreamItem(state.streamEntries[i]));
    }
    streamRendered = state.streamEntries.length;
    while (list.children.length > 250) list.removeChild(list.firstChild);
    if (nearBottom) list.scrollTop = list.scrollHeight;
    if (state.showRaw) {
      $('#raw-console').textContent = state.rawText.slice(-20000);
      $('#raw-console').scrollTop = $('#raw-console').scrollHeight;
    }
  }

  let dataTabQueued = false;
  function renderDataTab() {
    if (dataTabQueued) return;
    dataTabQueued = true;
    requestAnimationFrame(() => {
      dataTabQueued = false;
      const panel = $('#panel-data');
      // Don't clobber an open editor while the user is typing in it.
      if (state.dataEditing && panel.querySelector('.data-editor')) return;
      panel.innerHTML = '';
      if (surfaces.size === 0) {
        panel.innerHTML = '<div class="empty-mini">No surfaces yet. Each surface’s live data model appears here — it updates as you type, and you can edit it directly.</div>';
        return;
      }
      for (const s of surfaces.values()) {
        const block = el('div', 'data-block');
        const head = el('div', 'data-block-title data-block-head');
        head.innerHTML = `<span>${escapeHtml(s.id)}</span>`;
        const editBtn = el('button', 'ghost-btn tiny');
        editBtn.textContent = state.dataEditing === s.id ? 'Editing…' : 'Edit';
        editBtn.addEventListener('click', () => {
          state.dataEditing = s.id;
          renderDataEditor(panel, block, s);
        });
        head.appendChild(editBtn);
        block.appendChild(head);
        const pre = el('pre', 'json-view');
        pre.innerHTML = highlightJson(s.dataModel);
        block.appendChild(pre);
        panel.appendChild(block);
      }
    });
  }

  function renderDataEditor(panel, block, s) {
    const existing = block.querySelector('.json-view');
    if (existing) existing.remove();
    const editor = el('div', 'data-editor');
    const ta = el('textarea', 'set-input set-textarea mono');
    ta.rows = 10;
    ta.value = JSON.stringify(s.dataModel, null, 2);
    const row = el('div', 'set-actions');
    const apply = el('button', 'ghost-btn tiny');
    apply.textContent = 'Apply';
    const cancel = el('button', 'ghost-btn tiny');
    cancel.textContent = 'Cancel';
    const err = el('span', 'a2-field-error');
    apply.addEventListener('click', () => {
      try {
        s.dataModel = JSON.parse(ta.value || '{}');
        state.dataEditing = null;
        scheduleRender();
        renderDataTab();
        logActivity('edit', `Data model edited: ${s.id}`);
      } catch (e) {
        err.textContent = 'Invalid JSON: ' + e.message;
      }
    });
    cancel.addEventListener('click', () => {
      state.dataEditing = null;
      renderDataTab();
    });
    row.appendChild(apply);
    row.appendChild(cancel);
    row.appendChild(err);
    editor.appendChild(ta);
    editor.appendChild(row);
    block.appendChild(editor);
    ta.focus();
  }

  function logAction(payload) {
    state.actions.push(payload);
    logActivity('send', `Action “${payload.name}” → agent`, 'act-action');
    pushChat('event', `Action “${payload.name}” sent with the current data model`);
    beginTurn();
    renderActionsTab();
    updateDashboard();
  }

  let actionsRendered = 0;
  function renderActionsTab() {
    const panel = $('#panel-actions');
    if (state.actions.length === 0) {
      panel.innerHTML = '<div class="empty-mini">Interact with a surface — button clicks appear here and are sent back to the agent.</div>';
      actionsRendered = 0;
      return;
    }
    if (state.actions.length < actionsRendered || actionsRendered === 0) {
      panel.innerHTML = '';
      actionsRendered = 0;
    }
    const nearBottom = panel.scrollHeight - panel.scrollTop - panel.clientHeight < 60;
    for (let i = actionsRendered; i < state.actions.length; i++) {
      const action = state.actions[i];
      const item = el('details', 'stream-item action-item');
      const summary = el('summary');
      summary.innerHTML = `<span class="kind kind-action">action</span><span class="sid">${escapeHtml(action.name)}</span><span class="muted">${escapeHtml(action.surfaceId)}</span>`;
      item.appendChild(summary);
      const pre = el('pre', 'json-view');
      pre.innerHTML = highlightJson(action);
      item.appendChild(pre);
      item.addEventListener('toggle', () => {
        if (item.open) item.scrollIntoView({ block: 'nearest' });
      });
      panel.appendChild(item);
    }
    actionsRendered = state.actions.length;
    while (panel.children.length > 100) panel.removeChild(panel.firstChild);
    if (nearBottom) panel.scrollTop = panel.scrollHeight;
  }

  // ---------------- Host messages ----------------
  window.addEventListener('message', (event) => {
    const msg = event.data;
    switch (msg.type) {
      case 'config': {
        state.effective = msg.effective;
        state.settings = msg.settings;
        state.keys = msg.keys || {};
        state.savedPrompts = msg.savedPrompts || [];
        state.providers = msg.providers || [];
        const prevProvider = state.provider;
        state.provider = msg.effective.provider;
        state.model = msg.effective.model || '';
        if (prevProvider !== state.provider || state.models.length === 0) {
          state.models = [];
          state.modelsLoading = true;
          vscode.postMessage({ type: 'listModels', provider: state.provider });
        }
        syncProviderUi();
        renderGallery();
        break;
      }
      case 'models':
        if (msg.provider !== state.provider) break;
        state.models = msg.models || [];
        state.modelsNote = msg.note || '';
        state.modelsLoading = false;
        populateModelSelect();
        updateDashboard();
        break;
      case 'a2ui':
        exitReplay();
        state.turnEnvelopes++;
        logEnvelope(msg.envelope, true);
        processEnvelope(msg.envelope);
        if (state.view !== 'playground' && state.view !== 'arena') setView('playground');
        break;
      case 'invalid':
        state.turnInvalid++;
        logEnvelope(msg.envelope, false, msg.errors);
        break;
      case 'arenaEnvelope': {
        const rec = arena[msg.side];
        if (!rec) break;
        if (msg.ok) {
          rec.msgs++;
          processEnvelope(msg.envelope, rec.store);
        } else {
          rec.invalid++;
        }
        scheduleArenaRender();
        break;
      }
      case 'arenaStatus': {
        const rec = arena[msg.side];
        if (!rec) break;
        rec.state = msg.state;
        rec.text = msg.text || '';
        if (msg.stats) {
          rec.ms = msg.stats.ms || 0;
          rec.msgs = msg.stats.messages ?? rec.msgs;
          rec.invalid = msg.stats.invalid ?? rec.invalid;
        }
        scheduleArenaRender();
        break;
      }
      case 'raw':
        state.rawText += msg.text;
        if (state.showRaw) renderStreamTab();
        break;
      case 'status':
        setStatus(msg.state, msg.text);
        if (msg.state !== 'generating' && state.turnPending) {
          state.turnPending = false;
          const entry = { envelopes: state.turnEnvelopes, invalid: state.turnInvalid };
          pushChat('agent', msg.text || 'Done.', entry);
          if (msg.state === 'error') {
            state.chat[state.chat.length - 1].error = true;
            logActivity('error', msg.text || 'Generation failed', 'act-warn');
            renderChat();
          }
        }
        break;
      case 'setView':
        setView(msg.view);
        break;
      case 'resetSurfaces':
        stopReplayTimer();
        state.replay = null;
        replayBar.hidden = true;
        surfaces.clear();
        state.streamEntries = [];
        state.rawText = '';
        scheduleRender();
        renderStreamTab();
        renderDataTab();
        updateDashboard();
        break;
      case 'note':
        $('#status-text').textContent = msg.text;
        setView('playground');
        break;
    }
  });

  // ---------------- Init ----------------
  renderGallery();
  renderChat();
  renderDataTab();
  renderActionsTab();
  renderInspectTab();
  scheduleRender();
  updateDashboard();
  if (MODE !== 'editor') logActivity('star', 'A2UI Studio session started');
  vscode.postMessage({ type: 'ready' });
})();
