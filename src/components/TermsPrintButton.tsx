import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export const TermsPrintButton = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className="gap-2"
    >
      <Printer className="h-4 w-4" />
      <span className="hidden sm:inline">Imprimir/PDF</span>
    </Button>
  );
};
