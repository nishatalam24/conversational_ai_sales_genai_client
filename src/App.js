import React, { useState } from 'react';
import './App.css';
import ChatPanel from './components/ChatPanel';
import Dashboard from './components/Dashboard';

function App() {
  const [chatHistory, setChatHistory] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  const handleDashboardDataChange = (newData) => {
    setDashboardData(newData);
  };

  return (
    <div className="app-container">
      <div className="side-panel">
        <h1>🤖 AI Sales Assistant</h1>
        <p>Ask me anything about your sales data!</p>
        
        <ChatPanel 
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
          isThinking={isThinking}
          setIsThinking={setIsThinking}
          setDashboardData={setDashboardData}
        />
      </div>
      
      <div className="main-content">
        <Dashboard 
          data={dashboardData} 
          onFilterChange={handleDashboardDataChange}
        />
      </div>
    </div>
  );
}

export default App;