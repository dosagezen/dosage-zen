import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PublicReportView = () => {
  const { id } = useParams<{ id: string }>();
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadReport = async () => {
      if (!id) {
        setError("ID do relatório inválido");
        setLoading(false);
        return;
      }

      try {
        // Download HTML from public bucket
        const { data, error } = await supabase.storage
          .from("public-reports")
          .download(`${id}.html`);

        if (error) throw error;

        const text = await data.text();
        setHtmlContent(text);
      } catch (err) {
        console.error("Error loading report:", err);
        setError("Relatório não encontrado ou expirado");
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-base text-muted-foreground px-4">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground px-2">Relatório não encontrado</h1>
          <p className="text-sm sm:text-base text-muted-foreground px-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-background"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default PublicReportView;
