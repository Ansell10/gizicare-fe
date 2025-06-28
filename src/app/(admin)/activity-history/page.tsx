"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { format } from "date-fns";
import { Trash2, Activity, Bed, Footprints, Flame, Droplet, User2, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { id } from "date-fns/locale";

export default function ActivityHistoryPage() {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [profileId, setProfileId] = useState<string>("");
    const [profiles, setProfiles] = useState<any[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    //=========
    const itemsPerPage = 5;

    const paginatedActivities = activities.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(activities.length / itemsPerPage);


    //  ==========
    function getPaginationDisplay(current: number, total: number, maxButtons = 3) {
        if (total <= maxButtons + 2) return Array.from({ length: total }, (_, i) => i + 1);

        const buttons: (number | string)[] = [];

        if (current <= maxButtons) {
            buttons.push(...Array.from({ length: maxButtons }, (_, i) => i + 1), '...', total);
        } else if (current > total - maxButtons) {
            buttons.push(1, '...', ...Array.from({ length: maxButtons }, (_, i) => total - maxButtons + 1 + i));
        } else {
            buttons.push(1, '...', current - 1, current, current + 1, '...', total);
        }

        return buttons;
    }

    const fetchActivities = async () => {
        const token = Cookies.get("token");
        if (!token) return;

        try {
            setLoading(true);
            const profilesRes = await api.get("/profiles", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const profiles = profilesRes.data;
            if (profiles.length === 0) return;

            const firstProfileId = profiles[0].id;
            setProfileId(firstProfileId);

            const res = await api.get(`/activities?user_profiles_id=${firstProfileId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setActivities(res.data);
            setCurrentPage(1);
        } catch (err) {
            console.error("Gagal mengambil aktivitas:", err);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        // Ambil token dari cookie (karena route /profiles dan /exercises dilindungi auth:sanctum)
        const token = Cookies.get("token");

        // 1a) Fetch profiles milik user yang login
        if (token) {
            api
                .get("/profiles", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                .then((res) => {
                    setProfiles(res.data);
                    setSelectedProfile(res.data[0]);
                })
                .catch((err) => {
                    console.error("Gagal fetch profiles:", err);
                });
        }
        const load = async () => {
            setLoading(true);
            await fetchActivities();
            setLoading(false);
        };
        load();
    }, []);

    useEffect(() => {
        if (selectedProfile?.id) {
            const fetchData = async () => {
                setLoading(true);
                const token = Cookies.get("token");

                try {
                    const res = await api.get(`/activities?user_profiles_id=${selectedProfile.id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setActivities(res.data);
                    setCurrentPage(1);
                } catch (err) {
                    console.error("Gagal mengambil aktivitas:", err);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }
    }, [selectedProfile]);

    // useEffect(() => {
    //     fetchActivities();
    // }, []);

    const handleDelete = async (date: string) => {
        const token = Cookies.get("token");
        if (!token) return;

        if (!confirm(`Yakin ingin menghapus aktivitas pada ${date}?`)) return;

        try {
            setLoading(true);
            await api.delete(`/activities/date/${date}?user_profiles_id=${profileId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchActivities();
        } catch (err) {
            console.error("Gagal menghapus aktivitas:", err);
            alert("Gagal menghapus aktivitas.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Riwayat Aktivitas Harian</h2>
            {/* Pilih Pengguna */}
            <div className="w-full">
                <label
                    htmlFor="profile-select"
                    className="block text-sm font-medium text-gray-700 dark:text-white mb-1"
                >
                    Pilih Pengguna
                </label>

                <div className="relative">
                    <select
                        id="profile-select"
                        value={selectedProfile?.id || ""}
                        onChange={(e) => {
                            const p = profiles.find((p) => p.id === +e.target.value)!;
                            setSelectedProfile(p);
                        }}
                        className="
              block w-full pl-10 pr-3 py-2
              bg-white dark:bg-gray-800
              border border-gray-300 dark:border-gray-700
              rounded-md text-sm text-gray-800 dark:text-gray-200
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
              appearance-none
            "
                    >
                        <option value="" disabled>
                            — Pilih Profil —
                        </option>
                        {profiles.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>

                    {/* Icon user di kiri */}
                    <User2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-600 pointer-events-none" />

                    {/* Chevron kanan */}
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-600 pointer-events-none" />
                </div>

                {selectedProfile && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Berat: <strong>{selectedProfile.weight} kg</strong>, Umur:{" "}
                        <strong>{selectedProfile.age} tahun</strong>, Level:{" "}
                        <strong>{selectedProfile.activity_level}</strong>, BMR:{" "}
                        <strong>{Math.round(selectedProfile.bmr)}</strong>
                    </div>
                )}
            </div>
            <ComponentCard title="">
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="flex flex-col items-center space-y-3">
                            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                            <p className="text-gray-500 text-sm">Mengambil data aktivitas...</p>
                        </div>
                    </div>
                ) : activities.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Belum ada aktivitas yang tercatat.
                    </p>
                ) : (
                    <ul className="space-y-4">
                        {paginatedActivities.map((a) => (
                            <li
                                key={a.date}
                                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row md:justify-between items-start md:items-center"
                            >
                                <div className="space-y-2 w-full">
                                    <p className="text-xl font-semibold text-brand-600 dark:text-brand-400">
                                        {format(new Date(a.date), "EEEE, dd MMMM yyyy", { locale: id })}
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
                                        <p className="flex items-center gap-2">
                                            <Bed className="w-4 h-4 text-blue-500" />
                                            Tidur: <strong>{a.total_sleep}</strong> jam
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-green-500" />
                                            Olahraga: <strong>{a.latest_exercise_name ?? "-"}</strong> ({a.total_duration} menit)
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Footprints className="w-4 h-4 text-yellow-500" />
                                            Langkah: {(a.total_steps ?? 0).toLocaleString()}

                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Flame className="w-4 h-4 text-red-500" />
                                            Kalori: {a.total_calories?.toLocaleString()} kcal
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Droplet className="w-4 h-4 text-sky-500" />
                                            Air: {a.total_water} mL
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 md:mt-0 md:ml-4">
                                    <Button
                                        variant="outline"
                                        className="flex items-center text-red-600 border-red-500 hover:bg-red-500 hover:text-white"
                                        onClick={() => handleDelete(a.date)}
                                        disabled={loading}
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Hapus
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="flex justify-between items-center mt-6 px-4">
                    {/* Tombol Previous di kiri */}
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-lg border text-sm font-medium flex items-center gap-1 ${currentPage === 1
                                ? 'text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed'
                                : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        
                    </button>

                    {/* Tombol Angka di tengah */}
                    <div className="flex items-center space-x-1">
                        {getPaginationDisplay(currentPage, totalPages).map((page, idx) =>
                            typeof page === "number" ? (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 rounded-lg border text-sm font-medium ${currentPage === page
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {page}
                                </button>
                            ) : (
                                <span key={idx} className="px-3 py-1 text-gray-500 dark:text-gray-400">…</span>
                            )
                        )}
                    </div>

                    {/* Tombol Next di kanan */}
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-lg border text-sm font-medium flex items-center gap-1 ${currentPage === totalPages
                                ? 'text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed'
                                : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>




            </ComponentCard>
        </div>
    );
}
