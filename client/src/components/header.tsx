import { useState } from "react";
import { Link } from "wouter";
import { Search, Bell, Upload, Filter, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AdvancedSearch } from "@/components/advanced-search";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { useAuth } from "@/contexts/auth-context";

interface HeaderProps {
  onSearchChange: (query: string) => void;
  onUploadClick: () => void;
}

export function Header({ onSearchChange, onUploadClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout, isAuthenticated } = useAuth();

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
              <Link href="/browse" className="text-gray-600 hover:text-primary transition-colors" data-testid="nav-browse">
                Browse
              </Link>
              <Link href="/upload" className="text-gray-600 hover:text-primary transition-colors" data-testid="nav-upload">
                Upload
              </Link>
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

          {/* User Profile / Auth */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <NotificationCenter />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded-md transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 hidden md:block" data-testid="user-name">
                        {user?.username || 'User'}
                      </span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="w-full">
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="w-full">
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/bookmarks" className="w-full">
                        Bookmarks
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="w-full">
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={logout}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
