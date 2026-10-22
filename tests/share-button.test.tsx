import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ShareButton, { ShareMenu } from '@/components/ui/ShareButton';

describe('ShareButton', () => {
  it('renders a Share button', () => {
    expect(renderToStaticMarkup(<ShareButton path="/games/1/x" text="Our pick: BUF 65%" />)).toContain('Share');
  });
  it('menu offers copy, X and Reddit with the pre-filled text', () => {
    const out = renderToStaticMarkup(<ShareMenu url="https://nhl-momentum.netlify.app/games/1/x" text="Our pick: BUF 65%" copied={false} onCopy={() => {}} />);
    expect(out).toContain('Copy link');
    expect(out).toContain('href="https://x.com/intent/post?text=Our%20pick%3A%20BUF%2065%25&amp;url=https%3A%2F%2Fnhl-momentum.netlify.app%2Fgames%2F1%2Fx"');
    expect(out).toContain('https://www.reddit.com/submit?');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
  });
});
