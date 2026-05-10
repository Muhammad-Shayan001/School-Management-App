import { ChatLayout } from '@/app/_components/chat/chat-layout';

export default function TeacherMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-text-secondary">Chat with students and administrators</p>
      </div>
      <ChatLayout />
    </div>
  );
}
