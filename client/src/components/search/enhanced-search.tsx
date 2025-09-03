import { useState } from "react";
import { Search, Filter, X, Calendar, User, BookOpen, Star, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { DatePicker } from "@/components/ui/date-picker";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface SearchFilters {
  query: string;
  subjects: string[];
  fileTypes: string[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
  minRating: number;
  minDownloads: number;
  sortBy: "relevance" | "date" | "rating" | "downloads" | "title";
  sortOrder: "asc" | "desc";
  uploader?: string;
}

interface EnhancedSearchProps {
  initialFilters?: Partial<SearchFilters>;
  onSearch: (filters: SearchFilters) => void;
  className?: string;
}

const defaultFilters: SearchFilters = {
  query: "",
  subjects: [],
  fileTypes: [],
  dateRange: {},
  minRating: 0,
  minDownloads: 0,
  sortBy: "relevance",
  sortOrder: "desc",
};

const subjects = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
  "Engineering", "Psychology", "Philosophy", "History", "Literature",
  "Economics", "Business", "Medicine", "Law", "Art", "Music"
];

const fileTypes = [
  { value: "pdf", label: "PDF", icon: "📄" },
  { value: "image", label: "Image", icon: "🖼️" },
  { value: "text", label: "Text", icon: "📝" },
];

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "date", label: "Upload Date" },
  { value: "rating", label: "Rating" },
  { value: "downloads", label: "Downloads" },
  { value: "title", label: "Title" },
];

export function EnhancedSearch({ 
  initialFilters = {}, 
  onSearch, 
  className 
}: EnhancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    ...defaultFilters,
    ...initialFilters,
  });
  
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleSearch = () => {
    onSearch(filters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const toggleSubject = (subject: string) => {
    const newSubjects = filters.subjects.includes(subject)
      ? filters.subjects.filter(s => s !== subject)
      : [...filters.subjects, subject];
    updateFilter("subjects", newSubjects);
  };

  const toggleFileType = (fileType: string) => {
    const newFileTypes = filters.fileTypes.includes(fileType)
      ? filters.fileTypes.filter(t => t !== fileType)
      : [...filters.fileTypes, fileType];
    updateFilter("fileTypes", newFileTypes);
  };

  const activeFiltersCount = 
    filters.subjects.length + 
    filters.fileTypes.length + 
    (filters.dateRange.from || filters.dateRange.to ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.minDownloads > 0 ? 1 : 0) +
    (filters.uploader ? 1 : 0);

  return (
    <div className={cn("flex gap-2", className)}>
      {/* Main Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search notes by title, subject, or content..."
          value={filters.query}
          onChange={(e) => updateFilter("query", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="w-full pl-10 pr-4"
          data-testid="search-input"
        />
      </div>

      {/* Quick Sort */}
      <Select
        value={filters.sortBy}
        onValueChange={(value: any) => updateFilter("sortBy", value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Advanced Filters */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="relative"
            data-testid="advanced-search-button"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-96 p-0" align="end">
          <div className="p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Advanced Search</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>

            {/* Subjects */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Subjects</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {subjects.map(subject => (
                  <button
                    key={subject}
                    onClick={() => toggleSubject(subject)}
                    className={cn(
                      "px-2 py-1 text-xs rounded-full border transition-colors",
                      filters.subjects.includes(subject)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted border-border"
                    )}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* File Types */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">File Types</Label>
              <div className="flex gap-2">
                {fileTypes.map(type => (
                  <div
                    key={type.value}
                    className={cn(
                      "flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors",
                      filters.fileTypes.includes(type.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted border-border"
                    )}
                    onClick={() => toggleFileType(type.value)}
                  >
                    <span>{type.icon}</span>
                    <span className="text-sm">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Upload Date</Label>
              <div className="flex items-center gap-2">
                <DatePicker
                  date={filters.dateRange.from}
                  onSelect={(date) => updateFilter("dateRange", { ...filters.dateRange, from: date })}
                  placeholder="From"
                />
                <span className="text-sm text-gray-500">to</span>
                <DatePicker
                  date={filters.dateRange.to}
                  onSelect={(date) => updateFilter("dateRange", { ...filters.dateRange, to: date })}
                  placeholder="To"
                />
              </div>
            </div>

            <Separator />

            {/* Rating Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Minimum Rating</Label>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{filters.minRating.toFixed(1)}</span>
                </div>
              </div>
              <Slider
                value={[filters.minRating]}
                onValueChange={(value) => updateFilter("minRating", value[0])}
                max={5}
                min={0}
                step={0.5}
                className="w-full"
              />
            </div>

            <Separator />

            {/* Downloads Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Minimum Downloads</Label>
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">{filters.minDownloads}</span>
                </div>
              </div>
              <Slider
                value={[filters.minDownloads]}
                onValueChange={(value) => updateFilter("minDownloads", value[0])}
                max={1000}
                min={0}
                step={10}
                className="w-full"
              />
            </div>

            <Separator />

            {/* Uploader */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Uploader</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by uploader..."
                  value={filters.uploader || ""}
                  onChange={(e) => updateFilter("uploader", e.target.value || undefined)}
                  className="pl-10"
                />
              </div>
            </div>

            <Separator />

            {/* Sort Order */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sort Order</Label>
              <div className="flex gap-2">
                <Button
                  variant={filters.sortOrder === "desc" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter("sortOrder", "desc")}
                  className="flex-1"
                >
                  Descending
                </Button>
                <Button
                  variant={filters.sortOrder === "asc" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter("sortOrder", "asc")}
                  className="flex-1"
                >
                  Ascending
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSearch} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2">
          {filters.subjects.map(subject => (
            <Badge key={subject} variant="secondary" className="text-xs">
              {subject}
              <button
                onClick={() => toggleSubject(subject)}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.fileTypes.map(type => (
            <Badge key={type} variant="secondary" className="text-xs">
              {type.toUpperCase()}
              <button
                onClick={() => toggleFileType(type)}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
