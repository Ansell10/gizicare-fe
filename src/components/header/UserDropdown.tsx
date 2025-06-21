"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

type UserData = {
  name: string;
  email: string;
  image: string;
};

export default function UserDropdown() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  
  const handleLogout = async () => {
    try {
      const token = Cookies.get("token");

      await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Apapun hasilnya, kita tetap clear token di frontend
      Cookies.remove("token"); // HAPUS token lokal
      setUser(null); // HAPUS state user
      router.push("/signin"); // Redirect ke halaman signin
      router.refresh(); // Refresh router supaya state bersih
    } catch (err) {
      console.error("Logout error:", err);
      // Tetap paksa logout walaupun error
      Cookies.remove("token");
      setUser(null);
      router.push("/signin");
      router.refresh();
    }
  };

  useEffect(() => {
  setIsClient(true);

  // inline async loader, tidak perlu useCallback
  const loadUser = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        router.push("/signin");
        return;
      }
      const res = await fetch(`${BASE_URL}/me`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as UserData;
      setUser(data);
    } catch (err) {
      console.error(err);
      Cookies.remove("token");
      router.push("/signin");
    }
  };

  loadUser();
}, [router]);

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  function handleNavigate(path: string) {
    closeDropdown();
    router.push(path);
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dark:text-gray-400 dropdown-toggle"
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11">
          {isClient && user?.image ? (
            <Image
              src={user.image}
              width={44}
              height={44}
              alt="User"
              className="object-cover w-11 h-11 rounded-full"
              unoptimized
            />
          ) : (
            <div className="bg-gray-300 w-full h-full rounded-full" />
          )}
        </span>
        {isClient && (
          <span className="block mr-1 font-medium text-theme-sm">{user?.name ?? "Loading..."}</span>
        )}
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">{user?.name}</span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">{user?.email}</span>
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3">
          <li>
            <DropdownItem onItemClick={() => handleNavigate("/profile/edit")}>
              Edit Personalisasi
            </DropdownItem>
          </li>
          {/* <li>
            <DropdownItem onItemClick={() => handleNavigate("/profile")}>
              Setting Akun
            </DropdownItem>
          </li> */}
          {/* <li>
            <DropdownItem onItemClick={() => handleNavigate("/support")}>
              Support
            </DropdownItem>
          </li> */}
        </ul>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-2 pt-2">
          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 text-theme-sm"
          >
            Sign out
          </button>
        </div>


      </Dropdown>
    </div>
  );
}
