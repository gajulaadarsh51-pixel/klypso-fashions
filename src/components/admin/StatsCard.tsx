import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
}

const StatsCard = ({ title, value, change, changeType = 'neutral', icon: Icon }: StatsCardProps) => {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-muted-foreground',
  };

  return (
    <div className="bg-background border border-border p-6 rounded-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-3xl font-heading font-bold">{value}</p>
          {change && (
            <p className={`mt-1 text-sm ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        <div className="p-3 bg-gold/10 rounded-lg">
          <Icon className="text-gold" size={24} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
