import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCampusNews } from '@/hooks/useCampusNews';
import { formatDistanceToNow } from 'date-fns';

export const CampusNews = () => {
  const { data: news, isLoading } = useCampusNews(5);

  if (isLoading) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-4">Campus News</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-xs">
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!news || news.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-4">Campus News</h3>
        <p className="text-xs text-muted-foreground">No news available</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-4">Campus News</h3>
      <div className="space-y-3">
        {news.map((item) => (
          <div key={item.id} className="text-xs">
            <p className="text-muted-foreground">
              {formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}
            </p>
            <p className="font-medium text-foreground">{item.title}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};
