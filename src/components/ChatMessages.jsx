import React from 'react';
import './chatbot.css';
import { BiUser } from "react-icons/bi";
import { MdOutlineStorage } from "react-icons/md";
import { ThreeDots } from 'react-loader-spinner';

const ChatMessages = ({ messages, chatBoxRef, isLoading }) => {
  return (
    <div className="chat-box" ref={chatBoxRef}>
      {messages.map((message, index) => (
        <div key={index} className={`chat-message ${message.sender}`}>
          {message.sender === 'user' ? '' : <div className="botIcon"> <MdOutlineStorage size={'18px'} /> </div>}
          <span>{message.text}</span>
          {message.sender === 'user' ? <div className="userIcon"> <BiUser size={'18px'} /> </div> : ''}
        </div>
      ))}
      {isLoading && (
        <div className="loading-message">
          <ThreeDots
            visible={true}
            height="50"
            width="80"
            color="#944EF0"
            radius="2"
            ariaLabel="three-dots-loading"
            wrapperStyle={{}}
            wrapperClass=""
          />
        </div>
      )}
    </div>
  );
};

export default ChatMessages;
