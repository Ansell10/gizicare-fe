"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

// Helper component untuk ikon fitur, versi light mode
const FeatureIcon = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center justify-center w-12 h-12 mb-4 bg-brand-100 rounded-full text-brand-600">
        {children}
    </div>
);

export default function LandingPage() {
    const [isScrolled, setIsScrolled] = useState(false);

    // Efek untuk header saat scroll
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Efek progress bar di atas
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });

    // Varian animasi (tetap sama)
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2, delayChildren: 0.3 },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
    };

    const featureVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.5,
            },
        },
    };

    return (
        <div className="min-h-screen bg-white text-gray-800 antialiased">
            {/* Progress Bar di atas */}
            <motion.div className="fixed top-0 left-0 right-0 h-1 bg-brand-600 origin-left z-[60]" style={{ scaleX }} />

            {/* Header dengan efek saat scroll */}
            <motion.header
                className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm" : "bg-transparent"
                    }`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
                    <Link href="/">
                        {/* Hanya satu logo untuk light mode */}
                        <Image
                            src="/images/logo/logo.svg"
                            alt="GiziCare Logo"
                            width={140}
                            height={35}
                        />
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link href="/signin" className="text-sm font-medium text-brand-600 hover:text-brand-500 transition-colors">
                            Masuk
                        </Link>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link href="/signup" className="text-sm font-medium text-white bg-brand-600 px-4 py-2 rounded-lg shadow-md hover:bg-brand-700 transition-colors">
                                Daftar
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </motion.header>

            {/* Hero Section */}
            <section className="px-6 pt-32 pb-20 text-center bg-gradient-to-b from-brand-50 to-white">
                <motion.div
                    className="max-w-4xl mx-auto"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.h1 variants={itemVariants} className="text-4xl font-extrabold tracking-tight md:text-6xl text-gray-900 mb-6">
                        Capai Tujuan Kesehatan Anda, <br />
                        <span className="text-brand-600">Satu Suapan pada Satu Waktu.</span>
                    </motion.h1>
                    <motion.p variants={itemVariants} className="text-lg mb-8 text-gray-600 max-w-2xl mx-auto">
                        GiziCare merupakan asisten nutrisi anda untuk melacak kalori, memahami makro, dan mencatat aktivitas harian yang dapat menghitung kalori harian yang anda butuhkan. 
                    </motion.p>
                    <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link href="/signup">
                            <span className="inline-block px-8 py-4 bg-brand-600 text-white font-bold rounded-lg shadow-lg hover:bg-brand-700 transition-transform duration-300 text-lg">
                                Mulai Hari Ini
                            </span>
                        </Link>
                    </motion.div>
                    {/* Visual Aplikasi */}
                    <motion.div variants={itemVariants} className="mt-16">
                        <Image
                            src="/images/product/activity-diary.webp"
                            alt="Tampilan dashboard GiziCare"
                            width={1000}
                            height={600}
                            className="rounded-xl shadow-2xl ring-1 ring-gray-900/10"
                            priority
                        />
                    </motion.div>
                </motion.div>
            </section>

            {/* Fitur Unggulan */}
            <section className="px-6 py-24 bg-white">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-4">Semua yang Anda Butuhkan untuk Kesehatan</h2>
                    <p className="text-gray-600 mb-16 max-w-2xl mx-auto">
                        Fitur-fitur kami dirancang untuk membuat pemantauan gizi menjadi mudah, intuitif, dan efektif.
                    </p>
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-left"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                    >
                        {/* Fitur 1 */}
                        <motion.div variants={featureVariants} className="p-8 bg-gray-50 rounded-xl shadow-sm hover:shadow-xl transition-shadow duration-300">
                            <FeatureIcon>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </FeatureIcon>
                            <h4 className="text-lg font-semibold mb-2">Visualisasi Data Interaktif</h4>
                            <p className="text-sm text-gray-600">
                                Lihat progres kalori harian Anda melalui grafik yang informatif dan mudah dimengerti.
                            </p>
                        </motion.div>
                        {/* Fitur 2 */}
                        <motion.div variants={featureVariants} className="p-8 bg-gray-50 rounded-xl shadow-sm hover:shadow-xl transition-shadow duration-300">
                            <FeatureIcon>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.176-5.97M15 21h6m-6-1a6 6 0 009-5.197M15 21h6" /></svg>
                            </FeatureIcon>
                            <h4 className="text-lg font-semibold mb-2">Profil Gizi Personal</h4>
                            <p className="text-sm text-gray-600">
                                Dapatkan rekomendasi BMR dan TDEE (target kalori) yang dihitung secara otomatis berdasarkan data berat badan, tinggi, umur, dan jenis kelamin Anda.
                            </p>
                        </motion.div>
                        {/* Fitur 3 */}
                        <motion.div variants={featureVariants} className="p-8 bg-gray-50 rounded-xl shadow-sm hover:shadow-xl transition-shadow duration-300">
                            <FeatureIcon>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </FeatureIcon>
                            <h4 className="text-lg font-semibold mb-2">Pencatatan Makanan Cepat</h4>
                            <p className="text-sm text-gray-600">
                                (Segera Hadir) Cari dan catat makanan Anda dalam hitungan detik.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Testimoni */}
            <section className="px-6 py-24 bg-brand-50">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                        <Image src="/images/user/car.webp" alt="Foto Pengguna" width={80} height={80} className="rounded-full mx-auto mb-4" />
                        <p className="text-xl italic text-gray-700 mb-4">
                            "GiziCare mengubah perspektif saya pada nutrisi makanan. Sekarang saya lebih sadar untuk mengontrol makan hingga berhasil mencapai berat badan ideal saya. Sangat direkomendasikan!"
                        </p>
                        <p className="font-semibold text-gray-900">Ken Anargya</p>
                        <p className="text-sm text-gray-500">Pengguna Aktif GiziCare</p>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 py-8 text-center text-sm text-gray-500 border-t border-gray-200">
                © 2025 GiziCare | Dibuat untuk meningkatkan kesadaran kesehatan di Indonesia.
            </footer>
        </div>
    );
}