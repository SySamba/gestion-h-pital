import React from 'react';
import { useNavigate } from 'react-router-dom';
import './QuickAction.css';

export default function QuickAction({ icon, title, description, to, color = 'blue', onClick }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) onClick();
    else if (to) navigate(to);
  };

  return (
    <button type="button" className={`quick-action quick-action-${color}`} onClick={handleClick}>
      <span className="quick-action-icon">{icon}</span>
      <div className="quick-action-text">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <span className="quick-action-arrow">→</span>
    </button>
  );
}
