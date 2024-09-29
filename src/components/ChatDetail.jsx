import React, { useState, useEffect, useRef } from 'react';
import Button from './Button/Button';
import { MdSend, MdEdit, MdCheck, MdClose } from "react-icons/md";
import { useNavigate } from 'react-router-dom';
import { AiOutlinePaperClip } from "react-icons/ai";
import { MdOutlineNotStarted } from "react-icons/md";
import { GrLogout } from "react-icons/gr";
import { BsSun, BsMoon } from 'react-icons/bs';
import dxcImage from '../assets/dxc.png';

function ChatDetail({ selectedDiscussionId, onNewMessage, isDarkMode, toggleTheme }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [llm, setLlm] = useState('ollama');
  const [editingMessage, setEditingMessage] = useState(null); 
  const [editingText, setEditingText] = useState('');
  const inputRef = useRef(null);
  const [typing, setTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  // Scroll to the bottom of the chat
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch chat history whenever the selected discussion changes
  useEffect(() => {
    if (!selectedDiscussionId) {
      console.error('Discussion ID is undefined');
      return;
    }

    setMessages([]);  // Clear messages before fetching

    fetch(`http://localhost:5000/get_chat_history?discussion_id=${selectedDiscussionId}`)
      .then(response => response.json())
      .then(data => {
        if (data.chat_history) {
          setMessages(data.chat_history);
          scrollToBottom();
        } else {
          console.error('Unexpected data format:', data);
          setMessages([]);
        }
      })
      .catch(error => {
        console.error('Error fetching chat history:', error);
        setMessages([]);
      });
  }, [selectedDiscussionId]);

  // Auto scroll to the bottom whenever new messages are loaded
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setIsLoading(true);

      fetch('http://localhost:5000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          query: newMessage.trim(), 
          llm, 
          discussion_id: selectedDiscussionId 
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.response) {
          // Avoid duplicating responses by checking if the response already exists
          setMessages(prevMessages => {
            const userMessageId = data.user_message_id || Date.now();
            const assistantMessageId = data.assistant_message_id || `assistant-${Date.now()}`;
            const existingMessage = prevMessages.find(msg => msg._id === assistantMessageId);
            
            if (existingMessage) return prevMessages; // Avoid adding duplicate messages
            
            return [
              ...prevMessages,
              { role: 'user', query: newMessage.trim(), _id: userMessageId },
              { role: 'assistant', response: data.response, _id: assistantMessageId, parent_message_id: userMessageId }
            ];
          });

          setNewMessage('');  // Clear the input field
          inputRef.current.focus();
          setIsSending(true);
          setTimeout(() => {
            setIsSending(false);
            setIsLoading(false);
            onNewMessage();
          }, 1000);
        } else if (data.error) {
          console.error('Error sending message:', data.error);
          setIsLoading(false);
        }
      })
      .catch(error => {
        console.error('Error sending message:', error);
        setIsLoading(false);
      });
    }
  };

  const handleEditMessage = (msg) => {
    setEditingMessage(msg);
    setEditingText(msg.query);
  };

  const handleConfirmEdit = () => {
    if (editingText.trim()) {
      setIsLoading(true); // Start loading
  
      setMessages(prevMessages => {
        const userMessageIndex = prevMessages.findIndex(msg => msg._id === editingMessage._id);
        if (userMessageIndex === -1) return prevMessages;
  
        const newMessages = [...prevMessages];
  
        // Replace old assistant response with a loading animation
        if (newMessages[userMessageIndex + 1] && newMessages[userMessageIndex + 1].role === 'assistant' && newMessages[userMessageIndex + 1].parent_message_id === editingMessage._id) {
          newMessages[userMessageIndex + 1].response = '...';  // Show loading animation
        }
  
        // Update the user query to the new edited one
        newMessages[userMessageIndex] = { ...newMessages[userMessageIndex], query: editingText };
        return newMessages;
      });
  
      // Trigger backend to process the new response
      fetch('http://localhost:5000/edit_message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message_id: editingMessage._id,
          new_query: editingText.trim(),
          llm,
          discussion_id: selectedDiscussionId
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.response) {
          setMessages(prevMessages => {
            const userMessageIndex = prevMessages.findIndex(msg => msg._id === editingMessage._id);
            if (userMessageIndex === -1) return prevMessages;
  
            const newMessages = [...prevMessages];
            // Remove the loading animation and add the new assistant response
            const newAssistantMessage = {
              role: 'assistant',
              response: data.response,
              _id: data.assistant_message_id || `assistant-${Date.now()}`,
              parent_message_id: editingMessage._id
            };
  
            // Replace loading animation or previous response with the new one
            newMessages.splice(userMessageIndex + 1, 1, newAssistantMessage);
  
            return newMessages;
          });
          setEditingMessage(null); // Clear the editing state
          setEditingText('');
          setIsLoading(false); // Stop loading after the response is received
        } else if (data.error) {
          console.error('Error editing message:', data.error);
          setIsLoading(false); // Stop loading on error
        }
      })
      .catch(error => {
        console.error('Error editing message:', error);
        setIsLoading(false); // Stop loading on error
      });
    }
  };
  

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditingText('');
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  const handleLogout = async () => {
    navigate('/');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      if (editingMessage) {
        handleConfirmEdit();
      } else {
        handleSendMessage();
      }
    }
  };

  return (
    <div className="flex flex-col h-screen transition-colors duration-300 ease-in-out">
      <div className={`flex justify-between h-[60px] p-3 ${isDarkMode ? 'bg-[#212121]' : 'bg-[#ffffff]'} transition-colors duration-300 ease-in-out`}>
        <div className="flex items-center">
          <div className="flex flex-col">
            <h1 className={`font-sm text-[20px] my-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>DXC Lawbot</h1>
          </div>
          <div className="absolute top-0 right-0 m-4">
            <Button icon={<GrLogout />} onClick={handleLogout} />
            <button onClick={toggleTheme} className="flex items-center justify-center mt-2 ml-2">
              {isDarkMode ? <BsSun size={24} /> : <BsMoon size={24} />}
            </button>
          </div>
        </div>
      </div>

      <div className={`overflow-y-scroll h-screen flex justify-center ${isDarkMode ? 'bg-[#212121]' : 'bg-[#ffffff]'} transition-colors duration-300 ease-in-out`} style={{ padding: "12px 7%" }}>
        <div className="flex flex-col w-full sm:max-w-2xl">
          {messages.map((msg, index) => (
            <div key={msg._id || `${msg.role}-${msg.timestamp || index}`} className="mb-4">
              {msg.role === 'user' && msg.query ? (
                <div className="flex items-start">
                  <div className={`rounded-xl p-4 w-full ${isDarkMode ? 'bg-[#2f2f2f] text-white' : 'bg-[#e0e0e0] text-black'} transition-colors duration-300 ease-in-out`}>
                    {editingMessage && editingMessage._id === msg._id ? (
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full bg-transparent outline-none"
                        onKeyDown={handleKeyDown}
                      />
                    ) : (
                      <p className="text-left">{msg.query}</p>
                    )}
                  </div>
                  {editingMessage && editingMessage._id === msg._id ? (
                    <>
                      <button 
                        className="ml-2 text-green-500 hover:text-green-700"
                        onClick={handleConfirmEdit}
                      >
                        <MdCheck size={16} />
                      </button>
                      <button 
                        className="ml-2 text-red-500 hover:text-red-700"
                        onClick={handleCancelEdit}
                      >
                        <MdClose size={16} />
                      </button>
                    </>
                  ) : (
                    <button 
                      className="ml-2 text-gray-500 hover:text-gray-800"
                      onClick={() => handleEditMessage(msg)}
                    >
                      <MdEdit size={16} />
                    </button>
                  )}
                </div>
              ) : msg.role === 'assistant' && msg.response ? (
                <div className="flex flex-row-reverse items-start mt-2">
                  <div className={`rounded-xl p-4 w-full ${isDarkMode ? 'bg-[#5f249f] text-white' : 'bg-[#5f249f] text-white'} transition-colors duration-300 ease-in-out`}>
                    <p className="text-right">{msg.response}</p>
                  </div>
                  <img src={dxcImage} alt="DXC" className="h-6 ml-2" />
                </div>
              ) : null}
            </div>
          ))}

          {isLoading && (
            <div className="flex flex-row-reverse items-start mt-2">
              <div className={`rounded-xl p-2 flex items-center ${isDarkMode ? 'bg-[#5f249f] text-white' : 'bg-[#5f249f] text-white'} transition-colors duration-300 ease-in-out`}>
                <p className="text-right text-[1.25rem] animate-pulse">...</p>
                <img src={dxcImage} alt="Loading" className="h-6 ml-2" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="flex items-center justify-center p-2">
        <span className="mr-2">
          <Button icon={<AiOutlinePaperClip onClick={() => navigate('/upload')} />} />
        </span>

        <select 
          className={`rounded-full px-3 py-2 mr-2 ${isDarkMode ? 'bg-[#333333] text-white' : 'bg-[#ededed] text-black'} transition-colors duration-300 ease-in-out`}
          value={llm}
          onChange={(e) => setLlm(e.target.value)}
        >
          <option value="ollama">Ollama</option>
          <option value="openai"  >OpenAI</option>
        </select>

        <input
          type="text"
          placeholder="Type a message"
          className={`rounded-full outline-none text-sm w-50 h-100 px-3 ${isDarkMode ? 'bg-[#333333] text-neutral-200 placeholder:text-[#8796a1]' : 'bg-[#ededed] text-black placeholder:text-black'} transition-colors duration-300 ease-in-out`}
          value={newMessage}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          disabled={!!editingMessage} // Disable input when editing a message
        />
        <span className="ml-2">
          {isSending ? (
            <Button
              icon={<MdOutlineNotStarted />}
              disabled
              className={`w-8 h-8 mr-2 rounded ${isDarkMode ? 'bg-[#5f249f]' : 'bg-[#d3d3d3] text-black'} transition-colors duration-300 ease-in-out`}
            />
          ) : (
            <Button
              icon={<MdSend />}
              onClick={editingMessage ? handleConfirmEdit : handleSendMessage}
              disabled={!typing && !editingMessage}
              className={`w-8 h-8 mr-2 ${(!typing && !editingMessage) ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'} ${isDarkMode ? 'text-white' : 'text-black'} transition-colors duration-300 ease-in-out`}
            />
          )}
        </span>
      </div>
      <div className="flex justify-center items-center">
        <p className="text-[12px] text-[#545454]">This is powered by DXC Technology Team</p>
      </div>
    </div>
  );
}

export default ChatDetail;
