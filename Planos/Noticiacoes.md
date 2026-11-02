# Notificações — guia de ativação operacional

**Data**: 2 de novembro de 2026
**Versão do app**: v4.67.0
**Escopo**: push com o app fechado, pareamento de sessão por QR Code e expurgo de contas desativadas.

---

## Resumo em uma frase

Todo o **código** já está pronto e verificado; falta apenas o que vive fora do repositório: **uma migração pendente**, **seis variáveis na Vercel** e **dois agendamentos**. Enquanto isso não é feito, o app funciona — só o push mostra “Servidor sem chaves VAPID configuradas” e o pareamento cai no modo degradado.

### O que depende de quê

| Recurso | Código (já pronto) | Depende de | Sem a configuração |
|---|---|---|---|
| Push com o app fechado | `src-app/api/push-dispatch.js`, `src-app/src/features/notifications/push.ts`, `src-app/public/push-sw.js` | chaves VAPID + `SUPABASE_SERVICE_ROLE_KEY` + `CRON_SECRET` + cron | UI mostra “Servidor sem chaves VAPID configuradas”; avisos só com o app aberto (agendador local) |
| Pareamento de uso único (login por QR) | `src-app/src/features/auth/qr-pairing.ts`, `PairingAuthorizeDialog.tsx`, RPCs `pairing_*` | migração `20261102` (**já aplicada**) + Supabase configurado no app | QR continua funcionando pelo canal Realtime, mas o código vale 5 min e pode ser reusado |
| Expurgo de contas desativadas | `src-app/api/account-purge.js` | `CRON_SECRET` + service role + cron diário | Conta fica apenas marcada; nada é apagado |
| Ranking/amigos | `20261101_social_ranking_friends.sql` | **rode a migração corrigida** | Telas de ranking/amigos falham ao chamar as RPCs |

### Estado do banco (verificado em 02/11/2026)

Projeto: **Evo Fit** — ref `ymndekdhjxnsdyddlvkm` (us-east-1).
URL: `https://ymndekdhjxnsdyddlvkm.supabase.co`

| Migração | Situação |
|---|---|
| `supabase/migrations/20261020_profiles_username.sql` | ✅ aplicada (`profiles`) |
| `supabase/migrations/20261101_social_ranking_friends.sql` | ❌ **pendente** — a versão antiga falhava e nada era aplicado; já corrigida (ver Passo 1) |
| `supabase/migrations/20261102_push_pairing_account.sql` | ✅ aplicada (`push_subscriptions`, `pairing_codes`, colunas `deletion_*`) |

---

## Passo 1 — Banco de dados

### O que aconteceu antes

O SQL Editor do Supabase executa o script inteiro em **uma transação**. Como a função `global_monthly_ranking` não compilava, o erro desfez tudo — por isso `friendships` e as colunas de XP não existem. Duas correções foram feitas no arquivo:

1. **`position` é palavra reservada** no Postgres: a coluna agora aparece entre aspas (`"position"`) no `RETURNS TABLE`, no alias do `row_number()` e no `ORDER BY`. O nome devolvido ao cliente continua `position`, então **o app não mudou**.
2. **`friends_overview`** referenciava `me.uid` no `ON` do join antes de `cross join me` (`42P01`). O `cross join me` passou para antes do `join public.profiles`.

### Como aplicar

**Pelo navegador (recomendado):**

1. Abra <https://supabase.com/dashboard/project/ymndekdhjxnsdyddlvkm/sql/new>.
2. Abra o arquivo `supabase/migrations/20261101_social_ranking_friends.sql` e **copie o conteúdo inteiro**.
3. Cole no editor e clique em **Run**.
4. O resultado esperado é `Success. No rows returned`.

**Pela CLI** (se estiver logado e o projeto linkado):

```bash
npx supabase link --project-ref ymndekdhjxnsdyddlvkm
npx supabase db push
```

> As três migrações são idempotentes (`add column if not exists`, `create table if not exists`, `create or replace function`, `drop policy if exists`). Reexecutar `20261020` ou `20261102` não causa dano — mas só a `20261101` está pendente.

### Verificação

```sql
-- 1) as tabelas devem aparecer
select table_name
  from information_schema.tables
 where table_schema = 'public'
 order by table_name;
-- esperado: friendships, pairing_codes, profiles, push_subscriptions, user_sync

-- 2) as colunas de XP devem existir em profiles
select column_name
  from information_schema.columns
 where table_schema = 'public' and table_name = 'profiles'
   and column_name in ('total_xp','monthly_xp','xp_period','level','streak','avatar_emblem','photo','last_seen');

-- 3) as funções devem existir
select proname, pg_get_function_result(oid) as retorno
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('publish_monthly_xp','global_monthly_ranking','friends_overview')
 order by proname;
```

