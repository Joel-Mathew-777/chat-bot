import React from 'react';
import './chatbot.css';

const SuggestedQuestions = ({ suggestedQuestions, onClick }) => {
  return (
    <div className="suggested-questions-container">
      <label>Choose a question to start conversation:</label>
      <div className="suggested-questions">
        {suggestedQuestions.map((question, index) => (
          <div key={index} className="suggested-question-box" onClick={() => onClick(question)}>
            {question}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQuestions;
