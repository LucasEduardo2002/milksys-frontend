Relatório E2E — Sertão Seridó

Conteúdo:
- playwright-summary.txt: resumo das páginas visitadas, snapshots em texto e timings coletados pelo Playwright.
- report.md: resumo do resultado dos testes (pass/fail), observações e próximos passos.

Como usar:
1. Abra os arquivos neste diretório para revisar os resultados.
2. Para reproduzir os testes automatizados, recomendo adicionar um script Playwright em `tests/e2e/` e executar via `npx playwright test` (não incluído aqui).

Observação: o broker MQTT estava inacessível (porta 8082) no momento do teste; reproduzir cobertura MQTT requer broker ativo ou simulação.