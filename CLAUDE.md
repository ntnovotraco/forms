# Formulários Novotraco

Formulários de inscrição publicados no GitHub Pages. Cada formulário é uma página HTML estática que envia as respostas para uma planilha do Google via Apps Script.

- Repositório: `ntnovotraco/forms` (público), branch `main`
- No ar em: **https://forms.novotraco.com/** (o endereço antigo `ntnovotraco.github.io/forms/` redireciona para ele)
- Toda a comunicação com a usuária é em português do Brasil, em linguagem simples (ela não é desenvolvedora).

## Estrutura

```
index.html                     → página inicial: lista dos formulários abertos
<slug-do-formulario>/
  index.html                   → o formulário (HTML, CSS e JS num arquivo só)
  apps-script.gs               → cópia do código colado no Apps Script da planilha
  logos, favicon-32.png, apple-touch-icon.png, og-image.jpg
```

- Um formulário por pasta. Slug curto, em minúsculas, com hífens (ex.: `festival-natal-foodtrucks`).
- Ao criar um formulário novo, adicione um item na lista do `index.html` da raiz. Ao encerrar um, tire da lista (a pasta pode continuar).
- Arquivos de uso interno (como este) estão no `exclude` do `_config.yml` para não serem publicados.

## Criar um formulário novo

Parta de uma cópia de `festival-natal-foodtrucks/` e mantenha o mesmo padrão:

1. Copie a pasta com o novo slug e troque textos, perguntas, logos e metatags (title, description, og:*, twitter:*). As URLs absolutas de og:url e og:image apontam para a pasta do formulário.
2. Mude `DRAFT_KEY` para um valor único (o rascunho fica salvo no navegador e não pode colidir com outro formulário).
3. Ajuste o objeto `checks` (validação) e o `collect()` às perguntas novas.
4. Adapte o `apps-script.gs` às colunas novas e peça para a usuária criar a planilha e implantar (passo a passo abaixo). Cole a URL `/exec` em `ENDPOINT`.
5. Teste no navegador em desktop e em celular (375 px), faça um envio de teste, commit e push.

## Padrão visual e de UX (já aprovado pela usuária)

- Estilo limpo inspirado no Typeform, **tema claro único**. Fonte Figtree.
- Cor principal **#003E91**. Tokens em `:root` (`--accent`, `--accent-soft`, `--track`, `--field-line` etc.).
- Faixa no topo (`.topbar`), fundo azul-claro, com as logos **centralizadas lado a lado** e um separador vertical.
- Barra de progresso fixa no topo, com trilho azul-claro visível mesmo vazia.
- Fluxo: **abertura** (título, dados do evento, "Começar") → **regras** (com "← Voltar ao início") → **todas as perguntas numa página só** (com "← Rever as regras") → **confirmação** com protocolo.
- Perguntas numeradas automaticamente ("1 →"), agrupadas por títulos de seção em azul. **Sem linhas divisórias entre perguntas**: as únicas linhas da página são as dos campos.
- Perguntas Sim/Não como botões A/B. Termo de compromisso com caixas e "Marcar todos".
- Listas (ex.: cardápio, equipamentos): tabela no desktop; no celular viram **cartões numerados** ("Item 1") com rótulo em cada campo e botão "Remover".
- Números com faixa fixa usam seletor com setas ▲▼ próprias (as nativas não aparecem no iPhone).
- Celular: tipografia levemente menor (`html { font-size: 93.75% }`), mas **campos sempre com no mínimo 16px** para o iPhone não dar zoom.
- Rascunho salvo no navegador (localStorage) até enviar. Enter avança para o próximo campo.

## Planilha e Apps Script

Cada formulário tem **sua própria planilha** e seu próprio Apps Script. O script grava em abas criadas automaticamente pelo nome (ex.: Inscrições, Cardápio, Equipamentos) e devolve `{ok, protocolo}`.

O formulário envia com `Content-Type: text/plain` (evita a checagem de CORS que o Apps Script não responde).

Passo a passo para a usuária (os erros entre parênteses já aconteceram):

1. Criar a planilha em https://sheets.new com a conta Google.
2. **Extensões → Apps Script**, apagar tudo do `Código.gs` e colar o **conteúdo** do `apps-script.gs` (não o nome do arquivo). A linha 1 deve ser `/**`. Salvar.
3. **Implantar → Nova implantação → ⚙️ App da Web**:
   - **Executar como: Eu**
   - **Quem pode acessar: Qualquer pessoa** (não "em novotraco.com" nem "com uma Conta do Google": ambos exigem login e bloqueiam os inscritos)
4. Autorizar (Avançado → Acessar) e copiar a URL que termina em `/exec`.
5. Ao mudar o código depois: **Gerenciar implantações → ✏️ → Versão: Nova versão**. Salvar sozinho não atualiza a URL.

Para conferir: abrir a URL `/exec` no navegador deve mostrar `{"ok":true,...}`. Se aparecer tela de login do Google, o acesso está errado.

Formulários existentes:

| Formulário | Pasta | Planilha |
|---|---|---|
| Inscrição de Food Trucks · Festival de Natal Equatorial 2026 | `festival-natal-foodtrucks/` | implantação `AKfycbzsDw9D...KBFwSkE8` (URL completa no `ENDPOINT` do index.html) |
| Oficina de Produção de Eventos (20 vagas, 16/11 a 04/12) | `oficina-producao-eventos/` | implantação `AKfycbwED_SY...my1N3qhvw43` (URL completa no `ENDPOINT` do index.html). Testar com `?teste` (aba Testes); `?teste=espera` simula vagas esgotadas. Depois da 20ª inscrição as novas vão para a aba Fila de espera |

## Publicar

- `git push` na `main` publica sozinho no GitHub Pages em 1 a 2 minutos.
- Autenticação: token fine-grained da usuária salvo no Keychain do macOS (`credential.helper osxkeychain`), com Resource owner **ntnovotraco**, repositório `forms`, Contents **Read and write**. Nunca peça o token no chat; se precisar renovar, a usuária digita no terminal.
- Commits com `user.email = isadora-lang@users.noreply.github.com` (o e-mail da empresa não deve aparecer no repositório público).

## Domínio

- O DNS de `novotraco.com` fica na **Network Solutions** (servidores `dns101/dns102.register.com`).
- `forms.novotraco.com`: **CNAME** `forms` → `ntnovotraco.github.io`, Custom domain configurado (arquivo `CNAME` na raiz do repositório — não apagar), certificado HTTPS ativo. Domínio `novotraco.com` **verificado** na organização (registro TXT `_github-pages-challenge-ntnovotraco`), o que impede outras contas de usar qualquer subdomínio.
- As metatags og:url, og:image e twitter:image de cada formulário usam `https://forms.novotraco.com/<slug>/`.
- Histórico do que deu errado: um registro **A curinga `*` → 208.91.197.39** ("under construction page") brigava com o CNAME e fazia o DNS alternar; foi apagado. Se um subdomínio novo não estabilizar, procure curingas e redirecionamentos ("Web Forwarding", "Parked page") no painel da Network Solutions.
- Já existem registros A do `@` para o GitHub (185.199.108/109/110.153; falta o 185.199.111.153) e CNAME `www` → `ntnovotraco.github.io`, prontos para o site principal. O CNAME `nt` → `cname.short.io` é de um encurtador de links, não mexer.
- **Nunca mexer nos registros MX** do novotraco.com (são do e-mail da empresa).
- O site principal `novotraco.com` vai ser outro repositório na mesma organização (ex.: `ntnovotraco/site`), também no GitHub Pages.
