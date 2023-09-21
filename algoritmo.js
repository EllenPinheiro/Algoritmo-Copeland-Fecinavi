import fs from 'fs';
import csv from 'csv-parser';

// Função para calcular a média ponderada de um projeto
function calcularMediaPonderada(projeto, criteriosPesos) {
  let mediaPonderada = {}; // objeto vazio para armazenar as médias ponderadas

  for (let i = 0; i < criteriosPesos.length; i++) {
    const criterio = `n${i + 1}`; // Gera uma chave para o critério ponderado, como 'n1', 'n2', ...
    const peso = criteriosPesos[i]; // Obtém o peso correspondente a esse critério
    mediaPonderada[criterio] = projeto[criterio] * peso; // Calcula a média ponderada para o critério e o armazena no objeto
  }

  return mediaPonderada; // Retorna o objeto com as médias ponderadas de cada critério
}

// Objeto para armazenar as médias dos projetos
const mediasProjetos = {};

// Lê a planilha de critérios e pesos
const criteriosPesos = [];
fs.createReadStream('criterios-pesos.csv') // Abre o arquivo CSV 'criterios-pesos.csv'
  .pipe(csv()) // Utiliza o 'csv-parser' para analisar o arquivo CSV em linhas
  .on('data', (row) => { // Para cada linha do arquivo
    const peso = parseFloat(row['pesos']); // Obtém o valor do peso da linha atual
    criteriosPesos.push(peso); // Adiciona o peso ao array 'criteriosPesos'
  })
  .on('end', () => { // Após a leitura do arquivo ser concluída
    // Lê a planilha de projetos e notas
    fs.createReadStream('projetos-notas.csv') // Abre o arquivo CSV 'projetos-notas.csv'
      .pipe(csv()) // Utiliza o 'csv-parser' para analisar o arquivo CSV em linhas
      .on('data', (row) => { // Para cada linha do arquivo
        const projetoID = parseInt(row['fk_projeto']); // Obtém o ID do projeto da linha atual
        const mediaPonderada = calcularMediaPonderada(row, criteriosPesos); // Calcula a média ponderada com base nos critérios e pesos

        // Verifica se o projeto já existe no objeto de médias
        if (!mediasProjetos[projetoID]) {
          mediasProjetos[projetoID] = mediaPonderada; // Se não existir, cria uma entrada com as médias ponderadas
        } else {
          // Soma as médias ponderadas aos critérios existentes
          for (const criterio in mediaPonderada) {
            mediasProjetos[projetoID][criterio] += mediaPonderada[criterio];
          }
        }
      })
      .on('end', () => { // Após a leitura do arquivo ser concluída
        // Imprime as médias dos projetos
        for (const projetoID in mediasProjetos) {
          console.log(`Projeto ID: ${projetoID}`, mediasProjetos[projetoID]);
        }
        console.log('Processamento concluído. Médias Ponderadas Calculadas com Sucesso!'); 
      });
  });
