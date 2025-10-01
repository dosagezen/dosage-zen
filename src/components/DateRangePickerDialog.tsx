import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DateRangePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (range: { start: Date; end: Date }) => void;
}

export const DateRangePickerDialog = ({ open, onOpenChange, onSelect }: DateRangePickerDialogProps) => {
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!dateRange.start || (dateRange.start && dateRange.end)) {
      // Start new range
      setDateRange({ start: date, end: undefined });
    } else {
      // Complete range
      if (date < dateRange.start) {
        setDateRange({ start: date, end: dateRange.start });
      } else {
        setDateRange({ start: dateRange.start, end: date });
      }
    }
  };

  const handleConfirm = () => {
    if (dateRange.start && dateRange.end) {
      onSelect({ start: dateRange.start, end: dateRange.end });
      onOpenChange(false);
      setDateRange({});
    }
  };

  const handleCancel = () => {
    setDateRange({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Selecionar Período Personalizado</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {dateRange.start && !dateRange.end && (
              <p>
                Data inicial: <strong>{format(dateRange.start, "dd/MM/yyyy", { locale: ptBR })}</strong>
                <br />
                Selecione a data final
              </p>
            )}
            {dateRange.start && dateRange.end && (
              <p>
                Período: <strong>{format(dateRange.start, "dd/MM/yyyy", { locale: ptBR })}</strong> até{" "}
                <strong>{format(dateRange.end, "dd/MM/yyyy", { locale: ptBR })}</strong>
              </p>
            )}
            {!dateRange.start && <p>Selecione a data inicial</p>}
          </div>

          <Calendar
            mode="single"
            selected={dateRange.end || dateRange.start}
            onSelect={handleSelect}
            locale={ptBR}
            disabled={(date) => date > new Date()}
            className="rounded-md border"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!dateRange.start || !dateRange.end}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
