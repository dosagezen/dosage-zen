-- Tabela: privacy_policies (versões da Política de Privacidade)
create table if not exists public.privacy_policies (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  effective_date date not null,
  content_md text not null,
  is_active boolean not null default false,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Índice único para garantir apenas uma versão ativa
create unique index uq_privacy_policy_active 
on public.privacy_policies (is_active) 
where is_active = true;

-- Tabela: privacy_policy_view_logs
create table if not exists public.privacy_policy_view_logs (
  id bigserial primary key,
  policy_id uuid not null references public.privacy_policies(id) on delete cascade,
  viewer_user_id uuid references auth.users(id) on delete set null,
  viewer_ip inet,
  user_agent text,
  viewed_at timestamptz default now()
);

-- Tabela: privacy_policy_acceptance_logs
create table if not exists public.privacy_policy_acceptance_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_id uuid not null references public.privacy_policies(id) on delete restrict,
  accepted_at timestamptz default now(),
  acceptance_method text not null default 'checkbox',
  acceptance_ip inet,
  user_agent text
);

-- Índice para consultas por usuário
create index idx_privacy_acceptance_user 
on public.privacy_policy_acceptance_logs(user_id, accepted_at desc);

-- RLS para privacy_policies
alter table public.privacy_policies enable row level security;

create policy "Public can view active privacy policy"
on public.privacy_policies
for select
using (is_active = true);

create policy "Admins can manage privacy policies"
on public.privacy_policies
for all
using (is_admin(auth.uid()))
with check (is_admin(auth.uid()));

-- RLS para privacy_policy_view_logs
alter table public.privacy_policy_view_logs enable row level security;

create policy "System can log privacy policy views"
on public.privacy_policy_view_logs
for insert
with check (true);

create policy "Admins can view privacy policy logs"
on public.privacy_policy_view_logs
for select
using (is_admin(auth.uid()));

-- RLS para privacy_policy_acceptance_logs
alter table public.privacy_policy_acceptance_logs enable row level security;

create policy "Users can accept privacy policy"
on public.privacy_policy_acceptance_logs
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can view their privacy acceptances"
on public.privacy_policy_acceptance_logs
for select
using (auth.uid() = user_id);

create policy "Admins can view all privacy acceptances"
on public.privacy_policy_acceptance_logs
for select
using (is_admin(auth.uid()));

-- Função: Obter versão ativa da política
create or replace function public.fn_privacy_get_active()
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
  from public.privacy_policies
  where is_active = true
  limit 1;
$$;

-- Função: Listar versões (histórico)
create or replace function public.fn_privacy_list_versions(
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
    select * from public.privacy_policies
    order by created_at desc
    limit p_limit offset p_offset
  ) t;
$$;

