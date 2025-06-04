// components/TooltipWrapper.js
import React, { useState } from 'react';

export default function TooltipWrapper({ children, text, position = 'top' }) {
  const [show, setShow] = useState(false);

  const tooltipStyles = {
    position: 'absolute',
    [position]: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#333',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    marginTop: '5px'
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-block', marginRight: '10px' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && <div style={tooltipStyles}>{text}</div>}
    </div>
  );
}
