import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
] as const;

export interface RequestFiltersProps {
  search: string;
  method: string;
  startDate: string;
  endDate: string;
  onSearchChange: (value: string) => void;
  onMethodChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onClearFilters?: () => void;
  className?: string;
}

export function RequestFilters({
  search,
  method,
  startDate,
  endDate,
  onSearchChange,
  onMethodChange,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  className,
}: RequestFiltersProps) {
  const hasActiveFilters = search || method || startDate || endDate;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 border-b px-6 py-3",
        className
      )}
    >
      {/* Search Input */}
      <div className="relative flex-1 min-w-48">
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={2}
          className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          type="text"
          placeholder="Search headers and body..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-7"
        />
      </div>

      {/* Method Filter */}
      <Select
        value={method || undefined}
        onValueChange={(value) => onMethodChange(value ?? "")}
      >
        <SelectTrigger className="w-28">
          <SelectValue>{method || "Method"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Methods</SelectItem>
          {HTTP_METHODS.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Range Inputs */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">From</span>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="w-32"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">To</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="w-32"
        />
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && onClearFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            strokeWidth={2}
            className="h-3 w-3"
          />
          Clear
        </Button>
      )}
    </div>
  );
}
