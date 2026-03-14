import { BlogNav } from "./BlogNav";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BlogNav />
      <div className="blog-page-wrap">{children}</div>
    </>
  );
}
