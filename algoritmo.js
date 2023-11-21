import fs from 'fs';
import csv from 'csv-parser';
import readline from 'readline';


// Função para calcular a média ponderada de um projeto
function calcularMediaPonderada(projeto, criteriosPesos) {
  const mediasPonderadas = [];


  for (let i = 1; i <= 7; i++) {
    const notas = [];
    const peso = criteriosPesos[i - 1]; // Peso do critério, indexado de 0 a 6


    for (let j = 1; j <= 3; j++) {
      notas.push(parseFloat(projeto[`crit${i}_${j}`])); // Coleta as 3 notas do critério
    }


    const somaNotas = notas.reduce((acc, nota) => acc + nota, 0); // Soma das notas
    const media = (somaNotas * peso) / (3 * peso); // Cálculo da média ponderada
    mediasPonderadas.push(media);
  }


  return mediasPonderadas;
}


// Função para calcular a nota da comparação intracriterial
function calcularNotaComparacao(projeto1, projeto2) {
  let nota = 0;


  for (let i = 0; i < criteriosPesos.length; i++) {
    const criterio = `n${i + 1}`;
    const diferenca = projeto1[criterio] - projeto2[criterio];


    if (diferenca > 0) {
      nota += 1;
    } else if (diferenca < 0) {
      nota -= 1;
    }
  }


  if (nota < 0) {
    nota = -1;
  } else if (nota > 1) {
    nota = 1;
  }


  return nota;
}


// Função para calcular a Soma de Copeland para um projeto
function calcularSomaCopeland(projetoID, comparacoesProjetos) {
  let somaCopeland = 0;


  for (const outroProjetoID in comparacoesProjetos) {
    if (outroProjetoID != projetoID) {
      const nota = calcularNotaComparacao(comparacoesProjetos[projetoID], comparacoesProjetos[outroProjetoID]);
      somaCopeland += nota;
    }
  }


  return somaCopeland;
}


// Função para criar o ranking de somas Copeland
function criarRankingCopeland(comparacoesProjetos) {
  const ranking = [];
  for (const projetoID in comparacoesProjetos) {
    const projeto = comparacoesProjetos[projetoID];
    const somaCopeland = calcularSomaCopeland(projetoID, comparacoesProjetos);
    ranking.push({
      projetoID,
      somaCopeland,
      id_areaConhecimento: projeto.id_areaConhecimento,
      id_nivelEnsino: projeto.id_nivelEnsino
    });
  }
  ranking.sort((a, b) => b.somaCopeland - a.somaCopeland);
  return ranking;
}


// Objeto para armazenar as comparações dos projetos
const comparacoesProjetos = {};


