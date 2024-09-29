import './App.css';
import { useWebRTC } from './hooks/useWebRTC';

const App = () => {
  const { sendMessage } = useWebRTC({
    onMessageReceived: (message) => {
      console.log(`Received message: ${message}`);
    }
  });
  return (
    <div className="App">
      signal
      <div>
        <button onClick={()=>{
          sendMessage('test');
        }}> send message </button>
      </div>
    </div>
  );
}

export default App;
