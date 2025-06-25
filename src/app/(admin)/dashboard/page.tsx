"use client";

import api from "@/lib/axios";
import { ChevronDown, User2, Calendar, TrendingUp, Activity, Clock, Target, Flame, Zap, Beef, Wheat, Droplets } from "lucide-react";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import ComponentCard from "@/components/common/ComponentCard";
import { BarChart, Bar, XAxis, YAxis,ReferenceLine, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';


function getActivityFactor(level: string): number {
  const factors: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    'very active': 1.9,
  };
  
  return factors[level] ?? 1.2; // fallback default
}



function calculateTEE(bmr: number, activityLevel: number) {
  return Math.round(bmr * activityLevel);
}



type CustomTooltipProps = {
  active: boolean;
  payload: { 
    name: string;
    value: number;
    color: string;
  }[];
  label: string;
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value.toLocaleString()} {entry.name === 'Steps' ? 'steps' : 'kcal'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


const CustomTooltipNutrition = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0]; // Directly access the first entry, as `payload` is an array of objects.
    const total = payload.reduce((sum, item) => sum + item.value, 0); // Calculate the total of all values
    const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;

    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        <p style={{ color: data.color }} className="text-sm">
          {data.value.toLocaleString()} {data.name === 'Calories' ? 'kcal' : 'g'}
        </p>
        <p className="text-xs text-gray-600">
          {percentage}% of total
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]); // Ini sudah benar, pastikan tidak ada null di sini.
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [activeFilter, setActiveFilter] = useState('daily');
  
  // Separate state for calories and steps
  const [caloriesChartData, setCaloriesChartData] = useState([]);
  const [stepsChartData, setStepsChartData] = useState([]);
  const [caloriesLoading, setCaloriesLoading] = useState(false);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [caloriesSummary, setCaloriesSummary] = useState<CaloriesSummary>({
    totalIntake: 0,
    intakeChange: 0,
    totalBurned: 0,
    burnedChange: 0,
    netCalories: 0,
    netChange: 0,
    avgNet: 0,
  });

  const [stepsSummary, setStepsSummary] = useState<StepsSummary>({
  total: 0,
  average: 0,
  change: 0
});

  const [nutritionData, setNutritionData] = useState([]);
  const [nutritionPieData, setNutritionPieData] = useState<NutritionPieData[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    caloriesChange: 0,
    proteinChange: 0,
    carbsChange: 0,
    fatChange: 0,
    avgCalories: 0,
    avgProtein: 0,
    avgCarbs: 0,
    avgFat: 0,
  });
  const [loading, setLoading] = useState(false);

type StepsSummary = {
  total: number;
  average: number;
  change: number;
};

type CaloriesSummary = {
  totalIntake: number;         // Total kalori yang masuk
  intakeChange: number;        // Perubahan total kalori yang masuk
  totalBurned: number;        // Total kalori yang terbakar
  burnedChange: number;       // Perubahan kalori yang terbakar
  netCalories: number;        // Kalori bersih (intake - burned)
  netChange: number;          // Perubahan kalori bersih
  avgNet: number;             // Rata-rata kalori bersih per hari (untuk last30Days)
};


type NutritionPieData = {
  value: number;
  name: string;
  color: string; // Add the 'color' property here
};

type PayloadData = {
  name: string;
  value: number;
  color: string;
};

