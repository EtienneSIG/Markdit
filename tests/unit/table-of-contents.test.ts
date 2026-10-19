import { createElement, createRef } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TableOfContents } from '../../src/components/sidebar/TableOfContents';
import { setLocale } from '../../src/lib/i18n';

afterEach(() => {
  cleanup();
  setLocale('en');
});

function mount(html: string) {
  const contentRef = createRef<HTMLElement>();
  const result = render(
    createElement(
      'div',
      null,
      createElement('main', { ref: contentRef, dangerouslySetInnerHTML: { __html: html } }),
      createElement(TableOfContents, { contentRef }),
    ),
  );
  return { ...result, content: contentRef.current! };
}

describe('table of contents', () => {
  it('lists only document headings in order with formatting flattened and hierarchy preserved', () => {
    mount(
      '<h1>Toolbar</h1><article class="markdit-reader"><h2>First <em>section</em></h2><h4>Child</h4><h2>First section</h2><pre># Not a heading</pre><h3></h3></article>',
    );
    const navigation = screen.getByRole('navigation', { name: 'Table of contents' });
    const buttons = within(navigation).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual([
      'First section',
      'Child',
      'First section',
    ]);
    expect(buttons[0].style.paddingInlineStart).toBe('0.75rem');
    expect(buttons[1].style.paddingInlineStart).toBe('2.25rem');
  });

  it('navigates to the correct duplicate heading and moves keyboard focus', () => {
    const { content } = mount(
      '<article class="markdit-reader"><h2>Same</h2><h2>Same</h2></article>',
    );
    const headings = content.querySelectorAll('h2');
    const scrollIntoView = vi.fn();
    headings[1].scrollIntoView = scrollIntoView;
    fireEvent.click(screen.getAllByRole('button', { name: 'Same' })[1]);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    expect(headings[1]).toHaveFocus();
    expect(headings[0]).not.toHaveAttribute('tabindex');
  });

  it('hides without headings and tracks lazy editor mounting, edits, and document replacement', async () => {
    const { content, unmount } = mount('<p>Loading</p>');
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    await act(async () => {
      content.innerHTML = '<div class="markdit-editor"><h1>Draft</h1></div>';
    });
    expect(screen.getByRole('button', { name: 'Draft' })).toBeVisible();
    await act(async () => {
      content.querySelector('h1')!.firstChild!.textContent = 'Updated';
    });
    expect(screen.getByRole('button', { name: 'Updated' })).toBeVisible();
    await act(async () => {
      content.innerHTML = '<article class="markdit-reader"><p>No headings</p></article>';
    });
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    unmount();
  });

  it('can be collapsed and reopened with localized accessible controls', () => {
    setLocale('fr');
    mount('<article class="markdit-reader"><h1>Introduction</h1></article>');
    const toggle = screen.getByRole('button', { name: 'Afficher/masquer la table des matières' });
    expect(screen.getByRole('navigation', { name: 'Table des matières' })).toBeVisible();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Introduction' })).toBeVisible();
  });
});
