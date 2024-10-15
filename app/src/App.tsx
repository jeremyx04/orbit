import { useState } from 'react';
import { useWebRTC } from './hooks/useWebRTC';

const App = () => {
  const { sendFile, fileReceived, getReceivedFileNameAndUrl, clients } = useWebRTC({
    onMessageReceived: (message) => {
      console.log(`received message: ${message}`);
    }
  });

  const [file, setFile] = useState<File | undefined>(undefined);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownloadClick = () => {
    const fileNameAndUrl = getReceivedFileNameAndUrl();
    if (fileNameAndUrl) {
      const a = document.createElement('a');
      a.href = fileNameAndUrl.fileURL;
      a.download =  fileNameAndUrl.fileName; 
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(fileNameAndUrl.fileURL), 100);
    }
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen'>
      <div>
        <p className='text-4xl'> orbit </p>
      </div>
      <div>
        {fileReceived ? (
          <div>
            <p>File received</p>
            <button onClick={handleDownloadClick}>
              Download Received File
            </button>
          </div>
        ) : (
          <div>
            <p>No file received yet.</p>
          </div>
        )}
      </div>
      <div>
          <button onClick={() => {
            if(file) {
              sendFile(file);
            }
          }}>
            Send File
          </button>
        <div>
          <input 
            id="file" 
            type="file" 
            onChange={handleFileChange} 
          />
          {file && <p>Selected File: {file.name}</p>}
        </div>
      </div>
    </div>
  );
}

export default App;
