
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Task, Board, PomodoroSession, AppSettings, DEFAULT_SETTINGS } from '../types';

const APP_STORAGE_KEY = 'focusFlowApp';

interface AppContextType {
  tasks: Task[];
  boards: Board[];
  pomodoroSessions: PomodoroSession[];
  settings: AppSettings;
  addTask: (taskData: Omit<Task, 'id' | 'isCompleted' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (updatedTask: Task) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskComplete: (taskId: string) => void;
  addBoard: (boardName: string) => Board;
  updateBoard: (updatedBoard: Board) => void;
  deleteBoard: (boardId: string) => void;
  moveTaskToBoard: (taskId: string, newBoardId: string, newIndex?: number) => void;
  addPomodoroSession: (session: Omit<PomodoroSession, 'id'>) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  getTasksByBoard: (boardId: string) => Task[];
  activeBoardId: string | null;
  setActiveBoardId: (boardId: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedData = localStorage.getItem(APP_STORAGE_KEY);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setTasks(parsedData.tasks || []);
      setBoards(parsedData.boards || []);
      setPomodoroSessions(parsedData.pomodoroSessions || []);
      // Ensure all DEFAULT_SETTINGS fields are present, especially new ones like 'language'
      const mergedSettings = { ...DEFAULT_SETTINGS, ...(parsedData.settings || {}) };
      setSettings(mergedSettings);
      setActiveBoardId(parsedData.activeBoardId || (parsedData.boards?.[0]?.id || null) );
    } else {
      const defaultBoard: Board = { 
        id: crypto.randomUUID(), 
        name: 'My First Board', 
        taskOrder: [],
        createdAt: new Date().toISOString()
      };
      setBoards([defaultBoard]);
      setActiveBoardId(defaultBoard.id);
      setSettings(DEFAULT_SETTINGS); // Set default settings if nothing is stored
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({ tasks, boards, pomodoroSessions, settings, activeBoardId }));
    }
  }, [tasks, boards, pomodoroSessions, settings, activeBoardId, isInitialized]);

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Set document language
    document.documentElement.lang = settings.language;
  }, [settings.theme, settings.language]);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'isCompleted' | 'createdAt' | 'updatedAt'>): Task => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newTask]);
    setBoards(prevBoards => prevBoards.map(b => 
      b.id === taskData.boardId ? { ...b, taskOrder: [...b.taskOrder, newTask.id] } : b
    ));
    return newTask;
  }, []);

  const updateTask = useCallback((updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? {...updatedTask, updatedAt: new Date().toISOString()} : t));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setBoards(prevBoards => prevBoards.map(b => 
      b.id === taskToDelete.boardId ? { ...b, taskOrder: b.taskOrder.filter(id => id !== taskId) } : b
    ));
  }, [tasks]);

  const toggleTaskComplete = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: !t.isCompleted, updatedAt: new Date().toISOString() } : t));
  }, []);

  const addBoard = useCallback((boardName: string): Board => {
    const newBoard: Board = {
      id: crypto.randomUUID(),
      name: boardName,
      taskOrder: [],
      createdAt: new Date().toISOString(),
    };
    setBoards(prev => [...prev, newBoard]);
    if (!activeBoardId) {
      setActiveBoardId(newBoard.id);
    }
    return newBoard;
  }, [activeBoardId]);

  const updateBoard = useCallback((updatedBoard: Board) => {
    setBoards(prev => prev.map(b => b.id === updatedBoard.id ? updatedBoard : b));
  }, []);

  const deleteBoard = useCallback((boardId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.boardId !== boardId)); 
    setBoards(prev => {
        const newBoards = prev.filter(b => b.id !== boardId);
        if (activeBoardId === boardId) {
            setActiveBoardId(newBoards.length > 0 ? newBoards[0].id : null);
        }
        return newBoards;
    });
  }, [activeBoardId]); 

  const moveTaskToBoard = useCallback((taskId: string, newBoardId: string, newIndex?: number) => {
    const taskToMove = tasks.find(t => t.id === taskId);
    if (!taskToMove) return;

    const oldBoardId = taskToMove.boardId;
    
    setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, boardId: newBoardId, updatedAt: new Date().toISOString() } : t));

    setBoards(prevBoards => prevBoards.map(board => {
      if (board.id === oldBoardId) { 
        return { ...board, taskOrder: board.taskOrder.filter(id => id !== taskId) };
      }
      if (board.id === newBoardId) { 
        const newTaskOrder = [...board.taskOrder];
        if (typeof newIndex === 'number') {
          newTaskOrder.splice(newIndex, 0, taskId);
        } else {
          newTaskOrder.push(taskId);
        }
        return { ...board, taskOrder: newTaskOrder };
      }
      return board;
    }));
  }, [tasks]);

  const addPomodoroSession = useCallback((session: Omit<PomodoroSession, 'id'>) => {
    const newSession: PomodoroSession = {
      ...session,
      id: crypto.randomUUID(),
    };
    setPomodoroSessions(prev => [newSession, ...prev]);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);
  
  const getTasksByBoard = useCallback((boardId: string): Task[] => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return [];
    return board.taskOrder.map(taskId => tasks.find(t => t.id === taskId)).filter(Boolean) as Task[];
  }, [tasks, boards]);

  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return (
    <AppContext.Provider value={{ 
      tasks, boards, pomodoroSessions, settings,
      addTask, updateTask, deleteTask, toggleTaskComplete,
      addBoard, updateBoard, deleteBoard, moveTaskToBoard,
      addPomodoroSession, updateSettings, getTasksByBoard,
      activeBoardId, setActiveBoardId
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
