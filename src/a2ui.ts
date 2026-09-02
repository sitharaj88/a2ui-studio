/**
 * A2UI v0.9.1 stream utilities: incremental JSON object extraction from
 * arbitrary LLM output, envelope validation against the basic catalog, and a
 * cross-message surface linter for the repair loop.
 */

export interface A2uiEnvelope {
  version?: string;
  createSurface?: {
    surfaceId: string;
    catalogId: string;
    theme?: Record<string, unknown>;
    sendDataModel?: boolean;
  };
  updateComponents?: {
    surfaceId: string;
    components: Array<Record<string, unknown> & { id: string; component: string }>;
  };
  updateDataModel?: { surfaceId: string; path?: string; value?: unknown };
  deleteSurface?: { surfaceId: string };
}

export const BASIC_COMPONENTS = new Set([
  'Text',
  'Image',
  'Icon',
  'Video',
  'AudioPlayer',
  'Row',
  'Column',
  'List',
  'Card',
  'Tabs',
  'Modal',
  'Divider',
  'Button',
  'TextField',
  'CheckBox',
  'ChoicePicker',
  'Slider',
  'DateTimeInput'
]);

/** Studio extended catalog (https://a2ui-studio.dev/catalogs/studio/v1). */
export const STUDIO_COMPONENTS = new Set([
  'Pages',
  'Stepper',
  'Hero',
  'StatCard',
  'Chart',
  'Table',
  'Timeline',
  'Accordion',
  'Rating',
  'ProgressBar',
  'Avatar',
  'Badge'
]);

const ENVELOPE_KEYS = ['createSurface', 'updateComponents', 'updateDataModel', 'deleteSurface'] as const;

/**
 * Incrementally extracts complete top-level JSON objects from a growing text
 * buffer that may contain prose, markdown fences, and partial JSON.
 */
export class JsonStreamExtractor {
  private buffer = '';

  /** Feed a chunk; returns any complete JSON objects found. */
  push(chunk: string): unknown[] {
    this.buffer += chunk;
    return this.drain(false);
  }

  /** Flush at end of stream. */
  finish(): unknown[] {
    return this.drain(true);
  }

  private drain(final: boolean): unknown[] {
    const results: unknown[] = [];
    for (;;) {
      const start = this.buffer.indexOf('{');
      if (start < 0) {
        this.buffer = final ? '' : this.buffer.slice(-64);
        return results;
      }
      const end = this.findBalancedEnd(start);
      if (end < 0) {
        // Incomplete object; keep from `start` and wait for more chunks.
        this.buffer = this.buffer.slice(start);
        return results;
      }
      const candidate = this.buffer.slice(start, end + 1);
      this.buffer = this.buffer.slice(end + 1);
      try {
        results.push(JSON.parse(candidate));
      } catch {
        // Not valid JSON despite balanced braces — skip past the opening
        // brace and rescan so we don't loop forever.
        this.buffer = candidate.slice(1) + this.buffer;
      }
    }
  }

