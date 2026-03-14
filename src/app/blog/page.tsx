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
    <main className="blog-main">
      <header className="blog-hero">
        <div className="container">
          <span className="blog-hero-overline">Povesti & actualizări</span>
          <h1 className="blog-hero-title">
            Blog
          </h1>
          <p className="blog-hero-lead">
            Cum am construit Vello, cifre reale și lecții învățate pe parcurs.
          </p>
        </div>
      </header>

      <div className="container blog-list-wrap">
        <div className="blog-list">
          {posts.map((post) => (
            <article key={post.slug} className="blog-card">
              <Link href={`/blog/${post.slug}`} className="blog-card-link">
                <span className="blog-card-accent" aria-hidden />
                <time dateTime={post.date} className="blog-card-date">
                  {new Date(post.date + "T12:00:00").toLocaleDateString("ro-RO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <h2 className="blog-card-title">{post.title}</h2>
                <p className="blog-card-excerpt">{post.excerpt}</p>
                <span className="blog-card-cta">
                  Citește articolul
                  <svg className="blog-card-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
