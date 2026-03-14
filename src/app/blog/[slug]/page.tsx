import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getPosts } from "@/lib/blog-posts";
import { BlogPostContent } from "./BlogPostContent";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Blog — Vello" };
  return {
    title: `${post.title} — Blog Vello`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <header className="border-b border-[var(--paper-3)] bg-[var(--paper)]">
        <div className="container py-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[var(--ink-muted)] hover:text-[var(--sage)] text-sm font-500 mb-6"
          >
            ← Înapoi la Blog
          </Link>
          <time
            dateTime={post.date}
            className="overline"
            style={{ display: "block", marginBottom: 8 }}
          >
            {new Date(post.date + "T12:00:00").toLocaleDateString("ro-RO", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
          <h1 className="d2" style={{ marginBottom: 0 }}>
            {post.title}
          </h1>
        </div>
      </header>

      <div className="container py-10">
        <article className="blog-article">
          <BlogPostContent slug={slug} />
        </article>
      </div>
    </main>
  );
}
