import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, X, Calendar, Star, FileText, Users, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { getSearchSuggestions, searchNotes } from "@/lib/api";
import { debounce } from "lodash";

interface SearchFilters {
  subject?: string;
  fileType?: string;
  professor?: string;
  course?: string;
  semester?: string;
  minRating?: number;
  sortBy?: string;
  tags?: string;
}

interface EnhancedSearchProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  onClear: () => void;
}

export function EnhancedSearch({ onSearch, onClear }: EnhancedSearchProps) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { data: suggestions = [] } = useQuery({
    queryKey: ['/api/search/suggestions', query],
    queryFn: () => getSearchSuggestions(query),
    enabled: query.length >= 2,
  });

  const debouncedSearch = debounce((searchQuery: string, searchFilters: SearchFilters) => {
    if (searchQuery.length >= 2 || Object.keys(searchFilters).length > 0) {
      onSearch(searchQuery, searchFilters);
    }
  }, 300);

  useEffect(() => {
    debouncedSearch(query, filters);
  }, [query, filters, debouncedSearch]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(value.length >= 2);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    searchInputRef.current?.blur();
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearAllFilters = () => {
    setQuery("");
    setFilters({});
    setShowSuggestions(false);
    onClear();
  };

  const activeFilterCount = Object.keys(filters).filter(key => filters[key as keyof SearchFilters] !== undefined).length;

  const subjects = [
    "All Subjects", "Mathematics", "Computer Science", "Physics", 
    "Chemistry", "Biology", "Literature", "History", "Economics", "Psychology"
  ];

  const fileTypes = [
    "All Types", "PDF", "Image", "Document", "Text", "Presentation"
  ];

  const semesters = [
    "All Semesters", "Fall 2024", "Spring 2024", "Summer 2024", 
    "Fall 2023", "Spring 2023", "Summer 2023"
  ];

  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "date", label: "Most Recent" },
    { value: "rating", label: "Highest Rated" },
    { value: "downloads", label: "Most Downloaded" },
    { value: "views", label: "Most Viewed" }
  ];

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search notes, courses, professors, or topics..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => setShowSuggestions(query.length >= 2)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="pl-10 pr-10"
                data-testid="search-input"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                  data-testid="clear-search"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    onClick={() => handleSuggestionClick(suggestion)}
                    data-testid={`suggestion-${index}`}
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-3 w-3 text-gray-400" />
                      <span className="text-sm">{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Toggle & Active Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
                data-testid="toggle-filters"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
                <ChevronDown className={`h-3 w-3 transition-transform ${
                  showFilters ? 'rotate-180' : ''
                }`} />
              </Button>
              
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-sm text-red-600 hover:text-red-700"
                  data-testid="clear-all-filters"
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Sort Options */}
            <Select value={filters.sortBy || "relevance"} onValueChange={(value) => updateFilter('sortBy', value)}>
              <SelectTrigger className="w-48" data-testid="sort-select">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4 mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Subject Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Subject</label>
                  <Select value={filters.subject || "All Subjects"} onValueChange={(value) => updateFilter('subject', value === "All Subjects" ? undefined : value)}>
                    <SelectTrigger data-testid="filter-subject">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* File Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">File Type</label>
                  <Select value={filters.fileType || "All Types"} onValueChange={(value) => updateFilter('fileType', value === "All Types" ? undefined : value)}>
                    <SelectTrigger data-testid="filter-file-type">
                      <SelectValue placeholder="Select file type" />
                    </SelectTrigger>
                    <SelectContent>
                      {fileTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Semester Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Semester</label>
                  <Select value={filters.semester || "All Semesters"} onValueChange={(value) => updateFilter('semester', value === "All Semesters" ? undefined : value)}>
                    <SelectTrigger data-testid="filter-semester">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters.map((semester) => (
                        <SelectItem key={semester} value={semester}>
                          {semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Text Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Professor</label>
                  <Input
                    type="text"
                    placeholder="Enter professor name"
                    value={filters.professor || ""}
                    onChange={(e) => updateFilter('professor', e.target.value)}
                    data-testid="filter-professor"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Course</label>
                  <Input
                    type="text"
                    placeholder="Enter course name or code"
                    value={filters.course || ""}
                    onChange={(e) => updateFilter('course', e.target.value)}
                    data-testid="filter-course"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Minimum Rating</label>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {filters.minRating || 0}+
                  </span>
                </div>
                <Slider
                  value={[filters.minRating || 0]}
                  onValueChange={([value]) => updateFilter('minRating', value)}
                  max={5}
                  step={0.5}
                  className="w-full"
                  data-testid="filter-rating"
                />
              </div>

              {/* Tags Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                <Input
                  type="text"
                  placeholder="e.g., calculus, midterm, solutions"
                  value={filters.tags || ""}
                  onChange={(e) => updateFilter('tags', e.target.value)}
                  data-testid="filter-tags"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}