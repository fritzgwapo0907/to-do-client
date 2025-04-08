// AddModal.jsx
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function AddModal({ hide, onTaskAdded }) {
    const { state } = useLocation();  // Get the username from location state
    const [title, setTitle] = useState('');
    const [tasks, setTasks] = useState(['']);
    const [username, setUsername] = useState(state?.username || '');  // Initialize username from state
    const [status, setStatus] = useState('pending'); // Assuming a default status
    const [message, setMessage] = useState(null); // State for the success/error message

    useEffect(() => {
        // Ensure username is set correctly if it's passed from the login state
        if (state?.username) {
            setUsername(state.username);
        }
    }, [state]);

    // Add a new task input field
    const addTask = () => {
        setTasks([...tasks, '']);
    };

    // Remove a task input field
    const removeTask = (index) => {
        setTasks(tasks.filter((_, i) => i !== index));
    };

    const saveToDo = async () => {
        const lists = tasks.filter(task => task.trim() !== ''); 
        if (!title || lists.length === 0) {
            setMessage({ text: "Please provide a title and at least one task.", type: "error" });
            return;
        }
    
        const requestBody = {
            username,  // Pass the username from the state
            title,
            lists,
            status,
        };
    
        try {
            const response = await fetch("http://localhost:3000/add-to-do", { 
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });
    
            if (!response.ok) {
                const errorText = await response.text();
                setMessage({ text: errorText || 'An error occurred while saving the to-do list.', type: "error" });
                return;
            }
    
            let result;
            try {
                result = await response.json();
            } catch (err) {
                setMessage({ text: "Failed to parse the response from the server.", type: "error" });
                return;
            }
    
            if (result.success) {
                setMessage({ text: "To-Do List added successfully!", type: "success" });
                onTaskAdded({ id: result.id, title }); // Send the new task directly to parent
                hide(); // Close the modal on success
            } else {
                setMessage({ text: result.message || "Something went wrong", type: "error" });
            }
        } catch (error) {
            setMessage({ text: "An error occurred while saving the to-do list. Please try again later.", type: "error" });
        }
    };
    

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs bg-opacity-50">
            <div className="relative w-full max-w-md p-6 bg-black rounded-lg shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">About Your Tool</h3>
                    <button onClick={hide} id="closeModalButton" className="text-gray-500 hover:text-gray-700">
                        <svg
                            className="h-4 w-4 inline-block ml-2"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Task Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white-900 placeholder-gray-400"
                        />
                    </div>

                    <div className="mt-3">
                        <label htmlFor="list" className="block text-sm font-medium text-gray-700">Task List</label>

                        <div className="space-y-2">
                            {tasks.map((task, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={task}
                                        onChange={(e) => {
                                            const updatedTasks = [...tasks];
                                            updatedTasks[index] = e.target.value;
                                            setTasks(updatedTasks);
                                        }}
                                        className="p-2 border border-gray-300 rounded-md w-full"
                                        placeholder={`Task ${index + 1}`}
                                    />

                                    {tasks.length > 1 && (
                                        <button
                                            onClick={() => removeTask(index)}
                                            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={addTask} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        Add Task
                    </button>
                    <button onClick={saveToDo} className="mb-4 px-4 py-2 m-[5px] bg-green-500 text-white rounded-lg hover:bg-green-600">
                        Save
                    </button>

                    {/* Display message */}
                    {message && (
                        <div className={`mt-3 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                            <p className="text-white">{message.text}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
