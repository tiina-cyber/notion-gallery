import { getPosts } from "@/lib/notion";
import GalleryController from "@/components/GalleryController"; // if @/ alias works

export default async function EmbedPage() {
  const posts = await getPosts();
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <GalleryController posts={posts} />
    </main>
  );
}
