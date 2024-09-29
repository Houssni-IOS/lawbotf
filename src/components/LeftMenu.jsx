import React, { useState, useEffect, useCallback } from 'react';
import { AiFillDelete } from 'react-icons/ai';
import { MdMoreVert, MdDownload } from 'react-icons/md';

function LeftMenu({ onSelectDiscussion, selectedDiscussionId, onDocumentSelect, shouldUpdateDiscussions, isDarkMode }) {
  const [discussions, setDiscussions] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState('');
  const [highlightedDiscussionId, setHighlightedDiscussionId] = useState(null);
  const [showOptions, setShowOptions] = useState(null); // Track which discussion's options to show

  const startNewChat = useCallback(() => {
    fetch('http://localhost:5000/new_chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.discussion_id) {
          // Fetch the first message to update the discussion name
          fetch(`http://localhost:5000/get_chat_history?discussion_id=${data.discussion_id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          })
          .then((response) => response.json())
          .then((chatData) => {
            const firstMessage = chatData.chat_history?.[0]?.query || 'New Discussion';
            setDiscussions(prevDiscussions => [...prevDiscussions, { id: data.discussion_id, name: firstMessage }]);
            onSelectDiscussion(data.discussion_id);
          });
        } else {
          console.error('Failed to create new chat');
        }
      });
  }, [onSelectDiscussion]);

  const fetchDiscussions = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/get_chat_history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDiscussions(data.discussions);

        if (highlightedDiscussionId) {
          setTimeout(() => setHighlightedDiscussionId(null), 1000); // Remove highlight after animation
        }

        if (isInitialLoad && data.discussions.length === 0) {
          setIsInitialLoad(false);
          startNewChat();
        } else {
          setIsInitialLoad(false);
        }
      } else {
        console.error('Failed to fetch chat sessions');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }, [isInitialLoad, startNewChat, highlightedDiscussionId]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions, shouldUpdateDiscussions, selectedDiscussionId]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('http://localhost:5000/get_documents', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setDocuments(data.documents);
        } else {
          console.error('Failed to fetch documents');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchDocuments();
  }, []);

  const deleteDiscussion = async (discussionId) => {
    try {
      const response = await fetch(`http://localhost:5000/delete_discussion/${discussionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        setDiscussions(discussions.filter(discussion => discussion.id !== discussionId));
        onSelectDiscussion(null);
      } else {
        console.error('Failed to delete discussion');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const downloadDiscussion = async (discussionId) => {
    try {
      const discussion = discussions.find(d => d.id === discussionId);
      const discussionName = discussion?.name || `discussion_${discussionId}`;

      const response = await fetch(`http://localhost:5000/download_discussion/${discussionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${discussionName.replace(/ /g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        console.error('Failed to download discussion');
      }
    } catch (error) {
      console.error('Error downloading discussion:', error);
    }
  };

  const handleDocumentSelect = (e) => {
    const selectedDoc = e.target.value;
    setSelectedDocument(selectedDoc);
    if (onDocumentSelect) {
      onDocumentSelect(selectedDoc);
    } else {
      console.error('onDocumentSelect function is not provided');
    }
  };

  return (
    <div className={`flex flex-col h-screen p-4 ${isDarkMode ? 'bg-[#2A2A2A]' : 'bg-[#ededed]'}`}>
      <button
        className={`text-white p-2 rounded mb-4 ${isDarkMode ? 'bg-[#5f249f]' : 'bg-[#5f249f] text-white'}`}
        onClick={startNewChat}
      >
        Start a new chat
      </button>
      
      <h2 className={`text-xl mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>Chat Sessions</h2>
        
      <div className="mb-4">
        <select
          value={selectedDocument}
          onChange={handleDocumentSelect}
          className="w-full p-2 rounded text-black"
        >
          <option value="">Select Document</option>
          {documents.map((doc, index) => (
            <option key={index} value={doc}>{doc}</option>
          ))}
        </select>
      </div>

      <div className="flex-grow overflow-y-auto scrollbar-hidden">
        {discussions.length > 0 ? (
          discussions.map((discussion, index) => (
            <div
              key={index}
              className={`mb-2 cursor-pointer flex justify-between items-center p-2 rounded transition-colors duration-300 ease-in-out ${
                selectedDiscussionId === discussion.id ? 'bg-[#5f249f]' : `${isDarkMode ? 'bg-[#3a3a3a]' : 'bg-[#ffffff]'}`
              } hover:bg-[#4a4a4a] ${
                highlightedDiscussionId === discussion.id ? 'highlight-animation' : ''
              }`}
              onClick={() => onSelectDiscussion(discussion.id)}
            >
              <span className="flex-grow transition-all duration-500 ease-in-out text-ellipsis overflow-hidden whitespace-nowrap text-white">
                {discussion.name || `Session ${index + 1}`}
              </span>
              <div className="relative">
                <MdMoreVert
                  className="text-white cursor-pointer ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptions(showOptions === discussion.id ? null : discussion.id);
                  }}
                />
                {showOptions === discussion.id && (
                  <div className="absolute right-0 top-8 bg-white shadow-lg rounded p-2 z-10 flex space-x-2">
                    <AiFillDelete
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDiscussion(discussion.id);
                        setShowOptions(null);
                      }}
                    />
                    <MdDownload
                      className="text-blue-500 hover:text-blue-700 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadDiscussion(discussion.id);
                        setShowOptions(null);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className={`${isDarkMode ? 'text-white' : 'text-black'}`}>No sessions found</p>
        )}
      </div>
    </div>
  );
}

export default LeftMenu;
