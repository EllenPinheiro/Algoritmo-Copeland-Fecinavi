import fs from 'fs';
import csv from 'csv-parser';

// arquivos CSV de entrada
const projetosNotasCSV = 'projetos-notas.csv';
const criteriosPesosCSV = 'criterios-pesos.csv';

// Função para ler o arquivo CSV de projetos e notas
const lerCSVProjetosNotas = () => {
  const projetosNotas = [];

  // Lê o arquivo CSV linha por linha e adiciona os dados a um array
  fs.createReadStream(projetosNotasCSV)
    .pipe(csv())
    .on('data', (row) => {
      projetosNotas.push(row);
    })
    .on('end', () => {
      console.log('Dados do arquivo projetos-notas.csv:', projetosNotas);
    });
};

// Função para ler o arquivo CSV de critérios e pesos
const lerCSVCriteriosPesos = () => {
  const criteriosPesos = {};

  // Lê o arquivo CSV linha por linha e adiciona os dados a um objeto
  fs.createReadStream(criteriosPesosCSV)
    .pipe(csv())
    .on('data', (row) => {
      // Os dados estão no formato "critérios, pesos"
      const [criterio, peso] = row;
      criteriosPesos[criterio] = parseFloat(peso); // Converte o peso para número
    })
    .on('end', () => {
      console.log('Critérios e pesos:', criteriosPesos);

    });
};

// Função principal para executar o programa
const main = () => {
  // Chama as funções para ler os arquivos CSV
  lerCSVProjetosNotas();
  lerCSVCriteriosPesos();


};

// Chamada da função principal para iniciar o programa
main();
