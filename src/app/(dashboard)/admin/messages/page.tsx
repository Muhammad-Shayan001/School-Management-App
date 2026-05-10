import { ChatLayout } from '@/app/_components/chat/chat-layout';

export default function AdminMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-text-secondary">Real-time messaging with staff and students</p>
      </div>
      <ChatLayout />
    </div>
  );
}
