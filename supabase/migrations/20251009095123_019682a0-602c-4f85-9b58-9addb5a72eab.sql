-- Criar tabelas para Termos de Uso
create table if not exists public.terms_of_use (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  effective_date date not null,
  content_md text not null,
  is_active boolean not null default false,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Índice único para garantir apenas uma versão ativa
create unique index uq_terms_of_use_active 
on public.terms_of_use (is_active) 
where is_active = true;

-- Tabela de logs de visualização pública
create table if not exists public.terms_view_logs (
  id bigserial primary key,
  terms_id uuid not null references public.terms_of_use(id) on delete cascade,
  viewer_user_id uuid references auth.users(id) on delete set null,
  viewer_ip inet,
  user_agent text,
  viewed_at timestamptz default now()
);

-- Tabela de logs de aceite/consentimento
create table if not exists public.terms_acceptance_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_id uuid not null references public.terms_of_use(id) on delete restrict,
  accepted_at timestamptz default now(),
  acceptance_method text not null default 'checkbox',
  acceptance_ip inet,
  user_agent text
);

-- Índice para consultas por usuário
create index idx_terms_acceptance_user 
on public.terms_acceptance_logs(user_id, accepted_at desc);

-- RLS para terms_of_use
alter table public.terms_of_use enable row level security;

-- Política: Leitura pública apenas da versão ativa
create policy "Public can view active terms"
on public.terms_of_use
for select
using (is_active = true);

-- Política: Admins podem gerenciar termos
create policy "Admins can manage terms"
on public.terms_of_use
for all
using (is_admin(auth.uid()))
with check (is_admin(auth.uid()));

-- RLS para terms_view_logs
alter table public.terms_view_logs enable row level security;

-- Política: Sistema pode inserir logs
create policy "System can log views"
on public.terms_view_logs
for insert
with check (true);

-- Política: Admins podem visualizar logs
create policy "Admins can view logs"
on public.terms_view_logs
for select
using (is_admin(auth.uid()));

-- RLS para terms_acceptance_logs
alter table public.terms_acceptance_logs enable row level security;

-- Política: Usuários autenticados podem aceitar
create policy "Users can accept terms"
on public.terms_acceptance_logs
for insert
to authenticated
with check (auth.uid() = user_id);

-- Política: Usuários podem ver seus próprios aceites
create policy "Users can view their acceptances"
on public.terms_acceptance_logs
for select
using (auth.uid() = user_id);

-- Política: Admins podem ver todos os aceites
create policy "Admins can view all acceptances"
on public.terms_acceptance_logs
for select
using (is_admin(auth.uid()));

-- Função: Obter versão ativa
create or replace function public.fn_terms_get_active()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', id,
    'version', version,
    'effective_date', effective_date,
    'content_md', content_md
  )
  from public.terms_of_use
  where is_active = true
  limit 1;
$$;

-- Função: Listar versões (histórico)
create or replace function public.fn_terms_list_versions(
  p_limit integer default 10,
  p_offset integer default 0
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_agg(
    jsonb_build_object(
      'id', id,
      'version', version,
      'effective_date', effective_date,
      'is_active', is_active,
      'created_at', created_at
    )
  )
  from (
    select * from public.terms_of_use
    order by created_at desc
    limit p_limit offset p_offset
  ) t;
$$;

-- Função: Registrar visualização
create or replace function public.fn_terms_log_view(
  p_terms_id uuid,
  p_viewer_user_id uuid default null,
  p_viewer_ip inet default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.terms_view_logs (
    terms_id, viewer_user_id, viewer_ip, user_agent
  ) values (
    p_terms_id, p_viewer_user_id, p_viewer_ip, p_user_agent
  );
end;
$$;

-- Função: Registrar aceite
create or replace function public.fn_terms_log_accept(
  p_terms_id uuid,
  p_user_id uuid,
  p_acceptance_ip inet default null,
  p_user_agent text default null,
  p_acceptance_method text default 'checkbox'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.terms_acceptance_logs (
    user_id, terms_id, acceptance_ip, user_agent, acceptance_method
  ) values (
    p_user_id, p_terms_id, p_acceptance_ip, p_user_agent, p_acceptance_method
  );
end;
$$;

-- Inserir versão inicial dos Termos de Uso (v1.0)
insert into public.terms_of_use (version, effective_date, content_md, is_active)
values (
  'v1.0',
  current_date,
  '# Termos de Uso — DosageZen

**Última atualização:** ' || to_char(current_date, 'DD/MM/YYYY') || '

## 1. Aceitação

Ao utilizar o DosageZen, você declara ter lido e concordado com estes Termos e com a Política de Privacidade.

## 2. Descrição do Serviço

O DosageZen é um app de gestão de medicações, consultas, exames e atividades, que auxilia o usuário a acompanhar seus compromissos de saúde. **O aplicativo não substitui consulta, diagnóstico ou prescrição médica.**

## 3. Cadastro e Conta

- Informações verdadeiras e atualizadas.
- Login pessoal e intransferível.
- Responsabilidade por proteger credenciais.
- Contas podem ser suspensas em caso de uso indevido/fraude.

## 4. Perfis e Permissões

- **Paciente (Gestor):** titular e responsável pelo plano.
- **Acompanhante:** colaborador com acesso integral.
- **Cuidador:** acesso restrito (check de compromissos).
- **Administrador:** gestão técnica do sistema.

O Paciente pode convidar e remover colaboradores.

## 5. Planos e Pagamentos

- Mensalidade: **R$ 65,00**.
- Pagamento via cartão de crédito.
- Cancelamento imediato, sem fidelidade.
- Acesso mantém-se até o fim do ciclo vigente.

## 6. Responsabilidades do Usuário

- Usar o app de forma ética e legal.
- Não alterar, fraudar ou invadir o sistema.
- Inserir informações verídicas.

## 7. Responsabilidades do DosageZen

- Manter o app estável e seguro.
- Proteger dados conforme LGPD.
- Oferecer suporte técnico.

**Não nos responsabilizamos por:** uso incorreto; decisões médicas baseadas no app; falhas de terceiros.

## 8. Rescisão e Exclusão de Conta

- Usuário pode excluir sua conta a qualquer momento.
- Dados tratados conforme Política de Privacidade.
- Conta pode ser encerrada por violação ou risco de segurança.

## 9. Propriedade Intelectual

Todo o conteúdo (código, design, marca, textos, ícones, gráficos, fluxos) pertence ao DosageZen. Proibida a reprodução sem autorização.

## 10. Alterações dos Termos

Estes Termos podem ser atualizados. Mudanças relevantes exigirão novo aceite ativo.

## 11. Limitação de Responsabilidade

O app é ferramenta de apoio e **não substitui profissionais de saúde**.  
A DosageZen não é responsável por falhas técnicas, decisões tomadas com base no app ou erros de serviços de terceiros.

## 12. Legislação e Foro

Termos regidos pelas leis brasileiras. Foro eleito: **Comarca de Recife – PE**.

## 13. Contato

📩 suporte@dosagezen.com.br  
📩 privacidade@dosagezen.com.br',
  true
);