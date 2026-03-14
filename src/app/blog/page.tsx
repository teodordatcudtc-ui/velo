import Link from "next/link";
import { getPosts } from "@/lib/blog-posts";

export const metadata = {
  title: "Blog — Vello",
  description:
    "Povesti și actualizări despre Vello: cum am construit un SaaS pentru contabili, cifre, lecții învățate.",
};

export default function BlogPage() {
  const posts = getPosts();

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <header className="border-b border-[var(--paper-3)] bg-[var(--paper)]">
        <div className="container py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--ink-muted)] hover:text-[var(--sage)] text-sm font-500 mb-4"
          >
            ← Înapoi la Vello
          </Link>
          <h1 className="d2" style={{ marginBottom: 8 }}>
            Blog
          </h1>
          <p className="lead" style={{ maxWidth: 560 }}>
            Povesti despre construirea Vello, cifre reale și actualizări de progres.
          </p>
        </div>
      </header>

      <div className="container py-12">
        <div className="blog-list">
          {posts.map((post) => (
            <article key={post.slug} className="blog-card">
              <Link href={`/blog/${post.slug}`} className="blog-card-link">
                <time
                  dateTime={post.date}
                  className="blog-card-date"
                >
                  {new Date(post.date + "T12:00:00").toLocaleDateString("ro-RO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <h2 className="blog-card-title">{post.title}</h2>
                <p className="blog-card-excerpt">{post.excerpt}</p>
                <span className="blog-card-cta">Citește articolul →</span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
