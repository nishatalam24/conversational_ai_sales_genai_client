import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import { getApiUrl } from '../config';

const ChatPanel = ({ chatHistory, setChatHistory, isThinking, setIsThinking, setDashboardData }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [isGeneratingSuggestionsPDF, setIsGeneratingSuggestionsPDF] = useState(false);
  const [isGeneratingChatPDF, setIsGeneratingChatPDF] = useState(false);
  const [lastQueryContext, setLastQueryContext] = useState('');
  const chatHistoryRef = useRef(null);
const [suggestionContext, setSuggestionContext] = useState({
  lastQuery: '',
  queryType: '',
  metrics: null
});
  // Auto-scroll to bottom when new messages arrive
// Update auto-scroll effect
useEffect(() => {
  const scrollToBottom = () => {
    if (chatHistoryRef.current) {
      const scrollHeight = chatHistoryRef.current.scrollHeight;
      const height = chatHistoryRef.current.clientHeight;
      const maxScrollTop = scrollHeight - height;
      
      // Smooth scroll to bottom
      chatHistoryRef.current.scrollTo({
        top: maxScrollTop,
        behavior: 'smooth'
      });
    }
  };

  // Small delay to ensure content is rendered
  const timeoutId = setTimeout(scrollToBottom, 100);
  return () => clearTimeout(timeoutId);
}, [chatHistory, isThinking, filteredHistory]);

  // Filter chat history based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredHistory(chatHistory);
    } else {
      const filtered = chatHistory.filter(message => {
        const text = message.parts?.[0]?.text || message.content || '';
        return text.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredHistory(filtered);
    }
  }, [searchQuery, chatHistory]);

  // Function to clean text for PDF (remove special characters that cause encoding issues)
  const cleanTextForPDF = (text) => {
    if (!text) return '';
    
    return text
      // Remove problematic Unicode characters
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Convert bullet points to simple dashes
      .replace(/[•▪▫]/g, '-')
      .replace(/^\* /gm, '- ')
      .replace(/^- /gm, '- ')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Function to format text for display (remove markdown)
  // const formatMessageForDisplay = (text) => {
  //   if (!text) return '';
    
  //   return text
  //     // Remove ** bold ** markers but keep content
  //     .replace(/\*\*(.*?)\*\*/g, '$1')
  //     // Remove * italic * markers but keep content
  //     .replace(/\*(.*?)\*/g, '$1')
  //     // Convert bullet points to proper display
  //     .replace(/^\* /gm, '• ')
  //     .replace(/^- /gm, '• ')
  //     // Clean up extra spaces
  //     .replace(/\s+/g, ' ')
  //     .trim();
  // };

  // Update formatMessageForDisplay function
const formatMessageForDisplay = (text) => {
  if (!text) return '';
  
  return text
    // Preserve bold and italic markers but wrap in spans
    .replace(/\*\*(.*?)\*\*/g, '<span class="bold">$1</span>')
    .replace(/\*(.*?)\*/g, '<span class="italic">$1</span>')
    // Convert bullet points with proper spacing
    .replace(/^\* /gm, '<span class="bullet">•</span> ')
    .replace(/^- /gm, '<span class="bullet">•</span> ')
    // Preserve line breaks
    .replace(/\n/g, '<br/>')
    // Clean up extra spaces but preserve intended spacing
    .replace(/\s+/g, ' ')
    .trim();
};

  // Enhanced PDF generation for suggestions
  const downloadSuggestionsPDF = async () => {
    if (suggestions.length === 0) {
      alert('No suggestions available to download');
      return;
    }

    setIsGeneratingSuggestionsPDF(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Set default font to ensure proper character rendering
      pdf.setFont('helvetica', 'normal');
      
      // Header with solid background
      pdf.setFillColor(102, 126, 234);
      pdf.rect(0, 0, 210, 40, 'F');
      
      // Title - using simple text to avoid encoding issues
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI Sales Query Suggestions', 20, 25);
      
      // Context info
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const contextText = cleanTextForPDF(`Generated for: ${lastQueryContext || 'Sales Analysis'}`);
      pdf.text(contextText, 20, 35);
      
      // Date and time
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      pdf.setTextColor(102, 126, 234);
      pdf.setFontSize(11);
      pdf.text(`Generated on ${dateStr} at ${timeStr}`, 20, 55);
      
      // Main content
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Recommended Queries:', 20, 75);
      
      // Suggestions with clean formatting
      let yPosition = 90;
      suggestions.forEach((suggestion, index) => {
        if (yPosition > 260) {
          pdf.addPage();
          yPosition = 30;
        }
        
        // Simple number instead of circle to avoid rendering issues
        pdf.setFillColor(102, 126, 234);
        pdf.rect(20, yPosition - 8, 15, 10, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${index + 1}`, 25, yPosition - 2);
        
        // Clean suggestion text
        pdf.setTextColor(60, 60, 60);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        const cleanSuggestion = cleanTextForPDF(suggestion);
        const lines = pdf.splitTextToSize(cleanSuggestion, 160);
        pdf.text(lines, 40, yPosition);
        
        yPosition += Math.max(lines.length * 6, 12) + 8;
      });
      
      // Footer
      pdf.setFillColor(248, 249, 250);
      pdf.rect(0, 280, 210, 17, 'F');
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Generated by AI Sales Analytics Dashboard', 20, 290);
      
      // Save PDF with clean filename
      const timestamp = now.toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-');
      const context = lastQueryContext.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 20);
      pdf.save(`Sales-Suggestions-${context}-${timestamp}.pdf`);
      
    } catch (error) {
      console.error('Error generating suggestions PDF:', error);
      alert('Error generating suggestions PDF. Please try again.');
    } finally {
      setIsGeneratingSuggestionsPDF(false);
    }
  };

  // Enhanced PDF generation for chat history
  const downloadChatPDF = async () => {
    if (filteredHistory.length === 0) {
      alert('No chat history available to download');
      return;
    }

    setIsGeneratingChatPDF(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Set default font
      pdf.setFont('helvetica', 'normal');
      
      // Header
      pdf.setFillColor(102, 126, 234);
      pdf.rect(0, 0, 210, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Sales Analysis Conversation', 20, 25);
      
      // Date and message count
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      pdf.setFontSize(12);
      pdf.text(`${dateStr} | ${filteredHistory.length} messages`, 20, 35);
      
      let yPosition = 60;
      
      filteredHistory.forEach((message, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }
        
        // Message header
        const isUser = message.role === 'user';
        pdf.setFillColor(isUser ? 118 : 102, isUser ? 75 : 126, isUser ? 162 : 234);
        pdf.rect(15, yPosition - 8, 180, 12, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(isUser ? 'You asked:' : 'AI Response:', 20, yPosition - 2);
        
        yPosition += 8;
        
        // Message content - cleaned for PDF
        pdf.setTextColor(60, 60, 60);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        
        const messageText = cleanTextForPDF(message.parts?.[0]?.text || message.content || '');
        const lines = pdf.splitTextToSize(messageText, 170);
        
        lines.forEach(line => {
          if (yPosition > 280) {
            pdf.addPage();
            yPosition = 30;
          }
          pdf.text(line, 20, yPosition);
          yPosition += 5;
        });
        
        yPosition += 10;
        
        // Function indicator
        if (message.functionCalled && !message.isOffTopic) {
          pdf.setFillColor(76, 175, 80);
          pdf.rect(20, yPosition - 5, 150, 8, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(9);
          pdf.text(`Analysis: ${message.functionCalled}`, 25, yPosition);
          yPosition += 15;
        }
        
        if (message.isOffTopic) {
          pdf.setFillColor(255, 107, 107);
          pdf.rect(20, yPosition - 5, 150, 8, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(9);
          pdf.text('Off-topic query detected', 25, yPosition);
          yPosition += 15;
        }
      });
      
      // Footer
      pdf.setFillColor(248, 249, 250);
      pdf.rect(0, 280, 210, 17, 'F');
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Generated by AI Sales Analytics Dashboard', 20, 290);
      
      // Save PDF
      const timestamp = now.toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-');
      const searchContext = searchQuery ? `_Search-${searchQuery.replace(/[^a-zA-Z0-9]/g, '-')}` : '';
      pdf.save(`Sales-Chat-History${searchContext}-${timestamp}.pdf`);
      
    } catch (error) {
      console.error('Error generating chat PDF:', error);
      alert('Error generating chat PDF. Please try again.');
    } finally {
      setIsGeneratingChatPDF(false);
    }
  };
// Add enhanced suggestions generator
const generateEnhancedSuggestions = (baseSuggestions, context, dashboardData) => {
  const { lastQuery, queryType, metrics } = context;
  let enhanced = [...baseSuggestions];
  
  // Add contextual suggestions based on current query
  if (lastQuery.toLowerCase().includes('sales')) {
    enhanced.unshift(
      'Show me lowest performing regions',
      'Compare with last month'
    );
  }
  
  // Add metric-based suggestions
  if (metrics?.totalSales) {
    const revenue = metrics.totalSales;
    if (revenue < 100000) {
      enhanced.push('How can we improve sales?');
    } else {
      enhanced.push('What drove this success?');
    }
  }
  
  // Limit to 5 most relevant suggestions
  return enhanced.slice(0, 5);
};
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMessage = { role: 'user', parts: [{ text: input }] };
    setChatHistory(prev => [...prev, userMessage]);
    
    // Store context for suggestions
    setLastQueryContext(input);
    
    setInput('');
    setIsThinking(true);

    try {
    const response = await fetch(getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: input,
          chatHistory: chatHistory
        })
      });

      const data = await response.json();
      
          setSuggestionContext({
      lastQuery: input,
      queryType: data.functionCalled || 'general',
      metrics: data.dashboardData?.summary || null
    });
    
    // Generate smarter suggestions based on context
    if (data.suggestions) {
      const enhancedSuggestions = generateEnhancedSuggestions(
        data.suggestions,
        suggestionContext,
        data.dashboardData
      );
      setSuggestions(enhancedSuggestions);
    }
    
      const assistantMessage = {
        role: 'model',
        parts: [{ text: data.answer }],
        functionCalled: data.functionCalled,
        isOffTopic: data.isOffTopic
      };

      setChatHistory(prev => [...prev, assistantMessage]);
      
      // Update suggestions
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
      
      // Update dashboard if data available
      if (data.dashboardData) {
        setDashboardData(data.dashboardData);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setChatHistory(prev => [...prev, {
        role: 'model',
        parts: [{ text: 'Sorry, I encountered an error. Please try again.' }]
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const clearChat = () => {
    setChatHistory([]);
    setSuggestions([]);
    setSearchQuery('');
    setLastQueryContext('');
  };

  return (
    <div className="chat-panel">
      {/* Enhanced Search and Actions Bar */}
      <div className="search-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search chat history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button onClick={clearSearch} className="clear-search-btn">
              ✕
            </button>
          )}
        </div>
        <div className="chat-actions">
          <button 
            onClick={downloadChatPDF}
            disabled={isGeneratingChatPDF || filteredHistory.length === 0}
            className="download-chat-btn"
            title="Download Chat as PDF"
          >
            {isGeneratingChatPDF ? (
              <div className="mini-spinner"></div>
            ) : (
              '💬'
            )}
          </button>
          <button onClick={clearChat} className="clear-chat-btn" title="Clear Chat">
            🗑️
          </button>
          {suggestions.length > 0 && (
            <button 
              onClick={downloadSuggestionsPDF}
              disabled={isGeneratingSuggestionsPDF}
              className="download-suggestions-btn"
              title="Download Suggestions as PDF"
            >
              {isGeneratingSuggestionsPDF ? (
                <div className="mini-spinner"></div>
              ) : (
                '📄'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className="search-info">
          <span className="search-results">
            📊 Found {filteredHistory.length} message{filteredHistory.length !== 1 ? 's' : ''} 
            {filteredHistory.length !== chatHistory.length && (
              <span className="search-filter-info"> (filtered from {chatHistory.length})</span>
            )}
          </span>
        </div>
      )}

      {/* Chat History */}
      <div className="chat-history" ref={chatHistoryRef}>
        {filteredHistory.map((message, index) => (
          <div key={index} className={`message ${message.role} ${message.isOffTopic ? 'off-topic' : ''}`}>
        <div 
  className="message-content"
  dangerouslySetInnerHTML={{ 
    __html: formatMessageForDisplay(message.parts?.[0]?.text || message.content)
  }}
/>
            {message.functionCalled && (
              <div className="function-indicator">
                📊 Analysis: {message.functionCalled}
              </div>
            )}
            {message.isOffTopic && (
              <div className="off-topic-indicator">
                ⚠️ Off-topic query detected
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="message model thinking">
            <div className="thinking-animation">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="thinking-text">Analyzing your sales data...</div>
          </div>
        )}
      </div>

      {/* Enhanced Suggested Queries */}
      {suggestions.length > 0 && (
        <div className="suggested-queries">
          <div className="suggestions-header">
            <div className="suggestions-title">
              <span className="suggestions-icon">💡</span>
              <span className="suggestions-text">Smart Suggestions</span>
              {lastQueryContext && (
                <span className="suggestions-context">for "{lastQueryContext.substring(0, 30)}..."</span>
              )}
            </div>
            <button 
              onClick={downloadSuggestionsPDF}
              disabled={isGeneratingSuggestionsPDF}
              className="download-mini-btn"
              title="Download Suggestions as PDF"
            >
              {isGeneratingSuggestionsPDF ? '⏳' : '📄'}
            </button>
          </div>
          <div className="query-suggestions">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="suggestion-btn"
                disabled={isThinking}
              >
                <span className="suggestion-number">{index + 1}</span>
                <span className="suggestion-text">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Form */}
      <form onSubmit={handleSubmit} className="chat-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your sales data..."
          disabled={isThinking}
          className="chat-input"
        />
        <button type="submit" disabled={isThinking || !input.trim()} className="send-btn">
          {isThinking ? '⏳' : '🚀'}
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;