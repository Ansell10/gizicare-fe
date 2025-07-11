"use client";

import React, { useState, useEffect } from "react";
import { format, addDays, isToday } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import { motion } from "framer-motion";

// Icon
import { ArrowLeft, ArrowRight, Trash2, User2, ChevronDown } from "lucide-react";

// Components
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/form/input/TextArea";

// Tipe untuk kategori makanan
interface FoodCategory {
  id: number;
  name: string;
  icon: string;
}

// Tipe untuk item makanan
interface FoodItem {
  id: number;
  name: string;
  image: string;
  calories: number;
  category_id: number;
}

// Tipe untuk input makanan
interface FoodInput {
  id: number;
  food_item: {
    name: string;
    calories: number;
  };
  portion_size: number;
}

// Tipe untuk entri food diary
interface FoodDiaryEntry {
  id: number;
  food_item_id: number;
  date: string; // Format 'YYYY-MM-DD'
  meal_type: string;
  portion_size: number;
  notes: string;
  food_item?: { name: string; calories: number }; // Menambahkan informasi nama dan kalori makanan
  food_inputs: FoodInput[]; // Array dari FoodInput yang berisi data makanan dan porsi
}

const mealTypes = [
    { id: 'breakfast', name: 'Sarapan' },
    { id: 'lunch', name: 'Makan Siang' },
    { id: 'dinner', name: 'Makan Malam' },
    { id: 'snack', name: 'Camilan' }
];

