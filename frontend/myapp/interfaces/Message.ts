export interface Message {
    id: string;
    text: string;
    sender: string;
    receiver: string;
    timestamp: any;
    isSending?: boolean;
  }
  