---

## Passo 2 — Gerar as chaves (uma única vez)

### Par VAPID

**Git Bash / Linux / macOS:**

```bash
node -e "const c=require('crypto');const e=c.createECDH('prime256v1');e.generateKeys();console.log('VAPID_PUBLIC_KEY='+e.getPublicKey().toString('base64url'));console.log('VAPID_PRIVATE_KEY='+e.getPrivateKey().toString('base64url'))"
```

**PowerShell (Windows):**

```powershell
node -e 'const c=require("crypto");const e=c.createECDH("prime256v1");e.generateKeys();console.log("VAPID_PUBLIC_KEY="+e.getPublicKey().toString("base64url"));console.log("VAPID_PRIVATE_KEY="+e.getPrivateKey().toString("base64url"))'
```

Saída esperada (dois valores base64url):

```
VAPID_PUBLIC_KEY=BC...65 caracteres no total
VAPID_PRIVATE_KEY=...43 caracteres
```

### Segredo do cron

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Gera 64 caracteres hexadecimais. Serve para os **dois** endpoints (`push-dispatch` e `account-purge`).

> **Guarde os três valores em um gerenciador de senhas** antes de colar na Vercel. A chave privada não deve entrar no Git, em `.env` versionado, no chat ou em variável com prefixo `VITE_` (esse prefixo embute o valor no JavaScript entregue ao navegador).

---

## Passo 3 — Variáveis na Vercel

Painel do projeto (domínio atual `academia-seven-iota.vercel.app`) → **Settings → Environment Variables**. Crie uma por uma e marque **Production**, **Preview** e **Development**.

| Nome | Valor | Secreta? | Observação |
|---|---|---|---|
| `VAPID_PUBLIC_KEY` | saída `VAPID_PUBLIC_KEY=` | não | é pública: o app a busca em `/api/push-dispatch?action=key` |
| `VAPID_PRIVATE_KEY` | saída `VAPID_PRIVATE_KEY=` | **sim** | só o servidor assina com ela |
| `VAPID_SUBJECT` | `mailto:seu-email@dominio.com` | não | precisa ser `mailto:` ou `https://`; se faltar, o código usa `mailto:contato@evofit.app` |
| `SUPABASE_URL` | `https://ymndekdhjxnsdyddlvkm.supabase.co` | não | o código aceita `VITE_SUPABASE_URL` como fallback, mas declare explicitamente |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → **Project Settings → API Keys** → chave `service_role` / *secret* | **sim** | ignora RLS: nunca no cliente |
| `CRON_SECRET` | hex de 64 caracteres do Passo 2 | **sim** | autoriza `?action=cron` |

Detalhes que evitam retrabalho:

- O **Root Directory do projeto Vercel é `src-app`**. As variáveis são do projeto (não do diretório), então nada muda ao cadastrá-las.
- **Não** é preciso mexer em `package.json` nem criar dependência: o endpoint usa `@supabase/supabase-js` (já instalado) e `node:crypto`.
- **Não** é preciso adicionar `crons` ao `vercel.json` (e no plano Hobby a Vercel só aceita cron diário).
- Depois de cadastrar, **faça um novo deploy** (Deployments → ⋯ → Redeploy). Variáveis novas não entram em deployments já criados.

---

## Passo 4 — Agendar os dois endpoints

| Endpoint | Frequência | Header |
|---|---|---|
| `GET https://academia-seven-iota.vercel.app/api/push-dispatch?action=cron` | a cada **5–15 min** | `Authorization: Bearer $CRON_SECRET` |
| `GET https://academia-seven-iota.vercel.app/api/account-purge?action=cron` | **1× por dia** | `Authorization: Bearer $CRON_SECRET` |

### Opção A — cron-job.org (grátis, granularidade de minutos, funciona no Hobby)

1. Crie a conta em <https://cron-job.org> e clique em **Create cronjob**.
2. **URL**: a do `push-dispatch` acima. **Schedule**: *Every 10 minutes*.
3. Em **Advanced → Headers**, adicione `Authorization` = `Bearer SEU_CRON_SECRET`.
4. Salve e use **TEST RUN** para conferir a resposta (deve vir `{"ok":true,...}`).
5. Repita para o `account-purge`, com **Schedule** diário (ex.: 03:10) e o mesmo header.

### Opção B — GitHub Actions

Arquivo `.github/workflows/cron-notificacoes.yml`, com o segredo `CRON_SECRET` cadastrado em **Settings → Secrets and variables → Actions**:

