import { PrismaClient, UserRole, OrderType, PaymentType, RateType, OrderStatus, AssignmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean up existing data in dependency order
  await prisma.notification.deleteMany();
  await prisma.trackingEvent.deleteMany();
  await prisma.statusOverrideLog.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.reschedule.deleteMany();
  await prisma.order.deleteMany();
  await prisma.rateCard.deleteMany();
  await prisma.area.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.agentStatus.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@logistics.in',
      phone: '+919999999999',
      password: passwordHash,
      name: 'System Admin',
      role: UserRole.ADMIN,
      isVerified: true,
      isPhoneVerified: true,
    },
  });
  console.log('✅ Created 1 Admin');

  // 2. Create Zones (Cities)
  const zonesData = [
    { name: 'Mumbai', code: 'Z-MUM' },
    { name: 'Navi Mumbai', code: 'Z-NAV-MUM' },
    { name: 'Thane', code: 'Z-THA' },
    { name: 'Pune', code: 'Z-PUN' },
  ];
  const zones = [];
  for (const z of zonesData) {
    const zone = await prisma.zone.create({ data: z });
    zones.push(zone);
  }
  console.log('✅ Created 4 Zones (Mumbai, Navi Mumbai, Thane, Pune)');

  // 3. Create Areas with real Indian Pincodes and Coordinates
  const areasData = [
    // Mumbai (Z-MUM)
    { name: 'Andheri', code: 'A-AND', pincode: '400053', zoneId: zones[0].id, latitude: 19.1200, longitude: 72.8200 },
    { name: 'Borivali', code: 'A-BOR', pincode: '400092', zoneId: zones[0].id, latitude: 19.2300, longitude: 72.8500 },
    { name: 'Powai', code: 'A-POW', pincode: '400076', zoneId: zones[0].id, latitude: 19.1100, longitude: 72.9000 },
    { name: 'Kurla', code: 'A-KUR', pincode: '400070', zoneId: zones[0].id, latitude: 19.0700, longitude: 72.8800 },
    { name: 'Bandra', code: 'A-BAN', pincode: '400050', zoneId: zones[0].id, latitude: 19.0500, longitude: 72.8400 },
    { name: 'Dadar', code: 'A-DAD', pincode: '400014', zoneId: zones[0].id, latitude: 19.0100, longitude: 72.8400 },
    // Navi Mumbai (Z-NAV-MUM)
    { name: 'Panvel', code: 'A-PAN', pincode: '410206', zoneId: zones[1].id, latitude: 18.9900, longitude: 73.1100 },
    { name: 'Kharghar', code: 'A-KHA', pincode: '410210', zoneId: zones[1].id, latitude: 19.0200, longitude: 73.0700 },
    // Thane (Z-THA)
    { name: 'Thane West', code: 'A-THA', pincode: '400601', zoneId: zones[2].id, latitude: 19.2100, longitude: 72.9700 },
    // Pune (Z-PUN)
    { name: 'Baner', code: 'A-BNE', pincode: '411045', zoneId: zones[3].id, latitude: 18.5500, longitude: 73.7900 },
    { name: 'Hinjewadi', code: 'A-HIN', pincode: '411057', zoneId: zones[3].id, latitude: 18.5700, longitude: 73.7300 },
    { name: 'Aundh', code: 'A-AUN', pincode: '411007', zoneId: zones[3].id, latitude: 18.5600, longitude: 73.8000 },
  ];
  const areas = [];
  for (const a of areasData) {
    const area = await prisma.area.create({ data: a });
    areas.push(area);
  }
  console.log('✅ Created Areas (Andheri, Borivali, Powai, Kurla, Bandra, Dadar, Panvel, Kharghar, Thane, Baner, Hinjewadi, Aundh)');

  // 4. Create Rate Cards (including minWeight, maxWeight, basePrice, perUnitPrice, codSurcharge)
  const rateCardsData = [
    // INTRA_ZONE Rate Cards
    { name: 'Intra B2C Light', rateType: RateType.INTRA_ZONE, orderType: OrderType.B2C, minWeight: 0, maxWeight: 5, basePrice: 40.00, perUnitPrice: 0, codSurcharge: 20.00, isActive: true },
    { name: 'Intra B2C Heavy', rateType: RateType.INTRA_ZONE, orderType: OrderType.B2C, minWeight: 5, maxWeight: 100, basePrice: 60.00, perUnitPrice: 8.00, codSurcharge: 25.00, isActive: true },
    { name: 'Intra B2B Light', rateType: RateType.INTRA_ZONE, orderType: OrderType.B2B, minWeight: 0, maxWeight: 10, basePrice: 50.00, perUnitPrice: 0, codSurcharge: 15.00, isActive: true },
    { name: 'Intra B2B Heavy', rateType: RateType.INTRA_ZONE, orderType: OrderType.B2B, minWeight: 10, maxWeight: 1000, basePrice: 80.00, perUnitPrice: 6.00, codSurcharge: 20.00, isActive: true },
    
    // INTER_ZONE Rate Cards
    { name: 'Inter B2C Light', rateType: RateType.INTER_ZONE, orderType: OrderType.B2C, minWeight: 0, maxWeight: 5, basePrice: 70.00, perUnitPrice: 0, codSurcharge: 30.00, isActive: true },
    { name: 'Inter B2C Heavy', rateType: RateType.INTER_ZONE, orderType: OrderType.B2C, minWeight: 5, maxWeight: 100, basePrice: 90.00, perUnitPrice: 12.00, codSurcharge: 35.00, isActive: true },
    { name: 'Inter B2B Light', rateType: RateType.INTER_ZONE, orderType: OrderType.B2B, minWeight: 0, maxWeight: 10, basePrice: 85.00, perUnitPrice: 0, codSurcharge: 25.00, isActive: true },
    { name: 'Inter B2B Heavy', rateType: RateType.INTER_ZONE, orderType: OrderType.B2B, minWeight: 10, maxWeight: 1000, basePrice: 120.00, perUnitPrice: 10.00, codSurcharge: 30.00, isActive: true },
  ];
  for (const rc of rateCardsData) {
    await prisma.rateCard.create({ data: rc });
  }
  console.log('✅ Created 8 Rate Cards');

  // 5. Create Delivery Agents (12 Agents distributed across zones with varied ratings & GPS coords)
  const agentsData = [
    // Mumbai Agents
    { email: 'agent.mumbai1@logistics.in', name: 'Rohan Sharma', phone: '+919811111111', lat: 19.1200, lng: 72.8250, rating: 4.8, acceptanceRate: 98.00, vehicle: 'BIKE' },
    { email: 'agent.mumbai2@logistics.in', name: 'Amit Patel', phone: '+919811111112', lat: 19.1120, lng: 72.8980, rating: 4.2, acceptanceRate: 85.00, vehicle: 'SCOOTER' },
    { email: 'agent.mumbai3@logistics.in', name: 'Vikram Singh', phone: '+919811111113', lat: 19.0680, lng: 72.8850, rating: 4.9, acceptanceRate: 95.00, vehicle: 'VAN' },
    { email: 'agent.mumbai4@logistics.in', name: 'Sanjay Dutt', phone: '+919811111114', lat: 19.0200, lng: 72.8420, rating: 3.9, acceptanceRate: 72.00, vehicle: 'TRUCK' },

    // Navi Mumbai Agents
    { email: 'agent.navimum1@logistics.in', name: 'Karan Malhotra', phone: '+919811111115', lat: 18.9950, lng: 73.1120, rating: 4.6, acceptanceRate: 90.00, vehicle: 'BIKE' },
    { email: 'agent.navimum2@logistics.in', name: 'Rahul Joshi', phone: '+919811111116', lat: 19.0230, lng: 73.0680, rating: 4.4, acceptanceRate: 92.00, vehicle: 'SCOOTER' },

    // Thane Agents
    { email: 'agent.thane1@logistics.in', name: 'Pankaj Gupta', phone: '+919811111117', lat: 19.2150, lng: 72.9720, rating: 4.1, acceptanceRate: 80.00, vehicle: 'BIKE' },
    { email: 'agent.thane2@logistics.in', name: 'Aditya Sen', phone: '+919811111118', lat: 19.2080, lng: 72.9650, rating: 4.7, acceptanceRate: 96.00, vehicle: 'VAN' },

    // Pune Agents
    { email: 'agent.pune1@logistics.in', name: 'Nikhil Ranade', phone: '+919811111119', lat: 18.5520, lng: 73.7880, rating: 4.5, acceptanceRate: 88.00, vehicle: 'BIKE' },
    { email: 'agent.pune2@logistics.in', name: 'Pranav Kulkarni', phone: '+919811111120', lat: 18.5730, lng: 73.7280, rating: 4.8, acceptanceRate: 99.00, vehicle: 'SCOOTER' },
    { email: 'agent.pune3@logistics.in', name: 'Sarang Deshpande', phone: '+919811111121', lat: 18.5610, lng: 73.8050, rating: 4.3, acceptanceRate: 89.00, vehicle: 'VAN' },
    { email: 'agent.pune4@logistics.in', name: 'Tanmay Joshi', phone: '+919811111122', lat: 18.5300, lng: 73.8400, rating: 4.0, acceptanceRate: 81.00, vehicle: 'BIKE' },
  ];
  const agents = [];
  for (const ag of agentsData) {
    const agent = await prisma.user.create({
      data: {
        email: ag.email,
        phone: ag.phone,
        password: passwordHash,
        name: ag.name,
        role: UserRole.AGENT,
        isVerified: true,
        isPhoneVerified: true,
        agentStatus: {
          create: {
            availability: 'ONLINE',
            capacity: 5,
            latitude: ag.lat,
            longitude: ag.lng,
            rating: ag.rating,
            acceptanceRate: ag.acceptanceRate,
            vehicleType: ag.vehicle,
            lastSeenAt: new Date(),
          },
        },
      },
      include: { agentStatus: true },
    });
    agents.push(agent);
  }
  console.log('✅ Created 12 Delivery Agents distributed across Cities');

  // 6. Create Customers
  const customersData = [
    { email: 'customer.priya@logistics.in', name: 'Priya Sharma', phone: '+917711111111' },
    { email: 'customer.rajesh@logistics.in', name: 'Rajesh Nair', phone: '+917711111112' },
    { email: 'customer.sunita@logistics.in', name: 'Sunita Rao', phone: '+917711111113' },
    { email: 'customer.anil@logistics.in', name: 'Anil Deshmukh', phone: '+917711111114' },
    { email: 'customer.neha@logistics.in', name: 'Neha Gupta', phone: '+917711111115' },
  ];
  const customers = [];
  for (const cust of customersData) {
    const customer = await prisma.user.create({
      data: {
        email: cust.email,
        phone: cust.phone,
        password: passwordHash,
        name: cust.name,
        role: UserRole.CUSTOMER,
        isVerified: true,
        isPhoneVerified: true,
      },
    });
    customers.push(customer);
  }
  console.log('✅ Created 5 Customers');

  // 7. Create Sample Orders of different statuses
  
  // Order 1: PENDING (Mumbai Intra-zone B2C, Prepaid)
  const o1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-MUM-001',
      customerId: customers[0].id,
      pickupAreaId: areas[0].id, // Andheri
      dropAreaId: areas[1].id,   // Borivali
      pickupAddress: 'Andheri Metro Station, Link Rd',
      pickupContact: '+919822222222',
      dropAddress: 'Borivali Station Overpass, Borivali West',
      dropContact: '+919833333333',
      pickupLatitude: 19.1200,
      pickupLongitude: 72.8200,
      dropLatitude: 19.2300,
      dropLongitude: 72.8500,
      actualWeight: 2.500,
      volumetricWeight: 1.600,
      billableWeight: 2.500,
      orderType: OrderType.B2C,
      paymentType: PaymentType.PREPAID,
      calculatedPrice: 40.00, // Base price from B2C Intra Light card
      status: OrderStatus.PENDING,
      description: 'Documents parcel',
      trackingEvents: {
        create: {
          status: OrderStatus.PENDING,
          description: 'Order placed by customer',
        }
      }
    }
  });

  // Order 2: ASSIGNED (Pune Intra-zone B2B, COD)
  const o2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-PUN-002',
      customerId: customers[1].id,
      pickupAreaId: areas[9].id, // Baner
      dropAreaId: areas[11].id,  // Aundh
      pickupAddress: 'Amar Business Park, Baner',
      pickupContact: '+919844444444',
      dropAddress: 'Westend Mall, Aundh',
      dropContact: '+919855555555',
      pickupLatitude: 18.5500,
      pickupLongitude: 73.7900,
      dropLatitude: 18.5600,
      dropLongitude: 73.8000,
      actualWeight: 12.000,
      volumetricWeight: 8.000,
      billableWeight: 12.000,
      orderType: OrderType.B2B,
      paymentType: PaymentType.COD,
      calculatedPrice: 112.00, // Heavy Base B2B (80) + 2kg extra (2*6=12) + COD surcharge (20) = 112
      status: OrderStatus.ASSIGNED,
      description: 'Office supplies box',
      trackingEvents: {
        createMany: {
          data: [
            { status: OrderStatus.PENDING, description: 'Order placed by customer' },
            { status: OrderStatus.ASSIGNED, description: `Order assigned to agent ${agents[8].name}` },
          ]
        }
      },
      assignments: {
        create: {
          agentId: agents[8].id, // Pune Agent 1 (Nikhil)
          assignedById: admin.id,
          status: AssignmentStatus.PENDING,
          assignmentScore: 92.50,
          assignmentReason: 'Closest agent in Pune Baner zone with capacity',
          respondByAt: new Date(Date.now() + 90 * 1000),
        }
      }
    }
  });

  // Increment agent's active orders
  await prisma.agentStatus.update({
    where: { userId: agents[8].id },
    data: { activeOrders: 1 }
  });

  // Order 3: IN_TRANSIT (Mumbai Inter-zone B2C, Prepaid)
  const o3 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-MUM-003',
      customerId: customers[2].id,
      pickupAreaId: areas[4].id, // Bandra
      dropAreaId: areas[7].id,   // Kharghar (Navi Mumbai - Inter-zone)
      pickupAddress: 'Carter Road Promenade, Bandra West',
      pickupContact: '+919866666666',
      dropAddress: 'Sector 20, Kharghar, Navi Mumbai',
      dropContact: '+919877777777',
      pickupLatitude: 19.0500,
      pickupLongitude: 72.8400,
      dropLatitude: 19.0200,
      dropLongitude: 73.0700,
      actualWeight: 1.500,
      volumetricWeight: 2.000,
      billableWeight: 2.000,
      orderType: OrderType.B2C,
      paymentType: PaymentType.PREPAID,
      calculatedPrice: 70.00, // Light Inter B2C (70)
      status: OrderStatus.IN_TRANSIT,
      description: 'Birthday cake',
      trackingEvents: {
        createMany: {
          data: [
            { status: OrderStatus.PENDING, description: 'Order placed by customer' },
            { status: OrderStatus.ASSIGNED, description: `Order assigned to agent ${agents[2].name}` },
            { status: OrderStatus.PICKUP_ASSIGNED, description: 'Agent en route to pickup' },
            { status: OrderStatus.PICKED_UP, description: 'Agent loaded package' },
            { status: OrderStatus.IN_TRANSIT, description: 'Package in transit' },
          ]
        }
      },
      assignments: {
        create: {
          agentId: agents[2].id, // Mumbai Agent 3 (Vikram)
          assignedById: admin.id,
          status: AssignmentStatus.ACCEPTED,
          assignmentScore: 95.00,
          assignmentReason: 'High score candidate',
          respondByAt: new Date(Date.now() - 5000),
          respondedAt: new Date(),
        }
      }
    }
  });

  await prisma.agentStatus.update({
    where: { userId: agents[2].id },
    data: { activeOrders: 1 }
  });

  // Order 4: DELIVERED (Thane to Thane West Intra B2B)
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-THA-004',
      customerId: customers[3].id,
      pickupAreaId: areas[8].id, // Thane West
      dropAreaId: areas[8].id,   // Thane West
      pickupAddress: 'Viviana Mall, Eastern Express Hwy',
      pickupContact: '+919888888888',
      dropAddress: 'Hiranandani Estate, Thane West',
      dropContact: '+919899999999',
      pickupLatitude: 19.2100,
      pickupLongitude: 72.9700,
      dropLatitude: 19.2100,
      dropLongitude: 72.9700,
      actualWeight: 8.500,
      volumetricWeight: 6.000,
      billableWeight: 8.500,
      orderType: OrderType.B2B,
      paymentType: PaymentType.PREPAID,
      calculatedPrice: 50.00, // B2B Intra Light base price
      status: OrderStatus.DELIVERED,
      description: 'Corporate gift hampers',
      trackingEvents: {
        createMany: {
          data: [
            { status: OrderStatus.PENDING, description: 'Order placed' },
            { status: OrderStatus.ASSIGNED, description: `Order assigned to agent ${agents[7].name}` },
            { status: OrderStatus.DELIVERED, description: 'Order delivered successfully. Received by security.' },
          ]
        }
      },
      assignments: {
        create: {
          agentId: agents[7].id,
          assignedById: admin.id,
          status: AssignmentStatus.COMPLETED,
          assignmentScore: 89.00,
          respondByAt: new Date(Date.now() - 10000),
          respondedAt: new Date(),
        }
      }
    }
  });

  // Order 5: FAILED (Pune Hinjewadi to Baner B2C)
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-PUN-005',
      customerId: customers[4].id,
      pickupAreaId: areas[10].id, // Hinjewadi
      dropAreaId: areas[9].id,    // Baner
      pickupAddress: 'Infosys Phase 1, Hinjewadi',
      pickupContact: '+919900000000',
      dropAddress: 'Pan Card Club Road, Baner',
      dropContact: '+919911111111',
      pickupLatitude: 18.5700,
      pickupLongitude: 73.7300,
      dropLatitude: 18.5500,
      dropLongitude: 73.7900,
      actualWeight: 3.000,
      volumetricWeight: 2.000,
      billableWeight: 3.000,
      orderType: OrderType.B2C,
      paymentType: PaymentType.PREPAID,
      calculatedPrice: 40.00, // Base price Intra B2C Light
      status: OrderStatus.FAILED,
      description: 'E-commerce packet',
      trackingEvents: {
        createMany: {
          data: [
            { status: OrderStatus.PENDING, description: 'Order booked' },
            { status: OrderStatus.ASSIGNED, description: `Order assigned to agent ${agents[9].name}` },
            { status: OrderStatus.FAILED, description: 'Delivery failed: Customer unavailable. Left voicemail.' },
          ]
        }
      },
      assignments: {
        create: {
          agentId: agents[9].id, // Sarang Pune Agent 3
          assignedById: admin.id,
          status: AssignmentStatus.FAILED,
          assignmentScore: 91.00,
          respondByAt: new Date(Date.now() - 5000),
          respondedAt: new Date(),
        }
      }
    }
  });

  console.log('✅ Created 5 Sample Orders in PENDING, ASSIGNED, IN_TRANSIT, DELIVERED, and FAILED states');
  console.log('🎉 Seed script finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
