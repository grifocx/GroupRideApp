import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useState } from "react";
import { RideType, TerrainType, DifficultyLevel } from "@db/schema";
import { CalendarIcon, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

export type RideFilters = {
  search: string;
  rideType: string;
  minDistance: number;
  maxDistance: number;
  difficulty: string;
  terrain: string;
  startDate: Date | null;
  endDate: Date | null;
  showRecurring: boolean;
};

type RideSearchProps = {
  onFilterChange: (filters: RideFilters) => void;
};

const difficultyLevels = [
  { value: DifficultyLevel.BEGINNER, label: 'Beginner (E)' },
  { value: DifficultyLevel.NOVICE, label: 'Novice (D)' },
  { value: DifficultyLevel.INTERMEDIATE, label: 'Intermediate (C)' },
  { value: DifficultyLevel.ADVANCED, label: 'Advanced (B)' },
  { value: DifficultyLevel.EXPERT, label: 'Expert (A)' },
  { value: DifficultyLevel.EXTREME, label: 'Extreme (AA)' }
];

export default function RideSearch({ onFilterChange }: RideSearchProps) {
  const [filters, setFilters] = useState<RideFilters>({
    search: "",
    rideType: "all",
    minDistance: 0,
    maxDistance: 100,
    difficulty: "all",
    terrain: "all",
    startDate: null,
    endDate: null,
    showRecurring: false,
  });

  const handleFilterChange = (updates: Partial<RideFilters>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-card p-4 rounded-lg shadow-sm space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Search</label>
          <Input
            placeholder="Search rides..."
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Ride Type</label>
          <Select
            value={filters.rideType}
            onValueChange={(value) => handleFilterChange({ rideType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.values(RideType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Terrain</label>
          <Select
            value={filters.terrain}
            onValueChange={(value) => handleFilterChange({ terrain: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select terrain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terrain</SelectItem>
              {Object.values(TerrainType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Difficulty</label>
          <Select
            value={filters.difficulty}
            onValueChange={(value) => handleFilterChange({ difficulty: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {difficultyLevels.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Distance Range (miles)</label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min={0}
              value={filters.minDistance}
              onChange={(e) => handleFilterChange({ minDistance: Number(e.target.value) })}
              className="w-24"
            />
            <span>to</span>
            <Input
              type="number"
              min={0}
              value={filters.maxDistance}
              onChange={(e) => handleFilterChange({ maxDistance: Number(e.target.value) })}
              className="w-24"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Date Range</label>
          <div className="flex gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal w-full",
                    !filters.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? format(filters.startDate, "PPP") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.startDate ?? undefined}
                  onSelect={(date) => handleFilterChange({ startDate: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal w-full",
                    !filters.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate ? format(filters.endDate, "PPP") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.endDate ?? undefined}
                  onSelect={(date) => handleFilterChange({ endDate: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Add recurring ride filter */}
      <div className="flex items-center gap-2">
        <Switch
          id="recurring-filter"
          checked={filters.showRecurring}
          onCheckedChange={(checked) => handleFilterChange({ showRecurring: checked })}
        />
        <label htmlFor="recurring-filter" className="text-sm font-medium cursor-pointer flex items-center gap-2">
          <Repeat className="h-4 w-4" />
          Show only recurring rides
        </label>
      </div>
    </div>
  );
}