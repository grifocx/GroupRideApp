import { Switch, Route, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import CreateRidePage from "./pages/CreateRidePage";
import ProfilePage from "./pages/ProfilePage";
import CalendarPage from "./pages/CalendarPage";
import AdminPage from "./pages/AdminPage";
import RidePage from "./pages/RidePage";
import { useUser } from "./hooks/use-user";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./components/PageTransition";

function App() {
  const { user, isLoading } = useUser();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return (
      <AnimatePresence mode="wait">
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
      </AnimatePresence>
    );
  }

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        <Switch location={location} key={location}>
          <Route path="/">
            <PageTransition>
              <HomePage />
            </PageTransition>
          </Route>
          <Route path="/rides">
            <PageTransition>
              <HomePage />
            </PageTransition>
          </Route>
          <Route path="/rides/:id">
            <PageTransition>
              <RidePage />
            </PageTransition>
          </Route>
          <Route path="/create">
            <PageTransition>
              <CreateRidePage />
            </PageTransition>
          </Route>
          <Route path="/profile">
            <PageTransition>
              <ProfilePage />
            </PageTransition>
          </Route>
          <Route path="/calendar">
            <PageTransition>
              <CalendarPage />
            </PageTransition>
          </Route>
          {user.isAdmin && (
            <Route path="/admin">
              <PageTransition>
                <AdminPage />
              </PageTransition>
            </Route>
          )}
          <Route>
            <PageTransition>
              <div className="flex items-center justify-center min-h-screen p-4">
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                  <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
                </div>
              </div>
            </PageTransition>
          </Route>
        </Switch>
      </AnimatePresence>
    </ErrorBoundary>
  );
}

export default App;