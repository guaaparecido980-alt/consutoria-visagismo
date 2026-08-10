# Teste de Perfil Comportamental em Arquétipos — Wagner Alves

Teste de autoconhecimento com 30 perguntas que identifica qual dos quatro perfis
comportamentais — **Rei, Guerreiro, Mago e Amante** — mais se aproxima do modo de
funcionar de cada pessoa.

**No ar em:** `https://owagneralvessvisagista.com/teste-de-perfil-comportamental-em-arquetipos/`

---

## Como isso funciona (resumo em 30 segundos)

É um site **estático**: HTML, CSS e JavaScript puros, sem servidor, sem banco de
dados e sem mensalidade. Roda no GitHub Pages, no mesmo repositório do site.

O visitante responde às 30 perguntas → o navegador calcula o resultado → a pessoa
informa nome e e-mail → o resultado completo aparece na tela e uma mensagem com o
lead é aberta no **seu WhatsApp**, já preenchida. Mesmo fluxo do formulário de
pré-entrevista que já existe no site.

---

## Estrutura de arquivos

```
teste-de-perfil-comportamental-em-arquetipos/
├── index.html            Landing + teste + análise + captura + resultado
├── sobre.html            Explicação do método e dos limites do teste
├── privacidade.html      Política de Privacidade (LGPD)
├── termos.html           Termos de uso
├── assets/
│   ├── content.js        TODO o texto: 30 perguntas, 4 perfis, 12 combinações
│   ├── engine.js         Pontuação, percentuais, empate, combinação, link
│   ├── app.js            Interface: telas, cliques, gráfico, WhatsApp
│   └── styles.css        Identidade visual
├── tests/
│   └── engine.test.js    85 testes automatizados do motor
└── README.md
```

A separação é proposital: **para mudar um texto você mexe só no `content.js`**.
A lógica de pontuação (`engine.js`) e a interface (`app.js`) não precisam ser
tocadas.

---

## Executar localmente

Não precisa instalar nada, nem rodar servidor:

```
abra o arquivo index.html no navegador (duplo clique)
```

Todos os scripts são carregados por caminho relativo e funcionam via `file://`.

### Rodar os testes

Precisa apenas do Node.js instalado:

```
cd teste-de-perfil-comportamental-em-arquetipos
node tests/engine.test.js
```

Saída esperada: `85 passaram, 0 falharam`.

Os testes cobrem: integridade do conteúdo, ausência de padrão nas posições das
alternativas, viés de comprimento, perfil dominante, perfil secundário, as 12
combinações, empates, 100% em um único perfil, **varredura exaustiva das 5.456
distribuições possíveis de 30 respostas** (todas somam exatamente 100%),
ida e volta do link compartilhável e robustez contra entrada inválida.

---

## Algoritmo de pontuação

1. Cada uma das 30 perguntas tem 4 alternativas; cada alternativa vale **1 ponto**
   para um dos quatro arquétipos.
2. Ao final: `total = rei + guerreiro + mago + amante` (sempre 30 num teste completo).
3. Os percentuais usam o **método do maior resto** (largest remainder):
   trunca todos para baixo e distribui os pontos faltantes para quem tem maior
   resto. Isso garante que a soma exibida seja **sempre exatamente 100%** —
   arredondar cada valor isoladamente produziria 99% ou 101%.
4. Maior pontuação = **perfil predominante**. Segunda maior = **perfil secundário**.
5. A combinação usa a ordem: `mago+guerreiro` tem texto diferente de
   `guerreiro+mago`, porque o predominante muda a leitura.

### Sobre o critério de empate

A especificação original pedia empate quando a diferença fosse menor que 3 pontos
percentuais. **Isso não funcionaria**: com 30 perguntas, uma única resposta já vale
3,33 pontos percentuais, então aquele limiar só dispararia em empate exato.

O critério implementado é o equivalente real e independente do número de perguntas:
**empate técnico quando a diferença entre o primeiro e o segundo é de no máximo
uma resposta.** Nesse caso o resultado não força um vencedor — apresenta os dois
como equilibrados. Há um teste automatizado que documenta essa decisão.

### A matriz de arquétipos

A posição da alternativa **nunca** denuncia o arquétipo. A distribuição real,
verificada por teste automatizado:

| Arquétipo | 1ª opção | 2ª | 3ª | 4ª |
|-----------|---------|----|----|----|
| Rei       | 8 | 8 | 6 | 8 |
| Guerreiro | 8 | 8 | 7 | 7 |
| Mago      | 7 | 7 | 8 | 8 |
| Amante    | 7 | 7 | 9 | 7 |

Na simulação, uma pessoa que clicasse **sempre na primeira alternativa** das 30
perguntas terminaria com Rei 27% / Guerreiro 27% / Mago 23% / Amante 23% — ou seja,
não é possível forçar um resultado escolhendo sempre a mesma posição.

