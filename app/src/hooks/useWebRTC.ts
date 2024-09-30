import { useCallback, useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { PeerConnection } from "../types/peerconnection";
import { BACKEND_URL } from "../services/config";

type Props = {
  onMessageReceived: (message: string) => void;
}

export const useWebRTC = ({ onMessageReceived } : Props) => {
  const socketRef = useRef<Socket | undefined>(undefined);
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
    if(!socketRef.current) {
      socketRef.current = io(BACKEND_URL);
      socketRef.current.on('init', () => {
        peerConnectionRef.current = new PeerConnection(socketRef.current!);
        peerConnectionRef.current.initLocal();
      });
      socketRef.current.on('sdp-offer', (sdp: string) => {
        if(peerConnectionRef.current) {
          peerConnectionRef.current.initRemote(JSON.parse(sdp));
        }
      });
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