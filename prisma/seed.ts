import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.saleItem.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.deliveryItem.deleteMany()
  await prisma.delivery.deleteMany()
  await prisma.inventory.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.user.deleteMany()

  // Hash passwords
  const managerPassword = await bcrypt.hash('manager123', 10)
  const staffPassword = await bcrypt.hash('staff123', 10)

  // Create users
  const manager = await prisma.user.create({
    data: {
      name: 'Manager Admin',
      email: 'manager@tradeflow.com',
      password: managerPassword,
      role: 'MANAGER',
    },
  })

  const staff1 = await prisma.user.create({
    data: {
      name: 'Staff Member 1',
      email: 'staff1@tradeflow.com',
      password: staffPassword,
      role: 'STAFF',
    },
  })

  const staff2 = await prisma.user.create({
    data: {
      name: 'Staff Member 2',
      email: 'staff2@tradeflow.com',
      password: staffPassword,
      role: 'STAFF',
    },
  })

  // Create categories
  const electronics = await prisma.category.create({
    data: { name: 'Electronics' },
  })

  const groceries = await prisma.category.create({
    data: { name: 'Groceries' },
  })

  const household = await prisma.category.create({
    data: { name: 'Household' },
  })

  // Create suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'TechSupply Co.',
      contactInfo: 'tech@supplier.com | +254 700 111 222',
      address: '123 Industrial Rd, Nairobi',
    },
  })

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'General Goods Ltd.',
      contactInfo: 'info@generalgoods.com | +254 700 333 444',
      address: '456 Commerce St, Mombasa',
    },
  })

  // Create products with inventory
  const products = [
    {
      name: 'Wireless Mouse',
      sku: 'ELEC-001',
      categoryId: electronics.id,
      supplierId: supplier1.id,
      price: 25.99,
      quantity: 50,
    },
    {
      name: 'USB-C Cable',
      sku: 'ELEC-002',
      categoryId: electronics.id,
      supplierId: supplier1.id,
      price: 12.99,
      quantity: 100,
    },
    {
      name: 'Basmati Rice 5kg',
      sku: 'GROC-001',
      categoryId: groceries.id,
      supplierId: supplier2.id,
      price: 8.50,
      quantity: 30,
    },
    {
      name: 'Cooking Oil 2L',
      sku: 'GROC-002',
      categoryId: groceries.id,
      supplierId: supplier2.id,
      price: 5.99,
      quantity: 45,
    },
    {
      name: 'Dish Soap 500ml',
      sku: 'HOUS-001',
      categoryId: household.id,
      supplierId: supplier2.id,
      price: 3.49,
      quantity: 8, // Below threshold - low stock
    },
    {
      name: 'Laundry Detergent 1kg',
      sku: 'HOUS-002',
      categoryId: household.id,
      supplierId: supplier2.id,
      price: 6.99,
      quantity: 15,
    },
  ]

  for (const product of products) {
    const { quantity, ...productData } = product
    await prisma.product.create({
      data: {
        ...productData,
        inventory: {
          create: {
            quantity,
            minimumThreshold: 10,
          },
        },
      },
    })
  }

  console.log('Seed data created successfully!')
  console.log(`  - Users: ${manager.name}, ${staff1.name}, ${staff2.name}`)
  console.log(`  - Categories: Electronics, Groceries, Household`)
  console.log(`  - Suppliers: ${supplier1.name}, ${supplier2.name}`)
  console.log(`  - Products: 6 products with inventory records`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
