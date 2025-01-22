import { Switch, Route, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useUser } from "./hooks/use-user";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PageTransition } from "./components/PageTransition";

// Page imports
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import CreateRidePage from "./pages/CreateRidePage";
import ProfilePage from "./pages/ProfilePage";
import CalendarPage from "./pages/CalendarPage";
import AdminPage from "./pages/AdminPage";
import RidePage from "./pages/RidePage";
import ArchivedRidesPage from "./pages/ArchivedRidesPage";

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-border" />
  </div>
);

// Landing page component
const LandingPage = () => (
  <PageTransition>
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
            Welcome to GroupRideApp - Find and Organize Bicycle Rides
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Join a vibrant community of cyclists to discover new routes, meet fellow riders, and participate in exciting group rides.
          </p>
          <AuthPage />
        </div>
      </main>
    </div>
  </PageTransition>
);

// 404 Page component
const NotFoundPage = () => (
  <PageTransition>
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
      </div>
    </div>
  </PageTransition>
);

function App() {
  const { user, isLoading } = useUser();
  const [location] = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <LandingPage />
      </AnimatePresence>
    );
  }

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        <Switch location={location} key={location}>
          <Route path="/" component={HomePage} />
          <Route path="/rides" component={HomePage} />
          <Route path="/rides/:id" component={RidePage} />
          <Route path="/create" component={CreateRidePage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/calendar" component={CalendarPage} />
          <Route path="/archived" component={ArchivedRidesPage} />
          {user.isAdmin && <Route path="/admin" component={AdminPage} />}
          <Route component={NotFoundPage} />
        </Switch>
      </AnimatePresence>
    </ErrorBoundary>
  );
}

export default App;