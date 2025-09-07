import { useState } from "react";
import { Calendar, Globe, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AdminFiltersProps {
  onPeriodChange?: (period: string) => void;
  onPlatformChange?: (platform: string) => void;
  onCountryChange?: (country: string) => void;
  showCohort?: boolean;
  onCohortChange?: (cohort: string) => void;
}

export function AdminFilters({ 
  onPeriodChange, 
  onPlatformChange, 
  onCountryChange,
  showCohort,
  onCohortChange 
}: AdminFiltersProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedCohort, setSelectedCohort] = useState("month");

  const periods = [
    { value: "today", label: "Hoje" },
    { value: "7d", label: "7 dias" },
    { value: "30d", label: "30 dias" },
    { value: "90d", label: "90 dias" }
  ];

  const platforms = [
    { value: "all", label: "Todas" },
    { value: "web", label: "Web" },
    { value: "mobile", label: "Mobile" }
  ];

  const countries = [
    { value: "all", label: "Todos" },
    { value: "br", label: "Brasil" },
    { value: "us", label: "Estados Unidos" },
    { value: "other", label: "Outros" }
  ];

  const cohorts = [
    { value: "month", label: "Mês de entrada" },
    { value: "week", label: "Semana de entrada" },
    { value: "quarter", label: "Trimestre de entrada" }
  ];

  return (
    <div className="bg-card rounded-lg border border-border/50 p-4">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Período */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Período:</span>
          <div className="flex gap-1">
            {periods.map((period) => (
              <Button
                key={period.value}
                variant={selectedPeriod === period.value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedPeriod(period.value);
                  onPeriodChange?.(period.value);
                }}
                className="h-8 px-3 text-xs"
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Plataforma */}
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Plataforma:</span>
          <Select value={selectedPlatform} onValueChange={(value) => {
            setSelectedPlatform(value);
            onPlatformChange?.(value);
          }}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {platforms.map((platform) => (
                <SelectItem key={platform.value} value={platform.value}>
                  {platform.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* País */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">País:</span>
          <Select value={selectedCountry} onValueChange={(value) => {
            setSelectedCountry(value);
            onCountryChange?.(value);
          }}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Coorte (apenas para relatórios) */}
        {showCohort && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Coorte:</span>
            <Select value={selectedCohort} onValueChange={(value) => {
              setSelectedCohort(value);
              onCohortChange?.(value);
            }}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cohorts.map((cohort) => (
                  <SelectItem key={cohort.value} value={cohort.value}>
                    {cohort.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}