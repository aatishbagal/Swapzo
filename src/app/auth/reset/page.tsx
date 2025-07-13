'use client';

import { useState } from 'react';
import { sendResetEmail } from '@/lib/firebase';
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handleReset = async () => {
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      const result = await sendResetEmail(email);
      setLoading(false);

      if (result.success) {
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 8000);
      } else {
        toast.error(result.message || 'Failed to send reset email.');
      }
    } catch (err) {
      setLoading(false);
      toast.error('Something went wrong. Try again.');
    }
  };

  return (
    <>
      {/* Reset Password Form */}
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md p-6 rounded-2xl shadow-lg border border-border bg-card backdrop-blur">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Reset Your Password</h2>

          <p className="text-muted-foreground mb-6 text-sm">
            Enter your registered email and we'll send you a reset link.
          </p>

          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4"
          />

          <Button
            onClick={handleReset}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <Link href="/auth" passHref>
            <Button
              variant="outline"
              className="w-full mt-3 text-muted-foreground hover:text-primary"
            >
              ← Back to Sign In
            </Button>
          </Link>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            You'll receive an email if this address is registered.
          </p>
        </div>
      </div>

      {/* Animated Confirmation Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-xl shadow-xl flex flex-col items-center text-center border border-border animate-fadeIn">
            <div className="w-20 h-20 flex items-center justify-center rounded-full border-4 border-green-500 bg-green-100 mb-4 animate-scaleIn">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-700 mb-2">Email Sent!</h3>
            <p className="text-muted-foreground text-sm">Check your inbox for password reset instructions.</p>
            <Button variant="ghost" className="mt-4" onClick={() => setShowPopup(false)}>Close</Button>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scaleIn {
          0% { transform: scale(0.3); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }
      `}</style>
    </>
  );
}