---

## Link de resultado compartilhável

Sem banco de dados, o resultado viaja no próprio link:

```
.../teste-de-perfil-comportamental-em-arquetipos/#r=1.0-7-10-9-4
                                                    │  │  │ │ └ amante
                                                    │  │  │ └── mago
                                                    │  │  └──── guerreiro
                                                    │  └─────── rei
                                                    └────────── versão do teste
```

Abrir esse link reconstrói exatamente o mesmo resultado, em qualquer navegador.
Quem abre um link compartilhado vê um aviso de que o resultado é de outra pessoa,
e o nome de quem fez o teste **não** viaja no link.

---

## Versão do teste

`TEST_VERSION` está definida no topo do `content.js` (hoje `"1.0"`) e é gravada
junto de cada resultado.

**Se você mudar as perguntas, suba a versão.** Um rascunho salvo de uma versão
anterior é descartado automaticamente (as perguntas mudaram, as respostas antigas
não valem mais), e um resultado antigo continua identificando com que régua foi
medido.

---

## Como alterar o conteúdo

Tudo em `assets/content.js`:

| O que mudar | Onde |
|---|---|
| Texto de uma pergunta ou alternativa | `PERGUNTAS` |
| A qual arquétipo uma alternativa pertence | campo `arquetipo` da opção |
| Descrições, forças, pontos de atenção, dicas | `PERFIS` |
| Texto de uma das 12 combinações | `COMBINACOES` |
| Emblemas (SVG) | `EMBLEMAS` |

Depois de qualquer alteração, rode `node tests/engine.test.js`. Os testes conferem
que continua havendo 30 perguntas, 4 alternativas por pergunta, um arquétipo de
cada por pergunta, nenhum texto repetido e nenhuma posição viciada.

---

## Configuração

No topo de `assets/app.js`:

```js
var CONFIG = {
  whatsappNumero: '5541999682982',
  urlPublica: 'https://owagneralvessvisagista.com/teste-de-perfil-comportamental-em-arquetipos/'
};
```

- `whatsappNumero`: para onde os leads são enviados (55 + DDD + número, só dígitos).
- `urlPublica`: usada nos links de compartilhamento. Se a URL do teste mudar,
  altere aqui também.

Não há chave secreta, senha ou variável de ambiente neste projeto — não existe
back-end onde um segredo pudesse ser guardado com segurança.

---

## Analytics

O código já dispara os eventos no `dataLayer`, prontos para o Google Tag Manager
ou GA4. Se o GTM não estiver instalado, nada quebra — os eventos são descartados
em silêncio.

Eventos disponíveis: `test_started`, `question_answered`, `test_completed`,
`lead_submitted`, `result_viewed`, `report_clicked`.

Para ativar, basta colar o snippet do GTM no `<head>` do `index.html`.

---

## LGPD

- Nome e e-mail só são pedidos **depois** do teste — nunca antes.
- A caixa de consentimento **nunca** vem marcada previamente.
- Link para a Política de Privacidade ao lado do consentimento.
- As respostas ficam apenas no `localStorage` do próprio aparelho da pessoa e são
  apagadas ao concluir o teste.
- Não existe banco de dados: os dados vão do aparelho da pessoa direto para o
  seu WhatsApp.
- Não se coleta CPF, telefone, endereço nem qualquer dado sensível.

---

## Deploy

O teste vive no repositório do site (`consutoria-visagismo`), publicado via
GitHub Pages. Para atualizar:

```
git add teste-de-perfil-comportamental-em-arquetipos
git commit -m "Atualiza teste de perfil comportamental"
git push
```

O GitHub Pages republica em 1–2 minutos. **Teste sempre em aba anônima** — o
navegador guarda a versão antiga em cache com facilidade.

---

## Limitações conhecidas

- **Sem painel administrativo e sem banco de dados.** Foi uma decisão consciente:
  o teste é distribuído por link direto e o volume não justifica o custo e a
  manutenção de um back-end. Os leads chegam pelo WhatsApp. Se um dia o volume
  crescer, `engine.js` e `content.js` já estão isolados o suficiente para serem
  reaproveitados por um back-end sem reescrita.
- **Não há geração de PDF nativa.** O botão "Ver meu relatório completo" usa a
  impressão do navegador, que permite salvar em PDF. Há uma folha de estilo de
  impressão que esconde botões e ajusta as cores para papel.
- **Não é instrumento psicométrico.** Não passou por validação estatística e não
  deve ser usado para decisões sobre terceiros. Isso está declarado na landing,
  no resultado, no `sobre.html` e nos termos.
- **O e-mail do lead não é verificado.** O formato é validado, mas ninguém confirma
  se a caixa existe de fato.
