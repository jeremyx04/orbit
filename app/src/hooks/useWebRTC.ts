import { useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { PeerConnection } from "../types/peerconnection";
import { BACKEND_URL } from "../services/config";

type Props = {
  onMessageReceived: (message: string) => void;
}

export const useWebRTC = ({ onMessageReceived } : Props) => {
  const socketRef = useRef<Socket | undefined>(undefined);
  const peerConnectionRef = useRef<PeerConnection | undefined>(undefined);

  useEffect(() => {
    if(!socketRef.current) {
      socketRef.current = io(BACKEND_URL);  
      const rtcPeerConnection = new RTCPeerConnection();
      peerConnectionRef.current = new PeerConnection(rtcPeerConnection);
    }
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = undefined;
    }
  }, []);

}