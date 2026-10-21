import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ push: () => {} }) }));
vi.mock('@/lib/data', () => ({ fetchTodayGameCount: vi.fn(async () => 7) }));

describe('header data flow', () => {
  it('renders synchronously — no server fetch in the root layout (it would cap every page ISR at 300s)', async () => {
    const { default: BrandHeader } = await import('@/components/layout/BrandHeader');
    const el = BrandHeader();
    expect(el).not.toBeInstanceOf(Promise);
    expect(renderToStaticMarkup(el)).toContain('momentum');
  });
});

describe('/api/today-count', () => {
  it('returns the count with a 5-minute shared cache header', async () => {
    const { GET } = await import('@/app/api/today-count/route');
    const res = await GET();
    expect(await res.json()).toEqual({ count: 7 });
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=300');
  });
});
