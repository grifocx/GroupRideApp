import { Switch, Route } from "wouter";
import { Loader2 } from "lucide-react";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import CreateRidePage from "./pages/CreateRidePage";
import { useUser } from "./hooks/use-user";

function App() {
  const { user, isLoading } = useUser();

  console.log("App render - User state:", { user, isLoading }); // Debug log

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    console.log("No user, showing AuthPage"); // Debug log
    return <AuthPage />;
  }

  console.log("User authenticated, showing routes"); // Debug log
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/create" component={CreateRidePage} />
    </Switch>
  );
}

export default App;