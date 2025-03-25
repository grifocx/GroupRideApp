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
    <div className="bg-card p-3 sm:p-4 rounded-lg shadow-sm space-y-3 sm:space-y-4">
      {/* Search Input - Always Full Width */}
      <div className="space-y-1 sm:space-y-2">
        <label className="text-xs sm:text-sm font-medium">Search</label>
        <Input
          placeholder="Search rides..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
          className="h-8 sm:h-10 text-sm"
        />
      </div>

      {/* Select Filters - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
        {/* Ride Type */}
        <div className="space-y-1 sm:space-y-2">
          <label className="text-xs sm:text-sm font-medium">Ride Type</label>
          <Select
            value={filters.rideType}
            onValueChange={(value) => handleFilterChange({ rideType: value })}
          >
            <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Type" />
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

        {/* Terrain */}
        <div className="space-y-1 sm:space-y-2">
          <label className="text-xs sm:text-sm font-medium">Terrain</label>
          <Select
            value={filters.terrain}
            onValueChange={(value) => handleFilterChange({ terrain: value })}
          >
            <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Terrain" />
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

        {/* Difficulty */}
        <div className="space-y-1 sm:space-y-2">
          <label className="text-xs sm:text-sm font-medium">Difficulty</label>
          <Select
            value={filters.difficulty}
            onValueChange={(value) => handleFilterChange({ difficulty: value })}
          >
            <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Difficulty" />
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

        {/* Distance Range */}
        <div className="space-y-1 sm:space-y-2 col-span-2 sm:col-span-1">
          <label className="text-xs sm:text-sm font-medium">Distance (miles)</label>
          <div className="flex items-center gap-1 sm:gap-2">
            <Input
              type="number"
              min={0}
              value={filters.minDistance}
              onChange={(e) => handleFilterChange({ minDistance: Number(e.target.value) })}
              className="w-16 sm:w-20 h-8 sm:h-10 text-xs sm:text-sm"
            />
            <span className="text-xs">to</span>
            <Input
              type="number"
              min={0}
              value={filters.maxDistance}
              onChange={(e) => handleFilterChange({ maxDistance: Number(e.target.value) })}
              className="w-16 sm:w-20 h-8 sm:h-10 text-xs sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Date Range and Recurring Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <label className="text-xs sm:text-sm font-medium">Date Range</label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal w-full h-8 sm:h-10 text-xs sm:text-sm",
                    !filters.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  {filters.startDate ? format(filters.startDate, "MMM d") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal w-full h-8 sm:h-10 text-xs sm:text-sm",
                    !filters.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  {filters.endDate ? format(filters.endDate, "MMM d") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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

        {/* Add recurring ride filter */}
        <div className="flex items-center">
          <div className="flex items-center gap-2 bg-background/60 p-2 rounded-md h-8 sm:h-10">
            <Switch
              id="recurring-filter"
              checked={filters.showRecurring}
              onCheckedChange={(checked) => handleFilterChange({ showRecurring: checked })}
            />
            <label htmlFor="recurring-filter" className="text-xs sm:text-sm font-medium cursor-pointer flex items-center gap-1 sm:gap-2">
              <Repeat className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="line-clamp-1">Show only recurring rides</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}