// app/page.tsx

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { v4 as uuidv4 } from 'uuid'; // Uncomment if you install uuid

// Types
type Subtask = {
  id: number; // Prefer string if using uuid
  text: string;
  completed: boolean;
};

type Todo = {
  id: number; // Prefer string if using uuid
  text: string;
  completed: boolean;
  subtasks: Subtask[];
};

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [subtaskInputs, setSubtaskInputs] = useState<Record<number, string>>({});
  const [aiInput, setAiInput] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  // Utility for unique IDs
  const getId = () => Date.now() + Math.random(); // Replace with uuidv4() for string IDs

  // Add a new todo
  const addTodo = useCallback(() => {
    if (newTodo.trim() === '') return;
    const todo: Todo = {
      id: getId(),
      text: newTodo.trim(),
      completed: false,
      subtasks: [],
    };
    setTodos((prev) => [todo, ...prev]);
    setNewTodo('');
  }, [newTodo]);

  // Toggle todo completion
  const toggleTodo = useCallback((id: number) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, []);

  // Delete a todo
  const deleteTodo = useCallback((id: number) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  // Add a subtask to a todo
  const addSubtask = useCallback((todoId: number, subtaskText: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              subtasks: [
                ...todo.subtasks,
                {
                  id: getId(),
                  text: subtaskText,
                  completed: false,
                },
              ],
            }
          : todo
      )
    );
  }, []);

  // Toggle subtask completion
  const toggleSubtask = useCallback((todoId: number, subtaskId: number) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              subtasks: todo.subtasks.map((sub) =>
                sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
              ),
            }
          : todo
      )
    );
  }, []);

  // Generate todos with AI
  const generateWithAI = useCallback(async () => {
    if (aiInput.trim() === '') return;
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiInput }),
      });
      const data = await res.json();
      const generatedTodos: { task: string; subtasks: string[] }[] = data.tasks;

      const newTasks: Todo[] = generatedTodos.map((item) => ({
        id: getId(),
        text: item.task,
        completed: false,
        subtasks: item.subtasks.map((sub) => ({
          id: getId(),
          text: sub,
          completed: false,
        })),
      }));

      setTodos((prev) => [...newTasks, ...prev]);
      setAiInput('');
    } catch (err) {
      console.error('AI generation failed', err);
    } finally {
      setLoadingAi(false);
    }
  }, [aiInput]);

  // Handle subtask input change
  const handleSubtaskInputChange = useCallback(
    (todoId: number, value: string) => {
      setSubtaskInputs((prev) => ({ ...prev, [todoId]: value }));
    },
    []
  );

  // Handle subtask form submit
  const handleSubtaskSubmit = useCallback(
    (e: React.FormEvent, todoId: number) => {
      e.preventDefault();
      const text = subtaskInputs[todoId]?.trim();
      if (!text) return;
      addSubtask(todoId, text);
      setSubtaskInputs((prev) => ({ ...prev, [todoId]: '' }));
    },
    [subtaskInputs, addSubtask]
  );

  return (
    <main className="min-h-screen flex flex-col items-center p-6 bg-gray-800 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-gray-100">Dylan Waters's AI Assisted To-Do List</h1>

      {/* AI Toggle + Add Task Bar */}
      <div className="flex gap-2 mb-4 w-full max-w-md items-center">
        <button
          onClick={() => setShowAI((prev) => !prev)}
          className={`flex items-center justify-center w-10 h-10 rounded-md transition 
            ${showAI ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-700'} 
            hover:bg-purple-600 hover:text-white`}
          title="Toggle AI Task Generator"
        >
          🧠
        </button>

        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a new task..."
          className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />

        <button
          onClick={addTodo}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          ➕ Add
        </button>
      </div>

      <AnimatePresence>
        {showAI && (
          <motion.div
            key="ai-box"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md mb-6 overflow-hidden"
          >
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Ask AI to generate tasks (e.g., Plan my weekend)..."
              className="w-full p-3 border border-purple-300 rounded-md mb-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
            <button
              onClick={generateWithAI}
              disabled={loadingAi}
              className="bg-purple-600 text-white px-4 py-2 rounded-md w-full hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loadingAi ? 'Generating...' : '✨ Generate with AI'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ul className="w-full max-w-md space-y-4">
        <AnimatePresence>
          {todos.map((todo) => (
            <motion.li
              key={todo.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className=" rounded-md mb-2 resize-none focus:outline-none focus:ring-2 focus:ring-black-500 transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    className="mt-1 accent-green-500"
                  />
                  <h3
                    className={`text-md font-semibold text-gray-200 ${
                      todo.completed ? 'line-through text-gray-400 italic' : 'text-gray-200'
                    }`}
                  >
                    {todo.text}
                  </h3>
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-red-500 hover:text-red-700 text-lg transition"
                  title="Delete Task"
                >
                  ✕
                </button>
              </div>

              {/* Subtasks */}
              {todo.subtasks.length > 0 && (
                <ul className="mt-3 space-y-1 pl-6 border-l border-gray-200">
                  {todo.subtasks.map((sub) => (
                    <li key={sub.id} className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => toggleSubtask(todo.id, sub.id)}
                        className="accent-indigo-500"
                      />
                      <span className={sub.completed ? 'line-through text-gray-400' : ''}>
                        {sub.text}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Add Subtask */}
              <form
                onSubmit={(e) => handleSubtaskSubmit(e, todo.id)}
                className="flex gap-2 mt-3 pl-6"
              >
                <input
                  type="text"
                  value={subtaskInputs[todo.id] || ''}
                  onChange={(e) => handleSubtaskInputChange(todo.id, e.target.value)}
                  placeholder="Add subtask..."
                  className="flex-grow p-1 border border-gray-300 rounded text-sm"
                />
                <button
                  type="submit"
                  className="bg-indigo-500 text-white px-2 py-1 text-sm rounded hover:bg-indigo-600"
                >
                  ➕
                </button>
              </form>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </main>
  );
}
