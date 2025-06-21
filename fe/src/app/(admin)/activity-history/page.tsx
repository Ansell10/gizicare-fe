"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { format } from "date-fns";
import { Trash2, Activity, Bed, Footprints, Flame, Droplet } from "lucide-react";
import { id } from "date-fns/locale";

export default function ActivityHistoryPage() {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [profileId, setProfileId] = useState<string>("");

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
        } catch (err) {
            console.error("Gagal mengambil aktivitas:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchActivities();
            setLoading(false);
        };
        load();
    }, []);

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

            <ComponentCard title="Semua Aktivitas yang Tersimpan">
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
                        {activities.map((a) => (
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
            </ComponentCard>
        </div>
    );
}
