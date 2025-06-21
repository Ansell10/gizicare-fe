// components/ui/stat-card/StatCard.tsx
import React from "react";

interface StatCardProps {
    title: string;
    value: string | number;
    // icon?: React.ReactNode;
    trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend }) => {
    return (
        <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{value}</div>
            {trend && <div className="text-sm text-green-500 mt-1">{trend}</div>}
        </div>
    );
};

export default StatCard;
