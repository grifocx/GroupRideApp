import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { RideType, TerrainType } from "@db/schema";

export type RideFilters = {
  search: string;
  rideType: string;
  minDistance: number;
  maxDistance: number;
  difficulty: number;
  terrain: string;
};

type RideSearchProps = {
  onFilterChange: (filters: RideFilters) => void;
};

export default function RideSearch({ onFilterChange }: RideSearchProps) {
  const [filters, setFilters] = useState<RideFilters>({
    search: "",
    rideType: "all",
    minDistance: 0,
    maxDistance: 100,
    difficulty: 1,
    terrain: "all",
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
          <Slider
            min={1}
            max={5}
            step={1}
            value={[filters.difficulty]}
            onValueChange={([value]) => handleFilterChange({ difficulty: value })}
          />
          <div className="text-sm text-muted-foreground text-center">
            Level {filters.difficulty}
          </div>
        </div>
      </div>

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
    </div>
  );
}
