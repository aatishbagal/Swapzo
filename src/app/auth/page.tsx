'use client';

import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { sendVerificationEmail } from '@/lib/firebase';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

import { auth, googleProvider } from '@/lib/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

// ---------------- Schema ----------------
const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const signUpSchema = z
  .object({
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z.string().min(6, {
      message: 'Password must be at least 6 characters.',
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

// ---------------- Google Icon ----------------
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M22.56 12.25C22.56 11.47 22.5 10.72 22.38 10H12V14.5H18.09C17.74 16.06 16.91 17.34 15.64 18.28V21.09H19.04C21.21 19.2 22.56 16.03 22.56 12.25Z"
      fill="currentColor"
    />
    <path
      d="M12 23C14.97 23 17.45 22.15 19.04 20.59L15.64 17.78C14.69 18.44 13.45 18.83 12 18.83C9.31 18.83 7.06 17.08 6.24 14.69H2.73V17.59C4.22 20.77 7.83 23 12 23Z"
      fill="currentColor"
    />
    <path
      d="M6.24 14.31C6.04 13.77 5.92 13.18 5.92 12.56C5.92 11.94 6.04 11.35 6.24 10.81V8.01001H2.73C1.96 9.49001 1.5 10.97 1.5 12.56C1.5 14.15 1.96 15.63 2.73 17.11L6.24 14.31Z"
      fill="currentColor"
    />
    <path
      d="M12 6.28001C13.52 6.28001 14.77 6.78001 15.64 7.59001L19.12 4.10001C17.45 2.47001 14.97 1.50001 12 1.50001C7.83 1.50001 4.22 3.73001 2.73 6.91001L6.24 9.71001C7.06 7.42001 9.31 6.28001 12 6.28001Z"
      fill="currentColor"
    />
  </svg>
);

// ---------------- Verification Modal ----------------
function VerificationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify Your Email</DialogTitle>
          <DialogDescription>
            We've sent a verification link to your email address. Please check your inbox and verify before logging in.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Main Component ----------------
export default function AuthPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast({ title: 'Success!', description: 'Signed in with Google successfully.' });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  const onSignInSubmit = async (data: SignInFormValues) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        toast({
          variant: 'destructive',
          title: 'Email Not Verified',
          description: 'Please verify your email before logging in.',
        });
        return;
      }

      toast({ title: 'Success!', description: 'Signed in successfully.' });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Email Sign-In Error:', error);
      toast({
        variant: 'destructive',
        title: 'Email Sign-In Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  const onSignUpSubmit = async (data: SignUpFormValues) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await sendVerificationEmail(user);
      setShowVerificationModal(true);
    } catch (error: any) {
      console.error('Email Sign-Up Error:', error);
      toast({
        variant: 'destructive',
        title: 'Email Sign-Up Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height,0px)-var(--footer-height,0px))] items-center justify-center bg-background p-4 md:p-6">
      <style jsx global>{`
        body {
          --header-height: 80px;
          --footer-height: 70px;
        }
        @media (max-width: 768px) {
          body {
            --footer-height: calc(70px + 60px);
          }
        }
      `}</style>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="items-center text-center">
          <Link href="/">
            <Image
              src="/assets/Swapzo-logo_V1.png"
              alt="SwapZo Logo"
              width={80}
              height={80}
              className="mb-4 rounded-lg"
              priority
            />
          </Link>
          <CardTitle className="text-2xl font-bold">Welcome to SwapZo</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one to start swapping.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* ---------------- Sign In ---------------- */}
            <TabsContent value="signin">
              <Form {...signInForm}>
                <form onSubmit={signInForm.handleSubmit(onSignInSubmit)} className="space-y-6">
                  <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn}>
                    <GoogleIcon className="mr-2 h-5 w-5" />
                    Sign in with Google
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  <FormField
                    control={signInForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input placeholder="name@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signInForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Password</FormLabel>
                          <Link href="/auth/reset" className="text-sm text-primary hover:underline">
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">Sign In</Button>
                </form>
              </Form>
            </TabsContent>

            {/* ---------------- Sign Up ---------------- */}
            <TabsContent value="signup">
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-6">
                  <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn}>
                    <GoogleIcon className="mr-2 h-5 w-5" />
                    Sign up with Google
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input placeholder="name@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">Create Account</Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">Privacy Policy</Link>.
          </p>
        </CardContent>
      </Card>

      {/* --------- Verification Popup Modal --------- */}
      <VerificationModal open={showVerificationModal} onClose={() => setShowVerificationModal(false)} />
    </div>
  );
}
