import React from 'react';
import { Grid } from 'react-loader-spinner';
import './chatbot.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-message">
      <Grid
        visible={true}
        height="80"
        width="80"
        color="#944EF0"
        ariaLabel="grid-loading"
        radius="12.5"
        wrapperStyle={{}}
        wrapperClass="grid-wrapper"
      />
      <p>Learning the website...</p>
    </div>
  );
};

export default LoadingSpinner;