```yaml
name: cron-notificacoes
on:
  schedule:
    - cron: '*/10 * * * *'   # push a cada 10 min
  workflow_dispatch:
jobs:
  push:
    runs-on: ubuntu-latest
    steps:
      - name: Disparo de push
        run: |
          curl -fsS -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "https://academia-seven-iota.vercel.app/api/push-dispatch?action=cron"
  expurgo:
    runs-on: ubuntu-latest
    if: github.event.schedule == '*/10 * * * *'
    steps:
      - name: Expurgo diário (só na primeira execução do dia)
        run: |
          # roda apenas por volta das 03:00 UTC
          [ "$(date -u +%H)" = "03" ] || exit 0
          curl -fsS -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "https://academia-seven-iota.vercel.app/api/account-purge?action=cron"
```

O GitHub atrasa schedules (às vezes 10–20 min) e os desativa após 60 dias sem atividade no repositório. Para produção, prefira o cron-job.org.

### Opção C — Vercel Cron

Só no plano **Pro**: exige `crons` no `vercel.json`. No **Hobby** a Vercel executa no máximo 1× por dia, o que não serve para o lembrete no horário escolhido.

> Os dois endpoints também aceitam `?secret=SEU_CRON_SECRET` na URL, mas o header é preferível — segredo em URL aparece em logs e histórico.

---

## Passo 5 — Verificação (sem abrir o app)

```bash
BASE="https://academia-seven-iota.vercel.app"
SECRET="cole_aqui_o_cron_secret"

# 1) a chave pública está publicada?  esperado: {"configured":true,"key":"BC..."}
curl -s "$BASE/api/push-dispatch?action=key"

# 2) sem header deve dar 401; com header deve dar 200
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/api/push-dispatch?action=cron"
curl -s -H "Authorization: Bearer $SECRET" "$BASE/api/push-dispatch?action=cron"

# 3) expurgo
curl -s -H "Authorization: Bearer $SECRET" "$BASE/api/account-purge?action=cron"
```

Respostas esperadas:

| Cenário | Resposta |
|---|---|
| `?action=key` com chave | `{"configured":true,"key":"BC…"}` |
| `?action=key` sem chave | `{"configured":false,"key":null}` |
| `?action=cron` sem header | `401 {"error":"Não autorizado."}` |
| `?action=cron` com header | `200 {"ok":true,"checked":N,"sent":N,"removed":N,...}` |
| service role inválida | `502 {"error":"Falha ao ler assinaturas: …"}` |

**Antes de tudo isso**, rode a validação local da criptografia (não precisa de nenhuma variável):

```bash
npm run check:push
```

O script confere a RFC 8291 ponta a ponta — cifra, descriptografa como o navegador faria, valida o JWT VAPID (ES256, `aud`, `exp`, `sub`) e as janelas das ligas. Hoje ele passa: `check-push: OK`.

---

## Passo 6 — Teste no app

### Push com o app fechado

1. Abra o app publicado em **HTTPS** (obrigatório) e entre na sua conta — o push é ligado ao usuário; sem sessão a UI mostra “Entre na sua conta para ativar”.
2. **Configurações → Notificações**: ligue **Permitir notificações** (aceite a permissão do navegador).
3. Ligue **Push com o app fechado**. O texto deve sair de “Servidor sem chaves VAPID configuradas” para **“Ativo — o servidor envia mesmo com o app fechado”**.
4. **Configurações → Notificações → Notificações e Lembretes**: ligue **Lembretes de treino** e escolha **Horário do Lembrete** dois ou três minutos à frente do horário atual.
5. Espere passar o horário e dispare o cron (o `curl` do item anterior, ou o **TEST RUN** do cron-job.org).
6. Feche o app por completo (no Android, remova dos recentes; no iOS, só funciona com o PWA **instalado na tela de início**, iOS 16.4+) e aguarde a notificação.

> O servidor deduplica por dia: o lembrete usa a chave `reminder:AAAA-MM-DD` e a motivacional `motivation:AAAA-MM-DD`. Para repetir o teste no mesmo dia, limpe as chaves da assinatura no dashboard:
> ```sql
> update public.push_subscriptions
>    set sent_keys = '{}'::jsonb
>  where user_id = 'UUID_DO_USUARIO';
> ```

### Pareamento de uso único (duas contas/aparelhos)

1. **Aparelho A (sem sessão)**: Login → **Entrar por QR Code**. Aparecem o QR e o código `PLN-XXXX-XXXX`, válido por 5 minutos.
2. **Aparelho B (já logado)**: abra o link do QR ou vá em **Configurações → Segurança → Autorizar outro aparelho** e digite o código.
3. O aparelho B confirma; o aparelho A entra sem senha.
4. **Teste da revogação**: repita a autorização com o mesmo código em um terceiro aparelho. Deve aparecer “código já usado” — a RPC `pairing_claim` consumiu o código no primeiro uso.
5. **Teste de expiração**: gere um código e espere 5 minutos; a autorização deve recusar como expirado.

