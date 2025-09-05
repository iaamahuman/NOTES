import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import NoteDetail from "@/pages/note-detail";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Profile from "@/pages/profile";
import Browse from "@/pages/browse";
import Upload from "@/pages/upload";
import Settings from "@/pages/settings";
import Bookmarks from "@/pages/bookmarks";
import About from "@/pages/about";
import NotFound from "@/pages/not-found";
import { RequireGuest, RequireAuth } from "@/components/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/browse" component={Browse} />
      <Route path="/upload">
        <RequireAuth>
          <Upload />
        </RequireAuth>
      </Route>
      <Route path="/bookmarks">
        <RequireAuth>
          <Bookmarks />
        </RequireAuth>
      </Route>
      <Route path="/settings">
        <RequireAuth>
          <Settings />
        </RequireAuth>
      </Route>
      <Route path="/about" component={About} />
      <Route path="/login">
        <RequireGuest>
          <Login />
        </RequireGuest>
      </Route>
      <Route path="/signup">
        <RequireGuest>
          <Signup />
        </RequireGuest>
      </Route>
      <Route path="/dashboard">
        <RequireAuth>
          <Dashboard />
        </RequireAuth>
      </Route>
      <Route path="/profile">
        <RequireAuth>
          <Profile />
        </RequireAuth>
      </Route>
      <Route path="/notes/:id" component={NoteDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="quill-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
