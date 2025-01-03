import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";

type FormData = {
  username: string;
  password: string;
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login, register } = useUser();

  const form = useForm<FormData>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      await (isLogin ? login(data) : register(data));
      toast({
        title: "Success",
        description: isLogin ? "Successfully logged in!" : "Successfully registered!",
      });
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-[400px] mx-4">
        <CardHeader>
          <CardTitle>{isLogin ? "Login" : "Register"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Username"
                {...form.register("username", { required: true })}
                disabled={isLoading}
              />
              {form.formState.errors.username && (
                <p className="text-sm text-red-500">Username is required</p>
              )}
              <Input
                type="password"
                placeholder="Password"
                {...form.register("password", { required: true })}
                disabled={isLoading}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">Password is required</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                isLogin ? "Login" : "Register"
              )}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => setIsLogin(!isLogin)}
              disabled={isLoading}
            >
              {isLogin ? "Need an account?" : "Already have an account?"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}