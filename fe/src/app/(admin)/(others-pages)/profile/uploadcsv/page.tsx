"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/axios";
import DropzoneComponent from "@/components/form/form-elements/DropZone"; // Import DropzoneComponent
import Cookies from "js-cookie"; // Import Cookies untuk mendapatkan token autentikasi

const CsvUploadPage = () => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(true); // State to control modal visibility

  // Fungsi yang menangani file yang diterima dari Dropzone
  const handleDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0] || null;
    setCsvFile(file);
    setError("");
    setSuccess("");
  };

  const handleUploadCsv = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csvFile) {
      setError("Silakan pilih file CSV terlebih dahulu.");
      return;
    }

    const formData = new FormData();
    formData.append("csv", csvFile);

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = Cookies.get("token"); // Mengambil token autentikasi dari cookies
      if (!token) {
        setError("Unauthorized");
        setLoading(false);
        return;
      }

      // Pemanggilan API ke /profiles/upload-csv
      const response = await api.post('profiles/upload-csv', formData, {
        headers: {
          Authorization: `Bearer ${token}`, // Menambahkan header Authorization dengan token
        },
      });

      setSuccess("Data berhasil diunggah!");
      console.log(response.data);
    } catch (error) {
      setError("Terjadi kesalahan saat mengunggah CSV.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk menutup modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Unggah CSV untuk Update Profil
      </h2>

      {/* Modal */}
      {isModalOpen && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg w-3/4 md:w-1/2">
      <h3 className="text-xl font-semibold mb-4">Contoh Format CSV</h3>
      
      {/* Gambar dengan class untuk memastikan posisinya di tengah */}
      <div className="flex justify-center mb-0">
        <img 
          src="/images/csv/csv.png" 
          alt="Contoh File CSV"
          className="max-w-full h-auto" 
        />
      </div>

      {/* Penjelasan format CSV dengan jarak yang lebih dekat */}
      <p className="text-sm mb-1">Pastikan file CSV Anda mengikuti format yang ditunjukkan di atas.</p>

      {/* Tombol tutup modal */}
      <button 
        onClick={closeModal} 
        className="bg-brand-500 text-white px-4 py-2 rounded-md hover:bg-brand-600"
      >
        Tutup
      </button>
    </div>
  </div>
)}


      {/* Form untuk mengunggah CSV */}
      <form onSubmit={handleUploadCsv} className="space-y-5">
        <div>
          {/* Gunakan DropzoneComponent untuk upload file CSV */}
          <DropzoneComponent onDrop={handleDrop} />
          {/* Menampilkan nama file yang dipilih */}
          {csvFile && (
            <p className="mt-2 text-sm text-gray-600">File dipilih: {csvFile.name}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-md bg-brand-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:bg-brand-300"
        >
          {loading ? "Mengunggah..." : "Unggah CSV"}
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
    </div>
  );
};

export default CsvUploadPage;
