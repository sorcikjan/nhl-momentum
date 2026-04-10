import PlayerSearch from '@/components/layout/PlayerSearch';

export const metadata = { title: 'Search Players' };

export default function SearchPage() {
  return (
    <div className="max-w-lg mx-auto pt-4 pb-24 px-4">
      <h1 className="text-lg font-bold mb-4" style={{ color: 'var(--text-bright)' }}>
        Search Players
      </h1>
      <PlayerSearch autoFocus />
    </div>
  );
}
