# Projeto de Extensao 2026

## Nome do curso

Analise e Desenvolvimento de Sistemas

## Nome do projeto

**Sementes do Amanhã - Digitalizacao do Cadastro e Documentacao de Alunos**

## Integrantes

1. `[Nome do aluno 1]`
2. `[Nome do aluno 2]`
3. `[Nome do aluno 3]`
4. `[Nome do aluno 4]`

---

## Apresentacao

Este documento organiza o relatorio do Projeto de Extensao 2026 com base no desenvolvimento do sistema **Sementes do Amanhã**, criado para apoiar a rotina administrativa da ONG Sementes do Amanhã. O projeto nasce da necessidade real de transformar um processo manual, baseado em papeis, em um fluxo digital mais seguro, rapido e facil de consultar.

Atualmente, a instituicao realiza o cadastro de alunos e o controle de informacoes importantes de forma manual. Isso aumenta o tempo gasto no atendimento, dificulta a localizacao de dados, amplia o risco de erros de preenchimento e torna mais trabalhosa a emissao de documentos relacionados ao acolhimento e acompanhamento das criancas e adolescentes atendidos. A proposta do projeto foi desenvolver uma solucao tecnologica acessivel, alinhada a realidade da comunidade e capaz de apoiar o trabalho da assistente social e da equipe responsavel.

---

## 1. A Tematica

### 1.1 Justificativa Sobre a Tematica Escolhida

Escolheu-se a tematica de **transformacao digital aplicada ao impacto social** porque o projeto se conecta diretamente com uma necessidade concreta da ONG Sementes do Amanhã: melhorar o processo de cadastro, organizacao e consulta das informacoes dos alunos atendidos pela instituicao. A equipe identificou que o fluxo anterior era feito em papel, o que gerava retrabalho, dificuldade de acesso aos dados, risco de perda de documentos e pouca agilidade para atualizar informacoes importantes sobre as criancas, adolescentes e seus responsaveis.

O tema tambem foi escolhido por estar alinhado ao papel social da tecnologia na resolucao de problemas reais da comunidade. Em vez de propor uma solucao generica, o grupo concentrou esforcos em desenvolver uma ferramenta pratica e aplicavel ao cotidiano da organizacao parceira. O sistema permite centralizar informacoes cadastrais, apoiar a validacao de dados, facilitar a emissao de documentos e contribuir para uma rotina administrativa mais organizada, confiavel e eficiente.

Outro fator importante para a escolha da tematica foi a possibilidade de integrar conhecimentos tecnicos do curso com uma vivencia extensionista de impacto social. O projeto exige levantamento de requisitos, organizacao de dados, desenvolvimento de interface, construcao de backend, integracao com banco de dados e preocupacao com usabilidade. Dessa forma, a extensao deixa de ser apenas uma atividade complementar e passa a ser uma experiencia concreta de aplicacao dos conhecimentos academicos em beneficio da sociedade.

### 1.2 ODS Identificados

As ODS mais diretamente relacionadas ao projeto sao:

- **ODS 4 - Educacao de Qualidade:** ao fortalecer a organizacao institucional da ONG, o projeto contribui para a continuidade do atendimento socioeducativo oferecido as criancas e adolescentes.
- **ODS 10 - Reducao das Desigualdades:** a solucao foi pensada para atender um publico em situacao de vulnerabilidade social, promovendo melhor acesso a acompanhamento, acolhimento e organizacao dos servicos.
- **ODS 16 - Paz, Justica e Instituicoes Eficazes:** o sistema melhora o registro, a confiabilidade e a recuperacao de informacoes, fortalecendo a gestao institucional e a transparencia dos processos internos.

---

## 2. A Comunidade

### 2.1 Descricao Da Comunidade Escolhida

A comunidade escolhida e formada pelas criancas, adolescentes e familiares atendidos pela **ONG Sementes do Amanhã**, bem como pelos profissionais que realizam o acolhimento e o acompanhamento dessas pessoas. Trata-se de um publico que depende de atendimento organizado, registro atualizado e acesso rapido a informacoes essenciais para garantir continuidade, seguranca e qualidade nos servicos oferecidos.

