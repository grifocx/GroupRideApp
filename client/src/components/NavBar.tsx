import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { Link } from "wouter";
import { LogIn, LogOut, User, PlusCircle, Home, Map, Shield } from "lucide-react";

export function NavBar() {
  const { user, logout } = useUser();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-6 md:gap-8">
            <Link href="/">
              <a className="flex items-center space-x-2">
                <Map className="h-6 w-6" />
                <span className="font-bold inline-block">CycleGroup</span>
              </a>
            </Link>
            <div className="flex gap-6">
              <Link href="/">
                <a className="flex items-center gap-2 text-sm font-medium">
                  <Home className="h-4 w-4" />
                  Home
                </a>
              </Link>
              <Link href="/rides">
                <a className="flex items-center gap-2 text-sm font-medium">
                  <Map className="h-4 w-4" />
                  Rides
                </a>
              </Link>
              {user?.isAdmin && (
                <Link href="/admin">
                  <a className="flex items-center gap-2 text-sm font-medium">
                    <Shield className="h-4 w-4" />
                    Admin
                  </a>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link href="/create">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Create Ride
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Login / Register
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}