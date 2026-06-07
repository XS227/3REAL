"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type State = "pending" | "verifying" | "success" | "error" | "registered";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const registered = searchParams.get("registered");

  const [state, setState] = useState<State>(registered ? "registered" : token ? "verifying" : "pending");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token || registered) return;

    async function verify() {
      setState("verifying");
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok) {
          setState("success");
          setMessage(data.message ?? "Email verified.");
        } else {
          setState("error");
          setMessage(data.error ?? "Verification failed.");
        }
      } catch {
        setState("error");
        setMessage("A network error occurred.");
      }
    }

    verify();
  }, [token, registered]);

  if (state === "registered") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a verification link to your email address. Click it to activate your
            account and unlock KYC Tier 1.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">Back to sign in</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (state === "verifying") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verifying your email…</CardTitle>
          <CardDescription>Please wait a moment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === "success") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email verified!</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/auth/login">
            <Button className="w-full">Continue to sign in</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (state === "error") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verification failed</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2">
          <Link href="/auth/register">
            <Button variant="outline" className="w-full">Create a new account</Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="ghost" className="w-full">Back to sign in</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          A verification link was sent when you registered. Check your inbox and click the link.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Link href="/auth/login">
          <Button variant="outline" className="w-full">Back to sign in</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
