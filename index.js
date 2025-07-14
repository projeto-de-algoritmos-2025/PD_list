/**
 * Gera uma tabela HTML para que o usuário insira os lucros e pesos de cada item.
 */
function createTable() {
    // Usamos const para valores que não serão reatribuídos.
    const numOfObjects = document.getElementById('rows').value;
    const tableWrapper = document.getElementById('wrapper');

    // Validação para garantir que temos um número válido de objetos.
    if (numOfObjects <= 0) {
        tableWrapper.innerHTML = '';
        return;
    }

    // Usando Array.from para criar as linhas da tabela de forma funcional.
    const tableBody = Array.from({ length: numOfObjects }, (_, i) => `
        <tr>
            <td>Item ${i + 1}</td>
            <td><input type="number" class="form-control" placeholder="Lucro" /></td>
            <td><input type="number" class="form-control" placeholder="Peso" /></td>
        </tr>
    `).join(''); // .join('') converte o array de strings em uma única string.

    // Usando Template Literals para uma construção de HTML mais legível.
    const tableHTML = `
        <table class="table table-bordered" id="table">
            <thead>
                <tr>
                    <th scope="col">Itens</th>
                    <th scope="col">Lucro</th>
                    <th scope="col">Peso</th>
                </tr>
            </thead>
            <tbody>
                ${tableBody}
            </tbody>
        </table>
    `;

    tableWrapper.innerHTML = tableHTML;
}

/**
 * Coleta os dados da interface, executa os algoritmos da mochila e exibe os resultados.
 */
function generateResult() {
    const knapsackCapacity = parseInt(document.getElementById('capacity').value, 10);
    const numOfObjects = parseInt(document.getElementById('rows').value, 10);
    
    // Validação de entradas
    if (isNaN(knapsackCapacity) || isNaN(numOfObjects) || knapsackCapacity <= 0 || numOfObjects <= 0) {
        alert("Por favor, insira uma capacidade e número de itens válidos.");
        return;
    }

    const profitArr = [];
    const weightArr = [];

    // Tornar a seção de resultados visível
    // Array.from converte a HTMLCollection para um array para usar forEach.
    Array.from(document.getElementsByClassName("result")).forEach(element => {
        element.style.visibility = "visible";
    });

    const tableRows = document.getElementById("table").rows;

    // Começamos do 1 para pular o cabeçalho da tabela (thead).
    for (let i = 1; i <= numOfObjects; i++) {
        // Usamos let para variáveis que mudam dentro do loop.
        // Adicionamos o segundo argumento `10` em parseInt para especificar a base decimal.
        const profitValue = parseInt(tableRows[i].cells[1].querySelector('input').value, 10);
        const weightValue = parseInt(tableRows[i].cells[2].querySelector('input').value, 10);
        
        // Validação dos valores da tabela
        if (isNaN(profitValue) || isNaN(weightValue)) {
            alert(`Por favor, preencha todos os valores para o Item ${i}.`);
            return;
        }

        profitArr.push(profitValue);
        weightArr.push(weightValue);
    }
    
    // Para o Knapsack 0-1, usamos cópias dos arrays para não afetar o outro algoritmo
    // que depende da ordenação por densidade.
    knapsack01Algorithm(knapsackCapacity, [...profitArr], [...weightArr], numOfObjects);
    
    // O knapsack fracionário ordena os arrays, então o executamos com os arrays originais.
    knapsackAlgorithm(knapsackCapacity, profitArr, weightArr, numOfObjects);
}

/**
 * Ordena os itens pela densidade (lucro/peso) em ordem decrescente.
 * Modifica os arrays de lucro e peso para corresponderem à nova ordem.
 * @param {number[]} densityArr - Array para armazenar as densidades.
 * @param {number[]} profitArr - Array de lucros.
 * @param {number[]} weightArr - Array de pesos.
 * @param {number} numOfObjects - Número de objetos.
 */
function sortLists(densityArr, profitArr, weightArr, numOfObjects) {
    const list = [];
    for (let i = 0; i < numOfObjects; i++) {
        // Calculamos a densidade e a armazenamos junto com o lucro e o peso.
        const density = (profitArr[i] / weightArr[i]);
        list.push({ density, profit: profitArr[i], weight: weightArr[i] });
    }

    // Ordena a lista de objetos com base na densidade, do maior para o menor.
    list.sort((a, b) => b.density - a.density);

    // Reatribui os valores ordenados de volta aos arrays originais.
    for (let i = 0; i < numOfObjects; i++) {
        densityArr[i] = parseFloat(list[i].density.toFixed(2));
        profitArr[i] = list[i].profit;
        weightArr[i] = list[i].weight;
    }
}

/**
 * Aplica o algoritmo da Mochila Fracionária (Greedy).
 */
