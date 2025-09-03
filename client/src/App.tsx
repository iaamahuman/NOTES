import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
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
import { RequireGuest } from "@/components/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/browse" component={Browse} />
      <Route path="/upload" component={Upload} />
      <Route path="/bookmarks" component={Bookmarks} />
      <Route path="/settings" component={Settings} />
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
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/notes/:id" component={NoteDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
