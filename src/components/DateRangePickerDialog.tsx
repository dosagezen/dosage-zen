import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, addMonths, subMonths, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
      // Validar período máximo
      const diffDays = differenceInDays(dateRange.end, dateRange.start);
      
      if (diffDays > 90) {
        toast({
          title: "⚠️ Período muito longo",
          description: "Selecione um período de até 90 dias para melhor performance.",
          variant: "destructive"
        });
        return;
      }

      onSelect({ start: dateRange.start, end: dateRange.end });
      onOpenChange(false);
      setDateRange({});
      
      toast({
        title: "✓ Período confirmado",
        description: `${format(dateRange.start, 'dd/MM/yyyy')} até ${format(dateRange.end, 'dd/MM/yyyy')}`,
      });
    }
  };

  const handleCancel = () => {
    setDateRange({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[340px] md:max-w-[680px] max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="sticky top-0 z-20 bg-background border-b pb-3 -mt-3 -mx-3 sm:-mt-6 sm:-mx-6 px-3 sm:px-6 pt-3 sm:pt-6">
          <DialogTitle className="text-base sm:text-lg">Selecionar Período</DialogTitle>
          <div className="mt-3 text-sm">
            {dateRange.start && !dateRange.end && (
              <div className="bg-primary/10 text-primary p-2 rounded-md">
                ✓ Início: <strong>{format(dateRange.start, "dd/MM/yyyy")}</strong>
                <br />
                <span className="text-xs">👉 Selecione a data final</span>
              </div>
            )}
            {dateRange.start && dateRange.end && (
              <div className="bg-green-500/10 text-green-700 dark:text-green-400 p-2 rounded-md">
                ✓ Período: <strong>{format(dateRange.start, "dd/MM")}</strong> até <strong>{format(dateRange.end, "dd/MM/yyyy")}</strong>
              </div>
            )}
            {!dateRange.start && (
              <div className="text-muted-foreground text-xs">
                Passo 1/2: Selecione a data inicial
              </div>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">

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
                className="pointer-events-auto w-full border rounded-md p-2 sm:p-3"
                classNames={{
                  months: "w-full",
                  month: "space-y-4 w-full",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "hidden",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-8 sm:w-9 font-normal text-[0.7rem] sm:text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-8 w-8 sm:h-9 sm:w-9 text-center text-xs sm:text-sm p-0 relative",
                  day: "h-8 w-8 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
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
                className="pointer-events-auto w-full border rounded-md p-2 sm:p-3"
                classNames={{
                  months: "w-full",
                  month: "space-y-4 w-full",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "hidden",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-8 sm:w-9 font-normal text-[0.7rem] sm:text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-8 w-8 sm:h-9 sm:w-9 text-center text-xs sm:text-sm p-0 relative",
                  day: "h-8 w-8 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
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

        <DialogFooter className="sticky bottom-0 z-20 bg-background border-t pt-4 -mb-3 -mx-3 sm:-mb-6 sm:-mx-6 px-3 sm:px-6 pb-3 sm:pb-6 shadow-lg flex-col-reverse sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleCancel} 
            className="w-full sm:w-auto min-h-[44px]"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!dateRange.start || !dateRange.end}
            className="w-full sm:w-auto min-h-[44px] bg-primary hover:bg-primary/90"
          >
            {dateRange.start && dateRange.end ? '✓ Confirmar Período' : 'Selecione as datas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
