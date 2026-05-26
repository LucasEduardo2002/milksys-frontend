Relatório E2E — fumaça (smoke test)

Data: 26/05/2026
Ambiente: frontend servido via `vite preview` em http://192.168.0.200:4173, backend em http://localhost:3001.

Resultado geral: Parcialmente OK

Passaram:
- Backend iniciado com sucesso; base de dados contém dados de seed.
- Frontend (build preview) serviu as rotas `/produtores`, `/pagina-inicial` e `/dashboard` corretamente.
- Fluxos básicos de navegação, listagem, paginação e formulários carregaram sem 500s visíveis.

Falharam/observações:
- MQTT broker (ws://192.168.0.200:8082) inacessível (porta 8082 fechada), portanto cobertura de fila MQTT e processamento em tempo real NÃO foi executada.

Artefatos gerados:
- `playwright-summary.txt` — snapshot textual e timings coletados.

Próximos passos recomendados:
1. Habilitar/configurar broker MQTT e abrir porta 8082 no servidor; reexecutar E2E para validar fila.
2. Opcional: adicionar testes Playwright automatizados para criar/editar/excluir produtores e coletas e gerar relatórios automatizados.
3. Considerar implementar server-side pagination no backend se volume de histórico continuar grande.

Se quiser, eu:
- 1) adiciono testes Playwright automatizados e commito em `tests/e2e/` (precisa de broker ativo para cobertura total), ou
- 2) apenas envio os artefatos e instruções para você implantar no servidor de produção.