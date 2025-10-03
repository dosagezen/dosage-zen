import { useState } from 'react';
import { Bell, BellOff, Clock, Moon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationSchedule } from '@/hooks/useNotificationSchedule';

interface NotificationSettingsProps {
  profileId: string;
  userId: string;
}

export const NotificationSettings = ({ profileId, userId }: NotificationSettingsProps) => {
  const { 
    permission, 
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    isRegistering 
  } = useNotifications();
  
  const { 
    preferences, 
    savePreferences, 
    isSavingPreferences 
  } = useNotificationSchedule(profileId);

  const [localPrefs, setLocalPrefs] = useState(preferences || {
    enabled: true,
    medicacao_enabled: true,
    consulta_enabled: true,
    exame_enabled: true,
    atividade_enabled: true,
    medicacao_advance_minutes: 5,
    consulta_advance_hours: 24,
    exame_advance_hours: 24,
    atividade_advance_hours: 1,
    quiet_hours_start: '',
    quiet_hours_end: ''
  });

  const isEnabled = permission === 'granted';

  const handleToggleNotifications = async () => {
    if (isEnabled) {
      await unsubscribeFromPushNotifications();
    } else {
      await subscribeToPushNotifications(userId, profileId);
    }
  };

  const handleSave = () => {
    savePreferences(localPrefs);
  };

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {isEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                Notificações Push
              </CardTitle>
              <CardDescription>
                {isEnabled 
                  ? 'Receba lembretes automáticos no seu dispositivo' 
                  : 'Ative para receber lembretes automáticos'}
              </CardDescription>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggleNotifications}
              disabled={isRegistering}
            />
          </div>
        </CardHeader>
      </Card>

      {isEnabled && (
        <>
          {/* Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tipos de Notificação</CardTitle>
              <CardDescription>
                Escolha quais lembretes você quer receber
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">💊 Medicações</Label>
                  <p className="text-sm text-muted-foreground">
                    Lembretes de horários de medicamentos
                  </p>
                </div>
                <Switch
                  checked={localPrefs.medicacao_enabled}
                  onCheckedChange={(checked) => 
                    setLocalPrefs({ ...localPrefs, medicacao_enabled: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">🩺 Consultas</Label>
                  <p className="text-sm text-muted-foreground">
                    Lembretes de consultas médicas
                  </p>
                </div>
                <Switch
                  checked={localPrefs.consulta_enabled}
                  onCheckedChange={(checked) => 
                    setLocalPrefs({ ...localPrefs, consulta_enabled: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">🔬 Exames</Label>
                  <p className="text-sm text-muted-foreground">
                    Lembretes de exames agendados
                  </p>
                </div>
                <Switch
                  checked={localPrefs.exame_enabled}
                  onCheckedChange={(checked) => 
                    setLocalPrefs({ ...localPrefs, exame_enabled: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">📅 Atividades</Label>
                  <p className="text-sm text-muted-foreground">
                    Lembretes de atividades programadas
                  </p>
                </div>
                <Switch
                  checked={localPrefs.atividade_enabled}
                  onCheckedChange={(checked) => 
                    setLocalPrefs({ ...localPrefs, atividade_enabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Timing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Antecedência dos Lembretes
              </CardTitle>
              <CardDescription>
                Defina quanto tempo antes você quer ser notificado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="med-advance">💊 Medicações (minutos antes)</Label>
                <Input
                  id="med-advance"
                  type="number"
                  min="0"
                  max="60"
                  value={localPrefs.medicacao_advance_minutes}
                  onChange={(e) => 
                    setLocalPrefs({ 
                      ...localPrefs, 
                      medicacao_advance_minutes: parseInt(e.target.value) || 5 
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="consulta-advance">🩺 Consultas (horas antes)</Label>
                <Input
                  id="consulta-advance"
                  type="number"
                  min="1"
                  max="168"
                  value={localPrefs.consulta_advance_hours}
                  onChange={(e) => 
                    setLocalPrefs({ 
                      ...localPrefs, 
                      consulta_advance_hours: parseInt(e.target.value) || 24 
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exame-advance">🔬 Exames (horas antes)</Label>
                <Input
                  id="exame-advance"
                  type="number"
                  min="1"
                  max="168"
                  value={localPrefs.exame_advance_hours}
                  onChange={(e) => 
                    setLocalPrefs({ 
                      ...localPrefs, 
                      exame_advance_hours: parseInt(e.target.value) || 24 
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="atividade-advance">📅 Atividades (horas antes)</Label>
                <Input
                  id="atividade-advance"
                  type="number"
                  min="0"
                  max="48"
                  value={localPrefs.atividade_advance_hours}
                  onChange={(e) => 
                    setLocalPrefs({ 
                      ...localPrefs, 
                      atividade_advance_hours: parseInt(e.target.value) || 1 
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Horário Silencioso
              </CardTitle>
              <CardDescription>
                Não receba notificações neste período (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quiet-start">Início</Label>
                  <Input
                    id="quiet-start"
                    type="time"
                    value={localPrefs.quiet_hours_start || ''}
                    onChange={(e) => 
                      setLocalPrefs({ 
                        ...localPrefs, 
                        quiet_hours_start: e.target.value 
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet-end">Fim</Label>
                  <Input
                    id="quiet-end"
                    type="time"
                    value={localPrefs.quiet_hours_end || ''}
                    onChange={(e) => 
                      setLocalPrefs({ 
                        ...localPrefs, 
                        quiet_hours_end: e.target.value 
                      })
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Exemplo: 22:00 até 08:00 para não receber notificações à noite
              </p>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={isSavingPreferences}
            className="w-full"
          >
            {isSavingPreferences ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </>
      )}
    </div>
  );
};
