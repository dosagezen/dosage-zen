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
      <DialogContent className="max-w-[90vw] sm:max-w-[340px] md:max-w-[680px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Selecionar Período Personalizado</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            {dateRange.start && !dateRange.end && (
              <p>
                📅 Data inicial: <strong>{format(dateRange.start, "dd/MM/yyyy", { locale: ptBR })}</strong>
                <br />
                <span className="text-xs">Selecione a data final</span>
              </p>
            )}
            {dateRange.start && dateRange.end && (
              <p>
                📊 Período selecionado: <strong>{format(dateRange.start, "dd/MM/yyyy", { locale: ptBR })}</strong> até{" "}
                <strong>{format(dateRange.end, "dd/MM/yyyy", { locale: ptBR })}</strong>
              </p>
            )}
            {!dateRange.start && (
              <p>
                <span className="text-xs">Clique na data inicial para começar</span>
              </p>
            )}
          </div>

          <div className="flex overflow-x-auto relative w-full">
            <style>{`
              .calendar-months-wrapper > div:nth-child(2)::before {
                content: '';
                position: absolute;
                left: -18px;
                top: 36px;
                bottom: 0;
                width: 4px;
                background: hsl(var(--border) / 0.4);
                border-radius: 9999px;
              }
              @media (max-width: 640px) {
                .calendar-months-wrapper > div:nth-child(2)::before {
                  display: none;
                }
              }
            `}</style>
            <Calendar
              mode="single"
              selected={dateRange.end || dateRange.start}
              onSelect={handleSelect}
              locale={ptBR}
              disabled={(date) => date > new Date()}
              numberOfMonths={2}
              weekStartsOn={1}
              className="pointer-events-auto w-full"
              classNames={{
                months: "calendar-months-wrapper flex flex-col sm:flex-row gap-4 sm:gap-9 relative w-full justify-center",
                month: "space-y-4 relative",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 [&:nth-child(6)]:bg-accent/20 [&:nth-child(7)]:bg-accent/20",
                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground",
                day_range_end: "day-range-end",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground font-semibold",
                day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_hidden: "invisible",
              }}
            />
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!dateRange.start || !dateRange.end}
            className="w-full sm:w-auto"
          >
            Confirmar Período
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
