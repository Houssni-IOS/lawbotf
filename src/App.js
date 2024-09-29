import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import ChatPdf from './pages/ChatPdf';
import Register from './pages/Register';
import Upload from './pages/Upload';
import Login from './pages/Login';
import '../src/index.css'
function App() {
  return (
    <Router>
      <Routes> {/* Use Routes instead of Switch */}
        <Route path="/" element={<Login />} /> {/* Use 'element' prop to specify component */}
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<ChatPdf />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </Router>
  );
}

export default App;
