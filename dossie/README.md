# Dossiê de Visagismo

Ferramenta interna da consultoria de **Wagner Alves**. Preenche-se a ficha do
cliente e o sistema monta as 13 páginas do dossiê, exportando o PDF que é
entregue depois do atendimento.

**Endereço:** https://owagneralvessvisagista.com/dossie/

---

## Onde ficam os dados

Este repositório contém **apenas o código**. Nenhuma ficha e nenhuma foto de
cliente é publicada aqui.

Tudo o que é preenchido fica no **navegador de quem está usando** (IndexedDB),
na própria máquina. Não há servidor, banco de dados nem login: os dados dos
clientes não passam por lugar nenhum.

Como consequência, cada aparelho tem as suas próprias fichas. A ponte entre eles
são os botões **Backup** e **Restaurar**, no topo da tela — o backup baixa um
`.json` com todas as fichas e as fotos embutidas, que pode ser restaurado em
qualquer outro computador.

---

## As oito etapas da ficha

| Etapa | O que define |
|---|---|
| **Cliente** | Nome, profissão e data — vão para a capa |
| **Perfil** | Rei, Guerreiro, Mago ou Amante |
| **Rosto** | Formato entre 10 opções; o traçado geométrico é desenhado sozinho |
| **Cabelo** | Tipo 1A a 4C, densidade e couro cabeludo |
| **Medidas** | Topo, frente, laterais, nuca, barba, direção do fio e desenho da barba |
| **Proposta** | Texto técnico do atendimento (vem pré-escrito pelo perfil) |
| **Fotos** | Cliente, 3 referências e os 4 antes/depois |
| **Manutenção** | Rotina em casa, produtos e intervalo de retorno |

---

## O perfil comanda o dossiê inteiro

Cada perfil comportamental tem o **seu próprio texto** — nada é reaproveitado
entre eles. Trocar o perfil reescreve a descrição e as palavras-chave, a página
de Direção de Imagem, o rascunho da Proposta e o intervalo de retorno.

| Perfil | Temperamento | Linha predominante | Retorno |
|---|---|---|---|
| **Rei** | Sanguíneo | Linhas inclinadas (diagonais) | 21 dias |
| **Guerreiro** | Colérico | Linhas verticais e horizontais | 15 dias |
| **Mago** | Melancólico | Verticais finas e curvas longas | 18 dias |
| **Amante** | Fleumático | Curvas suaves com contorno definido | 21 dias |

Uma proposta escrita à mão é preservada ao trocar de perfil; só o texto que
ainda era o modelo é substituído.

---

## Diagramas técnicos

Os desenhos de rosto, medidas e barba são **vetoriais, gerados na hora** a partir
dos dados da ficha. As medidas em centímetros aparecem escritas dentro do
diagrama — é a página que o cliente leva para qualquer barbeiro reproduzir o
corte — e nenhum deles sai borrado no PDF, em nenhum tamanho.

---

## Estrutura

```
dossie/
├── index.html              a aplicação
└── assets/
    ├── conteudo.js         TODO o texto: perfis, rostos, cabelos, rotinas
    ├── diagramas.js        os desenhos técnicos em SVG
    ├── slides.js           monta as 13 páginas do dossiê
    ├── db.js               armazenamento
    ├── app.js              painel, editor e exportação do PDF
    ├── dossie.css          estilo do documento entregue ao cliente
    ├── app.css             estilo da ferramenta de trabalho
    ├── wagner-capa.jpg     retrato da capa
    └── wagner-final.jpg    retrato da contracapa
```

Para mudar qualquer texto de consultoria, edite **`assets/conteudo.js`** — todo
o conteúdo está ali, comentado e separado por assunto. Nenhum outro arquivo
precisa ser tocado.

Site estático: sem build, sem dependências instaladas. Requer conexão apenas na
primeira carga, para as bibliotecas de PDF (jsPDF e html2canvas) e as fontes.

---

## Base técnica

Visagismo clássico de **Philip Hallawell**: leitura das linhas faciais pela
Gestalt (retas comunicam força e estabilidade; diagonais, dinamismo; curvas,
acolhimento), os quatro temperamentos humanos e a análise do formato do crânio.
