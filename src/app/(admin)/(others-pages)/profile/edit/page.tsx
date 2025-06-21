"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import InputField from "@/components/form/input/InputField";
import Radio from "@/components/form/input/Radio";
import api from "@/lib/axios";               // instance axios yang sudah dikonfigurasi baseURL dll.
import Alert from "@/components/ui/alert/Alert";
import Cookies from "js-cookie";
import { typecastUserProfiles, UserPersonalisasi } from "@/types/user_profiles";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";


interface Profile extends UserPersonalisasi {
    id: number;
}

type FormState = {
    name: string;
    weight: string;
    height: string;
    age: string;
    gender: string;
    activity_level: string;
};

export default function EditProfilePage() {
    const router = useRouter();

    // Daftar profil yang sudah ada (bisa kosong)
    const [profiles, setProfiles] = useState<Profile[]>([]);
    // ID profil yang sedang dipilih (untuk mode edit). null artinya belum dipilih → mode create
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // Form state (dipakai untuk create maupun edit)
    const [form, setForm] = useState<FormState>({
        name: "",
        weight: "",
        height: "",
        age: "",
        gender: "",
        activity_level: "",
    });

    // State untuk loading/pulling data, serta menampilkan pesan error / success
    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isPersonalRole, setIsPersonalRole] = useState<number | null>(null);  // New state for role check

    useEffect(() => {
        (async () => {
            setFetching(true);
            setError("");
            const token = Cookies.get("token");
            if (!token) {
                setError("Unauthorized");
                setFetching(false);
                return;
            }


            try {
                // Ambil data profil dan cek role pengguna
                const res = await api.get<Profile[]>("/profiles", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // Ambil role pengguna hanya sekali

                const userRoleRes = await api.get("/user/role", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const role = Number(userRoleRes.data.role);
                // Pastikan isPersonalRole tidak null
                // const role = userRoleRes.data.role;
                if (!role || (role !== 1 && role !== 2)) {
                    setError("Role pengguna tidak valid.");
                    return;
                }

                setIsPersonalRole(role);

                // Filter data yang valid (typecastUserProfiles mengembalikan true kalau valid)
                const list = res.data
                    .map((d) =>
                        typecastUserProfiles(d) ? ({ ...d, id: d.id } as Profile) : null
                    )
                    .filter((v): v is Profile => Boolean(v));

                setProfiles(list);

                if (list.length > 0) {
                    // Kalau sudah ada profil, ambil yang pertama → mode EDIT
                    const first = list[0];
                    setSelectedId(first.id);
                    setForm({
                        name: first.name,
                        weight: String(first.weight),
                        height: String(first.height),
                        age: String(first.age),
                        gender: first.gender,
                        activity_level: first.activity_level,
                    });
                } else {
                    // Kalau belum ada profil sama sekali → mode CREATE
                    setSelectedId(null);
                    setForm({
                        name: "",
                        weight: "",
                        height: "",
                        age: "",
                        gender: "",
                        activity_level: "",
                    });
                }
            } catch (err) {
                console.error(err);
                setError("Gagal mengambil daftar profil.");
            } finally {
                setFetching(false);
            }
        })();
    }, []);  // Hanya dijalankan sekali saat pertama kali komponen dimuaat

    // Monitor perubahan state isPersonalRole
    useEffect(() => {
        console.log('isPersonalRole setelah perubahan:', isPersonalRole);  // Melihat nilai terbaru
    }, [isPersonalRole]);  // Memantau perubahan pada isPersonalRole


    // ─────────────── Fungsi untuk mengubah pilihan profil (mode edit atau create) ───────────────
    const handleSelect = (idOrEmpty: number | "") => {
        if (idOrEmpty === "") {
            // MODE CREATE
            if (isPersonalRole === 2) {
                setError("Pengguna dengan role personal hanya dapat membuat satu profil.");
                return;
            }
            setSelectedId(null);
            setForm({
                name: "",
                weight: "",
                height: "",
                age: "",
                gender: "",
                activity_level: "",
            });
            setError("");
            setSuccess("");
            return;
        }
        // MODE EDIT
        const id = Number(idOrEmpty);
        setSelectedId(id);
        setError("");
        setSuccess("");

        const p = profiles.find((x) => x.id === id);
        if (p) {
            setForm({
                name: p.name,
                weight: String(p.weight),
                height: String(p.height),
                age: String(p.age),
                gender: p.gender,
                activity_level: p.activity_level,
            });
        }
    };

    // ─────────────── Fungsi untuk mengubah nilai field form ───────────────
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // ─────────────── Submit form (create atau edit) ───────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        // 1) Validasi sederhana
        if (
            form.name.trim() === "" ||
            form.weight.trim() === "" ||
            form.height.trim() === "" ||
            form.age.trim() === "" ||
            form.gender.trim() === "" ||
            form.activity_level.trim() === ""
        ) {
            setError("Semua field wajib diisi.");
            setLoading(false);
            return;
        }

        const token = Cookies.get("token");
        if (!token) {
            setError("Unauthorized");
            setLoading(false);
            return;
        }

        // 2) Susun payload
        const payload = {
            name: form.name,
            weight: Number(form.weight),
            height: Number(form.height),
            age: Number(form.age),
            gender: form.gender,
            activity_level: form.activity_level,
        };

        try {
            let res;
            if (selectedId === null) {
                // MODE CREATE
                res = await api.post("/profiles", payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.status === 201) {
                    // jika berhasil create → langsung arah ke halaman Activity Diary
                    router.push("/activity-diary");
                } else {
                    throw new Error("Gagal membuat profil.");
                }
            } else {
                // MODE EDIT
                res = await api.put(`/profiles/${selectedId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.status === 200) {
                    // ───────────────────────────────────────
                    //  A. Tampilkan pesan sukses di UI
                    setSuccess("Data profil berhasil diperbarui.");

                    //  B. Update item di array `profiles` di state,
                    //     agar dropdown & form langsung merefleksikan data terbaru
                    setProfiles((prev) =>
                        prev.map((p) =>
                            p.id === selectedId ? { ...p, ...payload } as Profile : p
                        )
                    );
                    //    (Catatan: typecastUserProfiles seharusnya sudah memvalidasi bentuk payload yang cocok ke Profile)

                    //  C. Optional: jika mau langsung menunjuk ulang ke profil yang sama,
                    //     cukup tinggalkan `selectedId` & `form` apa adanya.
                    //     Kalau ingin kosongkan form, bisa panggil setSelectedId(null) dsb.
                } else {
                    throw new Error("Gagal menyimpan perubahan profil.");
                }
            }
        } catch (err) {
            console.error(err);
            if (selectedId === null) setError("Kesalahan saat membuat profil.");
            else setError("Kesalahan saat menyimpan data.");
        } finally {
            setLoading(false);
        }
    };

    // ─────────────── Fungsi untuk menghapus profil (hanya di mode edit) ───────────────
    const handleDelete = async () => {
        if (selectedId === null || isPersonalRole === 2) return;

        if (!confirm("Yakin ingin menghapus profil ini?")) return;

        setLoading(true);
        setError("");
        setSuccess("");

        const token = Cookies.get("token");
        if (!token) {
            setError("Unauthorized");
            setLoading(false);
            return;
        }

        try {
            const res = await api.delete(`/profiles/${selectedId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 200) {
                setSuccess("Profil berhasil dihapus.");

                const updatedList = profiles.filter((p) => p.id !== selectedId);
                setProfiles(updatedList);

                if (updatedList.length > 0) {
                    const next = updatedList[0];
                    setSelectedId(next.id);
                    setForm({
                        name: next.name,
                        weight: String(next.weight),
                        height: String(next.height),
                        age: String(next.age),
                        gender: next.gender,
                        activity_level: next.activity_level,
                    });
                } else {
                    setSelectedId(null);
                    setForm({
                        name: "",
                        weight: "",
                        height: "",
                        age: "",
                        gender: "",
                        activity_level: "",
                    });
                }
            } else {
                throw new Error("Gagal menghapus profil.");
            }
        } catch (err) {
            console.error(err);
            setError("Gagal menghapus profil.");
        } finally {
            setLoading(false);
        }
    };



    // Tampilkan loader singkat saat fetching data profil
    if (fetching) {
        return <div className="p-6">Loading profil…</div>;
    }

    // Tampilkan loader khusus saat role belum tersedia
    if (isPersonalRole === null) {
        return <div className="p-6">Memuat role pengguna…</div>;
    }

    return (
        <div className="p-4 md:p-6 2xl:p-1">
            <PageBreadcrumb pageTitle="Personalisasi Pengguna" />

            {success && (
                <Alert variant="success" title="Berhasil" message={success} showLink={false} />
            )}
            {error && <Alert variant="error" title="Gagal" message={error} showLink={false} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ─── Card Utama ─────────────────────────────────────── */}
                <ComponentCard
                    title={selectedId === null ? "Buat Profil Baru" : "Edit Profil Pengguna"}
                    className="lg:col-span-2"
                >

                    {isPersonalRole !== 2 ? (
                        <button
                            type="button"
                            onClick={() => router.push("/profile/uploadcsv")}
                            className="inline-flex items-center justify-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                        >
                            + Tambah Banyak Profil
                        </button>
                    ) : null}




                    {/* Bar “Pilih Profil” + tombol “+ Buat Profil Baru” */}
                    {profiles.length > 0 && (
                        <div className="mb-4">
                            <label htmlFor="profileSelect" className="block text-sm font-medium mb-1">
                                Pilih Profil Pengguna
                            </label>

                            <div className="flex items-center gap-4">
                                <select
                                    id="profileSelect"
                                    value={selectedId ?? ""}
                                    onChange={(e) => {
                                        if (e.target.value === "") {
                                            handleSelect("");
                                        } else {
                                            handleSelect(Number(e.target.value));
                                        }
                                    }}
                                    className="flex-1 rounded border border-gray-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                >
                                    {isPersonalRole !== 2 && <option value="">-- Buat Baru --</option>}
                                    {profiles.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>

                                {isPersonalRole !== 2 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedId(null);
                                            setForm({
                                                name: "",
                                                weight: "",
                                                height: "",
                                                age: "",
                                                gender: "",
                                                activity_level: "",
                                            });
                                            setError("");
                                            setSuccess("");
                                        }}
                                        className="inline-flex items-center justify-center rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
                                    >
                                        + Buat Profil Baru
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {profiles.length === 0 && (
                            <p className="text-sm text-gray-600 mb-2">
                                Tidak ada profil. Silakan buat profil baru.
                            </p>
                        )}

                        {/* ▼ Input Fields */}
                        <InputBlock
                            label="Nama Lengkap"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                        />
                        <InputBlock
                            label="Berat Badan (kg)"
                            name="weight"
                            type="number"
                            value={form.weight}
                            onChange={handleChange}
                        />
                        <InputBlock
                            label="Tinggi Badan (cm)"
                            name="height"
                            type="number"
                            value={form.height}
                            onChange={handleChange}
                        />
                        <InputBlock
                            label="Umur"
                            name="age"
                            type="number"
                            value={form.age}
                            onChange={handleChange}
                        />

                        {/* ▼ Radio untuk Jenis Kelamin */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Jenis Kelamin</label>
                            <div className="flex gap-4">
                                <Radio
                                    id="gender-male"
                                    label="Laki-laki"
                                    name="gender"
                                    value="male"
                                    checked={form.gender === "male"}
                                    onChange={() =>
                                        handleChange({ target: { name: "gender", value: "male" } } as any)
                                    }
                                />
                                <Radio
                                    id="gender-female"
                                    label="Perempuan"
                                    name="gender"
                                    value="female"
                                    checked={form.gender === "female"}
                                    onChange={() =>
                                        handleChange({ target: { name: "gender", value: "female" } } as any)
                                    }
                                />
                            </div>
                        </div>

                        {/* ▼ Select untuk Tingkat Aktivitas */}
                        <div>
                            <label htmlFor="activity_level" className="block text-sm font-medium mb-1">
                                Tingkat Aktivitas
                            </label>
                            <select
                                id="activity_level"
                                name="activity_level"
                                value={form.activity_level}
                                onChange={handleChange}
                                required
                                className="w-full rounded border border-gray-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            >
                                <option value="">Pilih tingkat aktivitas</option>
                                <option value="sedentary">Tidak aktif (Sedentary)</option>
                                <option value="light">Ringan (Light)</option>
                                <option value="moderate">Sedang (Moderate)</option>
                                <option value="active">Aktif (Active)</option>
                                <option value="very active">Sangat Aktif (Very Active)</option>
                            </select>
                        </div>

                        {/* ▼ Tombol aksi: “Buat Profil” atau “Simpan” */}
                        <div className="flex gap-3">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center bg-green-500 hover:bg-green-600 disabled:bg-green-300"
                            >
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
                                {loading ? "Menyimpan…" : "Simpan"}
                            </Button>

                            {selectedId !== null && isPersonalRole !== 2 && (
                                <Button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="w-full flex justify-center bg-red-500 hover:bg-red-600 disabled:bg-red-300"
                                >
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
                                    {loading ? "Menghapus…" : "Hapus"}
                                </Button>
                            )}
                        </div>
                    </form>
                </ComponentCard>

                {/* ─── Sidebar Penjelasan ────────────────────────────────────────────────── */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-5">
                    <h4 className="text-base font-semibold mb-3">Penjelasan Tingkat Aktivitas</h4>
                    <div className="text-sm text-gray-600 space-y-2 leading-relaxed">
                        <p>
                            <strong>Sedentary:</strong> Tidak banyak aktivitas fisik atau hanya sedikit olahraga. Contoh: duduk seharian.
                        </p>
                        <p>
                            <strong>Light:</strong> Aktivitas fisik ringan 1–3 hari/minggu. Contoh: jalan kaki santai, pekerjaan rumah.
                        </p>
                        <p>
                            <strong>Moderate:</strong> Aktivitas sedang 3–5 hari/minggu. Contoh: jogging, bersepeda ringan.
                        </p>
                        <p>
                            <strong>Active:</strong> Aktivitas berat hampir setiap hari. Contoh: olahraga intens, latihan kekuatan.
                        </p>
                        <p>
                            <strong>Very Active:</strong> Latihan intens atau pekerjaan fisik berat setiap hari. Contoh: atlet, buruh.
                        </p>
                    </div>
                </div>
            </div>
        </div >
    );
}

interface InputBlockProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    type?: string;
}
const InputBlock: React.FC<InputBlockProps> = ({
    label,
    name,
    value,
    onChange,
    type = "text",
}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium mb-1">
            {label}
        </label>
        <InputField name={name} type={type} value={value} onChange={onChange} className="w-full" />
    </div>
);
