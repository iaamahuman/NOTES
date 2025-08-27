import { useState } from "react";
import { Link } from "wouter";
import { Search, Bell, Upload, Filter, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AdvancedSearch } from "@/components/advanced-search";

interface HeaderProps {
  onSearchChange: (query: string) => void;
  onUploadClick: () => void;
}

export function Header({ onSearchChange, onUploadClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearchChange(value);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="text-primary text-2xl font-bold">✒️</div>
              <Link href="/" className="text-2xl font-bold text-gray-900" data-testid="logo-link">
                Quill
              </Link>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="text-primary font-medium border-b-2 border-primary pb-1" data-testid="nav-browse">
                Browse Notes
              </Link>
              <button 
                onClick={onUploadClick}
                className="text-gray-600 hover:text-primary transition-colors"
                data-testid="nav-upload"
              >
                Upload
              </button>
              <Link href="/dashboard" className="text-gray-600 hover:text-primary transition-colors" data-testid="nav-dashboard">
                Dashboard
              </Link>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search notes by title, subject, or content..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10"
                  data-testid="search-input"
                />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" data-testid="advanced-search-button">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <AdvancedSearch 
                    onSearch={(filters) => {
                      // Handle advanced search
                      console.log("Advanced search filters:", filters);
                    }}
                    onClose={() => {}}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              data-testid="notifications-button"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </Button>
            <Link href="/dashboard">
              <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded-md transition-colors">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face"
                  alt="User Profile"
                  className="w-8 h-8 rounded-full"
                  data-testid="user-avatar"
                />
                <span className="text-sm font-medium text-gray-700 hidden md:block" data-testid="user-name">
                  Alex Chen
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
