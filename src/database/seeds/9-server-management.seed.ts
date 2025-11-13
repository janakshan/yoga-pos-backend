import { DataSource } from 'typeorm';
import { ServerAssignment, AssignmentStatus } from '../../modules/server-management/entities/server-assignment.entity';
import { ServerShift, ShiftStatus, ShiftType } from '../../modules/server-management/entities/server-shift.entity';

export async function seedServerManagement(dataSource: DataSource) {
  console.log('Seeding server management data...');

  const assignmentRepo = dataSource.getRepository(ServerAssignment);
  const shiftRepo = dataSource.getRepository(ServerShift);

  // Get sample users who are servers
  const userRepo = dataSource.getRepository('User');
  const branchRepo = dataSource.getRepository('Branch');
  const sectionRepo = dataSource.getRepository('TableSection');

  const users = await userRepo.find({ take: 5 });
  const branches = await branchRepo.find({ take: 1 });
  const sections = await sectionRepo.find({ take: 2 });

  if (users.length === 0 || branches.length === 0) {
    console.log('Skipping server management seed - no users or branches found');
    return;
  }

  const branch = branches[0];

  // Update some users to be servers
  for (let i = 0; i < Math.min(3, users.length); i++) {
    const user = users[i];
    user.staffProfile = {
      ...user.staffProfile,
      isServer: true,
      serverLevel: i === 0 ? 'senior' : i === 1 ? 'intermediate' : 'junior',
      maxTableCapacity: i === 0 ? 6 : i === 1 ? 5 : 4,
      tipPoolParticipation: true,
      tipOutPercentages: {
        busser: 2,
        host: 1,
        bartender: 1,
      },
    };
    await userRepo.save(user);
  }

  // Create server assignments for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const assignments = [];

  for (let i = 0; i < Math.min(3, users.length); i++) {
    const user = users[i];
    const section = sections.length > 0 ? sections[i % sections.length] : null;

    const assignment = assignmentRepo.create({
      serverId: user.id,
      branchId: branch.id,
      sectionId: section?.id,
      assignmentDate: today,
      status: AssignmentStatus.ACTIVE,
      tableLimit: i === 0 ? 6 : i === 1 ? 5 : 4,
      currentTableCount: 0,
      priorityOrder: i,
      settings: {
        autoAssign: true,
        skillLevel: i === 0 ? 'senior' : i === 1 ? 'intermediate' : 'junior',
        canHandleVIP: i === 0,
      },
      notes: `Server assignment for ${user.firstName} ${user.lastName}`,
    });

    assignments.push(assignment);
  }

  await assignmentRepo.save(assignments);
  console.log(`✓ Created ${assignments.length} server assignments`);

  // Create shift schedules for the week
  const shifts = [];
  const shiftTypes = [ShiftType.MORNING, ShiftType.EVENING];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const shiftDate = new Date(today);
    shiftDate.setDate(shiftDate.getDate() + dayOffset);

    for (let i = 0; i < Math.min(3, users.length); i++) {
      const user = users[i];
      const shiftType = shiftTypes[i % 2];

      const scheduledStart = new Date(shiftDate);
      const scheduledEnd = new Date(shiftDate);

      if (shiftType === ShiftType.MORNING) {
        scheduledStart.setHours(8, 0, 0, 0);
        scheduledEnd.setHours(16, 0, 0, 0);
      } else {
        scheduledStart.setHours(16, 0, 0, 0);
        scheduledEnd.setHours(23, 0, 0, 0);
      }

      const shift = shiftRepo.create({
        serverId: user.id,
        branchId: branch.id,
        shiftDate,
        shiftType,
        status: dayOffset < 2 ? ShiftStatus.CLOCKED_OUT : ShiftStatus.SCHEDULED,
        scheduledStart,
        scheduledEnd,
        scheduledDurationMinutes: 480,
        notes: `${shiftType} shift for ${user.firstName}`,
      });

      // Add some completed shift data for past shifts
      if (dayOffset < 2) {
        shift.actualClockIn = new Date(scheduledStart);
        shift.actualClockOut = new Date(scheduledEnd);
        shift.actualDurationMinutes = 480;
        shift.totalBreakMinutes = 30;
        shift.ordersServed = Math.floor(Math.random() * 20) + 10;
        shift.tablesServed = Math.floor(Math.random() * 15) + 5;
        shift.totalSales = Math.floor(Math.random() * 1000) + 500;
        shift.totalTips = Math.floor(Math.random() * 150) + 50;
      }

      shifts.push(shift);
    }
  }

  await shiftRepo.save(shifts);
  console.log(`✓ Created ${shifts.length} server shifts (${shifts.filter(s => s.status === ShiftStatus.CLOCKED_OUT).length} completed, ${shifts.filter(s => s.status === ShiftStatus.SCHEDULED).length} scheduled)`);

  console.log('Server management seed completed!');
}
