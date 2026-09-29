# TollBox — Ferramentas Industriais

Aplicativo web local com seis módulos técnicos derivados das planilhas de referência.

**Abrir o app:** [TollBox no GitHub Pages](https://forestigam.github.io/toolbox_automate/)

## Ferramentas

- Levantamento técnico pré-projeto
- Vazão para ventilação de quadros
- Corrente de curto-circuito presumida
- Dimensionamento de eletrodutos
- Dimensionamento de eletrocalhas e CUD
- Dimensionamento de canaletas

## Uso local

Abra `index.html` em um navegador moderno. Mantenha `app.js`, `data.json.js` e `styles.css` na mesma pasta. O processamento é local e não requer dependências externas.

Os relatórios são documentos HTML preparados para impressão; use **Imprimir / Salvar como PDF** na janela aberta pelo app.

## Publicação

O workflow em `.github/workflows/pages.yml` publica a raiz do repositório no GitHub Pages após cada push à branch `main`.

## Notas técnicas

As fórmulas e tabelas da fonte foram mantidas. O app apresenta avisos onde a lógica original tem limitações ou diferenças a confirmar, incluindo os critérios de ocupação de cabos. Confira os catálogos dos fabricantes e valide os resultados para o projeto antes de especificar materiais.
