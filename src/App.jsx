import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();
  const apiUrl =  import.meta.env.VITE_ENDPOINT_URL;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);
  

  const handleLogin = async () => {
    await axios.post(`${apiUrl}/check-user`, { username, password })
      .then((response) => {
        if (response.data.exist) {
          setShowError(false);
          navigate('/todo', { state: { username } }); 
        } else {
          setShowError(true);
        }
      })
  }

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-gradient-to-r from-gray-800 to-black">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-xl shadow-xl">
        <h1 className="text-4xl text-center font-semibold text-white mb-8">Login</h1>

        {showError && 
          <div className="bg-gray-800 text-red-500 p-4 rounded-lg mb-6 text-center shadow-md">
            INVALID username or password
          </div>
        }
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full p-3 border border-gray-600 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border border-gray-600 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex items-center mb-6">
          <input type="checkbox" className="mr-2" id="remember" />
          <label htmlFor="remember" className="text-sm text-gray-400">Remember me</label>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          className="w-full py-3 bg-gray-700 text-white text-xl rounded-lg hover:bg-gray-600 transition duration-300"
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default App;