A instituicao parceira esta localizada na **Rua Joao Pires de Camargo, n. 207, Jardim Mirna, Taboao da Serra/SP**, conforme documentacao ja presente no projeto. O sistema tambem beneficia de forma direta a equipe interna da organizacao, especialmente a assistente social e os responsaveis pelo cadastro e manutencao das informacoes.

De acordo com os requisitos levantados no projeto, a ONG possui atualmente **cerca de 120 alunos cadastrados**, com uso diario do sistema por aproximadamente **2 pessoas** da equipe. Assim, o impacto do projeto nao se limita aos operadores da plataforma, mas se estende a todas as familias e estudantes cujos dados passam a ser organizados de forma mais eficiente e segura.

Entre as caracteristicas mais relevantes da comunidade atendida, destacam-se:

- necessidade de acolhimento e acompanhamento social;
- importancia de manter dados atualizados de criancas e responsaveis;
- demanda por organizacao documental;
- necessidade de reduzir retrabalho na rotina administrativa;
- importancia de preservar historicos e facilitar consultas futuras.

### 2.2 Registros E Evidencias Da Comunidade

Para esta secao, recomenda-se anexar:

- fotos da instituicao ou do espaco de atendimento;
- imagens do processo atual ou dos materiais utilizados;
- registros da equipe em atividade;
- evidencias da parceria com a comunidade.

Arquivos ja existentes no repositorio que podem apoiar a montagem desta parte:

- `docs/Carta_de_recomendação_Sementes_do_amanhã.pdf`
- `backend-python/docs/Carta_de_recomendação_Sementes_do_amanhã.pdf`
- `backend-python/docs/forms information/`

### 2.3 Carta De Recomendacao E Termos

Documentos relacionados a parceria e ao uso de conteudo/imagem ja localizados no projeto:

- Carta de recomendacao: `docs/Carta_de_recomendação_Sementes_do_amanhã.pdf`
- Termo de uso de imagem: `backend-python/docs/forms/termo_uso_de_imagem.docx`
- Termo de responsabilidade: `backend-python/docs/forms/termo_de_responsabilidade.docx`
- Termo de autorizacao de saida desacompanhada: `backend-python/docs/forms/termo_de_autorizacao_saida_desacompanhada.docx`

Antes da entrega final em PDF, inserir nesta secao os arquivos assinados, escaneados e atualizados com data e responsaveis.

---

## 3. Necessidades E Problemas Encontrados

Foi identificado que a principal dificuldade da comunidade parceira esta na **gestao manual das informacoes dos alunos**, realizada em papel. Esse modelo dificulta o acesso rapido aos dados, aumenta o risco de perdas, torna mais lenta a atualizacao cadastral e compromete a organizacao dos documentos exigidos no atendimento. Como a ONG precisa registrar informacoes pessoais, familiares, escolares, de saude e autorizacoes diversas, a ausencia de um sistema centralizado gera retrabalho e reduz a eficiencia da rotina administrativa.

Outro problema importante esta na dependencia de processos pouco padronizados para preenchimento, consulta e emissao de documentos. Isso afeta nao apenas a produtividade da equipe, mas tambem a seguranca da informacao e a qualidade do acompanhamento prestado. Em contextos sociais, qualquer atraso ou falha no acesso aos dados pode impactar negativamente o suporte oferecido as familias atendidas.

### 3.1 Problema / Necessidade 1

**Processo de cadastro realizado em papel**

O levantamento de requisitos mostrou que o processo atual e manual. Isso dificulta o armazenamento, a localizacao e a atualizacao dos registros dos alunos. Alem disso, informacoes importantes podem ficar espalhadas em documentos fisicos, o que aumenta o risco de extravio e retrabalho. A digitalizacao desse fluxo foi entendida como prioridade por trazer mais organizacao e agilidade para a equipe.

### 3.2 Problema / Necessidade 2

**Dificuldade para organizar e emitir documentos da rotina institucional**

