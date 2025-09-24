import { createSignalingSocket } from './api';

export type PeerEvent =
  | { type: 'open'; }
  | { type: 'peer-joined'; userId: string }
  | { type: 'peer-left'; userId: string }
  | { type: 'track'; stream: MediaStream; fromUserId: string }
  | { type: 'error'; error: Error };

export interface PeerOptions {
  roomId: string;
  localUserId: string;
  enableAudio?: boolean;
  enableVideo?: boolean;
}

export class PeerManager {
  private socket: WebSocket;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private options: PeerOptions;
  private listeners: ((e: PeerEvent) => void)[] = [];

  constructor(options: PeerOptions) {
    this.options = options;
    this.socket = createSignalingSocket();
    this.socket.addEventListener('open', () => {
      this.emit({ type: 'open' });
      this.send({ type: 'join', room: options.roomId, userId: options.localUserId });
    });
    this.socket.addEventListener('message', (ev) => this.onSignal(ev));
    this.socket.addEventListener('close', () => {/* noop */});
  }

  async initLocalStream() {
    const { enableAudio = true, enableVideo = false } = this.options;
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: enableAudio, video: enableVideo });
    return this.localStream;
  }

  on(listener: (e: PeerEvent) => void) { this.listeners.push(listener); }
  off(listener: (e: PeerEvent) => void) { this.listeners = this.listeners.filter(l => l !== listener); }
  private emit(e: PeerEvent) { this.listeners.forEach(l => l(e)); }

  private send(obj: any) { if (this.socket.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(obj)); }

  private async onSignal(ev: MessageEvent) {
    let msg: any;
    try { msg = JSON.parse(ev.data); } catch { return; }
    const { localUserId } = this.options;
    if (msg.type === 'peer-joined') {
      const remoteUserId = msg.userId;
      await this.createConnection(remoteUserId, true);
    }
    if (msg.type === 'peer-left') {
      const remoteUserId = msg.userId;
      const pc = this.peers.get(remoteUserId);
      if (pc) pc.close();
      this.peers.delete(remoteUserId);
      this.emit({ type: 'peer-left', userId: remoteUserId });
    }
    if (msg.type === 'signal') {
      const fromUserId = msg.fromUserId;
      const payload = msg.payload;
      let pc = this.peers.get(fromUserId);
      if (!pc) {
        pc = await this.createConnection(fromUserId, false);
      }
      if (payload.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        if (payload.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          this.send({ type: 'signal', toUserId: fromUserId, payload: { sdp: answer } });
        }
      } else if (payload.candidate) {
        try { await pc.addIceCandidate(payload.candidate); } catch {}
      }
    }
  }

  private async createConnection(remoteUserId: string, isInitiator: boolean) {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ]
    });

    if (!this.localStream) {
      try { await this.initLocalStream(); } catch (e) { this.emit({ type: 'error', error: e as Error }); }
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream!));
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.send({ type: 'signal', toUserId: remoteUserId, payload: { candidate: e.candidate } });
      }
    };
    pc.ontrack = (e) => {
      const [stream] = e.streams;
      if (stream) this.emit({ type: 'track', stream, fromUserId: remoteUserId });
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed' || pc.connectionState === 'disconnected') {
        pc.close();
        this.peers.delete(remoteUserId);
      }
    };

    this.peers.set(remoteUserId, pc);

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.send({ type: 'signal', toUserId: remoteUserId, payload: { sdp: offer } });
    }

    return pc;
  }

  leave() {
    this.send({ type: 'leave' });
    this.socket.close();
    this.peers.forEach(pc => pc.close());
    this.peers.clear();
  }
}


