import { CloudSun } from 'lucide-react';

export function Header() {
  return (
    <header className="w-full max-w-4xl mb-8 text-center">
      <div className="flex items-center justify-center space-x-3">
        <CloudSun className="w-12 h-12 text-primary" />
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
          Nimbus <span className="text-primary">Navigator</span>
        </h1>
      </div>
      <p className="text-muted-foreground mt-2 text-lg">Your friendly weather and activity guide.</p>
    </header>
  );
}
