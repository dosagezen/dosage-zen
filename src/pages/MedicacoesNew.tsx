import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Pill, AlertCircle, Loader2 } from 'lucide-react';
import AddMedicationDialog from '@/components/AddMedicationDialog';
import { useMedications } from '@/hooks/useMedications';

const MedicacoesNew = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState(null);
  
  const { 
    medications, 
    isLoading, 
    error, 
    createMedication, 
    updateMedication, 
    deleteMedication,
    isCreating,
    isUpdating,
    isDeleting
  } = useMedications();

  const handleAddMedication = (medicationData) => {
    createMedication(medicationData);
    setIsDialogOpen(false);
  };

  const handleEditMedication = (medication) => {
    setEditingMedication(medication);
    setIsDialogOpen(true);
  };

  const handleUpdateMedication = (medicationData) => {
    if (editingMedication) {
      updateMedication({ id: editingMedication.id, ...medicationData });
    }
    setIsDialogOpen(false);
    setEditingMedication(null);
  };

  const handleDeleteMedication = (id) => {
    deleteMedication(id);
    setIsDialogOpen(false);
    setEditingMedication(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando medicações...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Erro ao carregar medicações: {error.message}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medicações</h1>
          <p className="text-muted-foreground">
            Gerencie suas medicações e horários
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} disabled={isCreating}>
          {isCreating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Adicionar Medicação
        </Button>
      </div>

      <div className="grid gap-4">
        {medications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma medicação cadastrada</h3>
              <p className="text-muted-foreground mb-4">Comece adicionando sua primeira medicação</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Medicação
              </Button>
            </CardContent>
          </Card>
        ) : (
          medications.map((medicacao) => (
            <Card key={medicacao.id} className={`${!medicacao.ativo ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Pill className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">{medicacao.nome}</h3>
                      <Badge variant={medicacao.ativo ? "default" : "secondary"}>
                        {medicacao.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Dosagem:</strong> {medicacao.dosagem}</p>
                      <p><strong>Forma:</strong> {medicacao.forma}</p>
                      <p><strong>Frequência:</strong> {medicacao.frequencia}</p>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <strong>Horários:</strong> {Array.isArray(medicacao.horarios) ? medicacao.horarios.join(', ') : 'Não definido'}
                      </div>
                    </div>

                    {medicacao.observacoes && (
                      <div className="mt-3 p-2 bg-muted rounded-md">
                        <p className="text-sm">{medicacao.observacoes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditMedication(medicacao)}
                        disabled={isUpdating}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeleteMedication(medicacao.id)}
                        disabled={isDeleting}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      <span className={`font-medium ${medicacao.estoque <= 10 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        Estoque: {medicacao.estoque}
                      </span>
                      {medicacao.estoque <= 10 && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AddMedicationDialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingMedication(null);
          }
        }}
        medication={editingMedication}
        isEditing={!!editingMedication}
        onDelete={editingMedication ? () => handleDeleteMedication(editingMedication.id) : undefined}
        onSave={handleAddMedication}
        onUpdate={handleUpdateMedication}
      />
    </div>
  );
};

export default MedicacoesNew;