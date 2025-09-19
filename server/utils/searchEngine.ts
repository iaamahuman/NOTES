import Fuse from 'fuse.js';
import type { NoteWithUploader } from '@shared/schema';

interface SearchFilters {
  search?: string;
  subject?: string;
  fileType?: string;
  professor?: string;
  course?: string;
  semester?: string;
  minRating?: number;
  tags?: string[];
  university?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface SearchOptions {
  sortBy?: 'relevance' | 'date' | 'rating' | 'downloads' | 'views';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface SearchResult {
  notes: NoteWithUploader[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class SearchEngine {
  private fuse: Fuse<NoteWithUploader>;
  
  constructor() {
    // Configure Fuse.js for fuzzy search
    const fuseOptions = {
      keys: [
        { name: 'title', weight: 0.3 },
        { name: 'description', weight: 0.2 },
        { name: 'subject', weight: 0.2 },
        { name: 'course', weight: 0.15 },
        { name: 'professor', weight: 0.1 },
        { name: 'tags', weight: 0.05 }
      ],
      threshold: 0.4, // Lower = more strict matching
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
      includeMatches: true,
      useExtendedSearch: true, // Enable advanced search patterns
    };
    
    this.fuse = new Fuse([], fuseOptions);
  }

  // Update the search index with new data
  updateIndex(notes: NoteWithUploader[]): void {
    this.fuse.setCollection(notes);
  }

  // Perform fuzzy search
  fuzzySearch(query: string): Array<{ item: NoteWithUploader; score?: number }> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Enhanced query preprocessing
    const processedQuery = this.preprocessQuery(query);
    const results = this.fuse.search(processedQuery);
    
    return results.map(result => ({
      item: result.item,
      score: result.score
    }));
  }

  // Preprocess search query for better matching
  private preprocessQuery(query: string): string {
    // Remove special characters and normalize
    let processed = query.toLowerCase().trim();
    
    // Handle common academic terms and abbreviations
    const replacements: Record<string, string> = {
      'calc': 'calculus',
      'bio': 'biology',
      'chem': 'chemistry',
      'phys': 'physics',
      'cs': 'computer science',
      'math': 'mathematics',
      'econ': 'economics',
      'psych': 'psychology',
      'eng': 'engineering',
      'hist': 'history',
      'lit': 'literature'
    };

    // Apply replacements
    for (const [abbrev, full] of Object.entries(replacements)) {
      const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
      processed = processed.replace(regex, full);
    }

    // Support OR and AND operations using Fuse extended search
    processed = processed
      .replace(/\bOR\b/gi, '|')  // Convert OR to pipe
      .replace(/\bAND\b/gi, ' '); // AND is default behavior

    return processed;
  }

  // Apply filters to notes array
  applyFilters(notes: NoteWithUploader[], filters: SearchFilters): NoteWithUploader[] {
    let filtered = [...notes];

    // Subject filter
    if (filters.subject && filters.subject !== 'All Subjects') {
      filtered = filtered.filter(note => 
        note.subject.toLowerCase().includes(filters.subject!.toLowerCase())
      );
    }

    // File type filter
    if (filters.fileType && filters.fileType !== 'All Types') {
      filtered = filtered.filter(note => note.fileType === filters.fileType);
    }

    // Professor filter
    if (filters.professor) {
      filtered = filtered.filter(note => 
        note.professor?.toLowerCase().includes(filters.professor!.toLowerCase())
      );
    }

    // Course filter
    if (filters.course) {
      filtered = filtered.filter(note => 
        note.course?.toLowerCase().includes(filters.course!.toLowerCase())
      );
    }

    // Semester filter
    if (filters.semester) {
      filtered = filtered.filter(note => 
        note.semester?.toLowerCase().includes(filters.semester!.toLowerCase())
      );
    }

    // Rating filter
    if (filters.minRating && filters.minRating > 0) {
      filtered = filtered.filter(note => 
        parseFloat(note.rating?.toString() || '0') >= filters.minRating!
      );
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(note => 
        note.tags && filters.tags!.some(tag => 
          note.tags!.some(noteTag => 
            noteTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    }

    // University filter (through uploader)
    if (filters.university) {
      filtered = filtered.filter(note => 
        note.uploader && 'university' in note.uploader &&
        (note.uploader as any).university?.toLowerCase().includes(filters.university!.toLowerCase())
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(note => 
        new Date(note.createdAt) >= fromDate
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter(note => 
        new Date(note.createdAt) <= toDate
      );
    }

    return filtered;
  }

  // Sort notes by various criteria
  sortNotes(notes: NoteWithUploader[], sortBy: string, order: 'asc' | 'desc' = 'desc'): NoteWithUploader[] {
    const sorted = [...notes];
    const multiplier = order === 'desc' ? -1 : 1;

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'rating':
          comparison = (parseFloat(a.rating?.toString() || '0') - parseFloat(b.rating?.toString() || '0'));
          break;
        case 'downloads':
          comparison = (a.downloads || 0) - (b.downloads || 0);
          break;
        case 'views':
          comparison = (a.views || 0) - (b.views || 0);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'fileSize':
          comparison = (a.fileSize || 0) - (b.fileSize || 0);
          break;
        default: // relevance or no sort
          return 0;
      }

      return comparison * multiplier;
    });

    return sorted;
  }

  // Paginate results
  paginate(notes: NoteWithUploader[], page: number = 1, limit: number = 20): SearchResult {
    const offset = (page - 1) * limit;
    const total = notes.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedNotes = notes.slice(offset, offset + limit);

    return {
      notes: paginatedNotes,
      total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  // Main search method that combines all functionality
  search(
    allNotes: NoteWithUploader[], 
    filters: SearchFilters, 
    options: SearchOptions = {}
  ): SearchResult {
    const {
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = options;

    let results: NoteWithUploader[] = allNotes;

    // Apply text search if provided
    if (filters.search && filters.search.trim()) {
      this.updateIndex(allNotes);
      const fuzzyResults = this.fuzzySearch(filters.search);
      
      if (fuzzyResults.length > 0) {
        results = fuzzyResults.map(result => result.item);
      } else {
        // Fallback to basic text matching if fuzzy search returns nothing
        const searchTerm = filters.search.toLowerCase();
        results = allNotes.filter(note => 
          note.title.toLowerCase().includes(searchTerm) ||
          note.description?.toLowerCase().includes(searchTerm) ||
          note.subject.toLowerCase().includes(searchTerm) ||
          note.course?.toLowerCase().includes(searchTerm) ||
          note.professor?.toLowerCase().includes(searchTerm) ||
          (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
      }
    }

    // Apply other filters
    results = this.applyFilters(results, filters);

    // Sort results
    if (sortBy !== 'relevance') {
      results = this.sortNotes(results, sortBy, sortOrder);
    }

    // Paginate and return
    return this.paginate(results, page, limit);
  }

  // Get search suggestions based on existing data
  getSuggestions(query: string, allNotes: NoteWithUploader[], limit: number = 5): string[] {
    if (!query || query.length < 2) return [];

    const suggestions = new Set<string>();
    const searchTerm = query.toLowerCase();

    // Extract suggestions from various fields
    allNotes.forEach(note => {
      // Title suggestions
      if (note.title.toLowerCase().includes(searchTerm)) {
        suggestions.add(note.title);
      }
      
      // Subject suggestions
      if (note.subject.toLowerCase().includes(searchTerm)) {
        suggestions.add(note.subject);
      }
      
      // Course suggestions
      if (note.course?.toLowerCase().includes(searchTerm)) {
        suggestions.add(note.course);
      }
      
      // Professor suggestions
      if (note.professor?.toLowerCase().includes(searchTerm)) {
        suggestions.add(note.professor);
      }
      
      // Tag suggestions
      if (note.tags) {
        note.tags.forEach(tag => {
          if (tag.toLowerCase().includes(searchTerm)) {
            suggestions.add(tag);
          }
        });
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }
}

// Export singleton instance
export const searchEngine = new SearchEngine();