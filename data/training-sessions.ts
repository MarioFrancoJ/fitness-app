export type SessionStatus = "In Progress" | "Completed" | "Cancelled";

export interface SetLog {
  setNumber: number;
  targetReps: number;
  completedReps: number;
  targetWeight: number;
  completedWeight: number;
  completed: boolean;
  notes: string;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
}

export interface WorkoutSession {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string; // ISO date
  startTime: string; // ISO datetime
  endTime: string | null;
  durationMinutes: number;
  status: SessionStatus;
  exerciseLogs: ExerciseLog[];
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  highestWeight: number;
  mostReps: number;
  date: string;
}