O modo degradado (aviso “Sem conexão com o servidor de pareamento…”) só deve aparecer com a rede caída — se aparecer com rede boa, veja a tabela de problemas abaixo.

### Expurgo de contas

1. **Configurações → Sua Conta → Desativar Sua Conta**, digite `DESATIVAR` e confirme. A conta fica marcada por 30 dias e o login a reativa (`cancel_account_deletion`).
2. Para conferir sem esperar 30 dias, ajuste a data no dashboard e rode o expurgo:
   ```sql
   update public.profiles
      set deletion_effective_at = now() - interval '1 minute'
    where id = 'UUID_DO_USUARIO';
   ```
   Depois `curl` no `account-purge`: o retorno traz `purged` > 0 e o usuário desaparece de `auth.users`.

---

## Problemas comuns

| Sintoma | Causa provável | Correção |
|---|---|---|
| UI: “Servidor sem chaves VAPID configuradas” | variáveis ausentes **ou** deployment antigo | conferir `?action=key`; se `configured:false`, cadastrar as chaves e **redeploy** |
| `500 {"error":"CRON_SECRET não configurado."}` | `CRON_SECRET` ausente | cadastrar e redeploy |
| `401 {"error":"Não autorizado."}` | header diferente do segredo | conferir espaço após `Bearer` e o valor exato |
| `500 {"error":"Chaves VAPID não configuradas."}` | só a pública foi cadastrada | cadastrar também a privada |
| `502 {"error":"Falha ao ler assinaturas: …"}` | service role inválida/rotacionada ou tabela ausente | regerar a chave no Supabase e redeploy |
| Push só chega com o app aberto | sem sessão na nuvem, push desligado, ou `notify_*` desmarcado | entrar na conta, religar o toggle, conferir a linha em `push_subscriptions` |
| Notificação nunca chega mesmo “Ativo” | horário do lembrete no futuro, ou cron não está rodando | rodar o `curl` manualmente e ver `sent` no JSON |
| `403`/`410` em massa depois de trocar chaves | as assinaturas estão presas à chave antiga | as `410` são removidas automaticamente; cada usuário precisa religar o push |
| Pareamento sempre em modo degradado | migração `20261102` não aplicada ou Supabase não configurado no app | rodar a migração e conferir **Configurações → Nuvem** |
| “código já usado” em um código novo | relógio do aparelho muito adiantado (TTL de 5 min) | ajustar o relógio e gerar outro código |

---

## Segurança e rotação

- `VAPID_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET` existem **só** no servidor. Nunca com prefixo `VITE_`, nunca no repositório.
- A `service_role` ignora RLS: se vazar, o banco inteiro fica exposto. Rotacione em **Project Settings → API Keys** e faça redeploy.
- Trocar o par VAPID **invalida todas as assinaturas** (o navegador passa a recusar com 403). Gere uma vez e guarde; se precisar trocar, avise os usuários para religar o push.
- Rotacionar o `CRON_SECRET` é barato, mas exige atualizar o header no agendador **e** na Vercel no mesmo momento (há uma janela de 401).
- O expurgo é irreversível: `auth.admin.deleteUser` apaga o usuário e a cascata limpa `profiles`, `friendships` e `push_subscriptions`. A carência de 30 dias é a única proteção — não a reduza sem necessidade.

---

## Checklist final

- [ ] Rodar `20261101_social_ranking_friends.sql` (arquivo corrigido) no SQL Editor
- [ ] Conferir tabelas, colunas de XP e as três funções (queries do Passo 1)
- [ ] Gerar o par VAPID e o `CRON_SECRET`; guardar no gerenciador de senhas
- [ ] Cadastrar as 6 variáveis na Vercel (Production, Preview, Development)
- [ ] **Redeploy**
- [ ] `npm run check:push` → `check-push: OK` (local, já passa)
- [ ] `?action=key` → `configured: true`
- [ ] `?action=cron` sem header → 401; com header → 200
- [ ] Criar os dois cronjobs (10 min e diário) com o header `Authorization`
- [ ] Ligar **Push com o app fechado** e ver o estado “Ativo”
- [ ] Teste real: fechar o app e receber a notificação
- [ ] Teste do pareamento: autorizar uma vez e recusar o reuso
- [ ] (Opcional) Testar o expurgo forçando `deletion_effective_at`

---

## Se você não configurar nada

O app continua utilizável:

- os lembretes seguem funcionando **com o app aberto**, pelo agendador local (`features/notifications/scheduler.ts`);
- o toggle **Push com o app fechado** mostra o motivo honesto e não quebra;
- o pareamento por QR funciona pelo canal Realtime, com validade de 5 minutos — porém **sem** revogação de uso único;
- contas desativadas ficam apenas marcadas, sem exclusão.
