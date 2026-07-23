# Materiais gratuitos (PDFs)

PDFs exibidos na Área do Paciente (`/areapacientes#materiais`).

## Publicados

- `seletividade-alimentar.pdf` — Da recusa à confiança: seletividade alimentar
- `tea-mulheres-adultas.pdf` — TEA em mulheres adultas
- `fisioterapia-respiratoria.pdf` — Fisioterapia respiratória para adultos
- `neuromodulacao-neuroplasticidade.pdf` — Neuroplasticidade em cuidado
- `fibromialgia-familia-cuidadores.pdf` — Cuidar sem invalidar: fibromialgia e família
- `fibromialgia-cuidado-funcional.pdf` — Corpo em alerta: fibromialgia e sistema nervoso

## Para adicionar um novo material

1. Coloque o PDF aqui, com um nome de arquivo em kebab-case (sem espaços/acentos).
2. Em `areapacientes/index.html`, copie um `<a class="material-card reveal">` existente
   dentro de `.materials-grid`, ajuste `href`, título (`<b>`) e descrição (`<span>`).
3. Se quiser anunciar o card antes do PDF estar pronto, adicione a classe `soon` ao `<a>`
   e troque o texto `Baixar PDF` por `Em breve` — isso deixa o card visível mas não
   clicável, evitando link quebrado.
