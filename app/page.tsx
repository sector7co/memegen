import { MemeStudio } from './components/MemeStudio';
import { listMemes, type MemeSummary } from '@/db/memes';

export const runtime = 'edge';

export default async function Home() {
  let recent: MemeSummary[] = [];
  try {
    recent = await listMemes('', 12);
  } catch {
    // A fresh local database may not have migrations yet. The deployed database does.
  }
  return <MemeStudio initialPosts={recent} />;
}
