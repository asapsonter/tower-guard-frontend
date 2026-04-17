import { Construction } from "lucide-react";

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <Construction className="h-12 w-12 text-muted-foreground/50" />
    <h1 className="text-lg font-bold text-foreground">{title}</h1>
    <p className="text-xs text-muted-foreground">This module is under development.</p>
  </div>
);

export default PlaceholderPage;
