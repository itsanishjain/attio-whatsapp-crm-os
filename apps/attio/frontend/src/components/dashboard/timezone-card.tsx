import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TimezoneCardProps = {
  timezone: string;
  timezoneOptions: { value: string; label: string }[];
  isUpdating: boolean;
  onTimezoneChange: (timezone: string) => void;
};

export function TimezoneCard({
  timezone,
  timezoneOptions,
  isUpdating,
  onTimezoneChange,
}: TimezoneCardProps) {
  return (
    <Card className="flex flex-col justify-between shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">Timezone</CardTitle>
        <CardDescription>Set timezone for message timestamps</CardDescription>
      </CardHeader>
      <CardContent>
        <Select
          value={timezone}
          disabled={isUpdating}
          onValueChange={onTimezoneChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a timezone" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {timezoneOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
