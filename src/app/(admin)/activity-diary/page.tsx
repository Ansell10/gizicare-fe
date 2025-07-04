"use client";

import React, { useState, useEffect } from "react";
import { format, addDays, isToday } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import api from "@/lib/axios";
import Cookies from "js-cookie"; // ← IMPORT Cookies, agar bisa mengambil token
import {
    ArrowLeft,
    ArrowRight,
    Bed,
    Activity,
    Clock,
    Footprints,
    Scale,
    Zap,
    Droplet,
    TrendingUp,
    TrendingDown,
    Drumstick,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, User2, ChevronDown } from "lucide-react";
import Image from "next/image";

const StatCard = ({
    Icon,
    title,
    value,
    trend,
}: {
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    value: string | number;
    trend?: string;
}) => (
    <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800 flex items-center gap-3">
        <Icon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{value}</div>
            {trend && <div className="text-sm text-green-500 mt-1">{trend}</div>}
        </div>
    </div>
);

const ArticleCard = ({
    title,
    summary,
    kcal,
    tag,
    image_url,
}: {
    title: string;
    summary: string;
    kcal?: number;
    tag?: string;
    image_url?: string;
}) => (
    <div className="rounded-lg bg-white dark:bg-gray-800 shadow-md h-full flex flex-col">
        {image_url && (
            <div className="relative w-full h-32 sm:h-40 overflow-hidden rounded-t-lg">
                <Image
                    src={image_url}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                />
            </div>
        )}

        <div className="p-4 flex flex-col flex-grow">
            <div className="flex items-center justify-between mb-2">
                {tag && (
                    <span className="bg-green-100 text-green-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded dark:bg-green-200 dark:text-green-900">
                        {tag}
                    </span>
                )}
                {kcal !== undefined && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{kcal} kcal</span>
                )}
            </div>
            <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-1">{title}</h4>
            <p className="text-sm text-gray-600 dark:text-white/80 flex-grow">{summary}</p>
        </div>
    </div>
);

function calculateBMI(weight: number, height: number) {
    const heightM = height / 100;
    return weight / (heightM * heightM);
}

function calculateTEE(bmr: number, activityLevel: number) {
    return bmr * activityLevel;
}

function checkNutritionStatus(intake: number, tee: number) {
    if (intake < tee) return "Kekurangan kalori";
    if (intake === tee) return "Kalori terpenuhi";
    return "Kelebihan kalori";
}

function caloriesFromSteps(steps: number, weightKg?: number) {
    // Jika berat null/undefined, fallback ke rata-rata 60 kg
    const weight = weightKg ?? 60;
    return steps * weight * 0.0005;
}

function getActivityFactor(level: string): number {
    const map: Record<string, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        "very active": 1.9,
    };
    return map[level] || 1.2;
}