A ONG utiliza documentos como ficha de acolhimento, termo de responsabilidade, autorizacao de saida e termo de uso de imagem. Sem um fluxo digital integrado, o preenchimento desses materiais se torna mais demorado e sujeito a inconsistencias. O projeto busca reduzir esse problema ao estruturar os dados do aluno e permitir melhor aproveitamento dessas informacoes na geracao de documentos.

---

## 4. Planejamento Do Projeto

### 4.1 Proposta De Melhoria / Solucao

A proposta do projeto foi desenvolver um **sistema full stack para cadastro e gestao de alunos da ONG Sementes do Amanhã**, com interface amigavel e recursos voltados para a rotina real da instituicao. A plataforma foi planejada para centralizar o cadastro de estudantes, responsaveis e informacoes complementares, alem de apoiar a organizacao documental da entidade.

Entre as melhorias propostas, destacam-se:

- cadastro e edicao de alunos em ambiente digital;
- armazenamento estruturado de dados pessoais, familiares, escolares e de saude;
- validacao de informacoes dos responsaveis;
- apoio a emissao de documentos relacionados ao atendimento;
- consulta mais rapida e segura dos registros;
- reducao do uso de papel e do retrabalho administrativo.

Com isso, espera-se que a comunidade perceba ganhos concretos na organizacao interna, na confiabilidade dos dados e na continuidade do acompanhamento realizado pela ONG.

### 4.2 Tabela De Planejamento

| Etapa | Atividade | Responsavel | Periodo | Status |
| --- | --- | --- | --- | --- |
| 1 | Levantamento de requisitos com a comunidade/parceiro | `[Preencher]` | `[Preencher]` | Concluido |
| 2 | Analise do processo atual e definicao do problema | `[Preencher]` | `[Preencher]` | Concluido |
| 3 | Prototipacao e definicao da estrutura do sistema | `[Preencher]` | `[Preencher]` | Concluido |
| 4 | Desenvolvimento do frontend | `[Preencher]` | `[Preencher]` | Concluido |
| 5 | Desenvolvimento do backend e integracao com banco | `[Preencher]` | `[Preencher]` | Concluido |
| 6 | Estruturacao da geracao de documentos | `[Preencher]` | `[Preencher]` | Concluido |
| 7 | Testes, ajustes e validacao com o contexto do projeto | `[Preencher]` | `[Preencher]` | Em andamento |
| 8 | Registro de evidencias e elaboracao do relatorio final | `[Preencher]` | `[Preencher]` | Em andamento |

---

## 5. Execucao Do Projeto

### 5.1 Acoes Executadas

O projeto foi executado a partir do levantamento das necessidades reais da instituicao parceira. Depois dessa etapa, a equipe estruturou uma solucao digital composta por frontend, backend e banco de dados, com foco na centralizacao das informacoes e na melhoria do fluxo de cadastro dos alunos.

Entre as acoes realizadas, destacam-se:

- levantamento e registro dos requisitos da ONG;
- analise do processo manual utilizado anteriormente;
- modelagem dos dados cadastrais e documentais;
- desenvolvimento da interface para cadastro e edicao de alunos;
- implementacao do backend para consulta, armazenamento e processamento dos dados;
- organizacao de documentos institucionais usados na rotina de atendimento;
- preparacao da aplicacao para uso mais seguro e eficiente.

Essas acoes foram realizadas porque a comunidade necessitava de uma ferramenta pratica, funcional e aderente a sua realidade. O impacto esperado e a reducao do retrabalho, a melhoria no acesso as informacoes e o fortalecimento da organizacao administrativa da ONG.

### 5.2 Evidencias Da Execucao

Inserir aqui:

- fotos da equipe desenvolvendo o projeto;
- registros de reunioes, apresentacoes ou validacoes;
- capturas de tela do sistema em uso;
- imagens da instituicao parceira;
- depoimentos da comunidade ou da equipe parceira.

Se desejar, tambem podem ser usadas imagens do proprio sistema para demonstrar a implementacao da solucao.

---

## 6. Plano De Divulgacao Do Projeto