type CustomTooltipProps = {
  active: boolean;
  payload: { payload: PayloadData }[]; // Array yang berisi objek dengan properti payload
};

  // Shared filter options
  const filterOptions = [
    { key: 'daily', label: 'Harian', icon: Calendar },
    { key: 'weekly', label: 'Mingguan', icon: Activity },
    { key: 'monthly', label: 'Bulanan', icon: TrendingUp },
    { key: 'last30Days', label: '30 Hari Terakhir', icon: Clock }
  ];


  // Colors for pie chart
  const NUTRITION_COLORS = {
    protein: '#EF4444',    // Red
    carbs: '#F59E0B',      // Yellow/Orange
    fat: '#8B5CF6',        // Purple
  };

  type Profile = {
    id: number;
    name: string;
  };

  type UserProfile = {
    id: number;
    name: string;
    gender: string;
    age: number;
    weight: number;
    height: number;
    bmr: number;
    activity_level: number;
  };


  useEffect(() => {
    const token = Cookies.get("token");

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
  }, []);

  const fetchCaloriesData = async (filter) => {
    const token = Cookies.get("token");
    
    if (!token || !selectedProfile) {
      console.error("Token or selectedProfile not found");
      setCaloriesLoading(false);
      return;
    }

    setCaloriesLoading(true);
    
    try {
      const response = await api.get("/dashboard/calories-data", {
        params: {
          user_profiles_id: selectedProfile.id,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const caloriesData = response.data.calories[filter];
      type TransformedDataItem = {
        label: string;
        intake: number;
        burned: number;
        net: number;
        date: string;
      };

      let transformedData: TransformedDataItem[] = [];

      
      switch (filter) {
        case 'daily':
          transformedData = [
            { 
              label: 'Kemarin', 
              intake: caloriesData.yesterday.intake,
              burned: caloriesData.yesterday.burned,
              net: caloriesData.yesterday.net,
              date: caloriesData.date
            },
            { 
              label: 'Hari ini', 
              intake: caloriesData.today.intake,
              burned: caloriesData.today.burned,
              net: caloriesData.today.net,
              date: caloriesData.date
            }
          ];
          setCaloriesSummary({
            totalIntake: caloriesData.today.intake,
            totalBurned: caloriesData.today.burned,
            netCalories: caloriesData.today.net,
            intakeChange: caloriesData.percentage_changes.intake,
            burnedChange: caloriesData.percentage_changes.burned,
            netChange: caloriesData.percentage_changes.net,
            avgNet: caloriesData.averages.daily_net || 0, // Asumsi data ini ada, jika tidak gunakan fallback 0
          });

          break;
          
        case 'weekly':
          type DayData = {
            intake: number;
            burned: number;
            net: number;
            // Jika ada properti lainnya, tambahkan di sini
          };

          transformedData = Object.entries(caloriesData.daily_breakdown || {}).map(([date, dayData]) => {
            const typedDayData = dayData as DayData;  // Type assertion untuk memberitahu TypeScript tipe sebenarnya
            return {
              label: new Date(date).toLocaleDateString('id', { weekday: 'short' }),
              intake: typedDayData.intake,
              burned: typedDayData.burned,
              net: typedDayData.net,
              date
            };
          });

          setCaloriesSummary({
            totalIntake: caloriesData.today.intake,
            totalBurned: caloriesData.today.burned,
            netCalories: caloriesData.today.net,
            intakeChange: caloriesData.percentage_changes.intake,
            burnedChange: caloriesData.percentage_changes.burned,
            netChange: caloriesData.percentage_changes.net,
            avgNet: caloriesData.averages.daily_net || 0, // Asumsi data ini ada, jika tidak gunakan fallback 0
          });

          break;
          
        case 'monthly':
          transformedData = (caloriesData.weekly_breakdown || []).map((week) => ({
            label: `Minggu ${week.week}`,
            intake: week.intake,
            burned: week.burned,
            net: week.net,
            date: week.week_start
          }));
          setCaloriesSummary({
            totalIntake: caloriesData.today.intake,
            totalBurned: caloriesData.today.burned,
            netCalories: caloriesData.today.net,
            intakeChange: caloriesData.percentage_changes.intake,
            burnedChange: caloriesData.percentage_changes.burned,
            netChange: caloriesData.percentage_changes.net,
            avgNet: caloriesData.averages.daily_net || 0, // Asumsi data ini ada, jika tidak gunakan fallback 0
          });

          break;
          
        case 'last30Days':
          transformedData = (caloriesData.daily_data || []).map(day => ({
            label: new Date(day.date).getDate().toString(),
            intake: day.intake,
            burned: day.burned,
            net: day.net,
            date: day.date
          }));
         setCaloriesSummary({
            totalIntake: caloriesData.today.intake,
            totalBurned: caloriesData.today.burned,
            netCalories: caloriesData.today.net,
            intakeChange: caloriesData.percentage_changes.intake,
            burnedChange: caloriesData.percentage_changes.burned,
            netChange: caloriesData.percentage_changes.net,
            avgNet: caloriesData.averages.daily_net || 0, // Asumsi data ini ada, jika tidak gunakan fallback 0
          });

          break;
          
        default:
          transformedData = [];
          setCaloriesSummary({
            totalIntake: caloriesData.today.intake,
            totalBurned: caloriesData.today.burned,
            netCalories: caloriesData.today.net,
            intakeChange: caloriesData.percentage_changes.intake||0,
            burnedChange: caloriesData.percentage_changes.burned||0,
            netChange: caloriesData.percentage_changes.net||0,
            avgNet: caloriesData.averages.daily_net || 0, // Asumsi data ini ada, jika tidak gunakan fallback 0
          });

      }
      const [caloriesChartData, setCaloriesChartData] = useState<TransformedDataItem[]>([]);
      setCaloriesChartData(transformedData);
    } catch (err) {
      console.error("Gagal fetch calories data:", err);
      setCaloriesChartData([]);
      setCaloriesSummary({
            totalIntake: 0,
            totalBurned:0,
            netCalories: 0,
            intakeChange: 0,
            burnedChange: 0,
            netChange: 0,
            avgNet: 0, // Asumsi data ini ada, jika tidak gunakan fallback 0
          });

    } finally {
      setCaloriesLoading(false);
    }
  };

  const fetchStepsData = async (filter) => {
    const token = Cookies.get("token");
    
    if (!token || !selectedProfile) {
      console.error("Token or selectedProfile not found");
      setStepsLoading(false);
      return;
    }

    setStepsLoading(true);
    
    try {
      const response = await api.get("/dashboard/activity-data", {
        params: {
          user_profiles_id: selectedProfile.id,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

  const stepsData = response.data.steps[filter];
  
  // Definisikan Tipe untuk TransformedDataItem
  type TransformedDataItem = {
    label: string;
    steps: number;
    date: string;
  };

  let transformedData: TransformedDataItem[] = [];
  
  switch (filter) {
    case 'daily':
      transformedData = [
        { label: 'Kemarin', steps: Number(stepsData.yesterday), date: stepsData.date },
        { label: 'Hari ini', steps: Number(stepsData.today), date: stepsData.date }
      ];
      setStepsSummary({
        total: stepsData.today,
        average: stepsData.today,
        change: stepsData.percentage_change
      });
      break;
      
    case 'weekly':
      transformedData = Object.entries(stepsData.daily_breakdown || {}).map(([date, steps]) => ({
        label: new Date(date).toLocaleDateString('id', { weekday: 'short' }),
        steps: Number(steps), // Pastikan steps bertipe number
        date
      }));
      setStepsSummary({
        total: stepsData.current_week,
        average: Math.round(stepsData.current_week / 7),
        change: stepsData.percentage_change
      });
      break;
      
    case 'monthly':
      transformedData = (stepsData.weekly_breakdown || []).map((week, index) => ({
        label: `Minggu ${index + 1}`,
        steps: Number(week.total_steps), // Pastikan total_steps bertipe number
        date: week.week_start
      }));
      setStepsSummary({
        total: stepsData.current_month,
        average: Math.round(stepsData.current_month / 30),
        change: stepsData.percentage_change
      });
      break;
      
    case 'last30Days':
      transformedData = (stepsData.daily_data || []).map(day => ({
        label: new Date(day.date).getDate().toString(),
        steps: Number(day.steps), // Pastikan steps bertipe number
        date: day.date
      }));
      setStepsSummary({
        total: stepsData.total_steps,
        average: stepsData.average_daily,
        change: 0
      });
      break;
      
    default:
      transformedData = [];
      setStepsSummary({ total: 0, average: 0, change: 0 });
  }
  const [StepsChartData, setStepsChartData] = useState<TransformedDataItem[]>([]);
  setStepsChartData(transformedData);
} catch (err) {
  console.error("Gagal fetch steps data:", err);
  setStepsChartData([]);
  setStepsSummary({ total: 0, average: 0, change: 0 });
} finally {
  setStepsLoading(false);
}
};


  const fetchNutritionData = async (filter) => {
    const token = Cookies.get("token");
    
    if (!token || !selectedProfile) {
      console.error("Token or selectedProfile not found");
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.get("/dashboard/nutrition-data", {
        params: {
          user_profiles_id: selectedProfile.id,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const nutritionResponse = response.data.nutrition[filter];
      type TransformedDataItem = {
        label: string;
        calories: number,
        protein: number,
        carbs: number,
        fat: number,
        date: string;
      };

      let transformedData: TransformedDataItem[] = [];

      let pieData = [];
      
      switch (filter) {
        case 'daily':
          transformedData = [
            { 
              label: 'Kemarin', 
              calories: nutritionResponse.yesterday.calories,
              protein: nutritionResponse.yesterday.protein,
              carbs: nutritionResponse.yesterday.carbs,
              fat: nutritionResponse.yesterday.fat,
              date: nutritionResponse.yesterday.date
            },
            { 
              label: 'Hari Ini', 
              calories: nutritionResponse.today.calories,
              protein: nutritionResponse.today.protein,
              carbs: nutritionResponse.today.carbs,
              fat: nutritionResponse.today.fat,
              date: nutritionResponse.today.date
            }
          ];
          
          
          type PieDataItem = {
            name: string;
            value: number;
            color: string;
          };

          let pieData: PieDataItem[] = []; // Declare pieData with correct type

          // Create pie chart data for today's nutrition
          const todayData = nutritionResponse.today;

          if (todayData && (todayData.protein > 0 || todayData.carbs > 0 || todayData.fat > 0)) {
            pieData = [
              {
                name: 'Protein',
                value: Number(todayData.protein) || 0,
                color: NUTRITION_COLORS.protein
              },
              {
                name: 'Karbohidrat', 
                value: Number(todayData.carbs) || 0,
                color: NUTRITION_COLORS.carbs
              },
              {
                name: 'Lemak',
                value: Number(todayData.fat) || 0,
                color: NUTRITION_COLORS.fat
              }
            ].filter(item => item.value > 0); // Only include items with values
          }

          
          setSummary({
            totalCalories: nutritionResponse.totals.calories,
            totalProtein: nutritionResponse.totals.protein,
            totalCarbs: nutritionResponse.totals.carbs,
            totalFat: nutritionResponse.totals.fat,
            caloriesChange: nutritionResponse.percentage_changes.calories,
            proteinChange: nutritionResponse.percentage_changes.protein,
            carbsChange: nutritionResponse.percentage_changes.carbs,
            fatChange: nutritionResponse.percentage_changes.fat,
            avgCalories: nutritionResponse.averages.daily_calories,  // New property
            avgProtein: nutritionResponse.averages.daily_protein,    // New property
            avgCarbs: nutritionResponse.averages.daily_carbs,        // New property
            avgFat: nutritionResponse.averages.daily_fat,            // New property
          });

          break;
          
        case 'weekly':
          type DayData = {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            // Jika ada properti lainnya, tambahkan di sini
          };

          transformedData = Object.entries(nutritionResponse.daily_breakdown || {}).map(([date, dayData]) => {
            const typedDayData = dayData as DayData;  // Declare typedDayData here
            return {
              label: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
              calories: typedDayData.calories,
              protein: typedDayData.calories,
              carbs: typedDayData.calories,
              fat: typedDayData.calories,
              date
            };
          });

          
          // Create pie chart data for current week totals
          const weekData = nutritionResponse.current_week;
          if (weekData && (weekData.protein > 0 || weekData.carbs > 0 || weekData.fat > 0)) {
            pieData = [
              {
                name: 'Protein',
                value: Number(weekData.protein) || 0,
                color: NUTRITION_COLORS.protein
              },
              {
                name: 'Karbohidrat',
                value: Number(weekData.carbs) || 0,
                color: NUTRITION_COLORS.carbs
              },
              {
                name: 'Lemak',
                value: Number(weekData.fat) || 0,
                color: NUTRITION_COLORS.fat
              }
            ].filter(item => item.value > 0);
          }
          
          setSummary({
            totalCalories: nutritionResponse.totals.calories,
            totalProtein: nutritionResponse.totals.protein,
            totalCarbs: nutritionResponse.totals.carbs,
            totalFat: nutritionResponse.totals.fat,
            caloriesChange: nutritionResponse.percentage_changes.calories,
            proteinChange: nutritionResponse.percentage_changes.protein,
            carbsChange: nutritionResponse.percentage_changes.carbs,
            fatChange: nutritionResponse.percentage_changes.fat,
            avgCalories: nutritionResponse.averages.daily_calories,  // New property
            avgProtein: nutritionResponse.averages.daily_protein,    // New property
            avgCarbs: nutritionResponse.averages.daily_carbs,        // New property
            avgFat: nutritionResponse.averages.daily_fat,            // New property
          });

          break;
          
        case 'monthly':
          transformedData = (nutritionResponse.weekly_breakdown || []).map((week) => ({
            label: `Minggu ${week.week}`,
            calories: week.calories,
            protein: week.protein,
            carbs: week.carbs,
            fat: week.fat,
            date: week.week_start
          }));
          
          // Create pie chart data for current month totals
          const monthData = nutritionResponse.current_month;
          if (monthData && (monthData.protein > 0 || monthData.carbs > 0 || monthData.fat > 0)) {
            pieData = [
              {
                name: 'Protein',
                value: Number(monthData.protein) || 0,
                color: NUTRITION_COLORS.protein
              },
              {
                name: 'Karbohidrat',
                value: Number(monthData.carbs) || 0,
                color: NUTRITION_COLORS.carbs
              },
              {
                name: 'Lemak',
                value: Number(monthData.fat) || 0,
                color: NUTRITION_COLORS.fat
              }
            ].filter(item => item.value > 0);
          }
          
          setSummary({
            totalCalories: nutritionResponse.totals.calories,
            totalProtein: nutritionResponse.totals.protein,
            totalCarbs: nutritionResponse.totals.carbs,
            totalFat: nutritionResponse.totals.fat,
            caloriesChange: nutritionResponse.percentage_changes.calories,
            proteinChange: nutritionResponse.percentage_changes.protein,
            carbsChange: nutritionResponse.percentage_changes.carbs,
            fatChange: nutritionResponse.percentage_changes.fat,
            avgCalories: nutritionResponse.averages.daily_calories,  // New property
            avgProtein: nutritionResponse.averages.daily_protein,    // New property
            avgCarbs: nutritionResponse.averages.daily_carbs,        // New property
            avgFat: nutritionResponse.averages.daily_fat,            // New property
          });

          break;
          
        case 'last30Days':
          transformedData = (nutritionResponse.daily_data || []).map(day => ({
            label: new Date(day.date).getDate().toString(),
            calories: day.calories,
            protein: day.protein,
            carbs: day.carbs,
            fat: day.fat,
            date: day.date
          }));
          
          // Create pie chart data for last 30 days totals
          const last30Data = nutritionResponse.totals;
          if (last30Data && (last30Data.protein > 0 || last30Data.carbs > 0 || last30Data.fat > 0)) {
            pieData = [
              {
                name: 'Protein',
                value: Number(last30Data.protein) || 0,
                color: NUTRITION_COLORS.protein
              },
              {
                name: 'Karbohidrat',
                value: Number(last30Data.carbs) || 0,
                color: NUTRITION_COLORS.carbs
              },
              {
                name: 'Lemak',
                value: Number(last30Data.fat) || 0,
                color: NUTRITION_COLORS.fat
              }
            ].filter(item => item.value > 0);
          }
          
          setSummary({
            totalCalories: nutritionResponse.totals.calories,
            totalProtein: nutritionResponse.totals.protein,
            totalCarbs: nutritionResponse.totals.carbs,
            totalFat: nutritionResponse.totals.fat,
            caloriesChange: nutritionResponse.percentage_changes.calories,
            proteinChange: nutritionResponse.percentage_changes.protein,
            carbsChange: nutritionResponse.percentage_changes.carbs,
            fatChange: nutritionResponse.percentage_changes.fat,
            avgCalories: nutritionResponse.averages.daily_calories,  // New property
            avgProtein: nutritionResponse.averages.daily_protein,    // New property
            avgCarbs: nutritionResponse.averages.daily_carbs,        // New property
            avgFat: nutritionResponse.averages.daily_fat,            // New property
          });

          break;
          
        default:
          transformedData = [];
          pieData = [];
          setSummary({
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFat: 0,
            caloriesChange: nutritionResponse.percentage_changes.calories,
            proteinChange: nutritionResponse.percentage_changes.protein,
            carbsChange: nutritionResponse.percentage_changes.carbs,
            fatChange: nutritionResponse.percentage_changes.fat,
            avgCalories: nutritionResponse.averages.daily_calories,  // New property
            avgProtein: nutritionResponse.averages.daily_protein,    // New property
            avgCarbs: nutritionResponse.averages.daily_carbs,        // New property
            avgFat: nutritionResponse.averages.daily_fat,            // New property
          });

      }
      const [StepsNutritionData, setNutritionData] = useState<TransformedDataItem[]>([]);
      setNutritionData(transformedData);
      setNutritionPieData(pieData);
    } catch (err) {
      console.error("Gagal fetch nutrition data:", err);
      setNutritionData([]);
      setNutritionPieData([]);
      setSummary({
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFat: 0,
            caloriesChange:0,
            proteinChange:0,
            carbsChange:0,
            fatChange: 0,
            avgCalories: 0,  // New property
            avgProtein: 0,    // New property
            avgCarbs: 0,        // New property
            avgFat: 0,            // New property
          });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProfile) {
      fetchCaloriesData(activeFilter);
      fetchStepsData(activeFilter);
      fetchNutritionData(activeFilter);
    }
  }, [activeFilter, selectedProfile]);

  const formatYAxisTick = (value) => {
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return '↗';
    if (change < 0) return '↘';
    return '→';
  };

  const getBarColor = (filter) => {
    const colors = {
      daily: '#3B82F6',
      weekly: '#10B981',
      monthly: '#8B5CF6',
      last30Days: '#F59E0B'
    };
    return colors[filter] || '#3B82F6';
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
    if (percent < 0.05) return null; // Don't show label if less than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
        stroke="#000"
        strokeWidth="0.5"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  
  const TEE = selectedProfile
  ? calculateTEE(selectedProfile.bmr, getActivityFactor(String(selectedProfile.activity_level)))
  : 0;

  console.log("BMR:", selectedProfile?.bmr);
  console.log("Activity Level:", selectedProfile?.activity_level);
  console.log("TEE:", TEE);


  type Summary = {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  caloriesChange: number;
  proteinChange: number;
  carbsChange: number;
  fatChange: number;
  avgCalories: number; // Added property for average calories
  avgProtein: number;  // Added property for average protein
  avgCarbs: number;    // Added property for average carbs
  avgFat: number;      // Added property for average fat
};

  

  return (
    <div className="space-y-8">
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
              const p = profiles.find((p) => p.id === +e.target.value);
              setSelectedProfile(p || null); // Use null if no profile is found
            }}
            className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 appearance-none"
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

          <User2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-600 pointer-events-none" />
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-600 pointer-events-none" />
        </div>
      </div>

      <div className="w-full">
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filterOptions.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeFilter === key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex w-full space-x-1">
        <div className="w-1/3">
          <ComponentCard title="Ringkasan Profile Pengguna">
            {selectedProfile && (
              <div className="flex flex-wrap text-gray-500 dark:text-gray-400">
                <div className="w-1/2 flex flex-col">
                  <span className="text-xs text-blue-700 font-semibold">Gender:</span>
                  <span className="text-xl"><strong>{selectedProfile.gender}</strong></span>
                </div>
                <div className="w-1/2 flex flex-col">
                  <span className="text-xs text-blue-700 font-semibold">Tinggi:</span>
                  <span className="text-xl"><strong>{selectedProfile.height} cm</strong></span>
                </div>
                <div className="w-1/2 flex flex-col">
                  <span className="text-xs text-blue-700 font-semibold">Berat:</span>
                  <span className="text-xl"><strong>{selectedProfile.weight} kg</strong></span>
                </div>
                <div className="w-1/2 flex flex-col">
                  <span className="text-xs text-blue-700 font-semibold">Umur:</span>
                  <span className="text-xl"><strong>{selectedProfile.age} tahun</strong></span>
                </div>
                <div className="w-1/2 flex flex-col">
                  <span className="text-xs text-blue-700 font-semibold">Level:</span>
                  <span className="text-xl"><strong>{selectedProfile.activity_level}</strong></span>
                </div>
                <div className="w-1/2 flex flex-col">
                  <span className="text-xs text-blue-700 font-semibold">BMR:</span>
                  <span className="text-xl"><strong>{Math.round(selectedProfile.bmr)}</strong></span>
                </div>
              </div>
            )}
          </ComponentCard>

          <ComponentCard title="Nutrisi (Makronutrien)" className="mt-5">
            {/* Summary Cards */}
              <div className="flex w-full space-x-1 space-y-1">
                <div className="w-1/2">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border mb-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <div className="text-sm text-blue-600 font-medium">Total Kalori</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-800">
                      {summary.totalCalories?.toLocaleString() || '0'} kcal
                    </div>
                    {summary.caloriesChange !== undefined && (
                      <div className={`text-xs ${getChangeColor(summary.caloriesChange)} flex items-center gap-1`}>
                        {getChangeIcon(summary.caloriesChange)} {Math.abs(summary.caloriesChange)}% vs sebelumnya
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Beef className="w-5 h-5 text-red-600" />
                      <div className="text-sm text-red-600 font-medium">Protein</div>
                    </div>
                    <div className="text-2xl font-bold text-red-800">
                      {summary.totalProtein?.toLocaleString() || '0'}g
                    </div>
                    {summary.proteinChange !== undefined && (
                      <div className={`text-xs ${getChangeColor(summary.proteinChange)} flex items-center gap-1`}>
                        {getChangeIcon(summary.proteinChange)} {Math.abs(summary.proteinChange)}% vs sebelumnya
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-1/2">
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border mb-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Wheat className="w-5 h-5 text-yellow-600" />
                      <div className="text-sm text-yellow-600 font-medium">Karbohidrat</div>
                    </div>
                    <div className="text-2xl font-bold text-yellow-800">
                      {summary.totalCarbs?.toLocaleString() || '0'}g
                    </div>
                    {summary.carbsChange !== undefined && (
                      <div className={`text-xs ${getChangeColor(summary.carbsChange)} flex items-center gap-1`}>
                        {getChangeIcon(summary.carbsChange)} {Math.abs(summary.carbsChange)}% vs sebelumnya
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="w-5 h-5 text-purple-600" />
                      <div className="text-sm text-purple-600 font-medium">Lemak</div>
                    </div>
                    <div className="text-2xl font-bold text-purple-800">
                      {summary.totalFat?.toLocaleString() || '0'}g
                    </div>
                    {summary.fatChange !== undefined && (
                      <div className={`text-xs ${getChangeColor(summary.fatChange)} flex items-center gap-1`}>
                        {getChangeIcon(summary.fatChange)} {Math.abs(summary.fatChange)}% vs sebelumnya
                      </div>
                    )}
                  </div>
                </div>
              </div>

            {/* Main Nutrition Pie Chart */}
            <div className="w-full h-96">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : nutritionPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={nutritionPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={120}
                      innerRadius={0}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {nutritionPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltipNutrition active={false} payload={[]} label={""} />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={50}
                      iconType="square"
                      formatter={(value, entry) => (
                        <span style={{ color: entry.color, fontSize: '14px' }}>
                          {value}: {nutritionPieData.find(item => item.name === value)?.value.toLocaleString() || 0}g
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-lg font-medium">Tidak ada data nutrisi yang tersedia</p>
                    <p className="text-sm">Data akan muncul ketika informasi nutrisi disimpan</p>
                  </div>
                </div>
              )}
            </div>

            {/* Chart Legend Info */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-gray-600">
                  <strong>Protein:</strong> Membangun dan memperbaiki otot
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-gray-600">
                  <strong>Karbohidrat:</strong> Sumber Energi
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-gray-600">
                  <strong>Lemak:</strong> Asam lemak esensial
                </span>
              </div>
            </div>

            {/* Macronutrient Distribution Info */}
            {nutritionPieData.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Distribusi Makronutrien</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {nutritionPieData.map((item) => {
                    const total = nutritionPieData.reduce((sum, data) => sum + data.value, 0);
                    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                    return (
                      <div key={item.name} className="text-center">
                        <div className="font-medium" style={{ color: item.color }}>
                          {percentage}%
                        </div>
                        <div className="text-gray-600">{item.name}</div>
                        <div className="text-gray-500">{item.value.toLocaleString()}g</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Period Info */}
            <div className="mt-4 text-sm text-gray-500 text-center">
              {activeFilter === 'daily' && 'Menampilkan distribusi makronutrien saat ini'}
              {activeFilter === 'weekly' && 'Menampilkan distribusi makronutrien minggu ini'}
              {activeFilter === 'monthly' && 'Menampilkan distribusi makronutrien bulan ini'}
              {activeFilter === 'last30Days' && 'Menampilkan distribusi makronutrien 30 hari terakhir'}
            </div>
          </ComponentCard>
        </div>
        
        <div className="w-2/3">
          {/* Calories Chart */}
          <ComponentCard title="Grafik Kalori">
            {/* Calories Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <div className="text-sm text-green-600 font-medium">Jumlah Asupan</div>
                </div>
                <div className="text-2xl font-bold text-green-800">
                  {caloriesSummary.totalIntake?.toLocaleString() || '0'} kcal
                </div>
                {caloriesSummary.intakeChange !== undefined && (
                  <div className={`text-sm ${getChangeColor(caloriesSummary.intakeChange)} flex items-center gap-1`}>
                    {getChangeIcon(caloriesSummary.intakeChange)} {Math.abs(caloriesSummary.intakeChange)}% vs sebelumnya
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-red-600" />
                  <div className="text-sm text-red-600 font-medium">Total Terbakar</div>
                </div>
                <div className="text-2xl font-bold text-red-800">
                  {caloriesSummary.totalBurned?.toLocaleString() || '0'} kcal
                </div>
                {caloriesSummary.burnedChange !== undefined && (
                  <div className={`text-sm ${getChangeColor(caloriesSummary.burnedChange)} flex items-center gap-1`}>
                    {getChangeIcon(caloriesSummary.burnedChange)} {Math.abs(caloriesSummary.burnedChange)}% vs sebelumnya
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <div className="text-sm text-blue-600 font-medium">Kalori Bersih</div>
                </div>
                <div className={`text-2xl font-bold ${caloriesSummary.netCalories >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                  {caloriesSummary.netCalories >= 0 ? '+' : ''}{caloriesSummary.netCalories?.toLocaleString() || '0'} kcal
                </div>
                {caloriesSummary.netChange !== undefined && (
                  <div className={`text-sm ${getChangeColor(caloriesSummary.netChange)} flex items-center gap-1`}>
                    {getChangeIcon(caloriesSummary.netChange)} {Math.abs(caloriesSummary.netChange)}% vs sebelumnya
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <div className="text-sm text-purple-600 font-medium">
                    {activeFilter === 'last30Days' ? 'Rata-rata Harian' : 'Keseimbangan'}
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-800">
                  {activeFilter === 'last30Days' 
                    ? `${caloriesSummary.avgNet?.toLocaleString() || '0'} kcal`
                    : caloriesSummary.netCalories >= 0 ? 'Surplus' : 'Defisit'
                  }
                </div>
                <div className="text-sm text-purple-600">
                  {activeFilter === 'last30Days' 
                    ? 'Bersih per hari'
                    : caloriesSummary.netCalories >= 0 ? 'Makan lebih banyak daripada membakar' : 'Membakar lebih banyak daripada makan'
                  }
                </div>
              </div>
            </div>

            {/* Calories Chart */}
            <div className="w-full h-96">
              {caloriesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={caloriesChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 12 }}
                      stroke="#666"
                    />
                    <YAxis
                      domain={[
                        0,
                        (dataMax: number) => Math.max(dataMax, TEE + 200), // Pastikan TEE muat
                      ]}
                      tickFormatter={formatYAxisTick}
                      tick={{ fontSize: 12 }}
                      stroke="#666"
                    />

                    <Tooltip content={<CustomTooltip active={false} payload={[]} label={""} />} />
                    <Legend />
                    
                    <Line 
                      type="monotone" 
                      dataKey="intake" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, stroke: '#10B981', strokeWidth: 2 }}
                      name="Asupan"
                    />
                    
                    <Line 
                      type="monotone" 
                      dataKey="burned" 
                      stroke="#EF4444" 
                      strokeWidth={3}
                      dot={{ fill: '#EF4444', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, stroke: '#EF4444', strokeWidth: 2 }}
                      name="Terbakar"
                    />
                    
                    <Line 
                      type="monotone" 
                      dataKey="net" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, stroke: '#3B82F6', strokeWidth: 2 }}
                      name="Bersih"
                      strokeDasharray="5 5"
                    />

                    <ReferenceLine
                      y={TEE}
                      stroke="#f59e0b"
                      strokeDasharray="6 6"
                      strokeWidth={2}
                      label={{
                        value: `Target TEE (${TEE} kcal)`,
                        position: 'top',
                        fill: '#f59e0b',
                        fontSize: 12,
                        fontWeight: 'bold',
                        offset: 10
                      }}
                    />

                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Chart Legend Info */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-green-500"></div>
                <span className="text-gray-600">
                  <strong>Asupan:</strong> Kalori yang dikonsumsi dari makanan
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-red-500"></div>
                <span className="text-gray-600">
                  <strong>Total Terbakar:</strong> Kalori yang terbakar melalui olahraga
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-blue-500 border-dashed"></div>
                <span className="text-gray-600">
                  <strong>Bersih:</strong> Asupan dikurangi yang dibakar (surplus/defisit)
                </span>
              </div>
            </div>

            {/* Period Info */}
            <div className="mt-4 text-sm text-gray-500 text-center">
              {activeFilter === 'daily' && 'Menampilkan perbandingan kalori hari ini vs kemarin'}
              {activeFilter === 'weekly' && 'Menampilkan rincian kalori harian minggu ini'}
              {activeFilter === 'monthly' && 'Menampilkan rincian kalori mingguan bulan ini'}
              {activeFilter === 'last30Days' && 'Menampilkan kalori harian selama 30 hari terakhir'}
            </div>
          </ComponentCard>

          {/* Steps Chart */}
          <ComponentCard title="Grafik Aktivitas" className="mt-5">
            {/* Steps Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border">
                <div className="text-sm text-blue-600 font-medium">Total Langkah</div>
                <div className="text-2xl font-bold text-blue-800">
                  {stepsSummary.total?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border">
                <div className="text-sm text-green-600 font-medium">Rata-rata Harian</div>
                <div className="text-2xl font-bold text-green-800">
                  {stepsSummary.average?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border">
                <div className="text-sm text-purple-600 font-medium">vs sebelumnya</div>
                <div className={`text-2xl font-bold ${stepsSummary.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stepsSummary.change >= 0 ? '+' : ''}{stepsSummary.change}%
                </div>
              </div>
            </div>

            {/* Steps Chart */}
            <div className="w-full h-80">
              {stepsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stepsChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 12 }}
                      stroke="#666"
                    />
                    <YAxis 
                      tickFormatter={formatYAxisTick}
                      tick={{ fontSize: 12 }}
                      stroke="#666"
                    />

                    <Tooltip
                      formatter={(value) => [`${value?.toLocaleString()} langkah`, 'Langkah']}
                      labelStyle={{ color: '#333', fontWeight: 'bold' }}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="steps" 
                      fill={getBarColor(activeFilter)}
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Chart Info */}
            <div className="mt-4 text-sm text-gray-500 text-center">
              {activeFilter === 'daily' && 'Menampilkan perbandingan langkah hari ini vs kemarin'}
              {activeFilter === 'weekly' && 'Menampilkan rincian langkah harian minggu ini'}
              {activeFilter === 'monthly' && 'Menampilkan rincian langkah mingguan bulan ini'}
              {activeFilter === 'last30Days' && 'Menampilkan langkah harian selama 30 hari terakhir'}
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;