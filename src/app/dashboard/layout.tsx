import Sidebar from './Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mint">
      <div className="fixed top-0 left-0 h-screen z-40">
        <Sidebar restaurant={null} />
      </div>
      <main className="ml-64 flex-1 p-0 bg-mint min-h-screen shadow-inner">
        {children}
      </main>
    </div>
  );
} 