-- Função: Registrar visualização
create or replace function public.fn_privacy_log_view(
  p_policy_id uuid,
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
  insert into public.privacy_policy_view_logs (
    policy_id, viewer_user_id, viewer_ip, user_agent
  ) values (
    p_policy_id, p_viewer_user_id, p_viewer_ip, p_user_agent
  );
end;
$$;

-- Função: Registrar aceite
create or replace function public.fn_privacy_log_accept(
  p_policy_id uuid,
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
  insert into public.privacy_policy_acceptance_logs (
    user_id, policy_id, acceptance_ip, user_agent, acceptance_method
  ) values (
    p_user_id, p_policy_id, p_acceptance_ip, p_user_agent, p_acceptance_method
  );
end;
$$;

-- Seed: Versão inicial v1.0
insert into public.privacy_policies (version, effective_date, content_md, is_active)
values (
  'v1.0',
  current_date,
  '## Política de Privacidade — DosageZen

**Última atualização:** ' || to_char(current_date, 'DD/MM/YYYY') || '

## 1. Quem Somos

O **DosageZen** é um aplicativo digital de apoio à saúde, que ajuda usuários a gerenciar medicações, consultas, exames e atividades.

**Controlador de dados:** DosageZen Tecnologia Ltda. — em conformidade com a **LGPD (Lei 13.709/18)**.

## 2. Quais Dados Coletamos

- **Cadastrais:** nome, e-mail, telefone, senha.
- **Uso:** login, navegação e preferências.
- **Sensíveis:** medicações, exames, sintomas (dados de saúde).
- **Técnicos:** endereço IP, dispositivo, sistema operacional, localização aproximada.

## 3. Finalidades e Bases Legais

- **Execução de contrato:** funcionalidade do app.
- **Consentimento:** tratamento de dados sensíveis de saúde.
- **Obrigações legais:** cumprimento de normas aplicáveis.
- **Legítimo interesse:** segurança, prevenção de fraudes e melhorias no serviço.

## 4. Consentimento Explícito

Ao registrar informações de saúde no DosageZen, o usuário **consente expressamente** com o tratamento desses dados, podendo **revogar seu consentimento a qualquer momento** através do e-mail privacidade@dosagezen.com.br.

## 5. Como Usamos os Dados

- Gerenciar compromissos de saúde e lembretes personalizados.
- Melhorar o aplicativo e oferecer suporte técnico.
- Cumprir exigências legais e regulatórias.
- Realizar análises estatísticas agregadas (dados anonimizados).

## 6. Compartilhamento de Dados

**Compartilhamos dados com:**
- **Parceiros tecnológicos:** Supabase (banco de dados), Stripe (pagamentos), Google Cloud (infraestrutura).
- **Colaboradores autorizados:** cuidadores e acompanhantes vinculados pelo usuário.
- **Autoridades competentes:** quando houver determinação legal ou ordem judicial.

**Não vendemos nem comercializamos dados pessoais.**

## 7. Retenção e Exclusão de Dados

- **Dados cadastrais:** retidos por até **5 anos** após o término do vínculo contratual.
- **Dados sensíveis de saúde:** retidos por até **1 ano** após a revogação do consentimento.
- **Logs técnicos:** retidos por até **180 dias**.

O usuário pode solicitar a exclusão antecipada de seus dados a qualquer momento.

## 8. Direitos do Usuário (LGPD, GDPR, CCPA)

Você tem direito a:
- **Acessar** seus dados pessoais armazenados.
- **Corrigir** informações incompletas ou desatualizadas.
- **Excluir** seus dados (direito ao esquecimento).
- **Solicitar portabilidade** para outro serviço.
- **Revogar consentimento** para tratamento de dados sensíveis.
- **Reclamar** junto à Autoridade Nacional de Proteção de Dados (ANPD).

📩 **Exercer seus direitos:** privacidade@dosagezen.com.br

## 9. Segurança da Informação

Implementamos medidas técnicas e organizacionais para proteger seus dados:
- **Criptografia:** AES-256 em repouso e TLS 1.3 em trânsito.
- **Controle de acesso:** autenticação multifator e gestão de permissões.
- **Auditoria:** logs de acesso e monitoramento contínuo.
- **Notificação de incidentes:** em até **72 horas** conforme LGPD.

## 10. Menores de Idade

O uso do DosageZen é permitido apenas a **maiores de 18 anos**, ou mediante **autorização expressa do responsável legal**.

## 11. Alterações na Política

Esta Política pode ser atualizada periodicamente. Mudanças relevantes serão comunicadas por e-mail e exigirão **novo consentimento ativo** do usuário.

## 12. Contato e Encarregado de Dados (DPO)

👤 **Encarregado de Proteção de Dados (DPO):** A ser definido  
📩 **E-mail:** privacidade@dosagezen.com.br  
🏢 **Razão Social:** DosageZen Tecnologia Ltda.  
📍 **Endereço:** A ser definido

---

**Compliance:** Esta política está em conformidade com a **LGPD (Brasil)**, **GDPR (União Europeia)** e **CCPA (Califórnia, EUA)**.
',
  true
);