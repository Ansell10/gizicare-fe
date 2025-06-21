"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import SignInForm from "@/components/auth/SignInForm";

export default function SignIn() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  const [loading, setLoading] = useState(false); 

  const handleLogin = async (
    email: string,
    password: string,
    remember: boolean
  ) => {
    setError(null);
    setLoading(true);    // ⬅ mulai loading

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password, remember }), // send remember
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login gagal");
      }

      const data = await response.json();
      const token = data.access_token;
      if (!token) {
        setError("Token tidak ditemukan");
        return;
      }

      // if remember===true, cookie expires in 7 days; otherwise session cookie
      Cookies.set("token", token, {
        expires: remember ? 7 : undefined,
        secure: true,
        sameSite: "lax",
      });

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Terjadi kesalahan saat login.");
      setLoading(false);   // ⬅ hentikan loading saat error
    }
  };

  return (
    <SignInForm
      onSubmit={handleLogin}
      error={error}
      loading={loading}      // ⬅ teruskan prop loading
    />
  );
}
