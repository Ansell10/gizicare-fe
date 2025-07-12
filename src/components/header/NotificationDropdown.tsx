"use client";
import React, { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import api from "@/lib/axios";
import Cookies from "js-cookie";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timeToEat, setTimeToEat] = useState(null); // Menyimpan jenis makanan yang waktunya tiba
  const [showReminder, setShowReminder] = useState(false); // Status untuk menampilkan pengingat

  // Toggle dropdown and fetch notifications if dropdown is opened
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const handleClick = () => {
    toggleDropdown();
  };

  // Fetch notifications from the backend
  const fetchNotifications = async () => {
    const token = Cookies.get("token");
    if (!token) return;

    setLoading(true);
    try {
      const response = await api.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 20, include_read: true },
      });

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    const token = Cookies.get("token");
    if (!token) return;

    try {
      await api.patch(
        `/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notifTime) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hr ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  };

  // Get notification icon based on type
  const getNotificationIcon = (type, data) => {
    switch (type) {
      case "meal_reminder":
        return getMealIcon(data);
      case "intermittent_fasting":
        return "⏰";
      case "health_reminder":
        return "💊";
      default:
        return "🔔";
    }
  };

  // Get notification background color based on type
  const getNotificationBgColor = (type) => {
    switch (type) {
      case "meal_reminder":
        return "bg-orange-100 text-orange-600";
      case "intermittent_fasting":
        return "bg-blue-100 text-blue-600";
      case "health_reminder":
        return "bg-green-100 text-green-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Get the icon for meal reminder
  const getMealIcon = (data) => {
    const mealType = data?.meal_type || "meal";
    switch (mealType) {
      case "breakfast":
        return "🥐";
      case "lunch":
        return "🥗";
      case "dinner":
        return "🍽️";
      case "snack":
        return "🍎";
      default:
        return "🍴";
    }
  };

  const mealTimes = [
    { type: "Breakfast", hour: 1, minute: 50 },
    { type: "Lunch", hour: 12, minute: 0 },
    { type: "Dinner", hour: 18, minute: 0 },
  ];

  const checkMealTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    console.log(`Checking time: ${currentHour}:${currentMinute}`); // Debug log

    // Periksa setiap waktu makan yang sudah ditentukan
    for (let meal of mealTimes) {
      // Jika waktu sekarang cocok dengan waktu makan
      if (meal.hour === currentHour && meal.minute === currentMinute) {
        setTimeToEat(meal.type); // Set pengingat untuk jenis makanan yang sesuai
        setShowReminder(true); // Menampilkan pengingat
        break;
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(checkMealTime, 60000); // Cek setiap 1 menit
    return () => clearInterval(interval); // Bersihkan interval saat komponen unmount
  }, []);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();

    // Set up polling for new notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Notification Icon Button */}
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 flex">
            <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {showReminder && (
        <div className="notification fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white p-4 rounded-lg shadow-lg">
          <p>It's time for {timeToEat}!</p>
        </div>
      )}

      {/* Notification Dropdown */}
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] sm:h-[480px] sm:w-[350px] flex h-[400px] w-200px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-orange-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        {/* Notifications List */}
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {loading ? (
            <li className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </li>
          ) : notifications.length === 0 ? (
            <li className="flex flex-col items-center justify-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔔</div>
              <p className="text-sm">No notifications yet</p>
            </li>
          ) : (
            notifications.map((notification) => {
              const data =
                typeof notification.data === "string"
                  ? JSON.parse(notification.data)
                  : notification.data || {};

              return (
                <li key={notification.id}>
                  <DropdownItem
                    onItemClick={() => {
                      if (!notification.is_read) {
                        markAsRead(notification.id);
                      }
                      closeDropdown();
                    }}
                    className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                      !notification.is_read
                        ? "bg-orange-50 dark:bg-orange-900/20"
                        : ""
                    }`}
                  >
                    <span
                      className={`relative flex items-center justify-center w-10 h-10 rounded-full ${getNotificationBgColor(
                        notification.type
                      )}`}
                    >
                      <span className="text-lg">
                        {getNotificationIcon(notification.type, data)}
                      </span>
                      {!notification.is_read && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-orange-500 border-2 border-white"></span>
                      )}
                    </span>

                    <span className="block flex-1">
                      <span className="mb-1.5 block text-theme-sm text-gray-800 dark:text-white/90 font-medium">
                        {notification.title}
                      </span>

                      <span className="mb-2 block text-theme-sm text-gray-600 dark:text-gray-400">
                        {notification.message}
                      </span>

                      {/* Additional context for meal reminders */}
                      {notification.type === "meal_reminder" &&
                        data.meal_type && (
                          <span className="mb-2 block text-xs text-gray-500 dark:text-gray-500">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                              {data.meal_type.charAt(0).toUpperCase() +
                                data.meal_type.slice(1)}{" "}
                              Reminder
                            </span>
                          </span>
                        )}

                      {/* Intermittent fasting context */}
                      {notification.type === "intermittent_fasting" && (
                        <span className="mb-2 block text-xs text-gray-500 dark:text-gray-500">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Intermittent Fasting
                          </span>
                          {data.fasting_hours && (
                            <span className="ml-2 text-xs text-gray-400">
                              {data.fasting_hours}h fasting
                            </span>
                          )}
                        </span>
                      )}

                      <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                        <span className="capitalize">
                          {notification.type.replace("_", " ")}
                        </span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        <span>{formatTimeAgo(notification.created_at)}</span>
                      </span>
                    </span>
                  </DropdownItem>
                </li>
              );
            })
          )}
        </ul>

        {/* Footer with "Mark All Read" button */}
        {notifications.length > 0 && (
          <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex justify-between gap-2">
              <button
                onClick={() => {
                  // Mark all as read logic
                  const unreadNotifications = notifications.filter(
                    (n) => !n.is_read
                  );
                  unreadNotifications.forEach((n) => markAsRead(n.id));
                }}
                className="flex-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                disabled={unreadCount === 0}
              >
                Mark all read
              </button>
            </div>
          </div>
        )}
      </Dropdown>
    </div>
  );
}
