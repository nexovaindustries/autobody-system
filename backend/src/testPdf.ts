import { generateQuotationPDF } from './utils/pdfGenerator';
import path from 'path';

const mockData = {
  numero: "ABO-2026-9999",
  fecha: "22/05/2026",
  validezDias: 15,
  cliente: {
    nombre: "Juan Perez",
    dni_ruc: "12345678",
    telefono: "987654321",
    email: "juan@example.com",
  },
  vehiculo: {
    placa: "ABC-123",
    marca: "Toyota",
    modelo: "Corolla",
    anio: 2022,
    color: "Rojo",
  },
  aseguradora: "Rimac",
  numeroSiniestro: "SIN-9999",
  items: [
    {
      zonaLabel: "Parachoques Delantero",
      subcomponenteLabel: "Central",
      tipoIntervencion: "PLANCHADO",
      descripcion: "Alineamiento y planchado",
      costoManoObra: 150,
      costoMateriales: 50,
      subtotal: 200,
    }
  ],
  subtotal: 200,
  igv: 36,
  total: 236,
  tiempoEstimadoDias: 3,
  notas: "Prueba de PDF",
};

const pdfDir = path.join(__dirname, '../pdfs');

generateQuotationPDF(mockData, pdfDir)
  .then(filename => {
    console.log('PDF generado exitosamente:', filename);
  })
  .catch(err => {
    console.error('Error al generar PDF:', err);
  });