export default function FoodDiaryPage() {
  // State untuk tanggal yang dipilih
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // State untuk kategori makanan
  const [foodCategories, setFoodCategories] = useState<FoodCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);

  // State untuk item makanan berdasarkan kategori
  const [foodItems, setFoodItems] = useState<Record<string, FoodItem[]>>({});
  const [selectedFoodItem, setSelectedFoodItem] = useState<number | null>(null); // Untuk melacak ID makanan yang sedang dipilih
  
  // State untuk ukuran porsi makanan yang dipilih
  const [portionSize, setPortionSize] = useState<number>(1); // Ukuran porsi yang dimasukkan oleh pengguna
  const [selectedFoods, setSelectedFoods] = useState<{ foodItemId: number; portionSize: number }[]>([]);

  // State untuk tipe makanan yang dipilih (misalnya sarapan, makan siang, makan malam)
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);

  // State untuk catatan dan error
  const [notes, setNotes] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State untuk memuat data dan pengaturan profil
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);

  // State untuk semua item makanan
  const [allFoodItems, setAllFoodItems] = useState<FoodItem[]>([]);

  // State untuk data food diary
  const [foodDiary, setFoodDiary] = useState<any[]>([]);

  const MotionButton = motion.create(Button);

  // Fetch profiles milik user saat komponen di-mount
  useEffect(() => {
    // Ambil token dari cookie
    const token = Cookies.get("token");

    // Jika token ada, fetch profiles
    if (token) {
      api
        .get("/profiles", {
          headers: {
            Authorization: `Bearer ${token}`, // Sertakan token di header
          },
        })
        .then((res) => {
          // Simpan data profiles dan pilih profile pertama
          setProfiles(res.data);
          setSelectedProfile(res.data[0]);
        })
        .catch((err) => {
          // Tampilkan error jika gagal fetch
          console.error("Gagal fetch profiles:", err);
        });
    }
  }, []); // Hanya dijalankan saat pertama kali komponen dimuat

  // Fetch kategori makanan saat komponen di-mount
  useEffect(() => {
    const fetchCategories = async () => {
      const token = Cookies.get("token");

      // Jika token tidak ada, tampilkan pesan error
      if (!token) {
        setErrorMessage("Token tidak ditemukan. Silakan login.");
        return;
      }

      try {
        // Ambil kategori makanan dari API
        const response = await api.get<{ data: FoodCategory[] }>("food-diary/categories", {
          headers: {
            Authorization: `Bearer ${token}`, // Sertakan token di header
          },
        });
        setFoodCategories(response.data.data); // Set kategori makanan
      } catch (error) {
        // Tangani error jika gagal fetch
        console.error("Error fetching categories:", error);
        setErrorMessage("Terjadi kesalahan saat mengambil kategori makanan.");
      }
    };

    fetchCategories(); // Panggil fungsi untuk fetch kategori
  }, []); // Hanya dijalankan sekali saat komponen pertama kali di-mount

  // Fetch semua makanan hanya sekali saat komponen pertama kali dimuat
  useEffect(() => {
    const fetchAllFoodItems = async () => {
      const token = Cookies.get('token');

      // Jika token tidak ada, tampilkan pesan error
      if (!token) {
        setErrorMessage("Token tidak ditemukan. Silakan login.");
        return;
      }

      try {
        // Ambil semua makanan dari API
        const response = await api.get<{ data: FoodItem[] }>('food-diary/food-items/all', {
          headers: {
            Authorization: `Bearer ${token}`, // Sertakan token di header
          },
        });

        // Simpan semua makanan yang diambil
        setAllFoodItems(response.data.data);
      } catch (error) {
        // Tangani error jika gagal fetch
        console.error("Error fetching all food items:", error);
        setErrorMessage("Terjadi kesalahan saat mengambil semua makanan.");
      }
    };

    fetchAllFoodItems(); // Panggil fungsi untuk fetch semua makanan
  }, []); // Hanya dipanggil sekali saat komponen pertama kali dimuat

  // Fetch food items berdasarkan kategori yang dipilih
  useEffect(() => {
    if (selectedCategory === 0) return; // Jika "Semua" dipilih, tidak perlu fetch kategori lainnya

    const fetchFoodItems = async () => {
      const token = Cookies.get('token');

      // Jika token tidak ada, tampilkan pesan error
      if (!token) {
        setErrorMessage("Token tidak ditemukan. Silakan login.");
        return;
      }

      try {
        // Ambil food items berdasarkan kategori yang dipilih
        const response = await api.get<{ data: FoodItem[] }>(`food-diary/food-items/${selectedCategory}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Sertakan token di header
          },
        });

        // Simpan makanan berdasarkan kategori yang dipilih
        setFoodItems((prevItems) => ({
          ...prevItems,
          [selectedCategory]: response.data.data,
        }));
      } catch (error) {
        // Tangani error jika gagal fetch
        console.error("Error fetching food items:", error);
        setErrorMessage("Terjadi kesalahan saat mengambil makanan berdasarkan kategori.");
      }
    };

    fetchFoodItems(); // Panggil fungsi untuk fetch food items berdasarkan kategori
  }, [selectedCategory]); // Efek hanya dijalankan saat kategori dipilih

  // Panggil getFoodDiaryByDate jika selectedDate atau selectedProfile berubah
  useEffect(() => {
    getFoodDiaryByDate();
  }, [selectedDate, selectedProfile]);

  
  // Menambahkan makanan dan porsi yang dipilih
  const handleAddFood = (foodItemId: number) => {
    const newSelectedFoods = [...selectedFoods]; // Salin data makanan yang sudah dipilih
    const existingFood = newSelectedFoods.find((f) => f.foodItemId === foodItemId); // Cek apakah makanan sudah ada

    if (existingFood) {
      // Kalau makanan sudah ada, tambahkan porsi
      existingFood.portionSize += portionSize;
    } else {
      // Kalau belum ada, tambahkan makanan baru dengan porsi
      newSelectedFoods.push({ foodItemId, portionSize });
    }

    setSelectedFoods(newSelectedFoods); // Update makanan yang dipilih
    setSelectedFoodItem(null); // Reset makanan yang dipilih
    setPortionSize(1); // Reset porsi
  };

  // Menghapus makanan dari daftar yang dipilih
  const handleRemoveFood = (foodItemId: number) => {
    setSelectedFoods(selectedFoods.filter((f) => f.foodItemId !== foodItemId)); // Filter makanan yang ingin dihapus
  };

  // Menangani pengiriman form
  const handleSubmit = async () => {
    // Cek apakah semua field sudah diisi
    if (!selectedMealType || selectedFoods.length === 0 || !selectedDate) {
      setErrorMessage("Silakan lengkapi semua field yang diperlukan");
      return;
    }

    setIsLoading(true); // Menandakan sedang memuat
    setErrorMessage(null); // Menghapus pesan error sebelumnya

    // Siapkan data makanan yang dipilih
    const foodInputs = selectedFoods.map((f) => ({
      food_item_id: f.foodItemId,
      portion_size: f.portionSize,
    }));

    // Ambil token dari cookies
    const token = Cookies.get("token");
    if (!token) {
      setErrorMessage("Token tidak ditemukan. Silakan login.");
      setIsLoading(false);
      return;
    }

    // Hitung total kalori yang dikonsumsi
    const calorieIntake = calculateTotalCalories();

    try {
      // 1. Simpan entri food diary
      await api.post(
        "/food-diary/entries",
        {
          user_profiles_id: selectedProfile.id,
          date: format(selectedDate, "yyyy-MM-dd"),
          meal_type: selectedMealType,
          food_inputs: foodInputs,
          notes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Sertakan token
          },
        }
      );

      // 2. Simpan total kalori ke tabel aktivitas
      await api.post(
        "/activities",
        {
          user_profiles_id: selectedProfile.id,
          date: format(selectedDate, "yyyy-MM-dd"),
          activity: "makan", // Menyimpan aktivitas makan
          calorie_intake: calorieIntake,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Sertakan token
          },
        }
      );

      // Reset form setelah berhasil
      setSelectedDate(new Date());
      setSelectedMealType(null);
      setSelectedFoods([]);
      setNotes("");
      alert("Catatan makanan berhasil disimpan dan kalori tercatat ke aktivitas.");
    } catch (error) {
      console.error(error);
      setErrorMessage("Gagal menyimpan catatan makanan atau aktivitas.");
    } finally {
      setIsLoading(false); // Menandakan selesai memuat
    }
  };

  // Ambil catatan makanan berdasarkan tanggal yang dipilih
  const getFoodDiaryByDate = async () => {
    const token = Cookies.get("token");

    // Cek apakah token ada
    if (!token) {
      setErrorMessage("Token tidak ditemukan. Silakan login.");
      setIsLoading(false);
      return;
    }

    try {
      // Fetch catatan makanan berdasarkan tanggal dan profil pengguna
      const response = await api.get("/food-diary/entries/date", {
        params: {
          date: format(selectedDate, "yyyy-MM-dd"), // Format tanggal
          user_profiles_id: selectedProfile.id,    // ID profil pengguna
        },
        headers: {
          Authorization: `Bearer ${token}`, // Sertakan token
        },
      });

      console.log(response.data.data); // Tampilkan data di console

      // Simpan data ke state foodDiary
      setFoodDiary(response.data.data);
    } catch (error) {
      console.error("Error fetching food diary by date:", error);
    } finally {
      setIsLoading(false); // Set loading selesai
    }
  };

  // Kelompokkan food diary berdasarkan jenis makanan
  const groupFoodByMealType = (foodDiary: FoodDiaryEntry[]): Record<string, FoodDiaryEntry[]> => {
    return foodDiary.reduce((acc, entry) => {
      acc[entry.meal_type] = acc[entry.meal_type] || []; // Jika meal_type belum ada, buat array kosong
      acc[entry.meal_type].push(entry); // Tambahkan entry ke array sesuai meal_type
      return acc;
    }, {} as Record<string, FoodDiaryEntry[]>); // Kembalikan hasil pengelompokan
  };

  // Dapatkan label untuk jenis makanan
  const getMealTypeLabel = (mealType: string) => {
    const mealTypeLabels = {
      'breakfast': 'Sarapan',
      'lunch': 'Makan Siang',
      'dinner': 'Makan Malam',
      'snack': 'Camilan'
    };
    
    const lowerCaseMealType = mealType.toLowerCase() as 'breakfast' | 'lunch' | 'dinner' | 'snack';
    
    // Kembalikan label yang sesuai atau jenis makanan dalam huruf kapital jika tidak ada
    return mealTypeLabels[lowerCaseMealType] || mealType.toUpperCase();
  };

  // Hapus semua entri makanan berdasarkan jenis waktu makan
  const handleDeleteMealType = async (mealType: string) => {
    const token = Cookies.get("token");
    if (!token || !selectedProfile) return; // Cek token dan profil

    // Konfirmasi penghapusan
    const confirmed = confirm(`Hapus semua entri makanan untuk waktu makan "${getMealTypeLabel(mealType)}"?`);
    if (!confirmed) return; // Jika tidak dikonfirmasi, batalkan

    try {
      // Cari entri yang sesuai dengan mealType dan tanggal
      const entriesToDelete = foodDiary.filter(
        (entry) => entry.meal_type === mealType && entry.date === format(selectedDate, "yyyy-MM-dd")
      );

      // Hapus setiap entri yang ditemukan
      for (const entry of entriesToDelete) {
        await api.delete(`/food-diary/entries/${entry.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // Refresh data setelah penghapusan
      await getFoodDiaryByDate();
    } catch (err) {
      console.error("Gagal menghapus meal group:", err);
      alert("Gagal menghapus entri makanan.");
    }
  };

  // Hitung total kalori berdasarkan makanan yang dipilih
  const calculateTotalCalories = () => {
    return selectedFoods.reduce((total, food) => {
      const item = allFoodItems.find((f) => f.id === food.foodItemId); // Cari item makanan berdasarkan ID
      if (!item) return total; // Jika item tidak ditemukan, lanjutkan
      return total + item.calories * food.portionSize; // Tambah kalori dengan porsi makanan
    }, 0); // Mulai dengan total kalori 0
  };

  return (
    <div className="space-y-6 p-4">
    {/* Error Message Display */}
    {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{errorMessage}</span>
            <span 
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                onClick={() => setErrorMessage(null)}
            >
                <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <title>Close</title>
                    <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.03a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                </svg>
            </span>
        </div>
    )}
    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Catatan Makanan Harian</h2>
    
    {/* Pilih Pengguna */}
    <div className="space-y-8">
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
                    className=" block w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500appearance-none"
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

    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
  {Object.entries(groupFoodByMealType(foodDiary)).map(([mealType, entries]) => {
    const totalCalories = entries.reduce((sum, entry) => {
      const mealCalories = entry.food_inputs.reduce((acc, input) => {
        return acc + input.food_item.calories * input.portion_size;
      }, 0);
      return sum + mealCalories;
    }, 0);

    return (
      <div key={mealType} className="relative bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-5 transition hover:shadow-lg">
        {/* Tombol Trash di kanan atas */}
        <button
          onClick={() => handleDeleteMealType(mealType)}
          className="absolute top-3 right-3 text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-full border border-red-500 transition duration-150 ease-in-out z-10"
          title="Hapus semua entri"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Judul */}
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          {getMealTypeLabel(mealType)}
        </h3>

        {/* Total Kalori */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Total Kalori: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{totalCalories.toFixed(0)} kcal</span>
        </p>

        {/* List Makanan */}
        <div className="space-y-3">
          {(entries as any[]).map((entry: any) => (
            <div key={entry.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-600">
              <ul className="space-y-1">
                {entry.food_inputs.map((input: any) => (
                  <li key={input.id} className="flex justify-between text-sm text-gray-700 dark:text-gray-200">
                    <span>{input.food_item.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{parseFloat(input.portion_size).toFixed(0)} porsi</span>
                  </li>
                ))}
              </ul>
              {entry.notes && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2">
                  {entry.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  })}
</div>

    {/* Input  */}
    <div className="space-y-6 p-4">
    

      {/* Step 1 & Step 2: Pilih Tanggal dan Waktu Makan (Disusun dalam satu baris) */}
<div className="space-y-4">
  {/* ComponentCard untuk Pilih Tanggal */}
  <ComponentCard title="Pilih Tanggal" className="w-full">
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
  </ComponentCard>

  {/* ComponentCard untuk Pilih Waktu Makan */}
  {selectedDate && (
    <ComponentCard title="Pilih Waktu Makan">
      <div className="grid grid-cols-1 gap-4">
        {mealTypes.map((meal) => (
          <Button
            key={meal.id}
            variant={selectedMealType === meal.id ? "primary" : "outline"}
            onClick={() => setSelectedMealType(meal.id)}
            className="w-full"
          >
            {meal.name}
          </Button>
        ))}
      </div>
    </ComponentCard>
  )}
</div>

  {/* ComponentCard untuk Pilih Kategori dan Makanan */}
<ComponentCard title="Pilih Kategori dan Makanan">
  <div className="space-y-4">
    {/* Dropdown untuk memilih kategori */}
    <div className="flex justify-between items-center">
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(Number(e.target.value))}
        className="border-2 border-brand-500 text-brand-500 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value={0}>Semua</option> {/* Pilihan Semua */}
        {foodCategories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>

    {/* Menampilkan makanan berdasarkan kategori yang dipilih */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pb-4">
      {/* Menampilkan semua makanan jika selectedCategory == 0 */}
      {(selectedCategory === 0 ? allFoodItems : foodItems[selectedCategory])?.map((food: FoodItem) => (
        <div
          key={food.id}
          className={`p-4 rounded-lg cursor-pointer flex flex-col items-center transition-all duration-300 ease-in-out
            ${selectedFoodItem === food.id 
              ? 'bg-brand-500 text-white shadow-lg transform scale-105'  // Warna latar belakang dan efek jika dipilih
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md' // Warna latar belakang dan efek hover
            }`}
          onClick={() => setSelectedFoodItem(food.id)} // Memilih makanan
        >
          {selectedFoodItem === food.id ? (
            // Jika makanan ini dipilih, tampilkan input porsi dan tombol Add
            <>
              <span className="text-sm">{food.name}</span>
              <div className="mt-2">
                {/* Input untuk memilih porsi */}
                <input
                  type="number"
                  value={portionSize}
                  onChange={(e) => setPortionSize(Number(e.target.value))}
                  className="border p-0 rounded w-16 text-center"
                  min="1"
                />
              </div>
              <button
                onClick={() => handleAddFood(food.id)}
                className={`mt-2 p-2 rounded ${selectedFoods.some((f) => f.foodItemId === food.id) ? 'bg-brand-500' : 'bg-brand-400'} text-white hover:bg-white-600`}
              >
                {selectedFoods.some((f) => f.foodItemId === food.id) ? 'Added' : 'Add'}
              </button>
            </>
          ) : (
            // Jika makanan ini belum dipilih, tampilkan gambar, nama, dan kalori
            <>
              <img src={food.image} alt={food.name} className="w-24 h-24 object-cover rounded-md mb-2" />
              <span className="text-sm">{food.name}</span>
              <span className="text-xs">{food.calories} kalori</span>
            </>
          )}
        </div>
      ))}
    </div>
  </div>
</ComponentCard>



      {selectedFoods.length > 0 && (
  <ComponentCard title="Makanan yang Ditambahkan">
    <div>
      {selectedFoods.map((food) => {
        const foodDetails = allFoodItems?.find(item => item.id === food.foodItemId);
        return (
          <div key={food.foodItemId} className="flex justify-between items-center py-2">
            <span>{foodDetails?.name}</span>
            <div className="flex items-center space-x-2">
              <span>{food.portionSize} porsi</span>
              <button
                onClick={() => handleRemoveFood(food.foodItemId)} // Fungsi untuk menghapus makanan
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-5 h-5" /> {/* Ikon Trash Can */}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </ComponentCard>
)}



      {/* Step 4: Tambahkan Catatan */}
      <ComponentCard title="Catatan Tambahan">
        <TextArea
          placeholder="Tambahkan catatan..."
          value={notes}
          onChange={setNotes}
        />
      </ComponentCard>

      {/* Step 5: Simpan */}
      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? "Menyimpan..." : "Simpan Catatan Makanan"}
      </Button>
    </div>
        </div>
    );
}