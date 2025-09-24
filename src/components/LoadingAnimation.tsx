import React from 'react'
import './LoadingAnimation.css'

interface LoadingAnimationProps {
  text?: string
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ text = "Generando" }) => {
  const letters = text.split('')

  return (
    <div className="loader" id="loader">
      <div className="loader-wrapper">
        {letters.map((letter, index) => (
          <span
            key={index}
            className="loader-letter"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {letter}
          </span>
        ))}
        <span className="loader-letter" style={{ animationDelay: `${letters.length * 0.1}s` }}>.</span>
        <span className="loader-letter" style={{ animationDelay: `${(letters.length + 1) * 0.1}s` }}>.</span>
        <span className="loader-letter" style={{ animationDelay: `${(letters.length + 2) * 0.1}s` }}>.</span>
        <div className="loader-circle"></div>
      </div>
    </div>
  )
}

export default LoadingAnimation