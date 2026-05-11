import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hash, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { usePosts } from "@/hooks/usePosts";
import { useMemo } from "react";

export const TrendingHashtags = () => {
  const { posts } = usePosts();

  const trendingHashtags = useMemo(() => {
    const hashtagCounts: Record<string, number> = {};

    // Count hashtags from all posts
    posts.forEach((post) => {
      post.hashtags?.forEach((hashtag: string) => {
        const normalizedTag = hashtag.toLowerCase().replace(/^#/, '');
        hashtagCounts[normalizedTag] = (hashtagCounts[normalizedTag] || 0) + 1;
      });
    });

    // Sort by count and take top 5
    return Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));
  }, [posts]);

  if (trendingHashtags.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Trending Hashtags
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {trendingHashtags.map(({ tag, count }, index) => (
          <Link
            key={tag}
            to={`/hashtag/${tag}`}
            className="flex items-center justify-between hover:bg-accent p-2 rounded-md transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Hash className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-sm group-hover:text-[hsl(var(--link-blue))] transition-colors">
                  #{tag}
                </p>
                <p className="text-xs text-muted-foreground">
                  {count} {count === 1 ? 'post' : 'posts'}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              #{index + 1}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};