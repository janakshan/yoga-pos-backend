import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Branch } from '../../modules/branches/entities/branch.entity';
import { ServerSection, SectionStatus } from '../../modules/servers/entities/server-section.entity';

export async function seedServerManagement(
  dataSource: DataSource,
): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const branchRepository = dataSource.getRepository(Branch);
  const sectionRepository = dataSource.getRepository(ServerSection);

  console.log('\n🍽️  Seeding Server Management Data...\n');

  // Get branches
  const branches = await branchRepository.find();
  if (branches.length === 0) {
    console.log('❌ No branches found. Please seed branches first.');
    return;
  }

  const hqBranch = branches[0];

  // Update some existing users to be servers
  const users = await userRepository.find({ take: 5 });
  const serverUsers = users.slice(0, 3); // Take first 3 users to be servers

  for (let i = 0; i < serverUsers.length; i++) {
    const user = serverUsers[i];
    user.isServer = true;
    user.serverCode = `S00${i + 1}`;
    user.serverProfile = {
      rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5 and 5.0
      totalOrders: Math.floor(Math.random() * 500) + 100,
      totalSales: Math.random() * 50000 + 10000,
      totalTips: Math.random() * 5000 + 1000,
      averageTipPercentage: 15 + Math.random() * 10,
      preferredSections: [],
      certifications: ['Food Handler', 'Alcohol Service'],
      specialties: ['Wine Service', 'Table Service'],
    };

    await userRepository.save(user);
    console.log(`✓ Updated user ${user.username} to be a server (${user.serverCode})`);
  }

  // Create sections for each branch
  const sectionsData = [
    {
      name: 'Section A - Main Dining',
      description: 'Main dining area with window views',
      tableCount: 10,
      tables: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'],
      metadata: {
        color: '#3498db',
        floor: '1st Floor',
        capacity: 40,
      },
    },
    {
      name: 'Section B - Patio',
      description: 'Outdoor patio seating area',
      tableCount: 8,
      tables: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8'],
      metadata: {
        color: '#2ecc71',
        floor: '1st Floor',
        capacity: 32,
      },
    },
    {
      name: 'Section C - Bar Area',
      description: 'Bar counter and high-top tables',
      tableCount: 6,
      tables: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'],
      metadata: {
        color: '#e74c3c',
        floor: '1st Floor',
        capacity: 24,
      },
    },
    {
      name: 'Section D - Private Dining',
      description: 'Private dining rooms',
      tableCount: 4,
      tables: ['D1', 'D2', 'D3', 'D4'],
      metadata: {
        color: '#9b59b6',
        floor: '2nd Floor',
        capacity: 20,
      },
    },
    {
      name: 'Section E - Rooftop',
      description: 'Rooftop dining with city views',
      tableCount: 12,
      tables: [
        'E1',
        'E2',
        'E3',
        'E4',
        'E5',
        'E6',
        'E7',
        'E8',
        'E9',
        'E10',
        'E11',
        'E12',
      ],
      metadata: {
        color: '#f39c12',
        floor: 'Rooftop',
        capacity: 48,
      },
    },
  ];

  for (const branch of branches) {
    for (const sectionData of sectionsData) {
      const existingSection = await sectionRepository.findOne({
        where: {
          name: sectionData.name,
          branchId: branch.id,
        },
      });

      if (!existingSection) {
        const section = sectionRepository.create({
          name: sectionData.name,
          description: sectionData.description,
          tableCount: sectionData.tableCount,
          tables: sectionData.tables,
          metadata: sectionData.metadata,
          branchId: branch.id,
          status: SectionStatus.ACTIVE,
        });
        await sectionRepository.save(section);
        console.log(
          `✓ Created section: ${sectionData.name} at ${branch.name}`,
        );
      } else {
        console.log(
          `- Section already exists: ${sectionData.name} at ${branch.name}`,
        );
      }
    }
  }

  console.log('\n✅ Server Management seeding completed!\n');
  console.log(`📊 Summary:`);
  console.log(`   - Servers created: ${serverUsers.length}`);
  console.log(
    `   - Sections per branch: ${sectionsData.length}`,
  );
  console.log(
    `   - Total sections: ${sectionsData.length * branches.length}`,
  );
}
