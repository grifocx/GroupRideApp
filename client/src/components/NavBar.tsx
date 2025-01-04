import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { Link } from "wouter";
import { LogIn, LogOut, User, PlusCircle, Home, Map, Shield, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

export function NavBar() {
  const { user, logout } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const NavItems = () => (
    <>
      <Link href="/">
        <a className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <Home className="h-4 w-4" />
          Home
        </a>
      </Link>
      <Link href="/rides">
        <a className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <Map className="h-4 w-4" />
          Rides
        </a>
      </Link>
      {user?.isAdmin && (
        <Link href="/admin">
          <a className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Shield className="h-4 w-4" />
            Admin Dashboard
          </a>
        </Link>
      )}
    </>
  );

  const AuthButtons = () => (
    <>
      {user ? (
        <>
          <Link href="/create">
            <Button variant="ghost" size="sm" className="gap-2 w-full justify-start md:w-auto md:justify-center">
              <PlusCircle className="h-4 w-4" />
              <span>Create Ride</span>
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="gap-2 w-full justify-start md:w-auto md:justify-center">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="gap-2 w-full justify-start md:w-auto md:justify-center"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </>
      ) : (
        <Link href="/auth">
          <Button variant="ghost" size="sm" className="gap-2 w-full justify-start md:w-auto md:justify-center" onClick={() => setIsOpen(false)}>
            <LogIn className="h-4 w-4" />
            <span>Login / Register</span>
          </Button>
        </Link>
      )}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-6 md:gap-8">
            <Link href="/">
              <a className="flex items-center space-x-2">
                <Map className="h-6 w-6" />
                <span className="font-bold inline-block">RideGroops</span>
              </a>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:gap-6">
              <NavItems />
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex md:items-center md:gap-2">
            <AuthButtons />
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="relative">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[340px] p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col py-2">
                <div className="flex flex-col space-y-1 px-2">
                  <Link href="/" onClick={() => setIsOpen(false)}>
                    <a className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                      <Home className="h-4 w-4" />
                      Home
                    </a>
                  </Link>
                  <Link href="/rides" onClick={() => setIsOpen(false)}>
                    <a className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                      <Map className="h-4 w-4" />
                      Rides
                    </a>
                  </Link>
                  {user?.isAdmin && (
                    <Link href="/admin" onClick={() => setIsOpen(false)}>
                      <a className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                        <Shield className="h-4 w-4" />
                        Admin Dashboard
                      </a>
                    </Link>
                  )}
                </div>
                <div className="border-t my-2" />
                <div className="flex flex-col space-y-1 px-2">
                  <AuthButtons />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}