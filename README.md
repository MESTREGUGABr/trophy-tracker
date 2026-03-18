# Trophy Tracker

Plugin para [Obsidian](https://obsidian.md) que permite rastrear troféus de jogos PlayStation diretamente no seu vault. Importe sua biblioteca inteira da PlayStation Network automaticamente ou adicione jogos manualmente, com painel lateral dedicado, barras de progresso e controle total dos seus troféus.

---

## Funcionalidades

- **Importação automática da PSN** — Conecte sua conta PlayStation Network e importe todos os seus jogos com troféus, progresso e datas de conquista
- **Painel lateral dedicado** — Visualize todos os seus jogos e troféus em um painel organizado na sidebar do Obsidian
- **Barras de progresso** — Acompanhe visualmente o progresso de conclusão de cada jogo
- **Gerenciamento manual** — Adicione jogos e troféus manualmente, edite, marque como concluído ou remova
- **Importação por texto** — Cole uma lista de troféus formatada e o plugin cria a nota automaticamente
- **Detecção de duplicatas** — Ao importar da PSN, jogos que já existem no vault são automaticamente ignorados
- **Status automático** — O status do jogo (backlog, in-progress, completed) é atualizado automaticamente conforme você conquista troféus
- **Suporte multiplataforma** — PS3, PS4, PS5 e PS Vita

---

## Instalação

### Manual

1. Baixe os arquivos `main.js`, `manifest.json` e `styles.css` da [release mais recente](../../releases)
2. Crie a pasta `trophy-tracker` dentro de `.obsidian/plugins/` no seu vault
3. Copie os 3 arquivos para essa pasta
4. No Obsidian, vá em **Settings → Community plugins** e ative o **Achievement Tracker**

### Build local (desenvolvimento)

```bash
git clone https://github.com/gw-sauter/trophy-tracker.git
cd trophy-tracker
npm install
npm run build
```

Os arquivos compilados (`main.js`) serão gerados na raiz do projeto. Copie `main.js`, `manifest.json` e `styles.css` para a pasta de plugins do seu vault.

---

## Configuração

### 1. Pasta de jogos

Vá em **Settings → Achievement Tracker** e configure a pasta onde as notas dos jogos serão armazenadas. O padrão é `Games`. A pasta será criada automaticamente se não existir.

### 2. Plataforma padrão

Escolha a plataforma padrão ao adicionar jogos manualmente: PS5, PS4, PS3 ou PS Vita.

### 3. Conectar sua conta PSN

Para importar troféus automaticamente da PlayStation Network, você precisa de um **NPSSO token**. Siga os passos:

1. **Faça login** na sua conta PlayStation em [store.playstation.com](https://store.playstation.com) pelo navegador
2. **Após estar logado**, acesse a seguinte URL na mesma sessão do navegador:
   ```
   https://ca.account.sony.com/api/v1/ssocookie
   ```
3. Você verá uma resposta JSON como:
   ```json
   { "npsso": "abc123xyz..." }
   ```
4. **Copie o valor** do campo `npsso` (apenas o valor, sem as aspas)
5. No Obsidian, vá em **Settings → Achievement Tracker → NPSSO Token** e cole o token
6. Clique em **Test Connection** para verificar se está funcionando

> **Nota:** O token NPSSO expira periodicamente. Se a conexão parar de funcionar, repita os passos acima para obter um novo token.

---

## Como usar

### Abrindo o painel

- Clique no ícone de **troféu** na ribbon (barra lateral esquerda) do Obsidian
- Ou use o comando `Open Achievement Tracker` pela paleta de comandos (`Ctrl/Cmd + P`)

### Importar jogos da PSN

1. Certifique-se de que o NPSSO token está configurado nas settings
2. No painel do tracker, clique no botão **PSN Import**
3. Aguarde o carregamento da sua biblioteca — todos os seus jogos serão listados com progresso, plataforma e contagem de troféus
4. Selecione os jogos que deseja importar (ou clique em **Select All**)
5. Clique em **Import Selected**
6. O plugin irá buscar os detalhes de cada troféu e criar uma nota markdown para cada jogo na pasta configurada

> Também é possível importar pela paleta de comandos: `Import trophies from PlayStation Network`

### Adicionar jogo manualmente

1. No painel, clique em **Add Game**
2. Preencha o nome do jogo, plataforma e status
3. O jogo será criado na pasta configurada

### Adicionar troféus manualmente

1. Clique em um jogo no painel para expandir a lista de troféus
2. Clique em **Add Trophy**
3. Preencha nome, tipo (bronze/silver/gold/platinum) e status

### Importar troféus por texto

1. Use o comando `Import trophies from text` pela paleta de comandos
2. Ou clique no botão **Import** no painel
3. Cole a lista de troféus no formato esperado

### Gerenciando troféus

Na visualização expandida de um jogo:

- **Marcar como concluído** — Clique no checkbox ao lado do troféu. A data de conquista será registrada automaticamente
- **Editar** — Clique para editar nome, tipo ou status do troféu
- **Remover** — Delete troféus individuais
- **Voltar** — Clique em Back para retornar à lista de jogos

### Status dos jogos

Os jogos possuem 3 status possíveis:

| Status | Descrição |
|---|---|
| `backlog` | Nenhum troféu conquistado (0%) |
| `in-progress` | Alguns troféus conquistados (1-99%) |
| `completed` | Todos os troféus conquistados (100%) |

O status é atualizado automaticamente ao marcar/desmarcar troféus, mas também pode ser alterado manualmente.

---

## Estrutura dos dados

Cada jogo é armazenado como uma nota markdown com frontmatter YAML. Exemplo:

```yaml
---
game: God of War Ragnarök
platform: PS5
status: in-progress
trophies:
  - name: "The Journey Begins"
    type: bronze
    completed: true
    completedDate: "2024-01-15"
  - name: "Platinum Trophy"
    type: platinum
    completed: false
    completedDate: null
---
```

### Tipos de troféu

| Tipo | Ícone | Cor |
|---|---|---|
| Platinum | Gem | `#7b9cc2` |
| Gold | Trophy | `#cd9a10` |
| Silver | Award | `#a8a8a8` |
| Bronze | Medal | `#cd7f32` |

---

## Comandos disponíveis

| Comando | Descrição |
|---|---|
| `Open Achievement Tracker` | Abre o painel lateral do tracker |
| `Import trophies from text` | Abre o modal de importação manual por texto |
| `Import trophies from PlayStation Network` | Abre o modal de importação da PSN |

---

## FAQ

### O token NPSSO expirou, o que faço?

Faça login novamente no [store.playstation.com](https://store.playstation.com) e acesse `https://ca.account.sony.com/api/v1/ssocookie` para obter um novo token. Cole-o nas settings do plugin.

### Posso importar os mesmos jogos novamente?

Sim, mas jogos que já existem na pasta configurada serão automaticamente ignorados. A detecção é feita pelo nome do arquivo.

### Onde ficam salvos os dados?

Todos os dados ficam no seu vault Obsidian como arquivos markdown na pasta configurada (padrão: `Games/`). Nada é enviado para servidores externos — a comunicação acontece apenas entre o plugin e a API da PlayStation Network.

### O plugin funciona no mobile?

O plugin utiliza módulos nativos do Node.js para autenticação com a PSN, portanto a importação da PSN funciona apenas no **desktop**. As demais funcionalidades (gerenciamento manual, visualização) funcionam normalmente no mobile.

---

## Tecnologias

- [Obsidian Plugin API](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [PlayStation Network Trophy API](https://m.np.playstation.com/api/trophy)
- TypeScript + esbuild
