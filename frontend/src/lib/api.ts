import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

// Helper to simulate network latency
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to decode a simulated token to get user id
const getUserIdFromSession = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
  } catch {
    return localStorage.getItem('token_user_id'); // fallback
  }
};

// Helper to generate a fake JWT token
const generateFakeJWT = (payload: any) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = 'fake-signature';
  return `${header}.${body}.${signature}`;
};

// Dummy interceptor structure to prevent frontend errors
const mockInterceptors = {
  request: {
    use: (onFulfilled?: any) => {
      // Just save it or ignore for now as we simulate inside the calls
      return 1;
    },
    eject: () => {}
  },
  response: {
    use: (onFulfilled?: any, onRejected?: any) => {
      return 1;
    },
    eject: () => {}
  }
};

// Main API class that mocks Axios behavior using Supabase
class ApiMockClient {
  interceptors = mockInterceptors;
  defaults = {
    baseURL: '/api',
    headers: {
      common: {},
      Authorization: ''
    }
  };

  private async checkConnection() {
    const key = localStorage.getItem('SUPABASE_ANON_KEY') || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
    if (!key) {
      throw new Error('Supabase Anon Key no configurada. Por favor, inicie sesión o configure los ajustes de conexión.');
    }
  }

  private handleResponse(res: { data: any }): { data: any } {
    if (res && res.data && res.data.success === false) {
      const errMsg = res.data.error || 'Ocurrió un error inesperado';
      const err = new Error(errMsg) as any;
      err.response = {
        status: 400,
        data: {
          success: false,
          error: errMsg
        }
      };
      throw err;
    }
    return res;
  }

  async get(url: string, config?: any): Promise<{ data: any }> {
    return this.handleResponse(await this._get(url, config));
  }

  // GET Mock Router
  async _get(url: string, config?: any): Promise<{ data: any }> {
    await this.checkConnection();
    await delay(150);

    const parsedUrl = new URL(url, 'http://dummy-base-api.com');
    const path = parsedUrl.pathname;
    const params = config?.params || {};

    // 1. GET /auth/me
    if (path === '/auth/me') {
      const userId = getUserIdFromSession();
      if (!userId) {
        return { data: { success: false, error: 'No autorizado' } };
      }
      const { data: user, error } = await supabase
        .from('users')
        .select('id, name, email, role, active, createdAt')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return { data: { success: false, error: 'Usuario no encontrado' } };
      }
      return { data: { success: true, data: user } };
    }

    // 2. GET /users
    if (path === '/users') {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, role, active, createdAt')
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      return { data: { success: true, data: users } };
    }

    // 3. GET /quotations/:id
    if (path.startsWith('/quotations/')) {
      const id = path.split('/')[2];
      const { data: quotation, error } = await supabase
        .from('quotations')
        .select(`
          *,
          cliente:customers(*),
          vehiculo:vehicles(*),
          items:quotation_items(*),
          createdBy:users(id, name),
          order:orders(*)
        `)
        .eq('id', id)
        .single();

      if (error || !quotation) {
        return { data: { success: false, error: 'Proforma no encontrada' } };
      }

      // Format response keys to match CamelCase expectations if needed, but our DB keys are identical.
      return { data: { success: true, data: quotation } };
    }

    // 4. GET /quotations
    if (path === '/quotations') {
      const page = Number(params.page || 1);
      const limit = Number(params.limit || 20);

      let query = supabase
        .from('quotations')
        .select(`
          *,
          cliente:customers(*),
          vehiculo:vehicles(*),
          createdBy:users(id, name)
        `);

      if (params.aseguradora) {
        query = query.eq('aseguradora', params.aseguradora);
      }
      if (params.aprobada !== undefined) {
        query = query.eq('aprobada', params.aprobada === 'true');
      }

      const { data: allItems, error } = await query.order('createdAt', { ascending: false });

      if (error) throw new Error(error.message);

      let items = allItems || [];

      // Filter by search string (numero, client name, or plate)
      if (params.search) {
        const searchLower = String(params.search).toLowerCase();
        items = items.filter(q => 
          (q.numero && q.numero.toLowerCase().includes(searchLower)) ||
          (q.cliente && q.cliente.nombre && q.cliente.nombre.toLowerCase().includes(searchLower)) ||
          (q.vehiculo && q.vehiculo.placa && q.vehiculo.placa.toLowerCase().includes(searchLower))
        );
      }

      const total = items.length;
      const skip = (page - 1) * limit;
      const paginatedItems = items.slice(skip, skip + limit);

      return {
        data: {
          success: true,
          data: {
            items: paginatedItems,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
          }
        }
      };
    }

