import { Switch, Route } from "wouter";
import { Loader2 } from "lucide-react";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import CreateRidePage from "./pages/CreateRidePage";
import ProfilePage from "./pages/ProfilePage";
import { useUser } from "./hooks/use-user";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/rides" component={HomePage} />
        <Route path="/create" component={CreateRidePage} />
        <Route path="/profile" component={ProfilePage} />
        <Route>
          {/* 404 Not Found */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
              <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
            </div>
          </div>
        </Route>
      </Switch>
    </ErrorBoundary>
  );
}

export default App;