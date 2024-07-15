/*global chrome*/
import React, { useState, useEffect, useRef } from 'react';
import './chatbot.css';
import { askQuestion, getUrlContext, startChat } from '../api'; // Import the API functions
import SuggestedQuestions from './SuggestedQuestions';
import ChatMessages from './ChatMessages';
import LoadingSpinner from './LoadingSpinner';
import { BiSend } from "react-icons/bi";

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [contentExtracted, setContentExtracted] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(true);
  const [url, setUrl] = useState('');
  const [match, setMatch] = useState(false);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      const currentUrl = tabs[0].url;
      setUrl(currentUrl);
    });
  }, []);

  useEffect(() => {
    const checkContext = async () => {
      if (url) {
        console.log("Current url: ", url);
        try {
          const data = await getUrlContext(url);
          if (data.match === 'true') {
            console.log(data.match);
            setMatch(true);
            chrome.storage.local.get(["chat history", "suggested_questions"], function (items) {
              console.log(items);
              setMessages(items["chat history"] || []);
              setSuggestedQuestions(items["suggested_questions"] || []);
              setContentExtracted(true);
              if (!items["chat history"] || items["chat history"].length === 0) {
                setShowSuggestedQuestions(true);
              }
            });
          } else {
            console.log(data.match);
            chrome.storage.local.set({"chat history": []});
            setMatch(false);
            fetchQuestions();
          }
        } catch (error) {
          console.error('Error checking context:', error);
        }
      }
    };

    const fetchQuestions = async () => {
      try {
        const data = await startChat(url);
        setSuggestedQuestions(data.suggested_questions || []);
        setContentExtracted(true);
        chrome.storage.local.set({"suggested_questions": data.suggested_questions || []});
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    };

    checkContext();
  }, [url]); // Only call checkContext when the URL has been set

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (question) => {
    const newMessages = [...messages, { text: question, sender: 'user' }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setShowSuggestedQuestions(false);
    let response;
    try {
      response = await askQuestion(question);
      setMessages([...newMessages, { text: response, sender: 'bot' }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages([...newMessages, { text: 'Sorry, something went wrong.', sender: 'bot' }]);
    } finally {
      chrome.storage.local.set({ "chat history": [...newMessages, { text: response, sender: 'bot' }] });
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend(input);
    }
  };

  const handleSuggestedQuestionClick = (question) => {
    handleSend(question);
  };

  return (
    <div className="container">
      {contentExtracted ? (
        <div className="chat-container">
          {showSuggestedQuestions && messages.length === 0 && (
            <SuggestedQuestions 
              suggestedQuestions={suggestedQuestions}
              onClick={handleSuggestedQuestionClick}
            />
          )}
          <ChatMessages 
            messages={messages}
            chatBoxRef={chatBoxRef}
            isLoading={isLoading}
          />
          <div className="chat-input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isLoading}
            />
            <button className='sendButton' onClick={() => handleSend(input)} disabled={isLoading}>
              <BiSend size={'18px'} />
            </button>
          </div>
        </div>
      ) : (
        <LoadingSpinner />
      )}
    </div>
  );
};

export default ChatBot;
 