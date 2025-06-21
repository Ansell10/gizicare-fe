"use client";

import { useState } from "react";
import SignUpForm from "@/components/auth/SignUpForm";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function SignUp() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    name: string,
    email: string,
    password: string,
    password_confirmation: string,
    image: File | null,
    role: number // Tambahkan parameter role
  ) => {
    setError(null);
    setLoading(true);

    try {
      // 2. Get XSRF token from cookie
      const xsrfToken = Cookies.get("XSRF-TOKEN");

      // Karena ada file (image), harus pakai FormData
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('password_confirmation', password_confirmation);
      formData.append('role', role.toString()); // Menambahkan role ke dalam formData
      if (image) {
        formData.append('image', image);
      }

      // 3. Perform register request
      const response = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: {
          // "Content-Type": "application/json",
          "X-XSRF-TOKEN": xsrfToken ?? "",
          Accept: "application/json",
        },
        credentials: "include",
        body: formData
      });

      if (response.ok) {
        alert("Registrasi berhasil! Silakan login.");
        setLoading(false);
        router.push("/signin");
      } else {
        const err = await response.json();
        setError(err.message || "Registrasi gagal");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setError("Terjadi kesalahan saat registrasi.");
      setLoading(false);
    }
  };
  console.log("BASE_URL:", BASE_URL);

  return (
    <SignUpForm
      onSubmit={handleSubmit}
      error={error}
      loading={loading} // ← pass loading ke form
    />
  );
}
1