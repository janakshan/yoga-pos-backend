import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModifiersService } from './services/modifiers.service';
import { ModifiersController } from './modifiers.controller';
import { Modifier } from './entities/modifier.entity';
import { ModifierGroup } from './entities/modifier-group.entity';
import { Product } from '../../products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Modifier,
      ModifierGroup,
      Product,
    ]),
  ],
  controllers: [ModifiersController],
  providers: [ModifiersService],
  exports: [ModifiersService],
})
export class ModifiersModule {}
