import Chat from '../components/Chat';

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-teal via-cyan-light to-peach p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-center text-white mb-12 drop-shadow-lg">
          🐺 Hacker Reign
        </h1>
        <Chat />
      </div>
    </div>
  );
}
