"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";

interface SignInFormProps {
    onSubmit: (
        email: string,
        password: string,
        remember: boolean
    ) => Promise<void>;
    error: string | null;
    loading?: boolean;    // ⬅ tambahkan prop loading
}

export default function SignInForm({ onSubmit, error, loading = false }: SignInFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isChecked, setIsChecked] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        await onSubmit(email, password, isChecked);
    };

    return (
        <div className="flex flex-col flex-1 lg:w-1/2 w-full">
            <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                    <ChevronLeftIcon />
                    Back to Landing Page
                </Link>
            </div>

            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                <div>
                    <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                        Sign In
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Enter your email and password to sign in!
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    <div>
                        <Label>Email <span className="text-error-500">*</span></Label>
                        <Input
                            placeholder="info@gmail.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <Label>Password <span className="text-error-500">*</span></Label>
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <span
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                            >
                                {showPassword ? (
                                    <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                                ) : (
                                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Checkbox checked={isChecked} onChange={setIsChecked} />
                            <span className="text-sm text-gray-700 dark:text-gray-400">
                                Keep me logged in
                            </span>
                        </div>
                        <Link href="/reset-password" className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">
                            Forgot password?
                        </Link>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className="w-full flex items-center justify-center"
                        size="sm"
                        disabled={loading}     // ⬅ disable saat loading
                    >
                        {/* Spinner SVG jika loading === true */}
                        {loading && (
                            <svg
                                className="animate-spin h-5 w-5 mr-2 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                ></path>
                            </svg>
                        )}
                        {/* Teks tombol berubah saat loading */}
                        {loading ? "Signing In…" : "Sign in"}
                    </Button>
                    {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

                    <div className="mt-5 text-sm text-center text-gray-700 dark:text-gray-400">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                            Sign Up
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