### 6.1 Meios De Comunicacao Mais Viaveis

Os meios de comunicacao mais viaveis para divulgar o projeto na comunidade escolhida sao aqueles que fazem sentido para a realidade da ONG, da equipe e das familias atendidas. Entre eles, destacam-se **WhatsApp**, redes sociais da instituicao, comunicados internos, reunioes com responsaveis e apresentacoes presenciais junto aos parceiros locais.

O WhatsApp e especialmente relevante por ser um canal amplamente utilizado no cotidiano da comunidade e da equipe institucional. As redes sociais tambem podem ser utilizadas para apresentar os resultados do projeto, divulgar boas praticas e valorizar a parceria entre universidade e comunidade. Em complemento, encontros presenciais e rodas de conversa ajudam a explicar a finalidade da ferramenta, orientar seu uso e fortalecer o engajamento dos envolvidos.

Para esta secao, recomenda-se anexar:

- artes de divulgacao;
- registros de publicacoes em redes sociais;
- fotos de reunioes de apresentacao;
- capturas de mensagens ou convites institucionais.

---

## 7. Resultados Do Projeto

### 7.1 Impacto Do Projeto Na Comunidade

O projeto apresenta impacto principalmente **social e organizacional**, com reflexos indiretos no aspecto economico. Socialmente, a iniciativa melhora a capacidade da ONG de acompanhar seus atendidos, organizar informacoes importantes e dar mais suporte ao trabalho da equipe responsavel. Organizacionalmente, o sistema contribui para a padronizacao do cadastro, reduz a dependencia de papeis e facilita a consulta e atualizacao dos dados.

Com base nas informacoes levantadas, ja e possivel afirmar que a solucao foi desenhada para atender uma instituicao com cerca de **120 alunos cadastrados**, cujo processo anterior era feito em papel e utilizado diariamente por **2 pessoas** da equipe. A migracao para um fluxo digital tende a reduzir perdas de informacao, tornar o preenchimento mais consistente e agilizar o acesso aos registros dos estudantes e seus responsaveis.

Para fortalecer esta secao antes da entrega final, inserir:

- comparativo entre o processo anterior e o atual;
- dados numericos de tempo, volume ou reducao de retrabalho, se disponiveis;
- depoimentos da equipe ou da comunidade;
- fotos ou capturas de tela como evidencia.

### 7.2 Continuidade Das Acoes Pela Comunidade

As acoes podem continuar sendo implementadas pela comunidade por meio da apropriacao gradual da ferramenta pela equipe da ONG. Como o sistema foi pensado para uma necessidade real e para uma rotina de uso continuo, ele pode permanecer em funcionamento como instrumento de cadastro, consulta e organizacao documental. Para garantir continuidade, e importante orientar os usuarios, manter os dados atualizados e registrar boas praticas de uso.

Tambem e recomendavel que a comunidade mantenha um fluxo de revisao periodica das informacoes, utilize o sistema como base para novos atendimentos e registre sugestoes de melhoria. Assim, o projeto deixa um legado concreto, com potencial de continuidade mesmo apos o encerramento formal da atividade extensionista.

---

## 8. Avaliacoes

### 8.1 Avaliacao Da Comunidade

Nesta secao, devem ser inseridos os resultados do formulario aplicado a comunidade ou aos representantes da instituicao parceira. A analise pode considerar criterios como:

- facilidade de uso da solucao proposta;
- percepcao sobre melhoria na organizacao do trabalho;
- utilidade pratica do sistema para o dia a dia;
- impacto percebido no atendimento a comunidade;
- sugestoes de melhoria.

**Texto base sugerido:** os resultados da avaliacao da comunidade indicaram percepcao positiva em relacao a organizacao das informacoes, a praticidade do sistema e ao potencial da ferramenta para reduzir dificuldades da rotina administrativa. Tambem foi possivel identificar pontos de aperfeicoamento, especialmente relacionados a treinamento de uso, refinamento de campos e continuidade da implantacao.

### 8.2 Autoavaliacao Dos Alunos

