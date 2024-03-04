import React from 'react';
import { Oval, Comment, ThreeDots  } from 'react-loader-spinner';

export const OvalLoader = () => {
  return (
    <div className="loading-icon-container">
      <Oval
        height="30"
        width="30"
        color="#007bff" // Blue color for spinning content
        secondaryColor="#e0e0e0" // Grey color for the outline
        ariaLabel="oval-loading"
        strokeWidth="5"
        strokeWidthSecondary="5"
      />
    </div>
  );
};

export const CommentLoader = () => {
  return (
    <Comment
      visible={true}
      height="40"
      width="40"
      ariaLabel="comment-loading"
      wrapperStyle={{ transform: 'scaleX(-1)' }} // Flips the loader horizontally
      wrapperClass="comment-wrapper"
      color="#007bff"
      backgroundColor="#e0e0e0"
      />
  )
}

export const ThreeDotsLoader = () => {
  return (
    <ThreeDots
      visible={true}
      height="30"
      width="30"
      color="#007bff"
      radius="9"
      ariaLabel="three-dots-loading"
      wrapperStyle={{}}
      wrapperClass=""
      />
  )
}
