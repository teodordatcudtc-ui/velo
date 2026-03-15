export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  author?: string;
  readTime?: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "de-ce-contabilii-pierd-ore-intregi-in-fiecare-luna",
    title: "De ce contabilii pierd ore întregi în fiecare lună — și cum se poate schimba asta",
    date: "2026-03-01",
    excerpt:
      "Sfârșitul de lună, termenul pentru declarații se apropie — și încă aștepți facturile. Calculul real al orelor pierdute și o soluție simplă.",
    author: "Teodor Datcu",
    readTime: "5 min",
  },
  {
    slug: "lansare-saas-contabili-2-saptamani-ziua-1",
    title: "Am lansat un SaaS pentru contabili români în 2 săptămâni — iată ziua 1",
    date: "2025-03-14",
    excerpt:
      "Cum am validat ideea, am construit MVP-ul în 2 săptămâni cu Next.js și Supabase, și ce cifre am văzut în ziua 1.",
  },
];

export function getPosts(): BlogPost[] {
  return blogPosts;
}

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
