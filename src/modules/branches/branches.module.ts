import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from './entities/branch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Branch])],
  controllers: [],
  providers: [],
  exports: [],
})
export class BranchesModule {}
