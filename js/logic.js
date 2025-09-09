/**
 * Lógica cíclica por denominaciones:
 * - Recorre denoms asc de forma cíclica (d1, d2, ..., dn, d1, ...)
 * - Si la denom del turno excede lo que falta, usa la denom mínima.
 * - Requiere que la meta sea múltiplo de la denom mínima para poder cerrar exacto.
 */
function distribute(metaCOP, diasObjetivo, denominaciones, preferirMenosDias) {
    const denoms = Array.from(new Set(denominaciones.filter(n => Number.isFinite(n) && n > 0))).sort((a, b) => a - b);
    if (denoms.length === 0) throw new Error("Debe indicar al menos una denominación válida.");
    if (!Number.isFinite(metaCOP) || metaCOP <= 0) throw new Error("Meta total inválida.");
    const denomMin = denoms[0];

    // Para poder completar exacto se necesita que la meta sea múltiplo de la denom mínima
    if (metaCOP % denomMin !== 0) {
        throw new Error("La meta debe ser múltiplo de la denominación mínima para completar exactamente.");
    }

    const aportesBase = [];
    let sum = 0;
    let i = 0;
    while (sum < metaCOP) {
        const restante = metaCOP - sum;
        let d = denoms[i % denoms.length]; // 10k, 20k, 50k, 10k, ...
        if (d > restante) d = denomMin;     // si excede, baja a min denom
        if (d > restante) throw new Error("No es posible completar la meta con las denominaciones dadas.");
        aportesBase.push(d);
        sum += d;
        i++;
    }

    const aportes = shuffle([...aportesBase]);

    return { diasResultantes: aportes.length, aportes: aportes, denomMin, total: sum, excedente: 0 };
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i - 1)) + 1; 
    [array[i], array[j]] = [array[j], array[i]];   // intercambio
  }
  return array;
}