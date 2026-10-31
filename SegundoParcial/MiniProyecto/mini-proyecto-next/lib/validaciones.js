export function validarBoleta(boleta) {
  return typeof boleta === 'string' && /^\d{10}$/.test(boleta.trim());
}

export function filtrarNombre(valor) {
  return valor.normalize('NFC').replace(/[^\p{L} ]/gu, '').replace(/ {2,}/g, ' ');
}

export function validarNombre(valor) {
  return typeof valor === 'string' && /^[\p{L}]+(?: [\p{L}]+)*$/u.test(valor.trim().normalize('NFC'));
}