export default function ActivityDiaryDashboard() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [activityTitle, setActivityTitle] = useState("");
    const [activityDetails, setActivityDetails] = useState("");
    const [sleepHours, setSleepHours] = useState("");
    const [exerciseId, setExerciseId] = useState<string>("");
    const [duration, setDuration] = useState("");
    const [stepCount, setStepCount] = useState("");
    const [profiles, setProfiles] = useState<any[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
    const [articles, setArticles] = useState<any[]>([]);
    const [articleIndex, setArticleIndex] = useState(0);
    const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
    const [filterActivityLevel, setFilterActivityLevel] = useState<string>("");
    const [exercises, setExercises] = useState<any[]>([]);
    const [dailyActivity, setDailyActivity] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [direction, setDirection] = useState(0);

    const [loadingActivity, setLoadingActivity] = useState(false);

    //
    const MotionButton = motion.create(Button);

    // ───────────────────────────────────────────────────
    //  1) FETCH PROFILE DAN EXERCISES SEKALIGUS SAAT KOMONEN DI‐MOUNT
    // ───────────────────────────────────────────────────
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

        // 1b) Fetch daftar exercises agar dropdown tidak kosong
        if (token) {
            api
                .get("/exercises", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                .then((res) => {
                    setExercises(res.data);
                })
                .catch((err) => {
                    console.error("Gagal fetch exercises:", err);
                });
        }
    }, []);

    // ───────────────────────────────────────────────────
    //  2) FETCH DAFTAR ARTICLES & DAFTAR ACTIVITIES SETIAP KALI SELECTED PROFILE BERUBAH
    // ───────────────────────────────────────────────────
    useEffect(() => {
        if (!selectedProfile) return;

        const level = filterActivityLevel || selectedProfile.activity_level;

        // Kita asumsikan token tetap sama, agar bisa mengakses /articles dan /activities
        const token = Cookies.get("token");
        if (!token) return;

        // Fetch artikel berdasarkan activity_level
        api
            .get(`/articles?activity_level=${level}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                setArticles(res.data);
                setArticleIndex(0);
            })
            .catch(console.error);

        // Fetch semua aktivitas milik profil tertentu (bisa untuk statistik bulanan)
        api
            .get(`/activities?user_profiles_id=${selectedProfile.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setActivities(res.data))
            .catch(console.error);
    }, [selectedProfile, filterActivityLevel]);

    // ───────────────────────────────────────────────────
    //  3) FETCH DAILY ACTIVITY (DATA PADA TANGGAL TERPILIH)
    // ───────────────────────────────────────────────────
    useEffect(() => {
        if (!selectedProfile) return;
        const token = Cookies.get("token");
        if (!token) return;

        const d = format(selectedDate, "yyyy-MM-dd");
        api
            .get(`/activities?user_profiles_id=${selectedProfile.id}&date=${d}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                const summary = res.data[0] || null;
                setDailyActivity(summary);
            })
            .catch(() => setDailyActivity(null));
    }, [selectedProfile, selectedDate]);

    const refreshDailyActivity = async () => {
        if (!selectedProfile) return;
        const token = Cookies.get("token");
        if (!token) return;

        const d = format(selectedDate, "yyyy-MM-dd");
        try {
            const res = await api.get(
                `/activities?user_profiles_id=${selectedProfile.id}&date=${d}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDailyActivity(res.data[0] || null);
        } catch (err) {
            console.error("Gagal refresh dailyActivity:", err);
        }
    };

    let bmi = 0;
    let bmr = 0;
    let tee = 0;
    let nutritionStatus = "-";

    //dummy intake

    // const waterIntake = 0;
    const calorieIntake = 0; // belum terintegrasi

    if (selectedProfile) {
        const user = {
            weight: selectedProfile.weight,
            height: selectedProfile.height,
            age: selectedProfile.age,
            gender: selectedProfile.gender,
            activityLevel: getActivityFactor(selectedProfile.activity_level),
            dailyIntake: calorieIntake,
        };
        bmi = calculateBMI(user.weight, user.height);
        bmr = selectedProfile.bmr || 0;
        tee = calculateTEE(bmr, user.activityLevel);
        nutritionStatus = checkNutritionStatus(user.dailyIntake, tee);
    }

    // setelah kamu definisikan tee …
    const caloriesIn = dailyActivity?.total_calories ?? 0;

    // hitung kalori exercise
    const met = dailyActivity?.latest_exercise_met
        ? (exercises.find((e) => e.id === dailyActivity.latest_exercise_id)
            ?.met_value ?? 1)
        : 0;

    const totalMinutes = dailyActivity?.total_duration ?? 0;
    const durationHours = totalMinutes / 60;
    const caloriesBurnedExercise =
        met * (selectedProfile?.weight ?? 0) * durationHours;

    // hitung kalori dari langkah
    const steps = dailyActivity?.total_steps ?? 0;
    const caloriesBurnedSteps = caloriesFromSteps(
        steps,
        selectedProfile?.weight
    );

    // Total kalori terbakar = exercise + langkah
    const caloriesBurned = caloriesBurnedExercise + caloriesBurnedSteps;

    // remaining = TEE + calories burned − calorie intake

    // const remainingCalories = Math.round(tee + caloriesBurned - caloriesIn);

    // SISA KALORI: TEE - asupan kalori saja (tanpa kalori terbakar olahraga)
    const remainingCalories = Math.round(tee - caloriesIn);

    // ── HITUNG TARGET HIDRASI ──
    const weightKg = selectedProfile?.weight ?? 0;
    const recommendedWaterMl = weightKg * 50; // 50 mL per kg
    const waterConsumed = dailyActivity?.total_water ?? 0; // asupan hari ini

    //Tidur
    const sleep = dailyActivity?.total_sleep ?? 0;

    // 🔄 HANDLE SUBMIT KHUSUS OLAHRAGA
    const handleSubmitExercise = async () => {
        if (!selectedProfile) return;
        if (loadingActivity) return;
        setLoadingActivity(true);

        const durationNumber = parseInt(duration);
        if (isNaN(durationNumber) || durationNumber <= 0) {
            alert("Durasi olahraga harus lebih dari 0 menit.");
            setLoadingActivity(false);
            return;
        }

        const token = Cookies.get("token");
        if (!token) {
            alert("Token tidak ditemukan, silakan login ulang.");
            setLoadingActivity(false);
            return;
        }
        // Cek jika kosong
        if (!activityTitle.trim()) {
            alert("Nama aktivitas wajib diisi.");
            setLoadingActivity(false);
            return;
        }

        // Cek jika isinya angka semua
        if (/^\d+$/.test(activityTitle.trim())) {
            alert("Nama aktivitas tidak boleh hanya berupa angka.");
            setLoadingActivity(false);
            return;
        }

        const payload = {
            user_profiles_id: selectedProfile.id,
            date: format(selectedDate, "yyyy-MM-dd"),
            activity: activityTitle,
            detail: activityDetails,
            exercise_id: exerciseId ? parseInt(exerciseId, 10) : null,
            duration: durationNumber,
        };


        try {
            await api.post("/activities", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Olahraga berhasil disimpan!");
            await refreshDailyActivity();
            // Reset form olahraga
            setActivityTitle("");
            setActivityDetails("");
            setExerciseId("");
            setDuration("");
        } catch (err) {
            console.error("Error simpan olahraga:", err);
            alert("Gagal menyimpan olahraga.");
        } finally {
            // Pastikan ini selalu dijalankan agar tombol kembali enabled
            setLoadingActivity(false);
        }
    };


    // 🔄 HANDLE SUBMIT KHUSUS LANGKAH + TIDUR
    const handleSubmitStepsSleep = async () => {
        if (!selectedProfile) return;
        if (loadingActivity) return;
        setLoadingActivity(true);
        const sleep = parseInt(sleepHours);
        const steps = parseInt(stepCount);

        if (isNaN(sleep) || sleep < 0) {
            alert("Durasi tidur tidak boleh negatif.");
            setLoadingActivity(false);
            return;
        }

        if (isNaN(steps) || steps < 0) {
            alert("Jumlah langkah tidak boleh negatif.");
            setLoadingActivity(false);
            return;
        }

        const token = Cookies.get("token");
        if (!token) {
            alert("Token tidak ditemukan, silakan login ulang.");
            setLoadingActivity(false);
            return;
        }


        const payload = {
            user_profiles_id: selectedProfile.id,
            date: format(selectedDate, "yyyy-MM-dd"),
            steps: parseInt(stepCount) || 0,
            sleep: parseInt(sleepHours) || 0,
        };

        try {
            await api.post("/activities", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Langkah & tidur berhasil disimpan!");
            await refreshDailyActivity();
            setStepCount("");
            setSleepHours("");
        } catch (err) {
            console.error("Error simpan langkah+tidur:", err);
            alert("Gagal menyimpan langkah & tidur.");
        } finally {
            setLoadingActivity(false);
        }
    };



    const displayedArticles = articles.slice(articleIndex, articleIndex + 2);

    return (
        <div className="space-y-8">
            {/* Greeting */}
            <div className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                {selectedProfile ? `Hai, ${selectedProfile.name}!` : "Selamat datang!"}
            </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard Icon={(props) => <Bed {...props} className="w-6 h-6 text-purple-400 dark:text-purple-500" />} title="Durasi Tidur" value={`${sleep} jam`} />
                <StatCard
                    Icon={(props) => <Activity {...props} className="w-6 h-6 text-pink-400 dark:text-pink-500" />}
                    title="Jenis Olahraga Terakhir"
                    value={dailyActivity?.latest_exercise_name || "-"}
                />
                {/* <StatCard
                    Icon={Clock}
                    title="Durasi Olahraga"
                    value={`${dailyActivity?.total_duration ?? 0} menit`}
                />
                <StatCard
                    Icon={Footprints}
                    title="Jumlah Langkah"
                    value={dailyActivity?.total_steps ?? 0}
                /> */}

                <StatCard Icon={(props) => <Scale {...props} className="w-6 h-6 text-yellow-400 dark:text-yellow-500" />} title="BMI" value={bmi.toFixed(1)} />
                {/* Ganti StatCard Zap dengan custom card */}
                <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800 flex items-center justify-between">
                    {/* Icon + Title & Value di kiri */}
                    <div className="flex items-center gap-3">
                        <Zap className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                        <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                TEE (Target Kalori)
                            </div>
                            <div className="text-2xl font-bold text-gray-800 dark:text-white">
                                {tee.toFixed(0)} kcal
                            </div>
                            {/* Progress Bar */}
                            <div className="w-40 h-2 bg-gray-200 rounded mt-2 overflow-hidden">
                                <div
                                    className="h-2 bg-green-400 rounded transition-all duration-700"
                                    style={{
                                        width: `${Math.min((caloriesIn / (tee || 1)) * 100, 100)}%`
                                    }}
                                />
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                                Asupan: {caloriesIn} kcal ({Math.round((caloriesIn / (tee || 1)) * 100)}%)
                            </div>
                        </div>
                    </div>

                    {/* Trend di kanan */}
                    <div className="text-sm text-green-500 whitespace-nowrap">
                        Kurang {remainingCalories} kcal 
                    </div>
                </div>

                {/* GANTI StatCard “Asupan Air” dengan ini saja */}
                <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Droplet className="w-6 h-6 text-blue-400 dark:text-blue-500" />
                        <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Asupan Air</div>
                            <div className="text-2xl font-bold">
                                {dailyActivity?.total_water ?? waterConsumed} mL
                            </div>
                            {/* Progress Bar */}
                            <div className="w-40 h-2 bg-gray-200 rounded mt-2">
                                <div
                                    className="h-2 bg-blue-400 rounded"
                                    style={{
                                        width: `${Math.min((waterConsumed / (recommendedWaterMl || 1)) * 100, 100)}%`
                                    }}
                                />
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                                Target: {recommendedWaterMl} mL ({Math.round((waterConsumed / (recommendedWaterMl || 1)) * 100)}%)
                            </div>
                        </div>
                    </div>
                    <div className="text-sm text-green-500 mt-1">
                        Kurang {recommendedWaterMl - waterConsumed} mL
                    </div>
                </div>

                {/* <StatCard
                    Icon={Drumstick}
                    title="Asupan Kalori"
                    value={`${dailyActivity?.total_calories ?? calorieIntake} kcal`}
                /> */}
                <StatCard
                    Icon={(props) =>
                        nutritionStatus === "Kekurangan kalori"
                            ? <TrendingDown {...props} className="w-6 h-6 text-red-400 dark:text-red-500" />
                            : <TrendingUp {...props} className="w-6 h-6 text-green-400 dark:text-green-500" />
                    }
                    title="Status Nutrisi"
                    value={nutritionStatus}
                />

                {/* CARD BARU: Kalori Terbakar, Langkah, Durasi Olahraga */}
                <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <Zap className="w-6 h-6 text-orange-400 dark:text-orange-500" />
                        <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Kalori Terbakar (Aktivitas)
                            </div>
                            <div className="text-2xl font-bold text-gray-800 dark:text-white">
                                {Math.round(caloriesBurned)} kcal
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 dark:text-gray-300">
                        <span>
                            <Footprints className="inline w-4 h-4 mr-1 text-indigo-400 dark:text-indigo-500" />
                            Langkah: <b>{steps}</b>
                        </span>
                        <span>
                            <Activity className="inline w-4 h-4 mr-1 text-pink-400 dark:text-pink-500" />
                            Durasi Olahraga: <b>{totalMinutes}</b> menit
                        </span>
                    </div>
                </div>
            </div>

            

            {/* ◀️ Date Navigation ▶️ */}
            <div className="flex items-center justify-between my-6">
                <MotionButton
                    onClick={() => setSelectedDate((d) => addDays(d, -1))}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center px-4 py-2 text-base font-semibold rounded shadow hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Kemarin
                </MotionButton>

                <div className="text-lg font-bold text-gray-800 dark:text-white">
                    {format(selectedDate, "dd MMMM yyyy")}
                </div>

                <MotionButton
                    onClick={() => setSelectedDate((d) => addDays(d, 1))}
                    disabled={isToday(selectedDate)}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center px-4 py-2 text-base font-semibold rounded shadow hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                    Besok
                    <ArrowRight className="w-5 h-5 ml-2" />
                </MotionButton>
            </div>

            {/* Catatan Harian */}
            {/* === FORM OLAHRAGA === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ComponentCard title="Catatan Olahraga">
                    {/* –– Kalendar tetap di atas */}
                    <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        className="rounded-md border"
                        style={
                            {
                                "--rdp-accent-color": "#22c55e",
                                "--rdp-accent-color-hover": "#16a34a",
                            } as React.CSSProperties
                        }
                    />
                    <div className="mt-4 space-y-4">
                        <label htmlFor="input-activity" className="text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                            Nama Aktivitas
                        </label>
                        <Input
                            id="input-activity"
                            type="text"
                            placeholder="Masukkan aktivitas/kegiatan yang dilakukan"
                            value={activityTitle}
                            onChange={(e) => setActivityTitle(e.target.value)}
                        />
                        <label htmlFor="Detail Aktivitas" className="text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                            Detail
                        </label>
                        <TextArea
                            placeholder="Rincian aktivitas/kegiatan yang dilakukan"
                            value={activityDetails}
                            onChange={(value) => setActivityDetails(value)}
                            className="h-24"
                        />
                        <select
                            value={exerciseId}
                            onChange={(e) => setExerciseId(e.target.value)}
                            required
                            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="" disabled hidden>
                                Pilih Jenis Olahraga
                            </option>
                            {exercises.map((ex) => (
                                <option key={ex.id} value={ex.id}>
                                    {ex.name}
                                </option>
                            ))}
                        </select>
                        <label htmlFor="" className="text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                            Durasi Olahraga
                        </label>
                        <Input
                            type="number"
                            min="1"
                            placeholder="Durasi Olahraga (menit)"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                        />


                        <Button
                            onClick={handleSubmitExercise}
                            disabled={loadingActivity}
                            className="w-full flex justify-center"
                        >
                            {loadingActivity && (
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
                            {loadingActivity ? "Menyimpan Olahraga…" : "Simpan Olahraga"}
                        </Button>

                    </div>
                </ComponentCard>

                <ComponentCard title="Langkah & Tidur" className="flex flex-col">
                    <div className="px-4 py-3 space-y-4">
                        {/* Input Jumlah Langkah */}
                        <div className="flex flex-col">
                            <label htmlFor="input-steps" className="text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                                Jumlah Langkah
                            </label>
                            <Input
                                id="input-steps"
                                type="number"
                                min="1"
                                placeholder="Masukkan jumlah langkah"
                                value={stepCount}
                                onChange={(e) => setStepCount(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Input Durasi Tidur */}
                        <div className="flex flex-col">
                            <label htmlFor="input-sleep" className="text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                                Durasi Tidur (jam)
                            </label>
                            <Input
                                id="input-sleep"
                                type="number"
                                min="1"
                                placeholder="Masukkan durasi tidur"
                                value={sleepHours}
                                onChange={(e) => setSleepHours(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Tombol Simpan */}
                        <div className="pt-2">
                            <Button
                                onClick={handleSubmitStepsSleep}
                                disabled={loadingActivity || !stepCount || !sleepHours}
                                className="w-full flex items-center justify-center disabled:opacity-50"
                            >
                                {loadingActivity && (
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
                                {loadingActivity ? "Menyimpan Langkah & Tidur…" : "Simpan Data"}
                            </Button>

                        </div>
                    </div>

                    {/* Garis Pembatas */}
                    <div className="border-t border-gray-200 dark:border-gray-700 mt-2"></div>

                    {/* ==== Bagian Statistik ==== */}
                    <div className="px-4 py-4">
                        {/* <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">
                            Statistik Kalori Harian
                        </h3> */}
                        {/* <StatisticsChart
                            activities={activities}
                            tee={selectedProfile?.tdee ?? 0}
                        /> */}
                    </div>
                </ComponentCard>

            </div>



            {/* Ringkasan Bulanan */}
            {/* <ComponentCard title="Ringkasan Bulanan Aktivitas">
                <MonthlySalesChart />
            </ComponentCard> */}

            {/* Rekomendasi Artikel */}
            <ComponentCard title="Rekomendasi Artikel untuk Kamu">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <h3 className="text-md font-semibold text-gray-800 dark:text-white">
                        Filter Rekomendasi Berdasarkan Aktivitas
                    </h3>

                    <div className="relative w-full sm:w-64">
                        {/* Icon filter di kiri */}
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />

                        <select
                            value={filterActivityLevel}
                            onChange={(e) => setFilterActivityLevel(e.target.value)}
                            className="
                block w-full
                pl-10 pr-10 py-2
                bg-white dark:bg-gray-800
                border border-gray-300 dark:border-gray-700
                rounded-md text-sm text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500
                appearance-none
              "
                        >
                            <option value="">Default (Sesuai Profil)</option>
                            <option value="sedentary">Sedentary</option>
                            <option value="light">Light</option>
                            <option value="moderate">Moderate</option>
                            <option value="active">Active</option>
                            <option value="very active">Very Active</option>
                        </select>

                        {/* Chevron dropdown di kanan */}
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    </div>
                </div>

                {/* /////// */}

                <div className="flex items-center justify-center gap-4">
                    {/* Tombol Kiri */}
                    <AnimatePresence>
                        {articleIndex > 0 && (
                            <motion.button
                                key="prev-button"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => {
                                    setDirection(-1); // Set arah ke kiri
                                    setArticleIndex((prev) => Math.max(prev - 2, 0));
                                }}
                                className="rounded-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 self-center"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Wadah untuk Kartu Artikel */}
                    <div className="flex-grow">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={articleIndex} // Kunci animasi sekarang adalah index halaman
                                custom={direction}
                                variants={{
                                    enter: (direction) => ({
                                        x: direction > 0 ? 50 : -50,
                                        opacity: 0,
                                    }),
                                    center: {
                                        x: 0,
                                        opacity: 1,
                                    },
                                    exit: (direction) => ({
                                        x: direction < 0 ? 50 : -50,
                                        opacity: 0,
                                    }),
                                }}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 },
                                }}
                                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                            >
                                {displayedArticles.map((article) => (
                                    // motion.div di sini dihapus, karena kita menganimasikan wadahnya
                                    <div
                                        key={article.id}
                                        onClick={() => setSelectedArticle(article)}
                                        className="cursor-pointer"
                                    >
                                        <ArticleCard
                                            title={article.title}
                                            summary={article.summary}
                                            tag={article.tag}
                                            image_url={article.image_url}
                                        />
                                    </div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Tombol Kanan */}
                    <AnimatePresence>
                        {articleIndex + 2 < articles.length && (
                            <motion.button
                                key="next-button"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => {
                                    setDirection(1); // Set arah ke kanan
                                    setArticleIndex((prev) => prev + 2);
                                }}
                                className="rounded-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 self-center"
                            >
                                <ArrowRight className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </ComponentCard>

            {/* Modal Article Detail */}
            <AnimatePresence>
                {selectedArticle && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-24 px-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            // jadikan flex container kolom, dan batasi tinggi total
                            className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-3xl max-h-[78vh] overflow-hidden flex flex-col"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* — COVER IMAGE */}
                            {selectedArticle.image_url && (
                                <div className="relative h-48 w-full overflow-hidden">
                                    <Image
                                        src={selectedArticle.image_url}
                                        alt={selectedArticle.title}
                                        fill
                                        className="object-cover"
                                        sizes="100vw"
                                    />

                                    <button
                                        onClick={() => setSelectedArticle(null)}
                                        aria-label="Close"
                                        className="absolute top-4 right-4 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                    >
                                        <span className="text-xl leading-none">✕</span>
                                    </button>
                                </div>
                            )}

                            {/* HEADER */}
                            {/* HEADER */}
                            <div className="relative px-6 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-1">
                                    {selectedArticle.title}
                                </h3>

                                {selectedArticle.author && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Oleh: <span className="font-medium">{selectedArticle.author}</span>
                                    </p>
                                )}
                            </div>

                            {/* BODY: flex-1 supaya mengisi sisa ruang, lalu overflow-y-auto */}
                            <div className="px-6 py-4 overflow-y-auto flex-1 custom-scrollbar">
                                {/* Sumber dan tag */}
                                <div className="mb-4 space-y-2">
                                    {selectedArticle.tag && (
                                        <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded dark:bg-green-200 dark:text-green-900">
                                            {selectedArticle.tag}
                                        </span>
                                    )}
                                    {selectedArticle.source && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Sumber:{" "}
                                            <a
                                                href={selectedArticle.source}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                {selectedArticle.source}
                                            </a>
                                        </p>
                                    )}


                                </div>

                                <p className="text-sm leading-relaxed text-gray-700 dark:text-white/80 whitespace-pre-line">
                                    {selectedArticle.content || selectedArticle.summary}
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
