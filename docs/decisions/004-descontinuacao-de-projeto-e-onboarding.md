# Decisão: descontinuar “projeto” como conceito de produto

Status: proposta para lançamento beta

## Decisão

O Borogodó não terá um cadastro ou uma gestão de projetos. A unidade que a pessoa alimenta é o
**registro**; a unidade que o produto organiza é a **experiência profissional** (empresa, cargo,
período e evidências). “Projeto” deixa de aparecer como ação, filtro, agrupador ou requisito de
captura.

## Compatibilidade com dados existentes

Não remover `entries.project_name` agora. Essa coluna é legado de usuários e importações antigas.
Apagá-la em dev ou produção nesta fase faria dados antigos desaparecerem ou quebraria rascunhos e
rotas que ainda conhecem seeds antigos.

O caminho seguro é:

1. **Agora:** nenhum fluxo novo grava `project_name`; a Trajetória achata registros antigos na
   experiência da empresa. Nenhum botão ou texto novo fala em projeto.
2. **Depois do beta:** medir se ainda existem leituras de seeds antigos e fazer uma migração
   aditiva/compatível, preservando uma cópia de auditoria antes de qualquer limpeza.
3. **Somente quando não houver dependências:** migration separada para remover código de leitura e,
   por último, a coluna. A mesma migration deve ser aplicada primeiro no ambiente de teste e só
   depois em produção, com backup/verificação.

Não há motivo para uma migration destrutiva neste lançamento.

## Onboarding mínimo excelente

O onboarding continua sendo a primeira experiência de valor, não a feature de importação. Ele oferece
duas portas equivalentes:

- escrever uma história curta;
- enviar currículo/LinkedIn em PDF.

Em ambos os casos, o sistema salva as entradas estruturadas em segundo plano, deduplica quando a
fonte é reprocessada, gera o primeiro Espelho e mostra a pessoa o que foi encontrado. O primeiro
momento de revisão deve ser “estes são os registros que encontrei”, não um formulário de projetos.

O importador pode ganhar uma revisão em lote depois do beta, mas não deve bloquear a primeira
revelação. Se uma entrada vier incompleta, ela continua salva como registro cru; o produto pergunta
depois, dentro de “Perguntar”, em vez de transformar o onboarding num interrogatório.

## Taxonomia de conversa

Há uma única superfície conversacional: **Perguntar**. “Me preparar” é um contexto de uso dentro de
Perguntar, e “Usar” é uma ação de saída para transformar evidência em algo útil. “Corrigir” não é uma
porta separada; é uma intenção que a pessoa pode expressar em Perguntar.

## Critério de lançamento

O beta está pronto quando a pessoa consegue, em uma sessão:

1. fornecer texto ou PDF;
2. ver registros organizados sem duplicação óbvia;
3. abrir o Espelho e a Trajetória sem conceitos que ela não alimentou;
4. usar uma evidência real para uma necessidade concreta (entrevista, salário, bio ou post).

O gerador de post não deve ser a prova principal de valor. A prova principal é: “o Borogodó me
mostrou algo verdadeiro sobre o meu trabalho e me ajudou a usar isso numa situação real”.
