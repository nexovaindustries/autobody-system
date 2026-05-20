import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin2025!', 12);
  const tecPassword = await bcrypt.hash('Tecnico2025!', 12);
  const recPassword = await bcrypt.hash('Recepcion2025!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@autobody.pe' },
    update: {},
    create: { name: 'Administrador', email: 'admin@autobody.pe', password: adminPassword, role: 'ADMIN' },
  });

  await prisma.user.upsert({
    where: { email: 'tecnico@autobody.pe' },
    update: {},
    create: { name: 'Técnico Principal', email: 'tecnico@autobody.pe', password: tecPassword, role: 'TECNICO' },
  });

  await prisma.user.upsert({
    where: { email: 'recepcion@autobody.pe' },
    update: {},
    create: { name: 'Recepcionista', email: 'recepcion@autobody.pe', password: recPassword, role: 'RECEPCIONISTA' },
  });

  // Demo data: a customer, vehicle, quotation and order
  const cliente = await prisma.customer.upsert({
    where: { id: 'demo-customer-001' },
    update: {},
    create: {
      id: 'demo-customer-001',
      nombre: 'María Quispe Flores',
      dni_ruc: '29876543',
      telefono: '987 654 321',
      email: 'mquispe@gmail.com',
    },
  });

  const vehiculo = await prisma.vehicle.upsert({
    where: { placa: 'AQP-234' },
    update: {},
    create: {
      placa: 'AQP-234',
      marca: 'Toyota',
      modelo: 'Yaris',
      anio: 2021,
      color: 'Blanco Perla',
      customerId: cliente.id,
    },
  });

  const quotation = await prisma.quotation.upsert({
    where: { numero: 'ABO-2025-0001' },
    update: {},
    create: {
      numero: 'ABO-2025-0001',
      clienteId: cliente.id,
      vehiculoId: vehiculo.id,
      aseguradora: 'Rímac Seguros',
      numeroSiniestro: 'SIN-2025-04521',
      tiempoEstimadoDias: 7,
      notas: 'Colisión lateral. El cliente solicita pintura Sikkens color original.',
      validezDias: 15,
      subtotal: 1500,
      igv: 270,
      total: 1770,
      aprobada: true,
      createdById: admin.id,
      items: {
        create: [
          {
            zonaId: 'puerta-del-izq',
            zonaLabel: 'Puerta Delantera Izquierda (Piloto)',
            subcomponenteId: 'panel-ext-pdi',
            subcomponenteLabel: 'Panel exterior de puerta',
            tipoIntervencion: 'PLANCHADO',
            costoManoObra: 350,
            costoMateriales: 150,
            subtotal: 500,
          },
          {
            zonaId: 'aleta-del-izq',
            zonaLabel: 'Aleta Delantera Izquierda',
            subcomponenteId: 'panel-aleta-di',
            subcomponenteLabel: 'Panel exterior de aleta',
            tipoIntervencion: 'MASILLA_Y_PINTURA',
            costoManoObra: 400,
            costoMateriales: 200,
            subtotal: 600,
          },
          {
            zonaId: 'espejo-izq',
            zonaLabel: 'Espejo Retrovisor Izquierdo',
            subcomponenteId: 'carcasa-espejo-izq',
            subcomponenteLabel: 'Carcasa exterior',
            tipoIntervencion: 'REEMPLAZO',
            costoManoObra: 100,
            costoMateriales: 300,
            subtotal: 400,
          },
        ],
      },
    },
  });

  // Create the order if it doesn't exist
  const existingOrder = await prisma.order.findFirst({ where: { cotizacionId: quotation.id } });
  if (!existingOrder) {
    const order = await prisma.order.create({
      data: {
        codigoSeguimiento: 'ABO-2025-DM',
        cotizacionId: quotation.id,
        clienteId: cliente.id,
        vehiculoId: vehiculo.id,
        status: 'EN_PLANCHADO',
        mensajeCliente: 'Tu vehículo está en la etapa de planchado. Progreso al 60%.',
        fechaEstimadaEntrega: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.orderStatusLog.createMany({
      data: [
        { orderId: order.id, status: 'RECIBIDO', mensaje: 'Vehículo recibido en taller', userId: admin.id, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { orderId: order.id, status: 'EN_EVALUACION', mensaje: 'En evaluación técnica', userId: admin.id, createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000) },
        { orderId: order.id, status: 'EN_PLANCHADO', mensaje: 'Iniciamos el planchado. Todo en orden.', userId: admin.id, createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) },
      ],
    });
  }

  console.log('\n✅ Seed completado exitosamente\n');
  console.log('═══════════════════════════════════════');
  console.log('  USUARIOS DEL SISTEMA');
  console.log('───────────────────────────────────────');
  console.log('  admin@autobody.pe     / Admin2025!');
  console.log('  tecnico@autobody.pe   / Tecnico2025!');
  console.log('  recepcion@autobody.pe / Recepcion2025!');
  console.log('═══════════════════════════════════════');
  console.log('  DATOS DE PRUEBA');
  console.log('───────────────────────────────────────');
  console.log('  Código seguimiento demo: ABO-2025-DM');
  console.log('  Cliente: María Quispe Flores');
  console.log('  Vehículo: AQP-234 Toyota Yaris 2021');
  console.log('═══════════════════════════════════════\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
