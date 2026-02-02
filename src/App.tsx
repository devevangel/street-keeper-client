import { Button, Card, ThemeToggle } from "./components/common";

function App() {
  return (
    <div className="min-h-screen bg-bg text-text p-4">
      <header className="flex justify-between items-center border-b-2 border-border pb-4 mb-6">
        <h1 className="text-2xl font-bold">Street Keeper</h1>
        <ThemeToggle />
      </header>

      <main className="max-w-2xl mx-auto">
        <Card className="mb-6">
          <h2 className="text-xl font-bold mb-2">Welcome</h2>
          <p className="text-text-muted mb-4">
            Design system and API services are set up. Use the theme toggle to
            switch light/dark mode.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger" size="sm">Danger</Button>
            <Button variant="success" size="sm">Success</Button>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default App;
