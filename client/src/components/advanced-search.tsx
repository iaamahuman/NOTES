import { useState } from "react";
import { Search, Filter, Calendar, Star, FileType, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SearchFilters {
  query: string;
  subject: string;
  fileType: string;
  minRating: number;
  dateRange: string;
  sortBy: string;
  tags: string[];
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClose: () => void;
}

export function AdvancedSearch({ onSearch, onClose }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    subject: "",
    fileType: "",
    minRating: 0,
    dateRange: "",
    sortBy: "newest",
    tags: [],
  });

  const subjects = [
    "Mathematics", "Computer Science", "Physics", "Chemistry", 
    "Biology", "Literature", "History", "Economics", "Psychology"
  ];

  const fileTypes = [
    { value: "pdf", label: "PDF Documents" },
    { value: "image", label: "Images" },
    { value: "text", label: "Text Files" },
  ];

  const popularTags = [
    "calculus", "algorithms", "organic-chemistry", "quantum-physics",
    "molecular-biology", "shakespeare", "world-war", "microeconomics",
    "cognitive-psychology", "linear-algebra", "data-structures"
  ];

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleTagToggle = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
    onClose();
  };

  const clearFilters = () => {
    setFilters({
      query: "",
      subject: "",
      fileType: "",
      minRating: 0,
      dateRange: "",
      sortBy: "newest",
      tags: [],
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Advanced Search
        </CardTitle>
        <Button variant="ghost" onClick={onClose} data-testid="close-advanced-search">
          ×
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search Query */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Search Terms</label>
          <Input
            placeholder="Search notes, descriptions, courses..."
            value={filters.query}
            onChange={(e) => handleFilterChange("query", e.target.value)}
            className="w-full"
            data-testid="search-input"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Subject Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Subject
              </label>
              <Select
                value={filters.subject}
                onValueChange={(value) => handleFilterChange("subject", value)}
              >
                <SelectTrigger data-testid="subject-filter">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All subjects</SelectItem>
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
              <label className="text-sm font-medium flex items-center gap-2">
                <FileType className="h-4 w-4" />
                File Type
              </label>
              <Select
                value={filters.fileType}
                onValueChange={(value) => handleFilterChange("fileType", value)}
              >
                <SelectTrigger data-testid="file-type-filter">
                  <SelectValue placeholder="All file types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All file types</SelectItem>
                  {fileTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Minimum Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4" />
                Minimum Rating
              </label>
              <Select
                value={filters.minRating.toString()}
                onValueChange={(value) => handleFilterChange("minRating", parseInt(value))}
              >
                <SelectTrigger data-testid="rating-filter">
                  <SelectValue placeholder="Any rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any rating</SelectItem>
                  <SelectItem value="1">1+ stars</SelectItem>
                  <SelectItem value="2">2+ stars</SelectItem>
                  <SelectItem value="3">3+ stars</SelectItem>
                  <SelectItem value="4">4+ stars</SelectItem>
                  <SelectItem value="5">5 stars only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upload Date
              </label>
              <Select
                value={filters.dateRange}
                onValueChange={(value) => handleFilterChange("dateRange", value)}
              >
                <SelectTrigger data-testid="date-filter">
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                  <SelectItem value="year">This year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => handleFilterChange("sortBy", value)}
              >
                <SelectTrigger data-testid="sort-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="rating">Highest rated</SelectItem>
                  <SelectItem value="downloads">Most downloaded</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Popular Tags */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Popular Tags</label>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <Badge
                key={tag}
                variant={filters.tags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() => handleTagToggle(tag)}
                data-testid={`tag-${tag}`}
              >
                #{tag}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={clearFilters}
            data-testid="clear-filters"
          >
            Clear Filters
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              data-testid="cancel-search"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSearch}
              data-testid="apply-search"
              className="min-w-24"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.subject || filters.fileType || filters.minRating > 0 || filters.tags.length > 0) && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {filters.subject && (
                <Badge variant="secondary" data-testid="active-subject-filter">
                  Subject: {filters.subject}
                </Badge>
              )}
              {filters.fileType && (
                <Badge variant="secondary" data-testid="active-filetype-filter">
                  Type: {fileTypes.find(t => t.value === filters.fileType)?.label}
                </Badge>
              )}
              {filters.minRating > 0 && (
                <Badge variant="secondary" data-testid="active-rating-filter">
                  {filters.minRating}+ stars
                </Badge>
              )}
              {filters.tags.map((tag) => (
                <Badge key={tag} variant="secondary" data-testid={`active-tag-${tag}`}>
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}