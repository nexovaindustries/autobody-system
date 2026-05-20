import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

interface QuotationPDFData {
  numero: string;
  fecha: string;
  validezDias: number;
  cliente: {
    nombre: string;
    dni_ruc?: string;
    telefono: string;
    email?: string;
  };
  vehiculo: {
    placa: string;
    marca: string;
    modelo: string;
    anio?: number;
    color?: string;
  };
  aseguradora: string;
  numeroSiniestro?: string;
  items: Array<{
    zonaLabel: string;
    subcomponenteLabel: string;
    tipoIntervencion: string;
    descripcion?: string;
    costoManoObra: number;
    costoMateriales: number;
    subtotal: number;
  }>;
  subtotal: number;
  igv: number;
  total: number;
  tiempoEstimadoDias: number;
  notas?: string;
}

function formatSoles(amount: number): string {
  return `S/. ${amount.toFixed(2)}`;
}

function generateHTML(data: QuotationPDFData): string {
  const itemRows = data.items.map(item => `
    <tr>
      <td>${item.zonaLabel}</td>
      <td>${item.subcomponenteLabel}</td>
      <td>${item.tipoIntervencion.replace(/_/g, ' ')}</td>
      <td>${item.descripcion || '-'}</td>
      <td class="amount">${formatSoles(item.costoManoObra)}</td>
      <td class="amount">${formatSoles(item.costoMateriales)}</td>
      <td class="amount"><strong>${formatSoles(item.subtotal)}</strong></td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: #fff; font-size: 11px; }
    .header { background: #1a1a1a; color: #fff; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; }
    .logo-area h1 { font-size: 22px; font-weight: 800; letter-spacing: 2px; }
    .logo-area .accent { color: #f97316; }
    .logo-area p { font-size: 9px; color: #aaa; margin-top: 2px; }
    .proforma-badge { text-align: right; }
    .proforma-badge .numero { font-size: 18px; font-weight: 700; color: #f97316; }
    .proforma-badge .fecha { font-size: 9px; color: #aaa; }
    .content { padding: 20px 30px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
    .info-box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; }
    .info-box h3 { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 8px; border-bottom: 1px solid #f3f4f6; padding-bottom: 4px; }
    .info-box p { margin: 3px 0; }
    .info-box strong { color: #1a1a1a; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background: #1a1a1a; color: #fff; padding: 8px 6px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 7px 6px; border-bottom: 1px solid #f3f4f6; font-size: 10px; }
    tr:nth-child(even) td { background: #f9fafb; }
    .amount { text-align: right; }
    .totals { margin-left: auto; width: 280px; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
    .totals table { margin: 0; }
    .totals td { padding: 6px 12px; }
    .totals .total-row td { background: #f97316; color: #fff; font-weight: 700; font-size: 12px; }
    .footer-info { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
    .time-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; text-align: center; }
    .time-box .days { font-size: 28px; font-weight: 800; color: #16a34a; }
    .time-box p { font-size: 9px; color: #15803d; }
    .notas-box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; }
    .notas-box h3 { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 6px; }
    .firma { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .firma-line { border-top: 1px solid #1a1a1a; padding-top: 6px; text-align: center; font-size: 9px; color: #6b7280; margin-top: 40px; }
    .page-footer { margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 10px; display: flex; justify-content: space-between; font-size: 8px; color: #9ca3af; }
    .validez-tag { display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; color: #92400e; border-radius: 4px; padding: 2px 8px; font-size: 9px; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-area">
      <h1>AUTO<span class="accent">BODY</span> SAC</h1>
      <p>Taller de Colisión y Reparación Automotriz · Av. Aviación Km. 6 Interior, Cerro Colorado, Arequipa</p>
      <p>Tel: +51 XXX XXX XXX · autobodyperu.com</p>
    </div>
    <div class="proforma-badge">
      <div>PROFORMA</div>
      <div class="numero">${data.numero}</div>
      <div class="fecha">Fecha: ${data.fecha}</div>
      <div class="validez-tag">Válido por ${data.validezDias} días</div>
    </div>
  </div>

  <div class="content">
    <div class="grid-2">
      <div class="info-box">
        <h3>Datos del Cliente</h3>
        <p><strong>${data.cliente.nombre}</strong></p>
        ${data.cliente.dni_ruc ? `<p>DNI/RUC: ${data.cliente.dni_ruc}</p>` : ''}
        <p>Tel: ${data.cliente.telefono}</p>
        ${data.cliente.email ? `<p>Email: ${data.cliente.email}</p>` : ''}
      </div>
      <div class="info-box">
        <h3>Datos del Vehículo</h3>
        <p><strong>Placa: ${data.vehiculo.placa.toUpperCase()}</strong></p>
        <p>${data.vehiculo.marca} ${data.vehiculo.modelo} ${data.vehiculo.anio || ''}</p>
        ${data.vehiculo.color ? `<p>Color: ${data.vehiculo.color}</p>` : ''}
        <p>Aseguradora: <strong>${data.aseguradora}</strong></p>
        ${data.numeroSiniestro ? `<p>N° Siniestro: ${data.numeroSiniestro}</p>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Zona</th>
          <th>Subcomponente</th>
          <th>Tipo de Trabajo</th>
          <th>Descripción</th>
          <th>M. Obra</th>
          <th>Materiales</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div style="display:flex; justify-content:flex-end;">
      <div class="totals">
        <table>
          <tr><td>Subtotal</td><td class="amount">${formatSoles(data.subtotal)}</td></tr>
          <tr><td>IGV (18%)</td><td class="amount">${formatSoles(data.igv)}</td></tr>
          <tr class="total-row"><td><strong>TOTAL</strong></td><td class="amount"><strong>${formatSoles(data.total)}</strong></td></tr>
        </table>
      </div>
    </div>

    <div class="footer-info">
      <div class="time-box">
        <div class="days">${data.tiempoEstimadoDias}</div>
        <p>días hábiles estimados de reparación</p>
      </div>
      <div class="notas-box">
        <h3>Notas y Observaciones</h3>
        <p>${data.notas || 'Sin notas adicionales.'}</p>
      </div>
    </div>

    <div class="firma">
      <div>
        <div class="firma-line">Firma del Cliente</div>
      </div>
      <div>
        <div class="firma-line">Sello y Firma Autobody SAC</div>
      </div>
    </div>

    <div class="page-footer">
      <span>Autobody SAC · RUC: XXXXXXXXXXX · Arequipa, Perú</span>
      <span>Pintura marca Sikkens · Sistema desarrollado por Nexova</span>
    </div>
  </div>
</body>
</html>`;
}

export async function generateQuotationPDF(data: QuotationPDFData, outputDir: string): Promise<string> {
  const filename = `${data.numero.replace(/\//g, '-')}.pdf`;
  const outputPath = path.join(outputDir, filename);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(generateHTML(data), { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
  } finally {
    await browser.close();
  }

  return filename;
}
