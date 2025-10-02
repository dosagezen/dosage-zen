import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DateRangePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (range: { start: Date; end: Date }) => void;
}

export const DateRangePickerDialog = ({ open, onOpenChange, onSelect }: DateRangePickerDialogProps) => {
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [startMonth, setStartMonth] = useState<Date>(new Date());
  const [endMonth, setEndMonth] = useState<Date>(addMonths(new Date(), 1));

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

          <div className="flex flex-col sm:flex-row gap-6 w-full">
            {/* Calendário de Início */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">Mês Inicial</h3>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setStartMonth(subMonths(startMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setStartMonth(addMonths(startMonth, 1))}
                    disabled={startMonth >= new Date()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Calendar
                mode="single"
                selected={dateRange.start}
                onSelect={handleSelect}
                locale={ptBR}
                disabled={(date) => date > new Date() || (dateRange.end && date > dateRange.end)}
                month={startMonth}
                onMonthChange={setStartMonth}
                weekStartsOn={1}
                className="pointer-events-auto w-full border rounded-md p-3"
                classNames={{
                  months: "w-full",
                  month: "space-y-4 w-full",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "hidden",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-9 w-9 text-center text-sm p-0 relative",
                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground font-semibold",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_hidden: "invisible",
                }}
              />
            </div>

            {/* Separador */}
            <div className="hidden sm:block w-px bg-border" />

            {/* Calendário de Fim */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">Mês Final</h3>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setEndMonth(subMonths(endMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setEndMonth(addMonths(endMonth, 1))}
                    disabled={endMonth >= new Date()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Calendar
                mode="single"
                selected={dateRange.end}
                onSelect={handleSelect}
                locale={ptBR}
                disabled={(date) => date > new Date() || (dateRange.start && date < dateRange.start)}
                month={endMonth}
                onMonthChange={setEndMonth}
                weekStartsOn={1}
                className="pointer-events-auto w-full border rounded-md p-3"
                classNames={{
                  months: "w-full",
                  month: "space-y-4 w-full",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "hidden",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-9 w-9 text-center text-sm p-0 relative",
                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground font-semibold",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_hidden: "invisible",
                }}
              />
            </div>
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
