# Dossiê de Visagismo — sistema de consultoria

Sistema que substitui o dossiê montado à mão no Canva. O Wagner preenche a
ficha durante o atendimento, gera o PDF e salva no celular. **Nenhum cliente
fica guardado no sistema**: o próximo atendimento começa do zero.

---

## No ar

**https://owagneralvessvisagista.com/dossie/** — o site do Wagner, repositório
`guaaparecido980-alt/consutoria-visagismo`, pasta `dossie/`. Publicado por
GitHub Pages: um `git push` na `main` já atualiza. Fora dos buscadores pelo
`robots.txt` e pelo `noindex` da página.

Abrir sempre por esse endereço, no Safari (iPhone) ou no Chrome (Android).
Dentro do WhatsApp ou do Instagram o download do PDF costuma ser bloqueado.

---

## Como usar

1. Abrir o sistema. A ficha já está em branco.
2. Percorrer as oito etapas, tocando em **Próxima** no pé de cada uma.
   **Ver dossiê** mostra as páginas prontas; o que aparece ali é o que sai no PDF.
3. Na última etapa, **Gerar o PDF do dossiê**.
4. Na tela final: **Salvar o PDF no celular** ou **Enviar para o cliente**
   (abre o compartilhamento do celular: WhatsApp, e-mail…).
5. **Começar novo cliente** apaga a ficha e as fotos do aparelho.

O arquivo sai com o nome do cliente e a data
(`dossie-visagismo-alemax-nunes-2026-09-10.pdf`).

### A única coisa guardada

A ficha **em andamento** fica no próprio aparelho até tocar em *Novo cliente*.
Motivo: no celular, abrir a câmera para fotografar o cliente muitas vezes faz o
navegador recarregar a página, e sem isso a ficha sumiria no meio do
atendimento. Nada vai para servidor nenhum.

### As oito etapas

| Etapa | O que define |
|---|---|
| **Cliente** | Nome, profissão e data — vão para a capa |
| **Perfil** | Rei, Guerreiro, Mago ou Amante |
| **Rosto** | Formato entre os 7 modelos 3D: oval, redondo, quadrado, retangular, triangular, diamante e coração |
| **Cabelo** | Tipo 1A a 4C, densidade e couro cabeludo |
| **Medidas** | Topo, frente, laterais, nuca, barba, direção do fio e desenho da barba |
| **Proposta** | Texto técnico do atendimento (vem pré-escrito pelo perfil) |
| **Fotos** | Cliente, 3 referências e os 4 antes/depois |
| **Manutenção** | Rotina em casa, produtos e intervalo de retorno |

---

## O PDF

- **Em pé, no formato da tela do celular** (9:16). Cada página ocupa a tela
  inteira e o texto é lido sem zoom. O formato deitado de apresentação deixava
  a letra minúscula no telefone.
- **16 páginas**: capa, sumário, perfil, direção de imagem (2), análise facial (2),
  estrutura do fio, projeto técnico (2), proposta, referências, antes e depois
  (2), manutenção e contracapa.
- **Fotos recortadas, não esticadas.** Cada foto é recortada no tamanho exato do
  seu quadro antes de ir para o PDF — o gerador de PDF ignorava o enquadramento
  e achatava os rostos.
- **Texto longo não é cortado**: se a proposta ou uma observação não couber, a
  letra daquela página diminui um pouco até caber.
- Tamanho típico: 3 a 5 MB — passa pelo WhatsApp sem problema.

---

## A análise facial em 3D

A página do formato do rosto mostra o **modelo 3D** daquele formato, renderizado
no Blender, com as linhas por cima: o traçado geométrico em dourado e as
larguras de testa, maçãs e mandíbula, mais o comprimento. As linhas não são
desenhadas no olho — saem de medidas tiradas da própria malha 3D. Para refazer
depois de mexer nos modelos: `automacao/rostos-3d/gerar.ps1` (ver o LEIA-ME de lá).

## Os desenhos técnicos

Gerados na hora, em vetor, a partir da ficha (`assets/diagramas.js`). Não
existe um rosto padrão: a cabeça é construída a cada vez.

- **Formato do rosto** muda o contorno — testa, maçã do rosto, mandíbula e
  queixo. Um rosto quadrado tem quina na mandíbula; um oval, só curva.
- **Direção do fio** muda o penteado: para trás, lateral com risca, franja
  para a frente ou topete para cima — de frente e de perfil.
- **Medidas** mudam o volume: topo mais alto, laterais mais cheias ou batidas,
  franja mais longa, nuca.
- **Desenho da barba** é recortado no contorno daquele rosto, com linha da
  bochecha e do pescoço marcadas.

As medidas em centímetros aparecem **escritas dentro do desenho** — o cliente
leva a página a qualquer barbeiro para reproduzir o corte.

---

## O perfil comanda o dossiê inteiro

**Cada perfil tem o seu próprio texto** — nada é reaproveitado entre eles.
Trocar o perfil reescreve, de uma vez: a descrição e as palavras-chave, a
direção de imagem (com o desenho da linha predominante), o rascunho da proposta
e o intervalo de retorno.

| Perfil | Temperamento | Linha predominante | Retorno |
|---|---|---|---|
| **Rei** | Sanguíneo | Linhas inclinadas (diagonais) | 21 dias |
| **Guerreiro** | Colérico | Linhas verticais e horizontais | 15 dias |
| **Mago** | Melancólico | Verticais finas e curvas longas | 18 dias |
| **Amante** | Fleumático | Curvas suaves com contorno definido | 21 dias |

Se você escrever a sua própria proposta, ela é preservada ao trocar de perfil.

---

## Publicar

Site estático — sem build. Subir a pasta `dossie/` inteira e abrir `/dossie`.
Precisa de **HTTP** (não abrir o `index.html` direto do disco) e de **internet
na primeira carga**, para as bibliotecas de PDF e as fontes.

Para ver localmente, dentro da pasta `dossie/`:

```
python -m http.server 8931
```

e abrir `http://localhost:8931`.

---

## Estrutura dos arquivos

```
dossie/
├── index.html              a aplicação
└── assets/
    ├── conteudo.js         TODO o texto: perfis, rostos, cabelos, rotinas
    ├── diagramas.js        os desenhos técnicos em SVG
    ├── slides.js           monta as páginas do dossiê
    ├── rascunho.js         guarda só a ficha em andamento
    ├── app.js              ficha, prévia e geração do PDF
    ├── dossie.css          estilo do documento entregue ao cliente
    ├── app.css             estilo da ferramenta que o Wagner opera
    ├── rostos/             os 7 rostos 3D e as medidas das linhas
    ├── wagner-capa.jpg     retrato da capa
    └── wagner-final.jpg    retrato da contracapa
```

Para mudar um texto de consultoria, editar **`assets/conteudo.js`** — nenhum
outro arquivo precisa ser tocado.

---

## Base técnica

Visagismo clássico de **Philip Hallawell**: leitura das linhas faciais pela
Gestalt (retas comunicam força e estabilidade; diagonais, dinamismo; curvas,
acolhimento), os quatro temperamentos humanos e a análise do formato do crânio.
É a mesma base da skill `skills/visagismo-concept/`.

---

## Ponto de atenção

O texto do perfil **Rei** aqui é o que já era entregue em consultoria
(comunicativo, entusiasmado, voltado a relações — temperamento sanguíneo). Já o
teste em `teste-de-perfil-comportamental-em-arquetipos/` descreve o Rei como
estrutura, direção e responsabilidade — um perfil bem diferente. Vale decidir
qual das duas definições vale para a marca e alinhar o outro material.
