import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Loader2, User, KeyRound, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type FormData = {
  username: string;
  password: string;
  email?: string;
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
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <Card className="w-[400px] mx-4 overflow-hidden">
          <CardHeader className="space-y-1">
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <CardTitle className="text-2xl font-bold text-center">
                {isLogin ? "Welcome back!" : "Create an account"}
              </CardTitle>
              <p className="text-sm text-muted-foreground text-center">
                {isLogin
                  ? "Enter your credentials to access your account"
                  : "Enter your details to create your account"}
              </p>
            </motion.div>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Username"
                    {...form.register("username", { required: true })}
                    disabled={isLoading}
                    className="pl-10"
                  />
                </div>
                {form.formState.errors.username && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-destructive"
                  >
                    Username is required
                  </motion.p>
                )}
              </motion.div>

              {!isLogin && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="space-y-2"
                >
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email"
                      {...form.register("email", { 
                        required: !isLogin,
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address"
                        }
                      })}
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                  {form.formState.errors.email && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-destructive"
                    >
                      {form.formState.errors.email.message}
                    </motion.p>
                  )}
                </motion.div>
              )}

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Password"
                    {...form.register("password", { required: true })}
                    disabled={isLoading}
                    className="pl-10"
                  />
                </div>
                {form.formState.errors.password && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-destructive"
                  >
                    Password is required
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    isLogin ? "Sign In" : "Create Account"
                  )}
                </Button>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    form.reset();
                  }}
                  disabled={isLoading}
                >
                  {isLogin ? "Need an account?" : "Already have an account?"}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}