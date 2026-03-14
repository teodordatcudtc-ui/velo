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

  const formattedDate = new Date(post.date + "T12:00:00").toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="blog-main blog-article-page">
      <header className="blog-article-hero">
        <div className="container">
          <Link href="/blog" className="blog-article-back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Înapoi la Blog
          </Link>
          <time dateTime={post.date} className="blog-article-date">
            {formattedDate}
          </time>
          <h1 className="blog-article-title">
            {post.title}
          </h1>
        </div>
      </header>

      <div className="container blog-article-wrap">
        <article className="blog-article">
          <BlogPostContent slug={slug} />
        </article>
      </div>
    </main>
  );
}
