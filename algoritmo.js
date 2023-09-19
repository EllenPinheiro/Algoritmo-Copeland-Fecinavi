import fs from 'fs';
import csv from 'csv-parser';
import { Writable, Transform } from 'stream';


// Constantes para as planilhas
const projetosNotasFile = 'projetos-notas.csv';
const criteriosPesosFile = 'criterios-pesos.csv';


// Arrays para armazenar os dados
const projetosNotas = [];
const criteriosPesos = [];
const mediasPonderadas = [];


// Stream de leitura para "projetos-notas.csv"
const readableStreamProjetosNotas = fs.createReadStream(projetosNotasFile);
const transformToObject = csv({ separator: ';' }); // Transforma em objeto


// Stream de transformação para calcular as médias ponderadas
const calcularMediasPonderadas = new Transform({
  objectMode: true,
  transform(chunk, encoding, callback) {
    const notas = [];
    for (let i = 4; i <= 10; i++) {
      notas.push(Number(chunk[`n${i}`]));
    }


    // Verifique se "fk_projeto" existe antes de tentar convertê-lo
    const projetoId = chunk.hasOwnProperty('fk_projeto') ? Number(chunk.fk_projeto) : null;


    if (projetoId !== null && !isNaN(projetoId)) {
      // Encontre os pesos corretos para este projeto
      const criterioPeso = criteriosPesos.find((item) => item.criterio === projetoId);


      if (criterioPeso) {
        const pesos = criterioPeso.pesos.split(',').map(Number);


        const mediaPonderada = notas.reduce((acc, nota, index) => {
          return acc + nota * pesos[index];
        }, 0);


        chunk.mediaPonderada = mediaPonderada;
        mediasPonderadas.push({ projetoId, mediaPonderada });
      } else {
        console.log('Projeto ID não encontrado em criterios-pesos.csv:', projetoId);
      }
    } else {
      console.log('Projeto ID inválido:', chunk.fk_projeto);
    }


    callback(null, chunk);
  },
});


// Stream de saída para exibir as médias ponderadas
const writableStreamMediasPonderadas = new Writable({
  objectMode: true,
  write(chunk, encoding, next) {
    console.log(`Projeto ID: ${chunk.projetoId}, Média Ponderada: ${chunk.mediaPonderada}`);
    next();
  },
});


// Stream de leitura para "criterios-peso.csv"
const readableStreamCriteriosPesos = fs.createReadStream(criteriosPesosFile);
const transformCriteriosPesosToObject = csv({ separator: ',' }); // Alterado para ','


// Stream de saída para armazenar critérios e pesos
const writableStreamCriteriosPesos = new Writable({
  objectMode: true,
  write(chunk, encoding, next) {
    criteriosPesos.push(chunk);
    next();
  },
});


// Execute o processo de leitura de critérios-peso.csv
readableStreamCriteriosPesos
  .pipe(transformCriteriosPesosToObject)
  .pipe(writableStreamCriteriosPesos)
  .on('finish', () => {
    // Quando a leitura de "criterios-peso.csv" for concluída,
    // inicie o processamento de "projetos-notas.csv"


    readableStreamProjetosNotas
      .pipe(transformToObject)
      .pipe(calcularMediasPonderadas)
      .pipe(writableStreamMediasPonderadas)
      .on('finish', () => {
        // Após calcular as médias ponderadas, continue com o Método de Copeland e ranqueamento.


        // Função para calcular a matriz de decisão do Método de Copeland
        function calcularMatrizDecisao(mediasPonderadas) {
          const numProjetos = mediasPonderadas.length;
          const matrizDecisao = Array.from({ length: numProjetos }, () => Array(numProjetos).fill(0));


          for (let i = 0; i < numProjetos; i++) {
            for (let j = i + 1; j < numProjetos; j++) {
              if (mediasPonderadas[i].mediaPonderada > mediasPonderadas[j].mediaPonderada) {
                matrizDecisao[i][j] = 1;
                matrizDecisao[j][i] = -1;
              } else if (mediasPonderadas[i].mediaPonderada < mediasPonderadas[j].mediaPonderada) {
                matrizDecisao[i][j] = -1;
                matrizDecisao[j][i] = 1;
              }
            }
          }


          return matrizDecisao;
        }


        // Calcular a matriz de decisão do Método de Copeland
        const matrizDecisao = calcularMatrizDecisao(mediasPonderadas);


        // Função para calcular as somas das linhas da matriz de decisão
        function calcularSomasLinhas(matrizDecisao) {
          const numProjetos = matrizDecisao.length;
          const somasLinhas = Array(numProjetos).fill(0);


          for (let i = 0; i < numProjetos; i++) {
            for (let j = 0; j < numProjetos; j++) {
              somasLinhas[i] += matrizDecisao[i][j];
            }
          }


          return somasLinhas;
        }


        // Calcular as somas das linhas da matriz de decisão
        const somasLinhas = calcularSomasLinhas(matrizDecisao);


        // Gerar o ranqueamento geral
        const ranqueamentoGeral = mediasPonderadas.map((projeto, index) => ({
          projetoId: projeto.projetoId,
          mediaPonderada: projeto.mediaPonderada,
          somaLinhas: somasLinhas[index],
        }));


        // Ordenar o ranqueamento geral pelo critério desejado (por exemplo, somaLinhas)
        ranqueamentoGeral.sort((a, b) => b.somaLinhas - a.somaLinhas);


        // Exibir o ranqueamento geral
        console.log('Ranqueamento Geral:');
        ranqueamentoGeral.forEach((projeto, index) => {
          console.log(`${index + 1}. Projeto ID: ${projeto.projetoId}, Soma das Linhas: ${projeto.somaLinhas}`);
        });


        console.log('Processamento concluído.');
      });
  });
