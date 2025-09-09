-- Consolidação: Remover definições duplicadas da função is_admin das migrações anteriores
-- e manter apenas uma versão atualizada

-- A função is_admin já existe e está funcionando corretamente no banco
-- Este arquivo consolida todas as definições anteriores em uma única versão limpa

-- Comentário: As migrações anteriores continham múltiplas definições da mesma função
-- Este consolidado garante que apenas uma versão atualizada seja mantida