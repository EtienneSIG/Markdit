import { describe, it, expect } from 'vitest';
import { parse } from '../../src/markdown/parse';
import { renderHtml } from '../../src/markdown/render';

describe('HTML sanitization (FR-003, Principle V, SC-008)', () => {
  it('strips <script> tags from rendered output', () => {
    const md = 'Hello\n\n<script>alert(1)</script>\n\nWorld';
    const html = renderHtml(parse(md));
    expect(html).not.toContain('<script');
    expect(html).not.toContain('alert(1)');
  });

  it('removes event-handler attributes', () => {
    const md = '<img src="https://example.com/a.png" onerror="alert(1)">';
    const html = renderHtml(parse(md), { allowRemoteContent: true });
    expect(html).not.toMatch(/onerror/i);
  });

  it('drops javascript: URLs', () => {
    const md = '[click](javascript:alert(1))';
    const html = renderHtml(parse(md));
    expect(html).not.toMatch(/javascript:/i);
  });

  it('blocks remote images when consent is not granted (FR-011)', () => {
    const md = '![pic](https://remote.example/secret.png)';
    const html = renderHtml(parse(md), { allowRemoteContent: false });
    // Remote source must be neutralized (no active src=), not fetched.
    expect(html).not.toMatch(/<img[^>]*\ssrc="https:\/\/remote/);
    expect(html).toContain('data-remote-blocked');
    expect(html).toContain('data-blocked-src="https://remote.example/secret.png"');
  });

  it('allows remote images once consent is granted', () => {
    const md = '![pic](https://remote.example/ok.png)';
    const html = renderHtml(parse(md), { allowRemoteContent: true });
    expect(html).toContain('src="https://remote.example/ok.png"');
    expect(html).not.toContain('data-remote-blocked');
  });
});
