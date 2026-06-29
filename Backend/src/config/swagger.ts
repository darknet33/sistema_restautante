import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ALTIPIQUI — API Restaurante',
      version: '1.0.0',
      description: 'API del sistema de gestión restaurante ALTIPIQUI',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Desarrollo' },
      { url: 'https://api.altipiqui.com', description: 'Producción' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string', nullable: true },
            name: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'CAJERO', 'MESERO', 'COCINA'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            type: { type: 'string' },
          },
        },
        Dish: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            price: { type: 'number' },
            cost: { type: 'number' },
            imageUrl: { type: 'string', nullable: true },
            isAvailable: { type: 'boolean' },
            isMenu: { type: 'boolean' },
            categoryId: { type: 'integer' },
            category: { $ref: '#/components/schemas/Category' },
          },
        },
        Supply: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            unit: { type: 'string' },
            purchaseCost: { type: 'number' },
            salePrice: { type: 'number' },
            stockCurrent: { type: 'number' },
            stockMin: { type: 'number' },
            isInventoryTracked: { type: 'boolean' },
            categoryId: { type: 'integer' },
            category: { $ref: '#/components/schemas/Category' },
          },
        },
        Table: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            number: { type: 'integer' },
            seats: { type: 'integer' },
            status: { type: 'string', enum: ['LIBRE', 'OCUPADA', 'RESERVADA'] },
            posX: { type: 'number', nullable: true },
            posY: { type: 'number', nullable: true },
            shape: { type: 'string', nullable: true },
            width: { type: 'number', nullable: true },
            height: { type: 'number', nullable: true },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            quantity: { type: 'integer' },
            notes: { type: 'string', nullable: true },
            served: { type: 'boolean' },
            type: { type: 'string', enum: ['dish', 'supply'] },
            dish: { $ref: '#/components/schemas/Dish' },
            supply: { $ref: '#/components/schemas/Supply' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            status: { type: 'string', enum: ['PENDIENTE', 'EN_COCINA', 'LISTO', 'SERVIDO', 'PAGADO', 'ENTREGADO'] },
            total: { type: 'number' },
            totalCost: { type: 'number' },
            notes: { type: 'string', nullable: true },
            orderType: { type: 'string', enum: ['PARA_AQUI', 'PARA_LLEVAR', 'DELIVERY'] },
            deliveryAddress: { type: 'string', nullable: true },
            deliveryPhone: { type: 'string', nullable: true },
            tableId: { type: 'integer', nullable: true },
            table: { $ref: '#/components/schemas/Table' },
            userId: { type: 'integer' },
            user: { $ref: '#/components/schemas/User' },
            items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CajaSession: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            openingAmount: { type: 'number' },
            closingAmount: { type: 'number', nullable: true },
            status: { type: 'string', enum: ['ABIERTA', 'CERRADA'] },
            openedAt: { type: 'string', format: 'date-time' },
            closedAt: { type: 'string', format: 'date-time', nullable: true },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        Waste: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            quantity: { type: 'number' },
            reason: { type: 'string' },
            supply: { $ref: '#/components/schemas/Supply' },
            user: { $ref: '#/components/schemas/User' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        DailySales: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date-time' },
            totalSales: { type: 'number' },
            totalOrders: { type: 'integer' },
            avgTicket: { type: 'number' },
          },
        },
        TopDish: {
          type: 'object',
          properties: {
            dish: { $ref: '#/components/schemas/Dish' },
            totalQty: { type: 'integer' },
          },
        },
        InventoryMovement: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            date: { type: 'string', format: 'date-time' },
            type: { type: 'string', enum: ['ENTRADA', 'MERMA', 'AJUSTE'] },
            quantity: { type: 'number' },
            stockBefore: { type: 'number' },
            stockAfter: { type: 'number' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        TurnoClosure: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            date: { type: 'string', format: 'date-time' },
            totalSales: { type: 'number' },
            totalOrders: { type: 'integer' },
            closedCaja: { $ref: '#/components/schemas/CajaSession' },
          },
        },
        MenuItem: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            price: { type: 'number' },
            isAvailable: { type: 'boolean' },
            categoryId: { type: 'integer' },
            category: { $ref: '#/components/schemas/Category' },
          },
        },
        QRResponse: {
          type: 'object',
          properties: {
            qrDataUrl: { type: 'string', description: 'Base64 PNG del QR' },
            url: { type: 'string', description: 'URL del menú público' },
          },
        },
        KardexResponse: {
          type: 'object',
          properties: {
            supply: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, unit: { type: 'string' }, stockCurrent: { type: 'number' } } },
            initialStock: { type: 'number' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            movements: { type: 'array', items: { $ref: '#/components/schemas/InventoryMovement' } },
          },
        },
        LowStockSupply: {
          type: 'object',
          allOf: [
            { $ref: '#/components/schemas/Supply' },
            { type: 'object', properties: { stockStatus: { type: 'string', example: 'BAJO' } } },
          ],
        },
        LoginInput: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string' },
            password: { type: 'string', format: 'password' },
          },
        },
        CreateUserInput: {
          type: 'object',
          required: ['username', 'password', 'name'],
          properties: {
            username: { type: 'string' },
            password: { type: 'string', format: 'password' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'CAJERO', 'MESERO', 'COCINA'] },
          },
        },
        UpdateUserInput: {
          type: 'object',
          properties: {
            username: { type: 'string' },
            password: { type: 'string', format: 'password' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'CAJERO', 'MESERO', 'COCINA'] },
          },
        },
        CreateCategoryInput: {
          type: 'object',
          required: ['name', 'type'],
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
          },
        },
        UpdateCategoryInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
          },
        },
        CreateTableInput: {
          type: 'object',
          required: ['number'],
          properties: {
            number: { type: 'integer' },
            seats: { type: 'integer' },
          },
        },
        UpdateTableInput: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['LIBRE', 'OCUPADA', 'RESERVADA'] },
            seats: { type: 'integer' },
            posX: { type: 'number' },
            posY: { type: 'number' },
            shape: { type: 'string' },
            width: { type: 'number' },
            height: { type: 'number' },
          },
        },
        SaveLayoutInput: {
          type: 'object',
          required: ['tables'],
          properties: {
            tables: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id'],
                properties: {
                  id: { type: 'integer' },
                  posX: { type: 'number' },
                  posY: { type: 'number' },
                  shape: { type: 'string' },
                  width: { type: 'number' },
                  height: { type: 'number' },
                },
              },
            },
          },
        },
        CreateDishInput: {
          type: 'object',
          required: ['name', 'price', 'cost', 'categoryId'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            cost: { type: 'number' },
            categoryId: { type: 'integer' },
            isAvailable: { type: 'boolean' },
            isMenu: { type: 'boolean' },
          },
        },
        UpdateDishInput: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            cost: { type: 'number' },
            categoryId: { type: 'integer' },
            isAvailable: { type: 'boolean' },
            isMenu: { type: 'boolean' },
          },
        },
        CreateOrderInput: {
          type: 'object',
          required: ['items'],
          properties: {
            tableId: { type: 'integer' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['quantity'],
                properties: {
                  dishId: { type: 'integer' },
                  supplyId: { type: 'integer' },
                  quantity: { type: 'integer' },
                  notes: { type: 'string' },
                },
              },
            },
            notes: { type: 'string' },
            orderType: { type: 'string', enum: ['PARA_AQUI', 'PARA_LLEVAR', 'DELIVERY'] },
            deliveryAddress: { type: 'string' },
            deliveryPhone: { type: 'string' },
          },
        },
        UpdateOrderStatusInput: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['PENDIENTE', 'EN_COCINA', 'LISTO', 'SERVIDO', 'PAGADO', 'ENTREGADO'] },
          },
        },
        CreateSupplyInput: {
          type: 'object',
          required: ['name', 'categoryId'],
          properties: {
            name: { type: 'string' },
            unit: { type: 'string' },
            purchaseCost: { type: 'number' },
            salePrice: { type: 'number' },
            stockCurrent: { type: 'number' },
            stockMin: { type: 'number' },
            categoryId: { type: 'integer' },
            isInventoryTracked: { type: 'boolean' },
          },
        },
        UpdateSupplyInput: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            unit: { type: 'string' },
            purchaseCost: { type: 'number' },
            salePrice: { type: 'number' },
            stockCurrent: { type: 'number' },
            stockMin: { type: 'number' },
            categoryId: { type: 'integer' },
            isInventoryTracked: { type: 'boolean' },
          },
        },
        AddStockInput: {
          type: 'object',
          required: ['quantity'],
          properties: {
            quantity: { type: 'number', description: 'Cantidad > 0' },
          },
        },
        OpenCajaInput: {
          type: 'object',
          required: ['openingAmount'],
          properties: {
            openingAmount: { type: 'number', minimum: 0 },
          },
        },
        CloseCajaInput: {
          type: 'object',
          required: ['closingAmount'],
          properties: {
            closingAmount: { type: 'number', minimum: 0 },
          },
        },
        CreateWasteInput: {
          type: 'object',
          required: ['supplyId', 'quantity', 'reason'],
          properties: {
            supplyId: { type: 'integer' },
            quantity: { type: 'number', description: 'Cantidad positiva' },
            reason: { type: 'string' },
          },
        },
        CloseTurnoResponse: {
          type: 'object',
          properties: {
            closure: { $ref: '#/components/schemas/TurnoClosure' },
            closedCaja: { $ref: '#/components/schemas/CajaSession', nullable: true },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Autenticación y usuarios' },
      { name: 'Categorías', description: 'Gestión de categorías' },
      { name: 'Mesas', description: 'Gestión de mesas' },
      { name: 'Platos', description: 'Gestión de platos del menú' },
      { name: 'Menú Público', description: 'Menú público y QR' },
      { name: 'Pedidos', description: 'Gestión de pedidos' },
      { name: 'Consumibles', description: 'Inventario y consumibles' },
      { name: 'Caja', description: 'Apertura y cierre de caja' },
      { name: 'Reportes', description: 'Reportes de ventas' },
      { name: 'Mermas', description: 'Registro de mermas' },
      { name: 'Salud', description: 'Health check' },
    ],
    paths: {
      '/api/health': {
        get: {
          tags: ['Salud'],
          summary: 'Verificar estado del servidor',
          responses: {
            200: {
              description: 'Servidor funcionando',
              content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' }, timestamp: { type: 'string', format: 'date-time' } } } } },
            },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Iniciar sesión',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } } },
          responses: {
            200: { description: 'Login exitoso', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
            401: { description: 'Credenciales inválidas', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/auth/users': {
        post: {
          tags: ['Auth'],
          summary: 'Crear usuario',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUserInput' } } } },
          responses: {
            201: { description: 'Usuario creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            409: { description: 'Username ya existe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        get: {
          tags: ['Auth'],
          summary: 'Listar usuarios',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Lista de usuarios', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } },
          },
        },
      },
      '/api/auth/users/{id}': {
        put: {
          tags: ['Auth'],
          summary: 'Actualizar usuario',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUserInput' } } } },
          responses: {
            200: { description: 'Usuario actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            404: { description: 'Usuario no encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        delete: {
          tags: ['Auth'],
          summary: 'Eliminar usuario',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            204: { description: 'Usuario eliminado (sin contenido)' },
            409: { description: 'Tiene registros asociados', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/categories': {
        get: {
          tags: ['Categorías'],
          summary: 'Listar categorías',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'type', in: 'query', schema: { type: 'string' }, description: 'Filtrar por tipo' }],
          responses: { 200: { description: 'Lista de categorías', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Category' } } } } } },
        },
        post: {
          tags: ['Categorías'],
          summary: 'Crear categoría',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCategoryInput' } } } },
          responses: { 201: { description: 'Categoría creada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Category' } } } } },
        },
      },
      '/api/categories/{id}': {
        put: {
          tags: ['Categorías'],
          summary: 'Actualizar categoría',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateCategoryInput' } } } },
          responses: { 200: { description: 'Categoría actualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Category' } } } } },
        },
        delete: {
          tags: ['Categorías'],
          summary: 'Eliminar categoría',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            204: { description: 'Categoría eliminada' },
            409: { description: 'Tiene platos/consumibles asociados', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/tables': {
        get: {
          tags: ['Mesas'],
          summary: 'Listar mesas',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Lista de mesas con pedidos activos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Table' } } } } } },
        },
        post: {
          tags: ['Mesas'],
          summary: 'Crear mesa',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTableInput' } } } },
          responses: { 201: { description: 'Mesa creada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Table' } } } } },
        },
      },
      '/api/tables/{id}': {
        get: {
          tags: ['Mesas'],
          summary: 'Obtener mesa',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Mesa con pedidos activos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Table' } } } } },
        },
        patch: {
          tags: ['Mesas'],
          summary: 'Actualizar mesa (posición, estado)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateTableInput' } } } },
          responses: { 200: { description: 'Mesa actualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Table' } } } } },
        },
        delete: {
          tags: ['Mesas'],
          summary: 'Eliminar mesa',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            204: { description: 'Mesa eliminada' },
            409: { description: 'Tiene pedidos activos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/tables/layout': {
        put: {
          tags: ['Mesas'],
          summary: 'Guardar layout de mesas',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SaveLayoutInput' } } } },
          responses: { 200: { description: 'Layout actualizado', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Table' } } } } } },
        },
      },
      '/api/dishes': {
        get: {
          tags: ['Platos'],
          summary: 'Listar platos',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'integer' }, description: 'Filtrar por categoría' },
            { name: 'available', in: 'query', schema: { type: 'boolean' }, description: 'Solo disponibles' },
            { name: 'menu', in: 'query', schema: { type: 'boolean' }, description: 'Solo en menú' },
          ],
          responses: { 200: { description: 'Lista de platos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Dish' } } } } } },
        },
        post: {
          tags: ['Platos'],
          summary: 'Crear plato',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, price: { type: 'number' }, cost: { type: 'number' }, categoryId: { type: 'integer' }, isAvailable: { type: 'boolean' }, isMenu: { type: 'boolean' }, image: { type: 'string', format: 'binary' } }, required: ['name', 'price', 'cost', 'categoryId'] } } } },
          responses: { 201: { description: 'Plato creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Dish' } } } } },
        },
      },
      '/api/dishes/{id}': {
        get: {
          tags: ['Platos'],
          summary: 'Obtener plato',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Plato', content: { 'application/json': { schema: { $ref: '#/components/schemas/Dish' } } } } },
        },
        put: {
          tags: ['Platos'],
          summary: 'Actualizar plato',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, price: { type: 'number' }, cost: { type: 'number' }, categoryId: { type: 'integer' }, isAvailable: { type: 'boolean' }, isMenu: { type: 'boolean' }, image: { type: 'string', format: 'binary' } } } } } },
          responses: { 200: { description: 'Plato actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Dish' } } } } },
        },
        delete: {
          tags: ['Platos'],
          summary: 'Eliminar plato',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            204: { description: 'Plato eliminado' },
            409: { description: 'Tiene pedidos asociados', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/dishes/{id}/image': {
        patch: {
          tags: ['Platos'],
          summary: 'Actualizar imagen del plato',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } }, required: ['image'] } } } },
          responses: { 200: { description: 'Imagen actualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Dish' } } } } },
        },
      },
      '/api/menu': {
        get: {
          tags: ['Menú Público'],
          summary: 'Obtener menú público',
          description: 'No requiere autenticación',
          responses: { 200: { description: 'Platos disponibles en menú', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/MenuItem' } } } } } },
        },
      },
      '/api/menu/qr': {
        get: {
          tags: ['Menú Público'],
          summary: 'Generar QR del menú',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'QR generado', content: { 'application/json': { schema: { $ref: '#/components/schemas/QRResponse' } } } } },
        },
      },
      '/api/orders': {
        post: {
          tags: ['Pedidos'],
          summary: 'Crear pedido',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateOrderInput' } } } },
          responses: { 201: { description: 'Pedido creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } } },
        },
        get: {
          tags: ['Pedidos'],
          summary: 'Listar pedidos',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Filtrar por estado' },
            { name: 'tableId', in: 'query', schema: { type: 'integer' }, description: 'Filtrar por mesa' },
            { name: 'orderType', in: 'query', schema: { type: 'string' }, description: 'Filtrar por tipo' },
          ],
          responses: { 200: { description: 'Lista de pedidos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Order' } } } } } },
        },
      },
      '/api/orders/{id}': {
        get: {
          tags: ['Pedidos'],
          summary: 'Obtener pedido',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Pedido completo', content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } } },
        },
      },
      '/api/orders/{id}/status': {
        patch: {
          tags: ['Pedidos'],
          summary: 'Actualizar estado del pedido',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateOrderStatusInput' } } } },
          responses: { 200: { description: 'Estado actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } } },
        },
      },
      '/api/orders/{orderId}/items/{itemId}/serve': {
        patch: {
          tags: ['Pedidos'],
          summary: 'Marcar item como servido',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'orderId', in: 'path', required: true, schema: { type: 'integer' } },
            { name: 'itemId', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Item marcado como servido', content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderItem' } } } } },
        },
      },
      '/api/orders/{id}/ticket': {
        get: {
          tags: ['Pedidos'],
          summary: 'Generar ticket de cocina (PDF)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'PDF del ticket de cocina', content: { 'application/pdf': {} } } },
        },
      },
      '/api/orders/{id}/receipt': {
        get: {
          tags: ['Pedidos'],
          summary: 'Generar recibo de cliente (PDF)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'PDF del recibo', content: { 'application/pdf': {} } } },
        },
      },
      '/api/supplies': {
        get: {
          tags: ['Consumibles'],
          summary: 'Listar consumibles',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'integer' }, description: 'Filtrar por categoría' },
            { name: 'tracked', in: 'query', schema: { type: 'boolean' }, description: 'Solo con tracking' },
          ],
          responses: { 200: { description: 'Lista de consumibles', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Supply' } } } } } },
        },
        post: {
          tags: ['Consumibles'],
          summary: 'Crear consumible',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateSupplyInput' } } } },
          responses: { 201: { description: 'Consumible creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Supply' } } } } },
        },
      },
      '/api/supplies/{id}': {
        get: {
          tags: ['Consumibles'],
          summary: 'Obtener consumible',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Consumible', content: { 'application/json': { schema: { $ref: '#/components/schemas/Supply' } } } } },
        },
        put: {
          tags: ['Consumibles'],
          summary: 'Actualizar consumible',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateSupplyInput' } } } },
          responses: { 200: { description: 'Consumible actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Supply' } } } } },
        },
        delete: {
          tags: ['Consumibles'],
          summary: 'Eliminar consumible',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            204: { description: 'Consumible eliminado' },
            409: { description: 'Tiene registros asociados', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/supplies/low-stock': {
        get: {
          tags: ['Consumibles'],
          summary: 'Consumibles con stock bajo',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Lista de consumibles con stock <= stockMin', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/LowStockSupply' } } } } } },
        },
      },
      '/api/supplies/{id}/stock': {
        post: {
          tags: ['Consumibles'],
          summary: 'Agregar stock',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AddStockInput' } } } },
          responses: { 200: { description: 'Stock actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Supply' } } } } },
        },
      },
      '/api/supplies/{id}/kardex': {
        get: {
          tags: ['Consumibles'],
          summary: 'Kardex de movimientos',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          ],
          responses: { 200: { description: 'Kardex del consumible', content: { 'application/json': { schema: { $ref: '#/components/schemas/KardexResponse' } } } } },
        },
      },
      '/api/caja/current': {
        get: {
          tags: ['Caja'],
          summary: 'Obtener sesión de caja actual',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Sesión abierta o null', content: { 'application/json': { schema: { $ref: '#/components/schemas/CajaSession' } } } } },
        },
      },
      '/api/caja/open': {
        post: {
          tags: ['Caja'],
          summary: 'Abrir caja',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OpenCajaInput' } } } },
          responses: { 201: { description: 'Caja abierta', content: { 'application/json': { schema: { $ref: '#/components/schemas/CajaSession' } } } } },
        },
      },
      '/api/caja/close': {
        post: {
          tags: ['Caja'],
          summary: 'Cerrar caja',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CloseCajaInput' } } } },
          responses: { 200: { description: 'Caja cerrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/CajaSession' } } } } },
        },
      },
      '/api/caja/history': {
        get: {
          tags: ['Caja'],
          summary: 'Historial de caja',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Últimas 50 sesiones', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/CajaSession' } } } } } },
        },
      },
      '/api/reports/daily-sales': {
        get: {
          tags: ['Reportes'],
          summary: 'Ventas del día',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Resumen de ventas diarias', content: { 'application/json': { schema: { $ref: '#/components/schemas/DailySales' } } } } },
        },
      },
      '/api/reports/top-dishes': {
        get: {
          tags: ['Reportes'],
          summary: 'Platos más vendidos del día',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'type', in: 'query', schema: { type: 'string' }, description: 'Filtrar por tipo de categoría' }],
          responses: { 200: { description: 'Top 10 platos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/TopDish' } } } } } },
        },
      },
      '/api/reports/close-turno': {
        post: {
          tags: ['Reportes'],
          summary: 'Cerrar turno del día',
          security: [{ bearerAuth: [] }],
          responses: { 201: { description: 'Turno cerrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/CloseTurnoResponse' } } } } },
        },
      },
      '/api/waste': {
        get: {
          tags: ['Mermas'],
          summary: 'Listar mermas',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'supplyId', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Lista de mermas', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Waste' } } } } } },
        },
        post: {
          tags: ['Mermas'],
          summary: 'Registrar merma',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateWasteInput' } } } },
          responses: { 201: { description: 'Merma registrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Waste' } } } } },
        },
      },
    },
  },
  apis: [],
}

export const swaggerSpec = swaggerJsdoc(options)
