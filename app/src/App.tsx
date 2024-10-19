import { useState } from 'react';
import { useWebRTC } from './hooks/useWebRTC';
import { getAvatar } from './services/avatar';

const App = () => {
  const avatar = getAvatar();
  const { sendFile, fileReceived, getReceivedFileNameAndUrl, clients } = useWebRTC({
    avatar,
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
      a.download = fileNameAndUrl.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(fileNameAndUrl.fileURL), 100);
    }
  };

  return (
    <div className='flex justify-center min-h-screen bg-gradient-to-br p-6'>
        <div className='absolute top-8 left-8'>
          <div className='flex flex-col'>
            <div className='flex flex-row items-center space-x-3'>
              <div className='text-3xl font-extrabold'>Orbit</div>
              <svg height={20} width={20} viewBox="0 0 512 512">
                <path d="M16.1 260.2c-22.6 12.9-20.5 47.3 3.6 57.3L160 376l0 103.3c0 18.1 14.6 32.7 32.7 32.7c9.7 0 18.9-4.3 25.1-11.8l62-74.3 123.9 51.6c18.9 7.9 40.8-4.5 43.9-24.7l64-416c1.9-12.1-3.4-24.3-13.5-31.2s-23.3-7.5-34-1.4l-448 256zm52.1 25.5L409.7 90.6 190.1 336l1.2 1L68.2 285.7zM403.3 425.4L236.7 355.9 450.8 116.6 403.3 425.4z" />
              </svg>
            </div>
            <div className='text-left text-xs'> P2P file transfer </div>
        </div>
      </div>
      <div className='flex flex-col justify-center'>
        {clients.current && (
              <div className='flex flex-col justify-center items-center h-screen space-y-1'>
              <div className="flex flex-col items-center justify-center w-20 h-20 bg-teal-200 rounded-full shadow-xl border border-gray-200" />
              <div className='text-center text-xs'>{avatar}</div>
            </div>
        )}
      </div>
      <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 space-y-1 mb-4 h-40 flex flex-col items-center justify-center'>
        <div className="flex items-center justify-center w-20 h-20 bg-teal-200 rounded-full shadow-xl border border-gray-200" />
        <div className='text-center font-semibold'>You</div>
        <div className='text-center text-xs'>{avatar}</div>
      </div>
    </div>
  );
};

export default App;
