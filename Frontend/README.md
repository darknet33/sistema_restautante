# Frontend - Sistema de Gestión para Restaurante

## Descripción
Interfaz web (PWA-ready) para caja, cocina, meseros y administración.

## Tecnologías
- React 18 + TypeScript
- Vite (bundler rápido)
- Tailwind CSS (estilos)
- TanStack Query (React Query - datos)
- Socket.io client (tiempo real)
- React Router DOM (rutas)

## Scripts disponibles
- `npm run dev` - Inicia servidor desarrollo (puerto 5173)
- `npm run build` - Compila para producción (`dist/`)
- `npm run preview` - Previsualiza build de producción

## Estructura
```
src/
├── components/     # Componentes reutilizables
├── pages/          # Login, Caja, Cocina, Mesero, Admin
├── services/       # API calls (axios)
├── socket/         # WebSocket events
├── hooks/          # Custom hooks
├── types/          # TypeScript interfaces
├── App.tsx         # Routing principal
└── main.tsx        # Entry point
```

## Usuarios de prueba
- **Admin:** admin@restaurante.com / admin123
- **Cajero:** cajero@restaurante.com / cajero123
- **Mesero:** mesero@restaurante.com / mesero123

## Flujo de uso
1. Login → redirección según rol
2. **Caja:** Mapa mesas → crear pedido → enviar a cocina
3. **Cocina:** Ver pedidos → marcar "Listo" → notifica mesero
4. **Mesero:** Ver estado de mesas y pedidos
5. **Admin:** Ventas, stock bajo, platos top, cierre turno

## Proxy API
Configurado en `vite.config.ts`:
- `/api` → `http://localhost:3000`
- `/socket.io` → `http://localhost:3000` (WebSocket)
