import fs from 'fs';          // Módulo 'fs' para lidar com operações de arquivo
import csv from 'csv-parser'; // Módulo 'csv-parser' para analisar arquivos CSV

let criteriosPesos = {}; // Objeto para armazenar critérios e seus pesos

// Arquivos CSV de entrada
const projetosNotasCSV = 'projetos-notas.csv';
const criteriosPesosCSV = 'criterios-pesos.csv';

// Função para ler o arquivo CSV de critérios e pesos
const lerCSVCriteriosPesos = () => {
  // Lê o arquivo CSV linha por linha e adiciona os dados ao objeto criteriosPesos
  fs.createReadStream(criteriosPesosCSV)
    .pipe(csv()) // Usa o csv-parser
    .on('data', (row) => {
      const [criterio, peso] = row;
      criteriosPesos[criterio] = parseFloat(peso); // Converte o peso de string para número e associa ao critério correspondente
    })
    .on('end', () => {
      console.log('Critérios e pesos:', criteriosPesos); // Exibe os critérios e pesos após a leitura do CSV
      lerCSVProjetosNotas(); // Chama a função para ler o arquivo de projetos e notas após ler os critérios e pesos
    });
};

// Função para ler o arquivo CSV de projetos e notas
const lerCSVProjetosNotas = () => {
  const projetosNotas = []; // Array para armazenar os dados de projetos e notas

  // Lê o arquivo CSV linha por linha e adiciona os dados ao array projetosNotas
  fs.createReadStream(projetosNotasCSV)
    .pipe(csv()) // Usa o csv-parser para analisar o CSV
    .on('data', (row) => {
      projetosNotas.push(row); // Adiciona a linha atual ao array projetosNotas
    })
    .on('end', () => {
      // Remove a primeira linha (cabeçalho) que contém as nomeações "n1" até "n7"
      projetosNotas.shift();
      calcularMediasPonderadas(projetosNotas); // Quando a leitura do CSV terminar, chama a função para calcular as médias ponderadas
    });
};

// Função para calcular as médias ponderadas dos projetos
const calcularMediasPonderadas = (projetosNotas) => {
  const mediasPonderadas = []; // Array para armazenar as médias ponderadas dos projetos

  projetosNotas.forEach((projeto) => {
    let somaNotasPonderadas = 0; // Variável para somar as notas ponderadas de um projeto

    // Loop para iterar pelas colunas de notas da 5° à 11° (n1 a n7)
    for (let i = 5; i <= 11; i++) {
      const nota = parseFloat(projeto[`n${i}`]); // Obtém a nota da coluna atual e converte para número
      const peso = criteriosPesos[i.toString()];   // Obtém o peso correspondente ao critério atual
      somaNotasPonderadas += nota * peso; // Calcula a nota ponderada e adiciona à soma
    }

    mediasPonderadas.push(somaNotasPonderadas); // Adiciona a média ponderada do projeto ao array
  });

  console.log('Médias ponderadas dos projetos:', mediasPonderadas); // Exibe as médias ponderadas no console
};

// Função principal para executar o programa
const main = () => {
  // Chama a função para ler o arquivo CSV de critérios e pesos
  lerCSVCriteriosPesos();
};

// Chamada da função principal para iniciar o programa
main();
