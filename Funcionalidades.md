# Documentação das Funcionalidades do Sistema - Sertão Seridó

Este documento descreve as funcionalidades implementadas no sistema de controle de qualidade de leite da empresa Sertão Seridó. O objetivo é servir como um guia de referência e base para a criação de materiais de treinamento.

## Visão Geral

O sistema é composto por uma aplicação frontend (interface do usuário) e um backend (servidor) que trabalham juntos para gerenciar o cadastro de produtores e o registro das coletas de leite, incluindo os resultados de análise de qualidade.

## Funcionalidades Implementadas

A seguir, estão detalhadas as principais funcionalidades do sistema, divididas por módulo.

### 1. Controle de Qualidade (Página Inicial)

Nesta tela, o usuário pode registrar e visualizar as análises de qualidade do leite coletado.

* **Cadastro de Novas Coletas:**
    * Um formulário permite o registro de novas coletas de leite.
    * Os campos obrigatórios são: **Nome do Produtor** (selecionado de uma lista de produtores já cadastrados), **Tanque**, **Data** e **Acidez**.
    * Clicando no botão **"+ Campos"**, é possível exibir e preencher campos opcionais de análise, como: Densidade, Gordura, ESD, EST, Proteína, Crioscopia, Alizarol, Amido, Sacar, Observações e Analista.

* **Visualização de Registros Salvos:**
    * Uma tabela exibe todas as coletas já registradas com suas respectivas informações de análise.
    * É possível utilizar a barra de pesquisa para filtrar os resultados da tabela.
    * Há uma funcionalidade para **Exportar PDF**, que gera um relatório formatado com os registros exibidos.

### 2. Cadastro de Produtores

Este módulo é onde possui o gerenciamento completo dos produtores de leite.

* **Cadastrar Novo Produtor:**
    * Um formulário permite o cadastro de um novo produtor com os campos: **Nome**, **CPF/CNPJ**, **Telefone** e **Localidade**.
    * Campos como **Tipo** (Pessoa Física/Jurídica) e **Status** (Ativo/Inativo) também podem ser preenchidos.

* **Gerenciamento de Produtores Cadastrados:**
    * A tela exibe uma tabela com todos os produtores cadastrados.
    * Um campo de **busca** permite encontrar produtores rapidamente.
    * Para cada produtor, existem as seguintes ações:
        * **Editar:** Permite alterar as informações de um produtor já cadastrado.
        * **Excluir:** Remove o registro de um produtor do sistema, e possui também uma caixa de confirmação para evitar excluir acidentalmente um cadastro do produtor.

### 3. Dashboard

O Dashboard oferece uma visão geral e analítica dos dados do sistema por meio de gráficos e cartões informativos.

* **Indicadores Principais:**
    * Cartões de resumo exibem dados importantes de forma rápida:
        * Total de Produtores
        * Total de Coletas
        * Média de Acidez
        * Média de Gordura

* **Gráfico de Desempenho:**
    * Um gráfico de barras e linhas é exibido, mostrando a **quantidade de coletas** e a **média de acidez** para cada produtor, permitindo uma análise visual da produção e da qualidade do leite por fornecedor.

### 4. Funcionalidades do Backend (API)

O backend expõe uma API para que o frontend possa manipular os dados de forma segura e eficiente.

* **Rotas de Produtores (`/produtores`):**
    * `GET /`: Lista todos os produtores.
    * `POST /`: Cria um novo produtor.
    * `PUT /:id`: Atualiza um produtor existente.
    * `DELETE /:id`: Remove um produtor.

* **Rotas de Coletas (`/coletas`):**
    * `GET /`: Lista todas as coletas.
    * `POST /`: Registra uma nova coleta.