    // 5. GET /orders/stats/dashboard
    if (path === '/orders/stats/dashboard') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const startOfWeekStr = startOfWeek.toISOString();

      // Fetch orders
      const { data: orders, error: oError } = await supabase
        .from('orders')
        .select('status, createdAt');

      if (oError) throw new Error(oError.message);

      // Fetch approved quotations for this month
      const { data: monthlyQuotations, error: qError } = await supabase
        .from('quotations')
        .select('total, aseguradora')
        .eq('aprobada', true)
        .gte('createdAt', startOfMonth);

      if (qError) throw new Error(qError.message);

      const activeToday = (orders || []).filter(
        o => o.status !== 'ENTREGADO' && o.createdAt >= startOfDay
      ).length;

      const activeWeek = (orders || []).filter(
        o => o.status !== 'ENTREGADO' && o.createdAt >= startOfWeekStr
      ).length;

      const byStatusMap = new Map<string, number>();
      for (const o of orders || []) {
        byStatusMap.set(o.status, (byStatusMap.get(o.status) ?? 0) + 1);
      }
      const byStatus = [...byStatusMap.entries()].map(([status, count]) => ({ status, count }));

      const monthlyRevenue = (monthlyQuotations || []).reduce((acc, q) => acc + (q.total || 0), 0);

      const aseguradoraMap = new Map<string, number>();
      for (const q of monthlyQuotations || []) {
        if (q.aseguradora) {
          aseguradoraMap.set(q.aseguradora, (aseguradoraMap.get(q.aseguradora) ?? 0) + 1);
        }
      }
      const byAseguradora = [...aseguradoraMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([aseguradora, count]) => ({ aseguradora, count }));

