import { useEffect, useState } from 'react';
import { useWebRTC } from './hooks/useWebRTC';

const App = () => {
  const { sendMessage, sendFile, clients } = useWebRTC({
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

  return (
    <div className='flex flex-col items-center justify-center min-h-screen'>
      <div>
        <p className='text-4xl'> orbit </p>
      </div>

      <div>
          <button onClick={() => sendMessage('test')}>
            Send Message
          </button>
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
