
export enum Priority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
}

export interface Subtask {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string | null; // ISO string date
  priority: Priority;
  subtasks: Subtask[];
  attachments: string[]; // Store as file names for now
  boardId: string;
  isCompleted: boolean;
  createdAt: string; // ISO string date
  updatedAt: string; // ISO string date
  cardColor?: string; // Optional: for individual card color customization
}

export interface Board {
  id: string;
  name: string;
  taskOrder: string[]; // Array of task IDs
  createdAt: string; // ISO string date
}

export interface PomodoroSettings {
  workDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsBeforeLongBreak: number;
}

export interface PomodoroSession {
  id:string;
  taskId?: string;
  taskTitle?: string;
  startTime: string; // ISO string date
  endTime: string; // ISO string date
  duration: number; // minutes
  type: 'work' | 'shortBreak' | 'longBreak';
}

export interface AppSettings {
  pomodoro: PomodoroSettings;
  theme: 'light' | 'dark';
  selectedCardTemplateKey: string;
  soundNotifications: boolean;
  language: string; // ISO 639-1 language code (e.g., "en", "es")
}

export interface CardTemplate {
  key: string;
  name: string;
  styles: { // Tailwind classes
    card: string;
    title: string;
    description: string;
    dueDate: string;
    priorityBadge: string; // Base classes for priority, specific color added later
  };
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

export const DEFAULT_SETTINGS: AppSettings = {
  pomodoro: DEFAULT_POMODORO_SETTINGS,
  theme: 'light',
  selectedCardTemplateKey: 'minimalist',
  soundNotifications: true,
  language: 'en', // Default language
};

export const LANGUAGES: Array<{ code: string; name: string; nativeName: string }> = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    key: 'minimalist',
    name: 'Minimalist',
    styles: {
      card: 'bg-white dark:bg-neutral-800 shadow-md rounded-lg p-4 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow',
      title: 'text-lg font-semibold text-neutral-800 dark:text-neutral-100',
      description: 'text-sm text-neutral-600 dark:text-neutral-300 mt-1',
      dueDate: 'text-xs text-neutral-500 dark:text-neutral-400 mt-2',
      priorityBadge: 'px-2 py-0.5 text-xs font-medium rounded-full',
    },
  },
  {
    key: 'colorful',
    name: 'Colorful',
    styles: {
      card: 'bg-primary-100 dark:bg-primary-800 shadow-lg rounded-lg p-4 border border-primary-300 dark:border-primary-700 hover:shadow-xl transition-shadow',
      title: 'text-lg font-bold text-primary-700 dark:text-primary-200',
      description: 'text-sm text-primary-600 dark:text-primary-300 mt-1',
      dueDate: 'text-xs text-primary-500 dark:text-primary-400 mt-2',
      priorityBadge: 'px-2 py-0.5 text-xs font-semibold rounded-md text-white',
    },
  },
  {
    key: 'professional',
    name: 'Professional',
    styles: {
      card: 'bg-neutral-50 dark:bg-neutral-800 shadow-sm rounded-md p-4 border-l-4 border-secondary-500 dark:border-secondary-400 hover:shadow-md transition-shadow',
      title: 'text-lg font-medium text-neutral-900 dark:text-neutral-50',
      description: 'text-sm text-neutral-700 dark:text-neutral-300 mt-1',
      dueDate: 'text-xs text-neutral-500 dark:text-neutral-400 mt-2',
      priorityBadge: 'px-2.5 py-1 text-xs font-bold rounded-sm tracking-wide',
    },
  },
];

export type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';
