import { useState, useEffect } from 'react';
import axios from 'axios';
import AddModal from '../components/add_modal';


function Todo() {
    const [titles, setTitles] = useState([]);
    const apiUrl =  import.meta.env.VITE_ENDPOINT_URL;
    const [showModal, setShowModal] = useState(false);
    const [selectedTitle, setSelectedTitle] = useState(null);
    const [titleLists, setTitleLists] = useState([]);
    const [doneActivities, setDoneActivities] = useState([]);
    const [editTitle, setEditTitle] = useState(''); // New state for editing the title
    const [editingTitleId, setEditingTitleId] = useState(null); // To track which title is being edited
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editedTaskDesc, setEditedTaskDesc] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newList, setNewList] = useState("");
    



    useEffect(() => {
        getTitles(); // Get titles from the database
        const storedDoneActivities = JSON.parse(localStorage.getItem('doneActivities'));
        if (storedDoneActivities) {
            setDoneActivities(storedDoneActivities); // Get done activities from localStorage
        }
    }, []);

    const getTitles = async () => {
        try {
            const response = await axios.get(`${apiUrl}/get-titles`);
            const allTitles = response.data.titles;

            const storedDoneTitles = JSON.parse(localStorage.getItem('doneTitles')) || [];

            // Filter titles based on done statuses stored in localStorage
            const ongoingTitles = allTitles.filter((title) => !storedDoneTitles.includes(title.id));

            setTitles(ongoingTitles);
        } catch (error) {
            console.error("Error fetching titles:", error);
        }
    };

    const handleTitleClick = async (titleId) => {
        try {
            const response = await axios.get(`${apiUrl}/get-lists/${titleId}`);
            const tasks = response.data.lists;

            // Retrieve saved task completion state from localStorage
            const savedCompletionState = JSON.parse(localStorage.getItem(`taskCompletionState_${titleId}`)) || {};
            const updatedTasks = tasks.map((task) => ({
                ...task,
                completed: savedCompletionState[task.id] || false
            }));

            setTitleLists(updatedTasks);
            setSelectedTitle({ id: titleId, title: response.data.title });
        } catch (error) {
            console.error("Error fetching lists:", error);
            alert(`Error: ${error.response ? error.response.data.message : 'Unknown error'}`);
        }
    };

    const handleCheckboxChange = async (taskId) => {
        const updatedLists = titleLists.map((task) =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );

        setTitleLists(updatedLists);  // Update local state

        // Save updated task completion state to localStorage
        const updatedCompletionState = updatedLists.reduce((acc, task) => {
            acc[task.id] = task.completed;
            return acc;
        }, {});
        localStorage.setItem(`taskCompletionState_${selectedTitle.id}`, JSON.stringify(updatedCompletionState));

        // Find the updated task to get its new completed status
        const updatedTask = updatedLists.find(task => task.id === taskId);

        try {
            // Update the task status in the database
            await axios.put(`${apiUrl}/update-task-status/${taskId}`, {
                status: updatedTask.completed, // Send the new completed status
            });
            console.log('Task status updated in the database');
        } catch (error) {
            console.error('Error updating task status in the database:', error);
            alert('Error updating task status');
        }

        // Check if all tasks for the current title are completed
        const allCompleted = updatedLists.every((task) => task.completed);

        if (allCompleted) {
            moveTitleToDone();
        }
    };

    const moveTitleToDone = () => {
        if (!doneActivities.some((activity) => activity.id === selectedTitle.id)) {
            // Move title to the Done list
            setDoneActivities((prevDone) => {
                const updatedDoneActivities = [...prevDone, selectedTitle];
                // Save updated done activities to local storage
                localStorage.setItem('doneActivities', JSON.stringify(updatedDoneActivities));

                // Persist the done title in localStorage (doneTitles)
                const storedDoneTitles = JSON.parse(localStorage.getItem('doneTitles')) || [];
                if (!storedDoneTitles.includes(selectedTitle.id)) {
                    storedDoneTitles.push(selectedTitle.id);
                    localStorage.setItem('doneTitles', JSON.stringify(storedDoneTitles));
                }

                return updatedDoneActivities;
            });

            // Remove title from the Ongoing list
            setTitles((prevTitles) => prevTitles.filter((title) => title.id !== selectedTitle.id));

            // Hide the task list by clearing selectedTitle
            setSelectedTitle(null); // This will hide the "Tasks for: {selectedTitle.title}" section
        }
    };

    const handleDeleteTitle = async (titleId) => {
        try {
            // Delete the title from the database
            await axios.post(`${apiUrl}/delete-todo`, { title_id: titleId });
            console.log('Title deleted from the database');
            // Update the frontend state by removing the deleted title
            setTitles(titles.filter((title) => title.id !== titleId));
        } catch (error) {
            console.error('Error deleting title:', error);
            alert('Error deleting title');
        }
    };

    const handleEditTitle = async (titleId) => {
        try {
            // Make a PUT request to update the title
            const response = await axios.put(`${apiUrl}/edit-title/${titleId}`, {
                title: editTitle, // Send the edited title
                status: false, // You can adjust the status if needed (default to false)
            });

            console.log('Title updated:', response.data);

            // Update the frontend state by updating the titles list
            setTitles((prevTitles) =>
                prevTitles.map((title) =>
                    title.id === titleId ? { ...title, title: editTitle } : title
                )
            );

            // Reset editing state
            setEditingTitleId(null);
            setEditTitle('');
        } catch (error) {
            console.error('Error updating title:', error);
            alert('Error updating title');
        }
    };


    const handleDeleteTask = async (taskId) => {
        try {
            await axios.post(`${apiUrl}/delete-task`, { listIds: [taskId] }); // Send as an array
    
            console.log('Task deleted from the database');
    
            // Update local state to remove deleted task
            setTitleLists((prevLists) => prevLists.filter((task) => task.id !== taskId));
    
            // Remove task completion state from localStorage
            const updatedCompletionState = JSON.parse(localStorage.getItem(`taskCompletionState_${selectedTitle.id}`)) || {};
            delete updatedCompletionState[taskId];
            localStorage.setItem(`taskCompletionState_${selectedTitle.id}`, JSON.stringify(updatedCompletionState));
        } catch (error) {
            console.error('Error deleting task:', error.response?.data || error.message);
            alert('Error deleting task');
        }
    };
    
    
    const startEditing = (taskId, desc) => {
        setEditingTaskId(taskId);
        setEditedTaskDesc(desc);
    };
    
    const handleUpdateTask = async (taskId) => {
        try {
            await axios.post(`${apiUrl}/update-task`, { task_id: taskId, new_desc: editedTaskDesc });
    
            // Update local state
            setTitleLists((prevLists) =>
                prevLists.map((task) =>
                    task.id === taskId ? { ...task, list_desc: editedTaskDesc } : task
                )
            );
    
            setEditingTaskId(null); // Exit edit mode
        } catch (error) {
            console.error('Error updating task:', error.response?.data || error.message);
            alert('Error updating task');
        }
    };

    const handleAddTask = async () => {
        if (newTaskDesc.trim() === "") {
            alert("Task description cannot be empty!");
            return;
        }

        if (!selectedTitle?.id) {
            alert("Please select a title first!");
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/add-task`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title_id: selectedTitle.id,
                    list_desc: newTaskDesc.trim(),
                    status: false,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setTitleLists([...titleLists, { id: data.list_id, list_desc: newTaskDesc.trim(), status: false }]);
                setNewTaskDesc(""); // Clear input field
            } else {
                alert(data.message || "Failed to add task.");
            }
        } catch (error) {
            console.error("Error adding task:", error);
            alert("An error occurred while adding the task.");
        }
    };

    
    

     return (
        <div className="min-h-screen bg-gradient-to-r from-gray-800 to-black text-white p-8">
            <div className="container mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-semibold text-gray-300">To Do List</h1>
                </header>

                {/* Ongoing Tasks */}
                <div className="flex justify-between mb-8">
                    <div className="w-1/2 mr-4">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-300">Ongoing</h2>
                        <div className="bg-gray-900 p-4 rounded-lg shadow-lg">
                            {titles.length === 0 ? (
                                <p className="text-gray-500">No ongoing activities</p>
                            ) : (
                                titles.map((title) => (
                                    <div
                                        key={title.id}
                                        className="mb-2 p-3 bg-gray-800 rounded-md flex justify-between cursor-pointer"
                                        onClick={() => handleTitleClick(title.id)}
                                    >
                                        {editingTitleId === title.id ? (
                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                className="text-white bg-gray-700 rounded-md p-2"
                                            />
                                        ) : (
                                            <span>{title.title}</span>
                                        )}

                                        <button
                                            onClick={() => {
                                                setEditingTitleId(title.id);
                                                setEditTitle(title.title);
                                            }}
                                            className="ml-2 text-blue-500 hover:text-blue-400"
                                        >
                                            Edit
                                        </button>

                                        {editingTitleId === title.id && (
                                            <button
                                                onClick={() => handleEditTitle(title.id)}
                                                className="ml-2 text-green-500 hover:text-green-400"
                                            >
                                                Save
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDeleteTitle(title.id)}
                                            className="ml-2 text-red-500 hover:text-red-400"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    

                    {/* Done Titles */}
                    <div className="w-1/2 ml-4">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-300">Done</h2>
                        <div className="bg-gray-900 p-4 rounded-lg shadow-lg">
                            {doneActivities.length === 0 ? (
                                <p className="text-gray-500">No activities completed</p>
                            ) : (
                                doneActivities.map((task) => (
                                    <div key={task.id} className="mb-2 p-3 bg-gray-800 rounded-md flex justify-between">
                                        {task.title}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {showModal && <AddModal hide={() => setShowModal(false)} onTaskAdded={getTitles} />}
                <div className="mt-8 text-center">
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="py-3 px-8 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition duration-300"
                                >
                                    Add New Task
                                </button>
                            </div>
                            

                {selectedTitle && (
    <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-300">
            Tasks for: {selectedTitle.title}
        </h2>
        <div className="bg-gray-900 p-4 rounded-lg shadow-lg w-[760px]">

            {/* Task Input for Adding a New Task */}
            <div className="mb-4 flex">
            <input
                    type="text"
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder="Enter new task..."
                    className="flex-1 bg-gray-700 text-white p-2 rounded-md"
                />
                <button
                    onClick={handleAddTask}
                    className="ml-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-500"
                >
                    Add
                </button>
            </div>

            {/* Display Existing Tasks */}
            {titleLists.map((task) => (
                <div
                    key={task.id}
                    className="mb-2 py-2 px-6 bg-gray-800 rounded-md flex items-center justify-between"
                >
                    {/* Task Description Input for Editing */}
                    {editingTaskId === task.id ? (
                        <input
                            type="text"
                            value={editedTaskDesc}
                            onChange={(e) => setEditedTaskDesc(e.target.value)}
                            className="flex-1 bg-gray-700 text-white p-2 rounded-md"
                        />
                    ) : (
                        <p className="flex-1">{task.list_desc}</p>
                    )}

                    {/* Checkbox */}
                    <input
                        type="checkbox"
                        checked={task.completed || false}
                        onChange={() => handleCheckboxChange(task.id)}
                        className="mr-4"
                    />

                    {/* Edit Button */}
                    {editingTaskId === task.id ? (
                        <button
                            onClick={() => handleUpdateTask(task.id)}
                            className="text-green-500 hover:text-green-400 mr-2"
                        >
                            Save
                        </button>
                    ) : (
                        <button
                            onClick={() => startEditing(task.id, task.list_desc)}
                            className="text-blue-500 hover:text-blue-400 mr-2"
                        >
                            Edit
                        </button>
                    )}

                    {/* Delete Button */}
                    <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-500 hover:text-red-400"
                    >
                        Delete
        </button>
    </div>
))}
                            {showModal && <AddModal hide={() => setShowModal(false)} onTaskAdded={getTitles} />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Todo;
