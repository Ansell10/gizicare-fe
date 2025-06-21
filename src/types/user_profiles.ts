export interface UserPersonalisasi {
    name: string;
    weight: number;
    height: number;
    age: number;
    gender: string;
    activity_level: string;
  }
  
  export function typecastUserProfiles(data: any): UserPersonalisasi | undefined {
    if (!data) return undefined;
  
    const weight = Number(data.weight);
    const height = Number(data.height);
    const age = Number(data.age);
  
    if (
      typeof data.name === "string" &&
      !isNaN(weight) &&
      !isNaN(height) &&
      !isNaN(age) &&
      typeof data.gender === "string" &&
      typeof data.activity_level === "string"
    ) {
      return {
        name: data.name,
        weight,
        height,
        age,
        gender: data.gender,
        activity_level: data.activity_level,
      };
    }
  
    return undefined;
  }
  