// Lê a planilha de critérios e pesos
const criteriosPesos = [];
fs.createReadStream('criterios-pesos.csv')
  .pipe(csv())
  .on('data', (row) => {
    const peso = parseFloat(row['pesos']);
    criteriosPesos.push(peso);
  })
  .on('end', () => {
    console.log('Médias Ponderadas:\n');
    // Lê a planilha de projetos e notas
    fs.createReadStream('projetos-notas.csv')
      .pipe(csv())
      .on('data', (row) => {
        const projetoID = parseInt(row['fk_projeto']);
        const mediaPonderada = calcularMediaPonderada(row, criteriosPesos);
        comparacoesProjetos[projetoID] = {
          ...mediaPonderada,
          id_areaConhecimento: row['id_areaConhecimento'],
          id_nivelEnsino: row['id_nivelEnsino']
        };
        console.log(`Projeto ID: ${projetoID}`, mediaPonderada);
      })
      .on('end', () => {
        let rankingCopeland; // Defina a variável rankingCopeland aqui


        rankingCopeland = criarRankingCopeland(comparacoesProjetos);


        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });


        rl.question('\n\nDigite:\n1 para ver as comparações com a nota em cada critério; \n2 para ver com a soma de todas as notas em cada comparação; \n3 para ver a soma Copeland; \n4 para ver o ranking; \n5 para filtrar o ranking.\nEscolha uma opção: ', (opcao) => {
          if (opcao === '1') {
            rl.question('Digite o ID do projeto que deseja comparar: ', (projetoID1) => {
              const projetoSelecionado = comparacoesProjetos[projetoID1];
              if (projetoSelecionado) {
                console.log(`\nComparações com Projeto ID ${projetoID1}:`);
                for (const outroProjetoID in comparacoesProjetos) {
                  if (outroProjetoID != projetoID1) {
                    const comparacao = {};


                    for (let i = 0; i < criteriosPesos.length; i++) {
                      const criterio = `n${i + 1}`;
                      comparacao[criterio] = projetoSelecionado[criterio] > comparacoesProjetos[outroProjetoID][criterio] ? 1
                        : projetoSelecionado[criterio] < comparacoesProjetos[outroProjetoID][criterio] ? -1
                        : 0;
                    }
                    console.log(`Projeto ID ${projetoID1} com Projeto ID ${outroProjetoID}:`, comparacao);
                  }
                }
              } else {
                console.log(`Projeto de ID ${projetoID1} não encontrado.`);
              }
              rl.close();
            });
          } else if (opcao === '2') {
            rl.question('Digite o ID do projeto que deseja ver a lista com a soma de cada comparação: ', (projetoID2) => {
              const projetoSelecionado = comparacoesProjetos[projetoID2];
              if (projetoSelecionado) {
                const comparacoes = {};
                for (const outroProjetoID in comparacoesProjetos) {
                  if (outroProjetoID != projetoID2) {
                    comparacoes[outroProjetoID] = calcularNotaComparacao(projetoSelecionado, comparacoesProjetos[outroProjetoID]);
                  }
                }
                console.log(`\nComparações com Projeto ID ${projetoID2}:`);
                for (const outroProjetoID in comparacoes) {
                  console.log(`Projeto ID ${projetoID2} com Projeto ID ${outroProjetoID}:`, comparacoes[outroProjetoID]);
                }
              } else {
                console.log(`Projeto de ID ${projetoID2} não existe.`);
              }
              rl.close();
            });
          } else if (opcao === '3') {
            rl.question('Digite o ID do projeto para calcular a Soma de Copeland: ', (projetoID3) => {
              const somaCopeland = calcularSomaCopeland(projetoID3, comparacoesProjetos);
              console.log(`\nSoma de Copeland para o Projeto ID ${projetoID3}: ${somaCopeland}`);
              rl.close();
            });
          } else if (opcao === '4') {
            console.log('Ranking das Somas de Copeland:');
            const rankingCopeland = criarRankingCopeland(comparacoesProjetos);
            rankingCopeland.forEach((item, index) => {
              console.log(`${index + 1}. Projeto ID ${item.projetoID}, Área de Conhecimento: ${item.id_areaConhecimento}, Nível de Ensino: ${item.id_nivelEnsino}, Soma de Copeland: ${item.somaCopeland}`);
            });
            rl.close();
          } else if (opcao === '5') {
            rl.question('Digite 1 para ranquear por área de conhecimento, 2 para ranquear por nível de ensino, ou 3 para ranquear por área de conhecimento e nível de ensino simultaneamente: ', (filtroOpcao) => {
              if (filtroOpcao === '1') {
                rl.question('Digite o ID da área de conhecimento que deseja ver o ranking: ', (areaConhecimentoID) => {
                  const filteredRanking = rankingCopeland.filter(item => item.id_areaConhecimento === areaConhecimentoID);
                  console.log(`\nRanking por Área de Conhecimento (ID ${areaConhecimentoID}):`);
                  filteredRanking.forEach((item, index) => {
                    console.log(`${index + 1}. Projeto ID ${item.projetoID}, Soma de Copeland: ${item.somaCopeland}`);
                  });
                  rl.close();
                });
              } else if (filtroOpcao === '2') {
                rl.question('Digite o ID do nível de ensino que deseja ver o ranking: ', (nivelEnsinoID) => {
                  const filteredRanking = rankingCopeland.filter(item => item.id_nivelEnsino === nivelEnsinoID);
                  console.log(`\nRanking por Nível de Ensino (ID ${nivelEnsinoID}):`);
                  filteredRanking.forEach((item, index) => {
                    console.log(`${index + 1}. Projeto ID ${item.projetoID}, Soma de Copeland: ${item.somaCopeland}`);
                  });
                  rl.close();
                });
              } else if (filtroOpcao === '3') {
                rl.question('Digite o ID da área de conhecimento: ', (areaConhecimentoID) => {
                  rl.question('Digite o ID do nível de ensino: ', (nivelEnsinoID) => {
                    const filteredRanking = rankingCopeland.filter(item => item.id_areaConhecimento === areaConhecimentoID && item.id_nivelEnsino === nivelEnsinoID);
                    console.log(`\nRanking por Área de Conhecimento (ID ${areaConhecimentoID}) e Nível de Ensino (ID ${nivelEnsinoID}):`);
                    filteredRanking.forEach((item, index) => {
                      console.log(`${index + 1}. Projeto ID ${item.projetoID}, Soma de Copeland: ${item.somaCopeland}`);
                    });
                    rl.close();
                  });
                });
              } else {
                console.log('Opção de filtro inválida. Digite 1, 2 ou 3.');
                rl.close();
              }
            });
          } else {
            console.log('Opção inválida. Digite 1, 2, 3, 4 ou 5.');
            rl.close();
          }
        });
      });
  });
