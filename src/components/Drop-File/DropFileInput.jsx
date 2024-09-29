import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ImageConfig } from '../../config/ImageConfig';
import uploadImg from '../../assets/cloud-upload-regular-240.png';
import { useNavigate } from 'react-router-dom';
import { AiOutlineLoading3Quarters } from 'react-icons/ai'; // Import a spinner icon from react-icons
import { IoArrowBackSharp } from 'react-icons/io5'; // Import a back arrow icon

const DropFileInput = ({ onFileChange }) => {
    const wrapperRef = useRef(null);
    const [fileList, setFileList] = useState([]);
    const [isUploading, setIsUploading] = useState(false); // New state for upload status
    const [uploadSuccess, setUploadSuccess] = useState(false); // New state for success message
    const navigate = useNavigate();

    const onDragEnter = () => wrapperRef.current.classList.add('dragover');
    const onDragLeave = () => wrapperRef.current.classList.remove('dragover');
    const onDrop = () => wrapperRef.current.classList.remove('dragover');

    const onFileDrop = (e) => {
        const newFile = e.target.files[0];
        if (newFile) {
            const updatedList = [...fileList, newFile];
            setFileList(updatedList);
            if (onFileChange) {
                onFileChange(updatedList); // Ensure onFileChange is called with the updated file list
            }
        }
    };

    const fileRemove = (file) => {
        const updatedList = fileList.filter((item) => item !== file);
        setFileList(updatedList);
        if (onFileChange) {
            onFileChange(updatedList); // Ensure onFileChange is called with the updated file list
        }
    };

    const uploadFiles = () => {
        setIsUploading(true); // Start upload process
        const formData = new FormData();
        fileList.forEach((file) => formData.append('file', file));
        fetch('http://localhost:5000/upload-pdf', {  // Ensure the correct endpoint
            method: 'POST',
            body: formData,
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            },
        })
        .then((response) => {
            if (response.ok) {
                setUploadSuccess(true); // Show success message
            } else {
                console.error('Upload failed');
            }
        })
        .catch((error) => {
            console.error('Error uploading files:', error);
        })
        .finally(() => {
            setIsUploading(false); // Stop loading indicator
        });
    };

    return (
        <>
            {/* Go Back Button */}
            <div className="flex items-center mb-3 mt-2"> {/* Reduced bottom margin and added top margin */}
                <button
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => navigate(-1)}
                >
                    <IoArrowBackSharp size={24} />
                </button>
                <span className="ml-2 text-lg font-medium">Upload PDF</span>
            </div>

            {/* Main Container */}
            <div className="mt-2 flex flex-col items-center justify-center"> {/* Reduced margin-top */}
                {/* Drag and Drop Area */}
                <div
                    ref={wrapperRef}
                    className="relative w-80 h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-100 transition-opacity duration-300 hover:opacity-70"
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                >
                    <div className="text-center text-gray-500 font-medium">
                        <img src={uploadImg} alt="" className="w-16 mx-auto mb-2" />
                        <p className="text-sm">Drag & Drop your files here</p>
                    </div>
                    <input
                        type="file"
                        className="opacity-0 absolute top-0 left-0 w-full h-full cursor-pointer"
                        onChange={onFileDrop}
                    />
                </div>

                {/* File List */}
                {fileList.length > 0 && (
                    <div className="mt-2"> {/* Reduced margin-top */}
                        <div className="overflow-y-auto max-h-32">
                            {fileList.map((item, index) => (
                                <div key={index} className="relative flex mb-1 bg-gray-100 p-2 rounded-lg">
                                    <img src={ImageConfig[item.type.split('/')[1]] || ImageConfig['default']} alt="" className="w-10 h-10 mr-2" />
                                    <div className="flex flex-col justify-between text-xs">
                                        <p className="font-medium">{item.name}</p>
                                        <p className="font-medium">{(item.size / 1024).toFixed(2)} KB</p>                      
                                    </div>
                                    <span
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-md hover:opacity-80"
                                        onClick={() => fileRemove(item)}
                                    >
                                        x
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button
                            className="block mx-auto mt-3 px-4 py-2 bg-purple-700 text-white text-center text-sm font-bold rounded-md hover:bg-blue-700"
                            onClick={uploadFiles}
                            disabled={isUploading} // Disable button while uploading
                        >
                            {isUploading ? (
                                <span className="flex items-center">
                                    <AiOutlineLoading3Quarters className="animate-spin mr-2" /> Uploading...
                                </span>
                            ) : (
                                'Upload'
                            )}
                        </button>
                    </div>
                )}

                {/* Success Message */}
                {uploadSuccess && (
                    <div className="mt-2 text-center"> {/* Reduced margin-top */}
                        <p className="text-green-600 text-sm font-medium">File uploaded successfully!</p>
                        <button
                            className="mt-2 px-4 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
                            onClick={() => navigate('/chat')}
                        >
                            Go to Chat
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

DropFileInput.propTypes = {
    onFileChange: PropTypes.func,
};

export default DropFileInput;
