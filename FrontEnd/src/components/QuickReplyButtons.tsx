import React from 'react';

interface QuickReplyButton {
  id: string;
  text: string;
  icon?: string;
  action?: string;
}

interface QuickReplyButtonsProps {
  buttons: QuickReplyButton[];
  onButtonClick: (button: QuickReplyButton) => void;
  visible?: boolean;
}

const QuickReplyButtons: React.FC<QuickReplyButtonsProps> = ({ 
  buttons, 
  onButtonClick, 
  visible = true 
}) => {
  if (!visible || buttons.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginTop: '12px',
      padding: '0 16px'
    }}>
      {buttons.map((button) => (
        <button
          key={button.id}
          onClick={() => onButtonClick(button)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: '14px',
            color: '#333',
            textAlign: 'left',
            width: '100%',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8f9fa';
            e.currentTarget.style.borderColor = '#007bff';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = '#e0e0e0';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          }}
        >
          {button.icon && (
            <span style={{
              marginRight: '8px',
              fontSize: '16px'
            }}>
              {button.icon}
            </span>
          )}
          <span style={{ flex: 1 }}>{button.text}</span>
          <span style={{
            fontSize: '12px',
            color: '#666',
            marginLeft: '8px'
          }}>
            →
          </span>
        </button>
      ))}
    </div>
  );
};

export default QuickReplyButtons;
