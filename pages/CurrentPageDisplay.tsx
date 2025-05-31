
import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { usePomodoro } from '../hooks/usePomodoro';
import { Task, Priority, Subtask, Board, PomodoroMode, CARD_TEMPLATES, CardTemplate, DEFAULT_SETTINGS, AppSettings, PomodoroSettings, LANGUAGES } from '../types';
import { PlayIcon, PauseIcon, StopIcon, SkipNextIcon, PlusIcon, TrashIcon, EditIcon, CheckIcon, ChevronDownIcon, XMarkIcon, PaperClipIcon } from '../components/icons';

// Recharts components are available globally via CDN
declare var Recharts: any; 
// Removed top-level destructuring: const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } = Recharts;


// Helper to format time (MM:SS)
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// TaskCard Component (defined locally)
interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  cardTemplate: CardTemplate;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onToggleComplete, cardTemplate }) => {
  const priorityColor = (priority: Priority): string => {
    switch (priority) {
      case Priority.HIGH: return 'bg-red-500 dark:bg-red-400 text-white';
      case Priority.MEDIUM: return 'bg-yellow-500 dark:bg-yellow-400 text-white';
      case Priority.LOW: return 'bg-green-500 dark:bg-green-400 text-white';
      default: return 'bg-neutral-500 dark:bg-neutral-400 text-white';
    }
  };
  
  const { styles } = cardTemplate;

  return (
    <div className={`${styles.card} ${task.isCompleted ? 'opacity-60' : ''} w-full animate-fadeIn`}>
      <div className="flex justify-between items-start">
        <h3 className={`${styles.title} ${task.isCompleted ? 'line-through' : ''}`}>{task.title}</h3>
        <div className="flex space-x-2">
          <button onClick={() => onEdit(task)} className="text-neutral-500 hover:text-primary-500 dark:text-neutral-400 dark:hover:text-primary-300 transition-colors">
            <EditIcon className="w-5 h-5" />
          </button>
          <button onClick={() => onDelete(task.id)} className="text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-300 transition-colors">
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <p className={`${styles.description} break-words`}>{task.description}</p>
      {task.dueDate && <p className={`${styles.dueDate}`}>Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
      <div className="mt-2 flex justify-between items-center">
        <span className={`${styles.priorityBadge} ${priorityColor(task.priority)}`}>
          {task.priority}
        </span>
        <button 
          onClick={() => onToggleComplete(task.id)} 
          className={`p-1 rounded-full transition-colors ${task.isCompleted ? 'bg-green-500 text-white' : 'bg-neutral-200 dark:bg-neutral-600 hover:bg-green-200 dark:hover:bg-green-700'}`}
        >
          <CheckIcon className="w-4 h-4" />
        </button>
      </div>
      {task.subtasks.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Subtasks:</h4>
          <ul className="space-y-1">
            {task.subtasks.map(st => (
              <li key={st.id} className={`text-xs flex items-center ${st.isCompleted ? 'line-through text-neutral-500 dark:text-neutral-400' : 'text-neutral-600 dark:text-neutral-300'}`}>
                <span className={`mr-2 w-3 h-3 border rounded-sm flex items-center justify-center ${st.isCompleted ? 'bg-primary-500 border-primary-500' : 'border-neutral-400'}`}>
                  {st.isCompleted && <CheckIcon className="w-2 h-2 text-white" />}
                </span>
                {st.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      {task.attachments.length > 0 && (
         <div className="mt-3">
            <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Attachments:</h4>
            <ul className="space-y-1">
                {task.attachments.map((att, idx) => (
                    <li key={idx} className="text-xs text-neutral-600 dark:text-neutral-300 flex items-center">
                        <PaperClipIcon className="w-3 h-3 mr-1.5 text-neutral-500 dark:text-neutral-400"/>
                        {att}
                    </li>
                ))}
            </ul>
         </div>
      )}
    </div>
  );
};

// TaskModal Component (defined locally)
interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  boardId: string;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, taskToEdit, boardId }) => {
  const { addTask, updateTask, boards } = useAppContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [currentBoardId, setCurrentBoardId] = useState<string>(boardId);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]); // Simple string array for names
  const [newAttachmentName, setNewAttachmentName] = useState('');


  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setDueDate(taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().split('T')[0] : null);
      setPriority(taskToEdit.priority);
      setCurrentBoardId(taskToEdit.boardId);
      setSubtasks(taskToEdit.subtasks);
      setAttachments(taskToEdit.attachments);
    } else {
      setTitle('');
      setDescription('');
      setDueDate(null);
      setPriority(Priority.MEDIUM);
      setCurrentBoardId(boardId); // Default to current or first board
      setSubtasks([]);
      setAttachments([]);
    }
  }, [taskToEdit, isOpen, boardId]);

  const handleAddSubtask = () => {
    if (newSubtaskText.trim() !== '') {
      setSubtasks([...subtasks, { id: crypto.randomUUID(), text: newSubtaskText.trim(), isCompleted: false }]);
      setNewSubtaskText('');
    }
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(st => st.id === id ? { ...st, isCompleted: !st.isCompleted } : st));
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };
  
  const handleAddAttachment = () => {
    if (newAttachmentName.trim() !== '') {
        setAttachments([...attachments, newAttachmentName.trim()]);
        setNewAttachmentName('');
    }
  };

  const handleDeleteAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const taskData = { title, description, dueDate, priority, subtasks, attachments, boardId: currentBoardId };
    if (taskToEdit) {
      updateTask({ ...taskToEdit, ...taskData });
    } else {
      addTask(taskData);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slideInUp">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{taskToEdit ? 'Edit Task' : 'Add New Task'}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Title</label>
            <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Description</label>
            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Due Date</label>
              <input type="date" id="dueDate" value={dueDate || ''} onChange={e => setDueDate(e.target.value || null)} className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" />
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Priority</label>
              <select id="priority" value={priority} onChange={e => setPriority(e.target.value as Priority)} className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100">
                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
           <div>
                <label htmlFor="boardId" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Board</label>
                <select 
                    id="boardId" 
                    value={currentBoardId} 
                    onChange={e => setCurrentBoardId(e.target.value)} 
                    className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                >
                    {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            </div>
          {/* Subtasks */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Subtasks</label>
            <div className="mt-1 space-y-2">
              {subtasks.map(st => (
                <div key={st.id} className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-700 p-2 rounded">
                  <div className="flex items-center">
                    <input type="checkbox" checked={st.isCompleted} onChange={() => handleToggleSubtask(st.id)} className="h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 mr-2" />
                    <span className={st.isCompleted ? 'line-through text-neutral-500' : ''}>{st.text}</span>
                  </div>
                  <button type="button" onClick={() => handleDeleteSubtask(st.id)} className="text-red-500 hover:text-red-700">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex">
              <input type="text" value={newSubtaskText} onChange={e => setNewSubtaskText(e.target.value)} placeholder="New subtask" className="flex-grow px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-l-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-neutral-700" />
              <button type="button" onClick={handleAddSubtask} className="px-3 py-2 bg-primary-500 text-white rounded-r-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">Add</button>
            </div>
          </div>
          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Attachments (File Names)</label>
            <div className="mt-1 space-y-2">
                {attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-700 p-2 rounded">
                        <span className="truncate">{att}</span>
                        <button type="button" onClick={() => handleDeleteAttachment(idx)} className="text-red-500 hover:text-red-700">
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
            <div className="mt-2 flex">
                <input 
                    type="text" 
                    value={newAttachmentName} 
                    onChange={e => setNewAttachmentName(e.target.value)} 
                    placeholder="File name (e.g., report.pdf)" 
                    className="flex-grow px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-l-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-neutral-700" />
                <button type="button" onClick={handleAddAttachment} className="px-3 py-2 bg-secondary-500 text-white rounded-r-md hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2">Attach</button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-600 border border-neutral-300 dark:border-neutral-500 rounded-md shadow-sm hover:bg-neutral-200 dark:hover:bg-neutral-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">{taskToEdit ? 'Save Changes' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};


// Page Views
const FocusView: React.FC = () => {
  const { timeLeft, mode, isActive, startTimer, pauseTimer, resetTimer, skipTimer, currentFocusedTask, selectTaskToFocus, pomodoroSettings } = usePomodoro();
  const { tasks } = useAppContext(); // removed settings from here as pomodoroSettings comes from usePomodoro
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(currentFocusedTask?.id);

  useEffect(() => {
    const task = tasks.find(t => t.id === selectedTaskId);
    if (task) {
      selectTaskToFocus({ id: task.id, title: task.title });
    } else {
      selectTaskToFocus(undefined);
    }
  }, [selectedTaskId, tasks, selectTaskToFocus]);
  
  const totalDuration = (mode === 'work' ? pomodoroSettings.workDuration : mode === 'shortBreak' ? pomodoroSettings.shortBreakDuration : pomodoroSettings.longBreakDuration) * 60;
  const progressPercentage = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;

  const modeTextColors = {
    work: 'text-red-500 dark:text-red-400',
    shortBreak: 'text-green-500 dark:text-green-400',
    longBreak: 'text-blue-500 dark:text-blue-400',
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-8 animate-fadeIn">
      <div className="text-center">
        <h2 className={`text-3xl font-bold ${modeTextColors[mode]}`}>
          {mode === 'work' ? 'Focus Time' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
        </h2>
        {currentFocusedTask && mode === 'work' && (
          <p className="text-neutral-600 dark:text-neutral-300 mt-1">Focusing on: {currentFocusedTask.title}</p>
        )}
      </div>

      <div className="relative w-64 h-64 sm:w-80 sm:h-80">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            className="text-neutral-200 dark:text-neutral-700"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="40"
            cx="50"
            cy="50"
          />
          {/* Progress circle */}
          <circle
            className={modeTextColors[mode]}
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 40}
            strokeDashoffset={(2 * Math.PI * 40) * (1 - progressPercentage / 100)}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="40"
            cx="50"
            cy="50"
            transform="rotate(-90 50 50)"
            style={{transition: 'stroke-dashoffset 0.5s ease-out'}}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl sm:text-6xl font-mono text-neutral-800 dark:text-neutral-100">{formatTime(timeLeft)}</span>
        </div>
      </div>


      <div className="flex space-x-3">
        {!isActive ? (
          <button onClick={startTimer} className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out transform hover:scale-105 flex items-center">
            <PlayIcon className="w-5 h-5 mr-2" /> Start
          </button>
        ) : (
          <button onClick={pauseTimer} className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out transform hover:scale-105 flex items-center">
            <PauseIcon className="w-5 h-5 mr-2" /> Pause
          </button>
        )}
        <button onClick={resetTimer} className="px-6 py-3 bg-neutral-500 hover:bg-neutral-600 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out transform hover:scale-105 flex items-center">
          <StopIcon className="w-5 h-5 mr-2" /> Reset
        </button>
        <button onClick={skipTimer} className="px-6 py-3 bg-secondary-500 hover:bg-secondary-600 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out transform hover:scale-105 flex items-center">
          <SkipNextIcon className="w-5 h-5 mr-2" /> Skip
        </button>
      </div>

      <div className="w-full max-w-md">
        <label htmlFor="task-select" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Select task to focus on:</label>
        <select 
          id="task-select"
          value={selectedTaskId || ''}
          onChange={e => setSelectedTaskId(e.target.value || undefined)}
          className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">-- No specific task --</option>
          {tasks.filter(t => !t.isCompleted).map(task => (
            <option key={task.id} value={task.id}>{task.title}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

const BoardsView: React.FC = () => {
  const { boards, getTasksByBoard, deleteTask, toggleTaskComplete, settings, addBoard, deleteBoard, activeBoardId, setActiveBoardId } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [newBoardName, setNewBoardName] = useState('');
  
  const navigate = useNavigate();

  const currentActiveBoardId = activeBoardId ?? (boards.length > 0 ? boards[0].id : null);
  const tasksForCurrentBoard = currentActiveBoardId ? getTasksByBoard(currentActiveBoardId) : [];

  const handleOpenModal = (task?: Task) => {
    setTaskToEdit(task || null);
    setIsModalOpen(true);
  };

  const handleAddBoard = () => {
    if (newBoardName.trim() !== '') {
      const newBoard = addBoard(newBoardName.trim());
      setActiveBoardId(newBoard.id);
      setNewBoardName('');
    }
  };
  
  const handleDeleteBoard = (boardId: string) => {
    if (window.confirm("Are you sure you want to delete this board and all its tasks?")) {
      deleteBoard(boardId);
    }
  };

  const selectedTemplate = CARD_TEMPLATES.find(ct => ct.key === settings.selectedCardTemplateKey) || CARD_TEMPLATES[0];

  useEffect(() => {
    if (!currentActiveBoardId && boards.length > 0) {
      setActiveBoardId(boards[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boards, currentActiveBoardId]);


  return (
    <div className="p-1 md:p-4 animate-fadeIn">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h1 className="text-3xl font-bold mb-2 sm:mb-0">Task Boards</h1>
             <div className="flex items-center space-x-2">
                <input 
                    type="text"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    placeholder="New board name"
                    className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-neutral-700"
                />
                <button onClick={handleAddBoard} className="p-2 bg-primary-500 text-white rounded-md hover:bg-primary-600">
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>
        </div>

        {boards.length > 0 ? (
          <div className="flex space-x-2 pb-2 overflow-x-auto">
            {boards.map(board => (
              <button
                key={board.id}
                onClick={() => setActiveBoardId(board.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors
                  ${currentActiveBoardId === board.id ? 'bg-primary-600 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600'}`}
              >
                {board.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-neutral-500 dark:text-neutral-400">No boards yet. Create one to get started!</p>
        )}
      </div>

      {currentActiveBoardId && boards.find(b => b.id === currentActiveBoardId) ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">{boards.find(b => b.id === currentActiveBoardId)?.name}</h2>
            <div className="flex items-center space-x-2">
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 flex items-center">
                    <PlusIcon className="w-5 h-5 mr-2" /> Add Task
                </button>
                {boards.length > 1 && currentActiveBoardId && ( // ensure currentActiveBoardId is not null
                    <button onClick={() => handleDeleteBoard(currentActiveBoardId)} className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
          </div>
          {tasksForCurrentBoard.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasksForCurrentBoard.map(task => (
                <TaskCard 
                    key={task.id} 
                    task={task} 
                    onEdit={handleOpenModal} 
                    onDelete={deleteTask} 
                    onToggleComplete={toggleTaskComplete}
                    cardTemplate={selectedTemplate}
                />
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 dark:text-neutral-400 text-center py-8">No tasks in this board. Add one to get started!</p>
          )}
        </>
      ) : boards.length > 0 && (
         <p className="text-neutral-500 dark:text-neutral-400 text-center py-8">Select a board to view tasks.</p>
      )}
      
      {isModalOpen && currentActiveBoardId && (
        <TaskModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          taskToEdit={taskToEdit}
          boardId={currentActiveBoardId}
        />
      )}
    </div>
  );
};

const StatsView: React.FC = () => {
  const { pomodoroSessions, tasks } = useAppContext();

  // Check if Recharts global variable is available and has the necessary components
  if (typeof Recharts === 'undefined' || 
      !Recharts.BarChart || 
      !Recharts.PieChart || 
      !Recharts.ResponsiveContainer ||
      !Recharts.XAxis ||
      !Recharts.YAxis ||
      !Recharts.CartesianGrid ||
      !Recharts.Tooltip ||
      !Recharts.Legend ||
      !Recharts.Bar ||
      !Recharts.Pie ||
      !Recharts.Cell
      ) { 
    // console.warn("Recharts library not yet available or essential components missing."); // For debugging
    return <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">Loading charts...</p>;
  }
  
  // If Recharts is available, destructure its components here
  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } = Recharts;
  
  const sessionsPerDay = pomodoroSessions.reduce((acc, session) => {
    const day = new Date(session.startTime).toLocaleDateString();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sessionsPerDayData = Object.entries(sessionsPerDay)
    .map(([day, count]) => ({ day, count })).sort((a,b) => new Date(a.day).getTime() - new Date(b.day).getTime());

  const taskFocusData = pomodoroSessions
    .filter(s => s.type === 'work' && s.taskId)
    .reduce((acc, session) => {
      const task = tasks.find(t => t.id === session.taskId);
      const taskTitle = task ? task.title : 'Unknown Task';
      acc[taskTitle] = (acc[taskTitle] || 0) + session.duration;
      return acc;
    }, {} as Record<string, number>);
  
  const taskFocusChartData = Object.entries(taskFocusData)
    .map(([name, time]) => ({ name, time }))
    .sort((a,b) => b.time - a.time);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82Ca9D'];


  return (
    <div className="p-1 md:p-4 space-y-8 animate-fadeIn">
      <h1 className="text-3xl font-bold mb-6">Pomodoro Statistics</h1>
      
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Pomodoro Sessions Per Day</h2>
        {sessionsPerDayData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sessionsPerDayData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-700" />
              <XAxis dataKey="day" className="text-xs fill-neutral-600 dark:fill-neutral-300" />
              <YAxis allowDecimals={false} className="text-xs fill-neutral-600 dark:fill-neutral-300" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.8)', darkBackgroundColor: 'rgba(30,41,59,0.8)', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} 
                itemStyle={{ color: '#0f172a', darkColor: '#f1f5f9' }}
              />
              <Legend wrapperStyle={{fontSize: '0.875rem', color: '#334155', darkColor: '#cbd5e1'}}/>
              <Bar dataKey="count" fill="#3b82f6" name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-neutral-500 dark:text-neutral-400">No Pomodoro sessions recorded yet.</p>
        )}
      </div>

      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Time Spent on Tasks (Work Sessions)</h2>
        {taskFocusChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskFocusChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: {name: string, percent: number}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="time"
                className="text-xs fill-neutral-600 dark:fill-neutral-300"
              >
                {taskFocusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `${value} min`}
                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.8)', darkBackgroundColor: 'rgba(30,41,59,0.8)', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                itemStyle={{ color: '#0f172a', darkColor: '#f1f5f9' }}
              />
              <Legend wrapperStyle={{fontSize: '0.875rem', color: '#334155', darkColor: '#cbd5e1'}}/>
            </PieChart>
          </ResponsiveContainer>
        ) : (
           <p className="text-neutral-500 dark:text-neutral-400">No focused work sessions recorded for tasks.</p>
        )}
      </div>

      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-2">Recent Sessions</h2>
        {pomodoroSessions.length > 0 ? (
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {pomodoroSessions.slice(0, 20).map(session => (
              <li key={session.id} className="p-3 bg-neutral-50 dark:bg-neutral-700 rounded-md text-sm">
                <span className="font-medium capitalize">{session.type}</span> session completed on {new Date(session.endTime).toLocaleString()}.
                Duration: {session.duration} min.
                {session.taskTitle && ` (Task: ${session.taskTitle})`}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-neutral-500 dark:text-neutral-400">No sessions yet.</p>
        )}
      </div>
    </div>
  );
};

// Basic translation setup for demonstration in SettingsView
const translations: Record<string, Record<string, string>> = {
  en: {
    settingsTitle: "Settings",
    pomodoroTimersTitle: "Pomodoro Timer Durations (minutes)",
    taskCardTemplateTitle: "Task Card Template",
    notificationsTitle: "Notifications",
    enableSoundNotifs: "Enable sound notifications for timer events",
    languageTitle: "Language",
    resetToDefaults: "Reset to Defaults",
    saveSettings: "Save Settings",
    settingsSaved: "Settings saved!",
    settingsReset: "Settings reset to defaults!",
    workDuration: "Work Duration",
    shortBreakDuration: "Short Break Duration",
    longBreakDuration: "Long Break Duration",
    sessionsBeforeLongBreak: "Sessions Before Long Break",
  },
  es: {
    settingsTitle: "Configuración",
    pomodoroTimersTitle: "Duraciones del Temporizador Pomodoro (minutos)",
    taskCardTemplateTitle: "Plantilla de Tarjeta de Tarea",
    notificationsTitle: "Notificaciones",
    enableSoundNotifs: "Habilitar notificaciones sonoras para eventos del temporizador",
    languageTitle: "Idioma",
    resetToDefaults: "Restablecer Valores Predeterminados",
    saveSettings: "Guardar Configuración",
    settingsSaved: "¡Configuración guardada!",
    settingsReset: "¡Configuración restablecida a los valores predeterminados!",
    workDuration: "Duración del Trabajo",
    shortBreakDuration: "Duración del Descanso Corto",
    longBreakDuration: "Duración del Descanso Largo",
    sessionsBeforeLongBreak: "Sesiones Antes del Descanso Largo",
  },
  // Add more languages here as needed
  fr: {
    settingsTitle: "Paramètres",
    pomodoroTimersTitle: "Durées du minuteur Pomodoro (minutes)",
    taskCardTemplateTitle: "Modèle de carte de tâche",
    notificationsTitle: "Notifications",
    enableSoundNotifs: "Activer les notifications sonores pour les événements du minuteur",
    languageTitle: "Langue",
    resetToDefaults: "Réinitialiser aux valeurs par défaut",
    saveSettings: "Enregistrer les paramètres",
    settingsSaved: "Paramètres enregistrés !",
    settingsReset: "Paramètres réinitialisés aux valeurs par défaut !",
    workDuration: "Durée de travail",
    shortBreakDuration: "Durée de la pause courte",
    longBreakDuration: "Durée de la longue pause",
    sessionsBeforeLongBreak: "Sessions avant la longue pause",
  },
};

const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useAppContext();
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(settings.pomodoro);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(settings.selectedCardTemplateKey);
  const [soundNotifications, setSoundNotifications] = useState<boolean>(settings.soundNotifications);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(settings.language);

  // Effect to update local state if global settings change (e.g. after reset)
  useEffect(() => {
    setPomodoroSettings(settings.pomodoro);
    setSelectedTemplateKey(settings.selectedCardTemplateKey);
    setSoundNotifications(settings.soundNotifications);
    setSelectedLanguage(settings.language);
  }, [settings]);

  const t = useCallback((key: string): string => {
    const lang = selectedLanguage; // Use local state for instant feedback
    if (translations[lang] && translations[lang][key]) {
      return translations[lang][key];
    }
    // Fallback to English
    if (translations['en'] && translations['en'][key]) {
      return translations['en'][key];
    }
    // Fallback to a beautified key
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  }, [selectedLanguage]);


  const handlePomodoroChange = <K extends keyof PomodoroSettings,>(
    key: K,
    value: PomodoroSettings[K]
  ) => {
    setPomodoroSettings(prev => ({ ...prev, [key]: Number(value) }));
  };

  const handleSave = () => {
    updateSettings({ 
        pomodoro: pomodoroSettings, 
        selectedCardTemplateKey: selectedTemplateKey, 
        soundNotifications,
        language: selectedLanguage,
    });
    alert(t('settingsSaved'));
  };

  const handleResetToDefaults = () => {
    const defaultPomodoro = DEFAULT_SETTINGS.pomodoro;
    const defaultTemplateKey = DEFAULT_SETTINGS.selectedCardTemplateKey;
    const defaultSoundNotifications = DEFAULT_SETTINGS.soundNotifications;
    const defaultLanguage = DEFAULT_SETTINGS.language;

    // Update local state first for immediate UI reflection
    setPomodoroSettings(defaultPomodoro);
    setSelectedTemplateKey(defaultTemplateKey);
    setSoundNotifications(defaultSoundNotifications);
    setSelectedLanguage(defaultLanguage);
    
    // Then update global context
    updateSettings({
        pomodoro: defaultPomodoro,
        selectedCardTemplateKey: defaultTemplateKey,
        soundNotifications: defaultSoundNotifications,
        language: defaultLanguage,
    });
     alert(t('settingsReset'));
  };
  
  const pomodoroLabels: Record<keyof PomodoroSettings, string> = {
    workDuration: t('workDuration'),
    shortBreakDuration: t('shortBreakDuration'),
    longBreakDuration: t('longBreakDuration'),
    sessionsBeforeLongBreak: t('sessionsBeforeLongBreak'),
  };

  return (
    <div className="p-1 md:p-4 max-w-2xl mx-auto space-y-8 animate-fadeIn">
      <h1 className="text-3xl font-bold">{t('settingsTitle')}</h1>

      {/* Language Selection */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">{t('languageTitle')}</h2>
        <select 
            id="language-select"
            value={selectedLanguage} 
            onChange={e => setSelectedLanguage(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            aria-label={t('languageTitle')}
        >
            {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.nativeName} ({lang.name})</option>
            ))}
        </select>
      </div>

      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">{t('pomodoroTimersTitle')}</h2>
        <div className="space-y-4">
          {(Object.keys(pomodoroSettings) as Array<keyof PomodoroSettings>).map(key => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 capitalize">
                {pomodoroLabels[key] || key.replace(/([A-Z])/g, ' $1').replace('Duration', ' Duration').replace('Sessions Before Long Break', 'Sessions Before Long Break')}
              </label>
              <input
                type="number"
                id={key}
                min="1"
                value={pomodoroSettings[key]}
                onChange={e => handlePomodoroChange(key, parseInt(e.target.value, 10))}
                className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              />
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">{t('taskCardTemplateTitle')}</h2>
         <select 
            value={selectedTemplateKey} 
            onChange={e => setSelectedTemplateKey(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            aria-label={t('taskCardTemplateTitle')}
        >
            {CARD_TEMPLATES.map(template => (
                <option key={template.key} value={template.key}>{template.name}</option>
            ))}
        </select>
      </div>

      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">{t('notificationsTitle')}</h2>
        <div className="flex items-center">
            <input
                type="checkbox"
                id="soundNotifications"
                checked={soundNotifications}
                onChange={e => setSoundNotifications(e.target.checked)}
                className="h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="soundNotifications" className="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
                {t('enableSoundNotifs')}
            </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button onClick={handleResetToDefaults} className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-600 border border-neutral-300 dark:border-neutral-500 rounded-md shadow-sm hover:bg-neutral-200 dark:hover:bg-neutral-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">{t('resetToDefaults')}</button>
        <button onClick={handleSave} className="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          {t('saveSettings')}
        </button>
      </div>
    </div>
  );
};


const CurrentPageDisplay: React.FC = () => {
  const location = useLocation();

  switch (location.pathname) {
    case '/boards':
      return <BoardsView />;
    case '/stats':
      return <StatsView />;
    case '/settings':
      return <SettingsView />;
    case '/':
    default:
      return <FocusView />;
  }
};

export default CurrentPageDisplay;