  private findBalancedEnd(start: number): number {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < this.buffer.length; i++) {
      const ch = this.buffer[i];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export interface ValidateOptions {
  /** Accept component types outside the basic catalog (custom catalogs). */
  allowUnknownComponents?: boolean;
}

/** Validates a parsed object as an A2UI envelope. Lenient by design. */
export function validateEnvelope(obj: unknown, opts: ValidateOptions = {}): ValidationResult {
  const errors: string[] = [];
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return { ok: false, errors: ['Message is not a JSON object'] };
  }
  const env = obj as Record<string, any>;
  const present = ENVELOPE_KEYS.filter((k) => env[k] !== undefined);
  if (present.length !== 1) {
    return {
      ok: false,
      errors: [
        `Envelope must contain exactly one of ${ENVELOPE_KEYS.join(', ')} (found: ${present.join(', ') || 'none'})`
      ]
    };
  }
  const kind = present[0];
  const body = env[kind];
  if (typeof body !== 'object' || body === null) {
    return { ok: false, errors: [`"${kind}" must be an object`] };
  }
  if (typeof body.surfaceId !== 'string' || !body.surfaceId) {
    errors.push(`"${kind}" is missing a string surfaceId`);
  }
  if (kind === 'createSurface' && (typeof body.catalogId !== 'string' || !body.catalogId)) {
    errors.push('createSurface is missing catalogId');
  }
  if (kind === 'updateComponents') {
    if (!Array.isArray(body.components)) {
      errors.push('updateComponents.components must be an array');
    } else {
      const ids = new Set<string>();
      for (const comp of body.components) {
        if (typeof comp !== 'object' || comp === null) {
          errors.push('Component entry is not an object');
          continue;
        }
        if (typeof comp.id !== 'string' || !comp.id) {
          errors.push(`Component missing string id: ${JSON.stringify(comp).slice(0, 80)}`);
        } else if (ids.has(comp.id)) {
          errors.push(`Duplicate component id "${comp.id}" in the same updateComponents message`);
        } else {
          ids.add(comp.id);
        }
        if (typeof comp.component !== 'string') {
          errors.push(`Component "${comp.id}" missing component type`);
        } else if (
          !BASIC_COMPONENTS.has(comp.component) &&
          !STUDIO_COMPONENTS.has(comp.component) &&
          !opts.allowUnknownComponents
        ) {
          errors.push(`Component "${comp.id}" uses unknown type "${comp.component}" (not in the basic or studio catalog)`);
        }
        if (comp.component === 'Card' && comp.children !== undefined && comp.child === undefined) {
          errors.push(`Card "${comp.id}" must use a single "child" id — wrap multiple items in a Column or Row`);
        }
        if (comp.component === 'Button' && typeof comp.child !== 'string') {
          errors.push(`Button "${comp.id}" needs a "child" id pointing at a Text or Icon component`);
        }
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

/** Component ids referenced by a component's structural properties. */
export function childReferences(comp: Record<string, any>): string[] {
  const refs: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === 'string' && v) refs.push(v);
  };
  if (Array.isArray(comp.children)) comp.children.forEach(push);
  else if (comp.children && typeof comp.children === 'object') push(comp.children.componentId);
  push(comp.child);
  if (comp.component === 'Modal') {
    push(comp.trigger);
    push(comp.content);
  }
  for (const key of ['tabs', 'pages', 'steps', 'items']) {
    const list = comp[key];
    if (Array.isArray(list)) for (const entry of list) if (entry && typeof entry === 'object') push(entry.child);
  }
  return refs;
}

interface TrackedSurface {
  components: Map<string, Record<string, any>>;
  touched: boolean;
}

/**
 * Follows the surfaces a conversation builds up so structural problems that
 * span messages — dangling child ids, a missing root, updates to a surface
 * that was never created — can be fed back to the model for repair.
 */
export class SurfaceTracker {
  private surfaces = new Map<string, TrackedSurface>();
  private orphanUpdates = new Set<string>();

  apply(envelope: unknown): void {
    const env = envelope as A2uiEnvelope;
    if (env.createSurface?.surfaceId) {
      this.surfaces.set(env.createSurface.surfaceId, { components: new Map(), touched: true });
    } else if (env.updateComponents?.surfaceId) {
      const id = env.updateComponents.surfaceId;
      let s = this.surfaces.get(id);
      if (!s) {
        this.orphanUpdates.add(id);
        s = { components: new Map(), touched: true };
        this.surfaces.set(id, s);
      }
      s.touched = true;
      for (const comp of env.updateComponents.components ?? []) {
        if (comp && typeof comp.id === 'string') s.components.set(comp.id, comp);
      }
    } else if (env.deleteSurface?.surfaceId) {
      this.surfaces.delete(env.deleteSurface.surfaceId);
      this.orphanUpdates.delete(env.deleteSurface.surfaceId);
    }
  }

  /** Structural errors for surfaces touched since the last lint. */
  lint(): string[] {
    const errors: string[] = [];
    for (const [id, s] of this.surfaces) {
      if (!s.touched) continue;
      s.touched = false;
      if (this.orphanUpdates.has(id)) {
        errors.push(`Surface "${id}" received updateComponents without a preceding createSurface`);
        this.orphanUpdates.delete(id);
      }
      if (s.components.size > 0 && !s.components.has('root')) {
        errors.push(`Surface "${id}" has no component with id "root"`);
      }
      for (const [cid, comp] of s.components) {
        for (const ref of childReferences(comp)) {
          if (!s.components.has(ref)) {
            errors.push(`Component "${cid}" in surface "${id}" references undefined child "${ref}"`);
          }
        }
      }
    }
    return errors;
  }

  reset(): void {
    this.surfaces.clear();
    this.orphanUpdates.clear();
  }
}
