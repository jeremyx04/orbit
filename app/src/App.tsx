import './App.css';
import { useWebRTC } from './hooks/useWebRTC';

const App = () => {
  useWebRTC({
    onMessageReceived: (message) => {
      console.log(`Received message: ${message}`);
    }
  });
  return (
    <div className="App">
      signal
    </div>
  );
}

export default App;
