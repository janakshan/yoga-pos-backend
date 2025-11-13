# WebSocket Implementation Guide for Real-Time Table Updates

This guide explains how to add WebSocket support to enable real-time table status updates in the restaurant module.

## Prerequisites

Install the required WebSocket packages:

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

## Implementation Steps

### 1. Create the Table Gateway

Create `src/modules/restaurant/gateways/table.gateway.ts`:

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/restaurant/tables',
})
export class TableGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('TableGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinBranch')
  handleJoinBranch(client: Socket, branchId: string) {
    client.join(`branch:${branchId}`);
    this.logger.log(`Client ${client.id} joined branch ${branchId}`);
  }

  @SubscribeMessage('leaveBranch')
  handleLeaveBranch(client: Socket, branchId: string) {
    client.leave(`branch:${branchId}`);
    this.logger.log(`Client ${client.id} left branch ${branchId}`);
  }

  // Emit table status update to all clients in a branch
  emitTableStatusUpdate(branchId: string, tableData: any) {
    this.server.to(`branch:${branchId}`).emit('tableStatusUpdate', tableData);
  }

  // Emit table assignment update
  emitTableAssignmentUpdate(branchId: string, tableData: any) {
    this.server.to(`branch:${branchId}`).emit('tableAssignmentUpdate', tableData);
  }

  // Emit new table created
  emitTableCreated(branchId: string, tableData: any) {
    this.server.to(`branch:${branchId}`).emit('tableCreated', tableData);
  }

  // Emit table updated
  emitTableUpdated(branchId: string, tableData: any) {
    this.server.to(`branch:${branchId}`).emit('tableUpdated', tableData);
  }

  // Emit table deleted
  emitTableDeleted(branchId: string, tableId: string) {
    this.server.to(`branch:${branchId}`).emit('tableDeleted', { id: tableId });
  }
}
```

### 2. Update the TablesService

Inject the TableGateway into the TablesService and emit events:

```typescript
import { TableGateway } from '../gateways/table.gateway';

@Injectable()
export class TablesService {
  constructor(
    // ... existing dependencies
    private readonly tableGateway: TableGateway,
  ) {}

  async create(createTableDto: CreateTableDto): Promise<Table> {
    // ... existing create logic
    const table = await this.tableRepository.save(newTable);

    // Emit real-time event
    this.tableGateway.emitTableCreated(table.branchId, table);

    return table;
  }

  async updateStatus(
    id: string,
    updateTableStatusDto: UpdateTableStatusDto,
  ): Promise<Table> {
    // ... existing status update logic
    const updatedTable = await this.tableRepository.save(table);

    // Emit real-time event
    this.tableGateway.emitTableStatusUpdate(updatedTable.branchId, updatedTable);

    return updatedTable;
  }

  async assignServer(
    id: string,
    assignServerDto: AssignServerDto,
  ): Promise<Table> {
    // ... existing server assignment logic
    const updatedTable = await this.tableRepository.save(table);

    // Emit real-time event
    this.tableGateway.emitTableAssignmentUpdate(updatedTable.branchId, updatedTable);

    return updatedTable;
  }

  // Add similar emit calls to update() and remove() methods
}
```

### 3. Update the Restaurant Module

Add the TableGateway to the module:

```typescript
import { TableGateway } from './gateways/table.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Table, FloorPlan, TableSection]),
    SettingsModule,
    BranchesModule,
    UsersModule,
  ],
  controllers: [TablesController, FloorPlanController, TableSectionController],
  providers: [
    TablesService,
    FloorPlanService,
    TableSectionService,
    TableGateway,
  ],
  exports: [TablesService, FloorPlanService, TableSectionService],
})
export class RestaurantModule {}
```

### 4. Client-Side Integration

Example client-side integration using Socket.IO client:

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/restaurant/tables', {
  auth: {
    token: 'your-jwt-token',
  },
});

// Join a specific branch
socket.emit('joinBranch', 'branch-id');

// Listen for table status updates
socket.on('tableStatusUpdate', (tableData) => {
  console.log('Table status updated:', tableData);
  // Update your UI with the new table status
});

// Listen for table assignment updates
socket.on('tableAssignmentUpdate', (tableData) => {
  console.log('Table assignment updated:', tableData);
  // Update your UI with the new server assignment
});

// Listen for new tables
socket.on('tableCreated', (tableData) => {
  console.log('New table created:', tableData);
  // Add the new table to your UI
});

// Listen for table updates
socket.on('tableUpdated', (tableData) => {
  console.log('Table updated:', tableData);
  // Update the table in your UI
});

// Listen for table deletions
socket.on('tableDeleted', ({ id }) => {
  console.log('Table deleted:', id);
  // Remove the table from your UI
});

// Clean up on unmount
socket.disconnect();
```

## Events Reference

### Client → Server Events

- `joinBranch`: Join a branch room to receive updates for that branch
- `leaveBranch`: Leave a branch room

### Server → Client Events

- `tableStatusUpdate`: Emitted when a table's status changes
- `tableAssignmentUpdate`: Emitted when a server is assigned/unassigned to/from a table
- `tableCreated`: Emitted when a new table is created
- `tableUpdated`: Emitted when a table is updated
- `tableDeleted`: Emitted when a table is deleted

## Security Considerations

1. **Authentication**: Add JWT authentication to the WebSocket gateway
2. **Authorization**: Ensure users can only join branches they have access to
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **CORS**: Configure CORS appropriately for your production environment

## Testing

Test WebSocket functionality using tools like:
- [Socket.IO Client Tool](https://socket.io/docs/v4/testing/)
- Postman (supports WebSocket testing)
- Custom test scripts

## Next Steps

1. Install the required packages
2. Implement the TableGateway
3. Update the TablesService to emit events
4. Update the RestaurantModule
5. Test the implementation
6. Integrate with your frontend application

## Additional Resources

- [NestJS WebSockets Documentation](https://docs.nestjs.com/websockets/gateways)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
