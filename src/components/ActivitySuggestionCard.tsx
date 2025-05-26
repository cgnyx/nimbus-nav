import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Zap } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

interface ActivitySuggestionCardProps {
  activities: string[];
  isLoading: boolean;
  weatherCondition?: string;
}

export function ActivitySuggestionCard({ activities, isLoading, weatherCondition }: ActivitySuggestionCardProps) {
  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mt-8 shadow-lg rounded-xl fade-in-up">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-accent" />
            <CardTitle className="text-xl sm:text-2xl text-foreground">Activity Suggestions</CardTitle>
          </div>
           <Skeleton className="h-4 w-1/2 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <Skeleton className="w-5 h-5 rounded-full mt-1" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return null; // Don't render the card if there are no suggestions and not loading
  }

  return (
    <Card className="w-full max-w-2xl mt-8 shadow-lg rounded-xl bg-card/80 backdrop-blur-sm border-accent/20 fade-in-up">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-accent" />
          <CardTitle className="text-xl sm:text-2xl text-foreground">Activity Ideas {weatherCondition ? `for ${weatherCondition} Weather` : ''}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <ul className="space-y-3">
            {activities.map((activity, index) => (
              <li key={index} className="flex items-start space-x-3">
                <Zap className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <span className="text-foreground/90 text-base sm:text-lg">{activity}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No specific activities suggested for these conditions right now. Be creative!</p>
        )}
      </CardContent>
    </Card>
  );
}
