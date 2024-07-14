import './App.css';
import React, {useState} from 'react';
import { FaPowerOff } from "react-icons/fa";
// import ChatBot from './components/Chatbot';
import ChatBot from './components/Chatbot';

function App() {
  const [showChatBot, setShowChatBot] = useState(false);

  const handleStartChat = () => {
    setShowChatBot(true);
  };

  return (
    <div className="App">
      {showChatBot ? (
        <ChatBot />
      ) : (
        <div className="home-screen">
          <h1>Want to chat with the current webpage?</h1>
          <button className='startButton' onClick={handleStartChat}><FaPowerOff size={"30px"} />Start Chatting</button>
          
        </div>
      )}
    </div>
  );
}

export default App;