function knapsackAlgorithm(knapsackCapacity, profitArr, weightArr, numOfObjects) {
    const densityArr = [];
    // A função sortLists modifica os arrays profitArr e weightArr no local.
    sortLists(densityArr, profitArr, weightArr, numOfObjects);

    let knapsackResultantProfit = 0;
    const kpResultantSolutionArr = new Array(numOfObjects).fill(0);

    for (let i = 0; i < numOfObjects; i++) {
        if (knapsackCapacity === 0) break; // Otimização: sair se a mochila já estiver cheia.

        if (weightArr[i] <= knapsackCapacity) {
            knapsackCapacity -= weightArr[i];
            knapsackResultantProfit += profitArr[i];
            kpResultantSolutionArr[i] = 1; // Item inteiro adicionado
        } else {
            // Adicionar uma fração do item
            const fraction = knapsackCapacity / weightArr[i];
            knapsackResultantProfit += profitArr[i] * fraction;
            kpResultantSolutionArr[i] = `${knapsackCapacity}/${weightArr[i]}`;
            knapsackCapacity = 0;
        }
    }

    // Atualiza a UI com os resultados
    document.getElementById("kpResultantProfit").innerHTML = knapsackResultantProfit.toFixed(2);
    document.getElementById("kpProfit").innerHTML = profitArr.join(', ');
    document.getElementById("kpWeight").innerHTML = weightArr.join(', ');
    document.getElementById("kpProfitWeight").innerHTML = densityArr.join(', ');
    document.getElementById("kpResultantSolution").innerHTML = `[${kpResultantSolutionArr.join(', ')}]`;
}

/**
 * Encontra a solução (quais itens foram escolhidos) para o Knapsack 0-1 usando backtracking na tabela de DP.
 */
function find01Solution(objToSelect, capLeft, solutionArr, table, profitArr, weightArr) {
    if (objToSelect <= 0 || capLeft <= 0) {
        return;
    }

    // Se o valor da célula atual é o mesmo da célula acima, o item atual não foi incluído.
    if (table[objToSelect][capLeft] === table[objToSelect - 1][capLeft]) {
        find01Solution(objToSelect - 1, capLeft, solutionArr, table, profitArr, weightArr);
    } else {
        // Se o item foi incluído, marcamos como 1 e continuamos a busca com a capacidade restante.
        solutionArr[objToSelect - 1] = 1;
        const newCapLeft = capLeft - weightArr[objToSelect - 1];
        find01Solution(objToSelect - 1, newCapLeft, solutionArr, table, profitArr, weightArr);
    }
}

/**
 * Aplica o algoritmo da Mochila 0-1 (Programação Dinâmica).
 */
function knapsack01Algorithm(knapsackCapacity, profitArr, weightArr, numOfObjects) {
    // Inicializa a tabela de programação dinâmica (DP)
    const knapsackTable = Array(numOfObjects + 1).fill(0).map(() => Array(knapsackCapacity + 1).fill(0));

    // Preenche a tabela de DP
    for (let objConsidered = 1; objConsidered <= numOfObjects; objConsidered++) {
        for (let capConsidered = 1; capConsidered <= knapsackCapacity; capConsidered++) {
            const currentWeight = weightArr[objConsidered - 1];
            const currentProfit = profitArr[objConsidered - 1];

            if (currentWeight <= capConsidered) {
                // Decide se vale a pena incluir o item atual
                const profitWithItem = currentProfit + knapsackTable[objConsidered - 1][capConsidered - currentWeight];
                const profitWithoutItem = knapsackTable[objConsidered - 1][capConsidered];
                knapsackTable[objConsidered][capConsidered] = Math.max(profitWithItem, profitWithoutItem);
            } else {
                // O item atual não cabe, então o lucro é o mesmo da linha anterior
                knapsackTable[objConsidered][capConsidered] = knapsackTable[objConsidered - 1][capConsidered];
            }
        }
    }
    
    // --- Lógica de exibição separada do cálculo ---
    // Agora, construímos a tabela HTML a partir da matriz de dados `knapsackTable`
    const tableHeader = '<table class="table table-bordered">';
    let tableBody = '<tbody>';
    // Ignoramos a primeira linha e coluna (zeros) para uma visualização mais limpa
    for (let i = 1; i <= numOfObjects; i++) {
        tableBody += '<tr>';
        for (let j = 1; j <= knapsackCapacity; j++) {
            tableBody += `<td>${knapsackTable[i][j]}</td>`;
        }
        tableBody += '</tr>';
    }
    tableBody += '</tbody>';
    document.getElementById('knapsackTable').innerHTML = tableHeader + tableBody + '</table>';

    // Encontra a solução e atualiza a UI
    const solutionArr = new Array(numOfObjects).fill(0);
    find01Solution(numOfObjects, knapsackCapacity, solutionArr, knapsackTable, profitArr, weightArr);

    document.getElementById("kp01ResultantProfit").innerHTML = knapsackTable[numOfObjects][knapsackCapacity];
    document.getElementById("kp01Profit").innerHTML = profitArr.join(', ');
    document.getElementById("kp01Weight").innerHTML = weightArr.join(', ');
    document.getElementById("kp01ResultantSolution").innerHTML = `[${solutionArr.join(', ')}]`;
}