Nesta etapa, o grupo deve registrar a autoavaliacao do aprendizado construida ao longo da extensao. A analise pode destacar:

- desenvolvimento tecnico em frontend, backend e banco de dados;
- capacidade de levantar requisitos reais com a comunidade;
- experiencia de trabalho em equipe;
- evolucao na comunicacao com parceiros externos;
- compreensao do papel social da tecnologia.

**Texto base sugerido:** a autoavaliacao dos estudantes demonstra crescimento tecnico e humano ao longo do projeto. Alem do desenvolvimento de competencias ligadas a programacao e estruturacao de sistemas, a experiencia fortaleceu a escuta ativa, a responsabilidade social, a capacidade de adaptacao e a compreensao de que a tecnologia pode ser aplicada para resolver problemas concretos de uma comunidade.

---

## 9. Licoes Aprendidas E Conclusao

### 9.1 Principais Desafios Enfrentados

Os principais desafios enfrentados ao longo do projeto envolveram a traducao de uma necessidade social real para uma solucao tecnologica aplicavel, a organizacao de requisitos nem sempre formalizados e a preocupacao em construir uma ferramenta simples o suficiente para o uso cotidiano da instituicao. Tambem houve o desafio de estruturar dados variados, contemplando informacoes pessoais, familiares, escolares, de saude e autorizacoes em um unico sistema coerente.

### 9.2 Habilidades Desenvolvidas

Ao longo do projeto, foram desenvolvidas habilidades tecnicas e comportamentais importantes, tais como:

- levantamento e analise de requisitos;
- desenvolvimento full stack;
- modelagem e organizacao de dados;
- integracao entre frontend, backend e banco de dados;
- trabalho em equipe;
- comunicacao com parceiro externo;
- responsabilidade social e visao critica sobre impacto da tecnologia.

### 9.3 Conclusao

Conclui-se que o projeto atendeu ao objetivo de propor uma solucao pratica para uma necessidade real da ONG Sementes do Amanhã. Ao substituir um processo manual em papel por um sistema digital de cadastro e organizacao documental, a iniciativa contribui para melhorar a eficiencia administrativa, ampliar a confiabilidade das informacoes e apoiar o trabalho desenvolvido junto a criancas, adolescentes e familias atendidas pela instituicao.

Mais do que entregar uma aplicacao, o projeto demonstrou como os conhecimentos adquiridos no curso podem ser aplicados de forma concreta em beneficio da comunidade. A experiencia extensionista fortaleceu a relacao entre universidade e sociedade, gerando aprendizado para os estudantes e uma contribuicao relevante para a organizacao parceira.

### 9.4 Retorno A Comunidade - Boas Praticas

O retorno a comunidade pode ocorrer por diferentes meios, como:

- apresentacao da solucao para a equipe da ONG;
- entrega de materiais de apoio e orientacoes de uso;
- compartilhamento dos resultados obtidos;
- registro das boas praticas aprendidas durante a implantacao;
- demonstracoes presenciais ou online da ferramenta.

Esse retorno e essencial para que a comunidade nao seja apenas objeto do projeto, mas participe ativamente dos beneficios gerados pela extensao.

---

## Referencias

- Documentacao interna do projeto `Sementes do Amanhã`.
- `README.pt-BR.md` do repositorio.
- `backend-python/docs/requisitos.txt`.
- Formularios e termos institucionais presentes em `backend-python/docs/forms/`.
- Carta de recomendacao disponivel em `docs/Carta_de_recomendação_Sementes_do_amanhã.pdf`.
- Material orientador da disciplina/extensao: `docs/Ementa e Roteiro - Extensão Curricularizada Tech - Projeto Prático.docx`.

---

## Pendencias Para Fechamento Antes Do PDF

- preencher nome do curso;
- preencher nomes dos integrantes;
- substituir os campos marcados como `[Preencher]`;
- inserir fotos, evidencias e legendas;
- anexar documentos assinados e atualizados;
- incluir dados reais de avaliacao da comunidade e autoavaliacao;
- revisar se a instituicao prefere manter ou ajustar o titulo do projeto no relatorio final.