      return {
        data: {
          success: true,
          data: {
            activeToday,
            activeWeek,
            byStatus,
            monthlyRevenue,
            byAseguradora
          }
        }
      };
    }

    // 6. GET /orders/:id
    if (path.startsWith('/orders/') && path !== '/orders') {
      const id = path.split('/')[2];
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          cliente:customers(*),
          vehiculo:vehicles(*),
          tecnico:users(id, name),
          cotizacion:quotations(*, items:quotation_items(*)),
          statusLogs:order_status_logs(*, user:users(id, name))
        `)
        .eq('id', id)
        .single();

      if (error || !order) {
        return { data: { success: false, error: 'Orden no encontrada' } };
      }

      // Sort statusLogs by createdAt desc
      if (order.statusLogs) {
        order.statusLogs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      return { data: { success: true, data: order } };
    }

    // 7. GET /orders
    if (path === '/orders') {
      const page = Number(params.page || 1);
      const limit = Number(params.limit || 20);
      
      // Since complex client-side search/relational filters can be hard in pure Supabase API without RPC, 
      // we'll query orders, then apply filter and paginate locally to ensure perfect robust search results.
      let query = supabase
        .from('orders')
        .select(`
          *,
          cliente:customers(*),
          vehiculo:vehicles(*),
          tecnico:users(id, name)
        `);

      if (params.status) {
        query = query.eq('status', params.status);
      }
      if (params.tecnicoId) {
        query = query.eq('tecnicoId', params.tecnicoId);
      }

      const { data: allItems, error } = await query.order('createdAt', { ascending: false });

      if (error) throw new Error(error.message);

      let items = allItems || [];

      // Filter by search string (trackingCode, client name, or plate)
      if (params.search) {
        const searchLower = String(params.search).toLowerCase();
        items = items.filter(o => 
          (o.codigoSeguimiento && o.codigoSeguimiento.toLowerCase().includes(searchLower)) ||
          (o.cliente && o.cliente.nombre && o.cliente.nombre.toLowerCase().includes(searchLower)) ||
          (o.vehiculo && o.vehiculo.placa && o.vehiculo.placa.toLowerCase().includes(searchLower))
        );
      }

      const total = items.length;
      const skip = (page - 1) * limit;
      const paginatedItems = items.slice(skip, skip + limit);

      // Simulating database row count _count property
      const itemsWithCount = paginatedItems.map(item => ({
        ...item,
        _count: { statusLogs: 0 } // We'll mock this for now or fetch it if needed. The frontend just uses it.
      }));

      return {
        data: {
          success: true,
          data: {
            items: itemsWithCount,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
          }
        }
      };
    }

    // 8. GET /tracking/:codigo
    if (path.startsWith('/tracking/') || path.startsWith('/api/tracking/')) {
      const parts = path.split('/');
      const codigo = parts[parts.length - 1].toUpperCase().trim();
      
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          cliente:customers(nombre, telefono),
          vehiculo:vehicles(placa, marca, modelo, color),
          statusLogs:order_status_logs(*)
        `)
        .eq('codigoSeguimiento', codigo)
        .single();

      if (error || !order) {
        return { data: { success: false, error: 'Código de seguimiento no encontrado' } };
      }

      // Sort statusLogs asc by createdAt
      if (order.statusLogs) {
        order.statusLogs.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }

      // Map OrderStatus to stages matching backend tracking.ts
      // In @autobody/shared, we have maps, but let's re-implement for security.
      const ORDER_STATUS_LABELS: Record<string, string> = {
        RECIBIDO: 'Recibido',
        EN_EVALUACION: 'En Evaluación',
        ESPERANDO_REPUESTOS: 'Esperando Repuestos',
        EN_PLANCHADO: 'En Planchado',
        EN_PINTURA: 'En Pintura',
        EN_CONTROL_CALIDAD: 'Control de Calidad',
        LISTO: 'Listo para Entrega',
        ENTREGADO: 'Entregado',
      };

      const ORDER_STATUS_TO_STAGE: Record<string, string> = {
        RECIBIDO: 'RECEPCION',
        EN_EVALUACION: 'RECEPCION',
        ESPERANDO_REPUESTOS: 'RECEPCION',
        EN_PLANCHADO: 'EN_REPARACION',
        EN_PINTURA: 'EN_REPARACION',
        EN_CONTROL_CALIDAD: 'EN_REPARACION',
        LISTO: 'LISTO_ENTREGA',
        ENTREGADO: 'COMPLETADO',
      };

      const stage = ORDER_STATUS_TO_STAGE[order.status] || 'RECEPCION';

      const stages = [
        {
          id: 'RECEPCION',
          label: 'Recepción',
          emoji: '🔴',
          description: 'Vehículo recibido en el taller',
          active: stage === 'RECEPCION',
          completed: ['EN_REPARACION', 'LISTO_ENTREGA', 'COMPLETADO'].includes(stage),
        },
        {
          id: 'EN_REPARACION',
          label: 'En Reparación',
          emoji: '🟡',
          description: 'Trabajos de reparación en proceso',
          active: stage === 'EN_REPARACION',
          completed: ['LISTO_ENTREGA', 'COMPLETADO'].includes(stage),
        },
        {
          id: 'LISTO_ENTREGA',
          label: 'Listo para Entrega',
          emoji: '🟢',
          description: 'Reparación completada, listo para recoger',
          active: stage === 'LISTO_ENTREGA',
          completed: stage === 'COMPLETADO',
        },
      ];

      return {
        data: {
          success: true,
          data: {
            codigo: order.codigoSeguimiento,
            status: order.status,
            statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
            stage,
            stages,
            isWaitingParts: order.status === 'ESPERANDO_REPUESTOS',
            mensajeCliente: order.mensajeCliente,
            fechaIngreso: order.createdAt,
            fechaEstimadaEntrega: order.fechaEstimadaEntrega,
            ultimaActualizacion: order.updatedAt,
            vehiculo: {
              placa: order.vehiculo.placa,
              descripcion: `${order.vehiculo.marca} ${order.vehiculo.modelo}`,
              color: order.vehiculo.color,
            },
            cliente: { nombre: order.cliente.nombre },
            historial: (order.statusLogs || []).map((log: any) => ({
              status: log.status,
              statusLabel: ORDER_STATUS_LABELS[log.status] || log.status,
              mensaje: log.mensaje,
              fecha: log.createdAt,
            })),
          }
        }
      };
    }

    throw new Error(`Endpoint GET desconodido: ${path}`);
  }

  async post(url: string, data?: any, config?: any): Promise<{ data: any }> {
    return this.handleResponse(await this._post(url, data, config));
  }

  // POST Mock Router
  async _post(url: string, data?: any, config?: any): Promise<{ data: any }> {
    await this.checkConnection();
    await delay(200);

    const parsedUrl = new URL(url, 'http://dummy-base-api.com');
    const path = parsedUrl.pathname;

    // 1. POST /auth/login
    if (path === '/auth/login') {
      const { email, password } = data || {};
      if (!email || !password) {
        return { data: { success: false, error: 'Datos inválidos' } };
      }

      // Fetch user from Supabase
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user || !user.active) {
        return { data: { success: false, error: 'Credenciales incorrectas' } };
      }

      // Verify bcrypt hash
      const validPassword = bcrypt.compareSync(password, user.password);
      if (!validPassword) {
        return { data: { success: false, error: 'Credenciales incorrectas' } };
      }

      const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
      const token = generateFakeJWT(payload);
      const refreshToken = 'fake-refresh-token';

      // Save user ID to localStorage for session management
      localStorage.setItem('token_user_id', user.id);

      return {
        data: {
          success: true,
          data: {
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token,
            refreshToken
          }
        }
      };
    }

    // 2. POST /auth/refresh
    if (path === '/auth/refresh') {
      const { refreshToken } = data || {};
      if (!refreshToken) {
        return { data: { success: false, error: 'Token requerido' } };
      }
      const userId = localStorage.getItem('token_user_id');
      if (!userId) {
        return { data: { success: false, error: 'Sesión expirada' } };
      }
      const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
      if (!user) {
        return { data: { success: false, error: 'Usuario no encontrado' } };
      }
      const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
      return {
        data: {
          success: true,
          data: {
            token: generateFakeJWT(payload),
            refreshToken: 'fake-refresh-token'
          }
        }
      };
    }

    // 3. POST /users
    if (path === '/users') {
      const { name, email, password, role } = data || {};
      if (!name || !email || !password || !role) {
        return { data: { success: false, error: 'Datos inválidos' } };
      }

      // Check existing
      const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
      if (existing) {
        return { data: { success: false, error: 'Email ya registrado' } };
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const { data: createdUser, error } = await supabase
        .from('users')
        .insert({
          name,
          email,
          password: hashedPassword,
          role,
          active: true
        })
        .select('id, name, email, role, active, createdAt')
        .single();

      if (error) throw new Error(error.message);
      return { data: { success: true, data: createdUser } };
    }

    // 4. POST /quotations
    if (path === '/quotations') {
      const { cliente: cData, vehiculo: vData, aseguradora, numeroSiniestro, items: qItems, tiempoEstimadoDias, notas, validezDias } = data || {};

      let clienteId = data.clienteId;
      if (!clienteId && cData) {
        // Find existing by dni_ruc
        let existingCust = null;
        if (cData.dni_ruc) {
          const { data: r } = await supabase.from('customers').select('id').eq('dni_ruc', cData.dni_ruc).maybeSingle();
          existingCust = r;
        }

        if (existingCust) {
          clienteId = existingCust.id;
        } else {
          const { data: newCust, error: cError } = await supabase
            .from('customers')
            .insert({
              nombre: cData.nombre,
              dni_ruc: cData.dni_ruc || null,
              telefono: cData.telefono,
              email: cData.email || null
            })
            .select('id')
            .single();

          if (cError) throw new Error(`Error al crear cliente: ${cError.message}`);
          clienteId = newCust.id;
        }
      }

      let vehiculoId = data.vehiculoId;
      if (!vehiculoId && vData) {
        // Find by plate
        const { data: existingVeh } = await supabase
          .from('vehicles')
          .select('id')
          .eq('placa', vData.placa.toUpperCase())
          .maybeSingle();

        if (existingVeh) {
          vehiculoId = existingVeh.id;
        } else {
          const { data: newVeh, error: vError } = await supabase
            .from('vehicles')
            .insert({
              placa: vData.placa.toUpperCase(),
              marca: vData.marca,
              modelo: vData.modelo,
              anio: vData.anio || null,
              color: vData.color || null,
              kilometraje: vData.kilometraje || null,
              customerId: clienteId
            })
            .select('id')
            .single();

          if (vError) throw new Error(`Error al crear vehículo: ${vError.message}`);
          vehiculoId = newVeh.id;
        }
      }

      const subtotal = qItems.reduce((acc: number, item: any) => acc + (item.costoManoObra || 0) + (item.costoMateriales || 0), 0);
      const igv = Math.round(subtotal * 0.18 * 100) / 100;
      const total = Math.round((subtotal + igv) * 100) / 100;

      // Generate unique quotation number
      const { count } = await supabase.from('quotations').select('*', { count: 'exact', head: true });
      const currentYear = new Date().getFullYear();
      const numero = `COT-${currentYear}-${String((count || 0) + 1).padStart(4, '0')}`;

      const createdById = getUserIdFromSession();
      if (!createdById) throw new Error('Sesión de usuario no válida');

      // Create quotation record
      const { data: quotation, error: qError } = await supabase
        .from('quotations')
        .insert({
          numero,
          clienteId,
          vehiculoId,
          aseguradora,
          numeroSiniestro: numeroSiniestro || null,
          tiempoEstimadoDias: tiempoEstimadoDias || 5,
          notas: notas || null,
          validezDias: validezDias || 15,
          subtotal,
          igv,
          total,
          aprobada: false,
          createdById
        })
        .select('*')
        .single();

      if (qError) throw new Error(`Error al guardar proforma: ${qError.message}`);

      // Create items
      const itemsToInsert = qItems.map((item: any) => ({
        cotizacionId: quotation.id,
        zonaId: item.zonaId,
        zonaLabel: item.zonaLabel,
        subcomponenteId: item.subcomponenteId,
        subcomponenteLabel: item.subcomponenteLabel,
        tipoIntervencion: item.tipoIntervencion,
        descripcion: item.descripcion || null,
        costoManoObra: item.costoManoObra || 0,
        costoMateriales: item.costoMateriales || 0,
        subtotal: (item.costoManoObra || 0) + (item.costoMateriales || 0)
      }));

      const { error: itemsError } = await supabase
        .from('quotation_items')
        .insert(itemsToInsert);

      if (itemsError) throw new Error(`Error al guardar ítems: ${itemsError.message}`);

      // Query full object to return
      const { data: fullQuotation } = await supabase
        .from('quotations')
        .select(`
          *,
          cliente:customers(*),
          vehiculo:vehicles(*),
          items:quotation_items(*),
          createdBy:users(id, name)
        `)
        .eq('id', quotation.id)
        .single();

      return { data: { success: true, data: fullQuotation } };
    }

    // 5. POST /orders
    if (path === '/orders') {
      const { cotizacionId, tecnicoId, notas, fechaEstimadaEntrega } = data || {};
      
      const { data: quotation, error: qError } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', cotizacionId)
        .single();

      if (qError || !quotation) {
        return { data: { success: false, error: 'Proforma no encontrada' } };
      }

      // Check if order already exists
      const { data: existingOrd } = await supabase
        .from('orders')
        .select('id')
        .eq('cotizacionId', cotizacionId)
        .maybeSingle();

      if (existingOrd) {
        return { data: { success: false, error: 'Ya existe una orden para esta proforma' } };
      }

      // Generate unique tracking code (6 characters alphanumeric uppercase)
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let trackingCode = '';
      for (let i = 0; i < 10; i++) {
        let cand = '';
        for (let j = 0; j < 6; j++) {
          cand += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const { data: check } = await supabase.from('orders').select('id').eq('codigoSeguimiento', cand).maybeSingle();
        if (!check) {
          trackingCode = cand;
          break;
        }
      }

      const creatorId = getUserIdFromSession();
      if (!creatorId) throw new Error('Sesión de usuario no válida');

      // Create Order
      const { data: newOrder, error: oError } = await supabase
        .from('orders')
        .insert({
          codigoSeguimiento: trackingCode,
          cotizacionId,
          clienteId: quotation.clienteId,
          vehiculoId: quotation.vehiculoId,
          tecnicoId: tecnicoId || null,
          notas: notas || null,
          fechaEstimadaEntrega: fechaEstimadaEntrega || null,
          status: 'RECIBIDO'
        })
        .select('*')
        .single();

      if (oError) throw new Error(oError.message);

      // Create Status Log
      const { error: logError } = await supabase
        .from('order_status_logs')
        .insert({
          orderId: newOrder.id,
          status: 'RECIBIDO',
          mensaje: 'Vehículo recibido en taller',
          userId: creatorId
        });

      if (logError) throw new Error(logError.message);

      // Approve quotation
      await supabase.from('quotations').update({ aprobada: true }).eq('id', cotizacionId);

      // Get full order
      const { data: fullOrder } = await supabase
        .from('orders')
        .select(`
          *,
          cliente:customers(*),
          vehiculo:vehicles(*),
          tecnico:users(id, name),
          cotizacion:quotations(*, items:quotation_items(*)),
          statusLogs:order_status_logs(*, user:users(id, name))
        `)
        .eq('id', newOrder.id)
        .single();

      return { data: { success: true, data: fullOrder } };
    }

    throw new Error(`Endpoint POST desconocido: ${path}`);
  }

  async patch(url: string, data?: any, config?: any): Promise<{ data: any }> {
    return this.handleResponse(await this._patch(url, data, config));
  }

  // PATCH Mock Router
  async _patch(url: string, data?: any, config?: any): Promise<{ data: any }> {
    await this.checkConnection();
    await delay(150);

    const parsedUrl = new URL(url, 'http://dummy-base-api.com');
    const path = parsedUrl.pathname;

    // 1. PATCH /users/:id
    if (path.startsWith('/users/')) {
      const id = path.split('/')[2];
      const updateData: any = { ...data };

      if (updateData.password) {
        updateData.password = bcrypt.hashSync(updateData.password, 10);
      }

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select('id, name, email, role, active')
        .single();

      if (error) throw new Error(error.message);
      return { data: { success: true, data: updatedUser } };
    }

    // 2. PATCH /quotations/:id/approve
    if (path.startsWith('/quotations/') && path.endsWith('/approve')) {
      const id = path.split('/')[2];
      const { data: quotation, error } = await supabase
        .from('quotations')
        .update({ aprobada: true })
        .eq('id', id)
        .select('*, cliente:customers(*), vehiculo:vehicles(*)')
        .single();

      if (error) throw new Error(error.message);
      return { data: { success: true, data: quotation } };
    }

    // 3. PATCH /orders/:id/status
    if (path.startsWith('/orders/') && path.endsWith('/status')) {
      const id = path.split('/')[2];
      const { status, mensaje, tecnicoId } = data || {};

      const userId = getUserIdFromSession();
      if (!userId) throw new Error('Sesión de usuario no válida');

      const updatePayload: any = {
        status,
        mensajeCliente: mensaje || null
      };
      if (tecnicoId !== undefined) {
        updatePayload.tecnicoId = tecnicoId;
      }

      // Update Order Status
      const { error: oError } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', id);

      if (oError) throw new Error(oError.message);

      // Create log
      const { error: logError } = await supabase
        .from('order_status_logs')
        .insert({
          orderId: id,
          status,
          mensaje: mensaje || 'Actualización de estado en taller',
          userId
        });

      if (logError) throw new Error(logError.message);

      // Get full order response
      const { data: fullOrder } = await supabase
        .from('orders')
        .select(`
          *,
          cliente:customers(*),
          vehiculo:vehicles(*),
          tecnico:users(id, name),
          statusLogs:order_status_logs(*, user:users(id, name))
        `)
        .eq('id', id)
        .single();

      if (fullOrder && fullOrder.statusLogs) {
        fullOrder.statusLogs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      return { data: { success: true, data: fullOrder } };
    }

    throw new Error(`Endpoint PATCH desconocido: ${path}`);
  }

  async delete(url: string, config?: any): Promise<{ data: any }> {
    return this.handleResponse(await this._delete(url, config));
  }

  // DELETE Mock Router
  async _delete(url: string, config?: any): Promise<{ data: any }> {
    await this.checkConnection();
    await delay(100);

    const parsedUrl = new URL(url, 'http://dummy-base-api.com');
    const path = parsedUrl.pathname;

    throw new Error(`Endpoint DELETE no soportado/desconocido: ${path}`);
  }
}

export const api = new ApiMockClient();
export default api;
