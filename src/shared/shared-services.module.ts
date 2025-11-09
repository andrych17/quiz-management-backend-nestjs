import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UserQuizAssignment } from '../entities/user-quiz-assignment.entity';
import { ConfigItem } from '../entities/config-item.entity';
import { UserService } from '../services/user.service';
import { AutoAssignmentService } from '../services/auto-assignment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserQuizAssignment, ConfigItem]),
  ],
  providers: [UserService, AutoAssignmentService],
  exports: [UserService, AutoAssignmentService],
})
export class SharedServicesModule {}