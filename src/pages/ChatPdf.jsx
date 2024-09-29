// Remove the unnecessary imports
import React, { useState, useEffect } from 'react';
import LeftMenu from '../components/LeftMenu';
import ChatDetail from '../components/ChatDetail';

function ChatPdf() {
  const [selectedDiscussionId, setSelectedDiscussionId] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState('');
  const [shouldUpdateDiscussions, setShouldUpdateDiscussions] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // State to manage theme

  // Handler for when a document is selected in the LeftMenu
  const handleDocumentSelect = (document) => {
    setSelectedDocument(document);
  };

  // Handler for when a new message is sent, causing the discussion name to potentially change
  const handleNewMessage = () => {
    setShouldUpdateDiscussions(prevState => !prevState); // Toggle to trigger discussion list update
  };

  // Handler to toggle between dark and light mode
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Effect to handle automatic selection of the first discussion
  useEffect(() => {
    if (selectedDiscussionId === null && !shouldUpdateDiscussions) {
      // Fetch the first discussion ID after discussions have loaded
      fetch('http://localhost:5000/get_chat_history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data.discussions && data.discussions.length > 0) {
            setSelectedDiscussionId(data.discussions[0].id); // Auto-select the first discussion
          }
        })
        .catch(error => console.error('Error fetching discussions:', error));
    }
  }, [selectedDiscussionId, shouldUpdateDiscussions]);

  return (
    <div className={`w-100 h-100 overflow-hidden ${isDarkMode ? 'bg-[#000000]' : 'bg-[#f5f5f5]'} ${isDarkMode ? 'text-white' : 'text-black'}`}>
      <div className="flex justify-start chatpdf-bp:justify-center items-center h-screen">
        <div className={`min-w-[250px] max-w-[350px] w-[350px] h-100 ${isDarkMode ? 'bg-[#171717]' : 'bg-[#d3d3d3]'} ${isDarkMode ? 'text-white' : 'text-black'}`}>
          <LeftMenu 
            onSelectDiscussion={setSelectedDiscussionId} 
            selectedDiscussionId={selectedDiscussionId} 
            onDocumentSelect={handleDocumentSelect}
            shouldUpdateDiscussions={shouldUpdateDiscussions} // Pass down to trigger discussion updates
            isDarkMode={isDarkMode} // Pass the theme state to LeftMenu
          />
        </div>
        <div className={`min-w-[400px] max-w-screen w-100 h-100 ${isDarkMode ? 'bg-[#212121]' : 'bg-[#ffffff]'} ${isDarkMode ? 'text-white' : 'text-black'}`}>
          {selectedDiscussionId ? (
            <ChatDetail 
              selectedDiscussionId={selectedDiscussionId} 
              selectedDocument={selectedDocument} 
              onNewMessage={handleNewMessage} // Trigger discussion name update on new message
              isDarkMode={isDarkMode} // Pass the theme state to ChatDetail
              toggleTheme={toggleTheme} // Pass the toggle function
            />
          ) : (
            <div className="flex justify-center items-center h-full">
              <p>Start a new chat or select an existing one to continue chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatPdf;
