 import { getPosts } from "@/lib/notion";
-import GalleryGrid from "@/components/GalleryGrid";
+import GalleryController from "@/components/GalleryController";

 export default async function Page() {
   const posts = await getPosts();
   return (
     <main className="mx-auto max-w-5xl px-4 py-6">
-      <GalleryGrid posts={posts} />
+      <GalleryController posts={posts} />
     </main>
   );
 }
