import React from 'react';

const Tools: React.FC = () => {
  return (
    <div className="page-container">
      <h2 className="page-title">Tools</h2>
      
      <div className="content">
        <div className="form-actions" style={{ marginBottom: '20px' }}>
          <p>Welcome to the Tools page. Select a tool below:</p>
        </div>

        <div className="table-container">
          <div style={{ display: 'grid', gap: '20px', maxWidth: '800px' }}>
            <div 
              className="form-actions" 
              style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '20px',
                cursor: 'pointer',
                transition: 'box-shadow 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <h3 style={{ marginTop: 0 }}>Data Import/Export</h3>
              <p>Import or export data from various sources.</p>
            </div>

            <div 
              className="form-actions" 
              style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '20px',
                cursor: 'pointer',
                transition: 'box-shadow 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <h3 style={{ marginTop: 0 }}>Reports Generator</h3>
              <p>Generate custom reports for training and meet results.</p>
            </div>

            <div 
              className="form-actions" 
              style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '20px',
                cursor: 'pointer',
                transition: 'box-shadow 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <h3 style={{ marginTop: 0 }}>Database Utilities</h3>
              <p>Manage and maintain database records.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tools;
