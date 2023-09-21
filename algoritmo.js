import fs from 'fs';
import csv from 'csv-parser';

const projetosNotasCSV = 'projetos-notas.csv';
const criteriosPesosCSV = 'criterios-pesos.csv';

const lerCSVCriteriosPesos = () => {
  const criteriosPesos = {};

  fs.createReadStream(criteriosPesosCSV)
    .pipe(csv())
    .on('data', (row) => {
      const [criterio, peso] = Object.values(row);
      criteriosPesos[criterio] = parseFloat(peso);
    })
    .on('end', () => {
      console.log('Critérios e pesos:', criteriosPesos);
      lerCSVProjetosNotas(criteriosPesos);
    });
};

const lerCSVProjetosNotas = (criteriosPesos) => {
  const projetosNotas = [];

  fs.createReadStream(projetosNotasCSV)
    .pipe(csv())
    .on('data', (row) => {
      projetosNotas.push(row);
    })
    .on('end', () => {
      projetosNotas.shift();
      calcularMediasPonderadas(projetosNotas, criteriosPesos);
    });
};

const calcularMediasPonderadas = (projetosNotas, criteriosPesos) => {
  const mediasPonderadas = [];

  projetosNotas.forEach((projeto) => {
    const mediasPorProjeto = {}; // Objeto para armazenar médias ponderadas por projeto

    for (let i = 5; i <= 11; i++) {
      const nota = parseFloat(projeto[`n${i}`]);
      const peso = criteriosPesos[`n${i}`];
      const criterio = `n${i}`;
      const notaPonderada = nota * peso;

      // Armazena a média ponderada para cada critério do projeto
      mediasPorProjeto[criterio] = notaPonderada;
    }

    mediasPonderadas.push(mediasPorProjeto);
  });

  console.log('Médias ponderadas dos projetos:', mediasPonderadas);
};

const main = () => {
  lerCSVCriteriosPesos();
};

main();
