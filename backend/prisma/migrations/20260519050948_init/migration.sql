-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'RECEPCIONISTA',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "dni_ruc" TEXT,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "placa" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "anio" INTEGER,
    "color" TEXT,
    "kilometraje" INTEGER,
    "customerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vehicles_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "vehiculoId" TEXT NOT NULL,
    "aseguradora" TEXT NOT NULL,
    "numeroSiniestro" TEXT,
    "tiempoEstimadoDias" INTEGER NOT NULL DEFAULT 5,
    "notas" TEXT,
    "validezDias" INTEGER NOT NULL DEFAULT 15,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "igv" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "aprobada" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "pdfPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "quotations_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "quotations_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "vehicles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "quotations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cotizacionId" TEXT NOT NULL,
    "zonaId" TEXT NOT NULL,
    "zonaLabel" TEXT NOT NULL,
    "subcomponenteId" TEXT NOT NULL,
    "subcomponenteLabel" TEXT NOT NULL,
    "tipoIntervencion" TEXT NOT NULL,
    "descripcion" TEXT,
    "costoManoObra" REAL NOT NULL DEFAULT 0,
    "costoMateriales" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quotation_items_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "quotations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigoSeguimiento" TEXT NOT NULL,
    "cotizacionId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "vehiculoId" TEXT NOT NULL,
    "tecnicoId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECIBIDO',
    "mensajeCliente" TEXT,
    "fechaEstimadaEntrega" DATETIME,
    "notas" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "orders_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "quotations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "vehicles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "order_status_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "mensaje" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_status_logs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "order_status_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "price_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "zonaId" TEXT NOT NULL,
    "zonaLabel" TEXT NOT NULL,
    "subcomponenteId" TEXT NOT NULL,
    "subcomponenteLabel" TEXT NOT NULL,
    "tipoIntervencion" TEXT NOT NULL,
    "costoManoObra" REAL NOT NULL DEFAULT 0,
    "costoMateriales" REAL NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_placa_key" ON "vehicles"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_numero_key" ON "quotations"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "orders_codigoSeguimiento_key" ON "orders"("codigoSeguimiento");

-- CreateIndex
CREATE UNIQUE INDEX "orders_cotizacionId_key" ON "orders"("cotizacionId");

-- CreateIndex
CREATE UNIQUE INDEX "price_templates_zonaId_subcomponenteId_tipoIntervencion_key" ON "price_templates"("zonaId", "subcomponenteId", "tipoIntervencion");
