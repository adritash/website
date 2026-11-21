import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  InsightArticle,
  createInsightMetadata,
} from "@/components/sections/InsightArticle";
import {
  formatPostDate,
  getAllPosts,
  getPost,
  parseBody,
} from "@/lib/content/posts";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return createInsightMetadata({
    title: post.title,
    description: post.excerpt,
    slug: post.slug,
  });
}

export default async function InsightPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <InsightArticle
      title={post.title}
      description={post.excerpt}
      date={formatPostDate(post.date)}
      tag={post.tag}
    >
      {parseBody(post.body).map((block, i) => {
        switch (block.type) {
          case "h2":
            return <h2 key={i}>{block.text}</h2>;
          case "h3":
            return <h3 key={i}>{block.text}</h3>;
          case "ul":
            return (
              <ul key={i}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          default:
            return <p key={i}>{block.text}</p>;
        }
      })}
    </InsightArticle>
  );
}
