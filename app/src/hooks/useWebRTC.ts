import { useCallback, useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { PeerConnection } from "../types/peerconnection";
import { BACKEND_URL } from "../services/config";

type Props = {
  onMessageReceived: (message: string) => void;
}

export const useWebRTC = ({ onMessageReceived } : Props) => {
  const peerConnectionRef = useRef<PeerConnection | undefined>(undefined);

  const sendMessage = useCallback((message: string) => {
    if(peerConnectionRef.current?.rtcDataChannel 
      && peerConnectionRef.current.rtcDataChannel.readyState === 'open') {
      peerConnectionRef.current?.rtcDataChannel.send(message);
    } else {
      console.error('Data channel is closed');
    }
  }, []);

  useEffect(() => {
    if(!peerConnectionRef.current) {
      const signalingServer = io(BACKEND_URL); 
      peerConnectionRef.current = new PeerConnection(signalingServer);
    }

    return () => {
      if(peerConnectionRef.current) {
        peerConnectionRef.current.signalingServer.disconnect();
        peerConnectionRef.current.rtcConnection.close();
      }
    }
  }, [onMessageReceived]);

  return { sendMessage };
}